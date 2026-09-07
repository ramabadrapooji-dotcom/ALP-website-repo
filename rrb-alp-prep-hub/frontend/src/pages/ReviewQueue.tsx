import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Check, X, ArrowRight, Save, AlertCircle, RefreshCw } from 'lucide-react';

interface Option {
  id: string;
  optionIndex: number;
  optionText: string;
}

interface Question {
  id: string;
  questionText: string;
  originalQuestionText?: string;
  subjectName: string;
  topicName?: string;
  correctAnswer: number;
  options: Option[];
  verificationStatus: string;
}

export default function ReviewQueue() {
  const location = useLocation();
  const navigate = useNavigate();
  const importId = new URLSearchParams(location.search).get('importId');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Edit state
  const [editedText, setEditedText] = useState('');
  const [editedOptions, setEditedOptions] = useState<string[]>([]);
  const [editedAnswer, setEditedAnswer] = useState(0);

  useEffect(() => {
    if (!importId) {
      setError('No import ID provided');
      setLoading(false);
      return;
    }

    fetchQueue();
  }, [importId]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/imports/${importId}/review`);
      setQuestions(res.data);
      if (res.data.length > 0) {
        initEditState(res.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch review queue');
    } finally {
      setLoading(false);
    }
  };

  const initEditState = (q: Question) => {
    setEditedText(q.questionText);
    const opts = q.options.sort((a, b) => a.optionIndex - b.optionIndex).map(o => o.optionText);
    while (opts.length < 4) opts.push('');
    setEditedOptions(opts);
    setEditedAnswer(q.correctAnswer ?? 0);
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'SAVE') => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    try {
      setSaving(true);
      
      const payload = {
        action,
        questionData: (action === 'APPROVE' || action === 'SAVE') ? {
          questionText: editedText,
          correctAnswer: editedAnswer,
          options: editedOptions.map((text, index) => ({ index, text }))
        } : undefined
      };

      await api.patch(`/imports/review/${currentQ.id}`, payload);
      
      // Move to next
      if (currentIndex < questions.length - 1) {
        const nextQ = questions[currentIndex + 1];
        setCurrentIndex(currentIndex + 1);
        initEditState(nextQ);
      } else {
        // Done!
        navigate('/import');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to apply review action');
    } finally {
      setSaving(false);
    }
  };

  const currentQ = questions[currentIndex];

  if (loading) return <div className="page-container flex items-center justify-center"><div className="spinner" /></div>;
  if (error) return <div className="page-container p-6 text-danger">{error}</div>;
  if (questions.length === 0) {
    return (
      <div className="page-container p-10 flex-col items-center justify-center text-center">
        <Check size={48} className="text-accent-success mb-4" />
        <h2>All Caught Up!</h2>
        <p className="text-secondary mb-6">No questions require manual review for this import.</p>
        <Link to="/import" className="btn btn-primary">Back to Import Center</Link>
      </div>
    );
  }

  return (
    <div className="page-container p-6 fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header className="page-header flex justify-between items-center mb-6">
        <div>
          <h1>Manual Review Queue</h1>
          <p className="text-secondary mt-1">Reviewing import {importId?.slice(0,8)}... ({currentIndex + 1} of {questions.length})</p>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{questions.length - currentIndex}</span> remaining
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Original OCR Data */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-accent-warning" />
            <h2 style={{ fontSize: '1.25rem' }}>Original Extraction</h2>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', minHeight: '300px', maxHeight: '500px', overflowY: 'auto' }}>
            {currentQ.originalQuestionText || currentQ.questionText}
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>Subject: {currentQ.subjectName}</span>
            {currentQ.topicName && <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>Topic: {currentQ.topicName}</span>}
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Review & Edit</h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Question Text</label>
              <textarea 
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                style={{ width: '100%', minHeight: '120px', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'white', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Options & Correct Answer</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {editedOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <button
                      type="button"
                      onClick={() => setEditedAnswer(idx)}
                      style={{ 
                        marginTop: '0.25rem',
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: editedAnswer === idx ? 'var(--accent-success)' : 'transparent',
                        border: `2px solid ${editedAnswer === idx ? 'var(--accent-success)' : 'var(--glass-border)'}`,
                        color: editedAnswer === idx ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                    <textarea 
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editedOptions];
                        newOpts[idx] = e.target.value;
                        setEditedOptions(newOpts);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      style={{ flex: 1, minHeight: '45px', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'white', resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => handleAction('REJECT')}
              disabled={saving}
              className="btn btn-secondary"
              style={{ flex: 1, borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
            >
              <X size={18} /> Reject & Skip
            </button>
            <button 
              onClick={() => handleAction('APPROVE')}
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 2, background: 'var(--accent-success)' }}
            >
              <Check size={18} /> {saving ? 'Saving...' : 'Approve & Next'} <ArrowRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
