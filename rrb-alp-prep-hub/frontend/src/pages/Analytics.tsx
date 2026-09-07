import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, BookOpen, Layers } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/analytics')
      .then((res: any) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center p-10"><div className="spinner"></div></div>;
  if (error) return <div className="text-danger p-6">Error: {error}</div>;
  if (!data) return null;

  const { subjects, weakTopics } = data;

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1>Detailed <span className="text-gradient">Analytics</span></h1>
        <p className="text-secondary">Deep dive into your performance by subject and topic.</p>
      </header>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Subjects Performance */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <BookOpen className="text-accent-primary" />
            Subject Performance
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {subjects.map((sub: any) => (
              <div key={sub.subject} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{sub.subject}</span>
                  <span>{Math.round(sub.accuracy)}% Accuracy</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${sub.accuracy}%`, 
                      background: sub.accuracy > 70 ? 'var(--accent-success)' : sub.accuracy > 40 ? 'var(--accent-warning)' : 'var(--accent-danger)' 
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Attempted: {sub.totalAttempted}</span>
                  <span>Avg Time: {Math.round(sub.averageTimeMs / 1000)}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Layers className="text-accent-warning" />
            Areas to Improve
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {weakTopics.length > 0 ? weakTopics.map((topic: any, idx: number) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{topic.subject}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{topic.topic}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--accent-danger)' }}>{topic.accuracy}% Accuracy</span>
                  <span>{topic.questionsAttempted} attempts</span>
                </div>
              </div>
            )) : (
              <div className="text-muted">No weak topics identified yet. Keep practicing!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
