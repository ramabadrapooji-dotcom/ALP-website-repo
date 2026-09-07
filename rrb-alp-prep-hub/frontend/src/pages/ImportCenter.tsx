import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ImportCenter() {
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImports = () => {
    api.get('/imports')
      .then((res: any) => {
        setImports(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchImports();
    const interval = setInterval(fetchImports, 5000); // Poll every 5s for updates
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('examName', 'Previous Year Paper');
    
    try {
      await api.post('/imports/pdf', formData);
      fetchImports(); // refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1>Import <span className="text-gradient">Center</span></h1>
        <p className="text-secondary">Upload previous year papers to automatically extract questions.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Upload Section */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Upload PDF</h2>
          
          <div 
            style={{
              border: '2px dashed var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} className="text-accent-primary" />
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Click to upload PDF</p>
              <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Maximum file size: 50MB</p>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf"
            style={{ display: 'none' }}
          />

          {uploading && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', marginBottom: 0 }}></div>
              <span>Uploading file...</span>
            </div>
          )}

          {error && (
            <div className="text-danger" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Import History</h2>
          
          {loading ? (
            <div className="flex justify-center p-6"><div className="spinner"></div></div>
          ) : imports.length === 0 ? (
            <div className="text-muted text-center p-6">No imports yet. Upload a PDF to get started.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {imports.map((imp) => (
                <div key={imp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <FileText size={24} className="text-accent-primary" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{imp.fileName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                        <span>{new Date(imp.createdAt).toLocaleDateString()}</span>
                        {imp.report && <span>{imp.report.questionsParsed} questions</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500,
                      color: imp.status === 'COMPLETED' ? 'var(--accent-success)' :
                             imp.status === 'NEEDS_REVIEW' ? 'var(--accent-warning)' :
                             imp.status === 'FAILED' ? 'var(--accent-danger)' :
                             'var(--text-secondary)'
                    }}>
                      {imp.status === 'COMPLETED' && <CheckCircle size={16} />}
                      {imp.status === 'NEEDS_REVIEW' && <AlertTriangle size={16} />}
                      {imp.status === 'FAILED' && <AlertTriangle size={16} />}
                      {(imp.status === 'PENDING' || imp.status === 'PROCESSING') && <Clock size={16} />}
                      {imp.status.replace('_', ' ')}
                    </div>

                    {/* Action Button */}
                    {imp.status === 'NEEDS_REVIEW' && (
                      <Link to={`/import/${imp.id}/review`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Review Questions <ChevronRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
