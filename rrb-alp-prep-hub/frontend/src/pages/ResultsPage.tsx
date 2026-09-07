import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CheckCircle2, XCircle, MinusCircle, BookOpen, ArrowRight, BarChart2, PlayCircle } from 'lucide-react';

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'review'>('summary');

  useEffect(() => {
    if (!attemptId) return;
    api.get(`/attempts/${attemptId}`)
      .then((res: any) => { setResult(res); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'var(--bg-primary)', gap: '1rem' }}>
        <p className="text-danger">Error: {error ?? 'Result not found'}</p>
        <Link to="/dashboard" className="btn btn-secondary">Go Home</Link>
      </div>
    );
  }

  const { attempt, subjectBreakdown, questionAttempts } = result;
  const isPassing = attempt.accuracy >= 60;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '3rem 2rem' }}>
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Score Card */}
        <div className="glass-panel fade-in" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{isPassing ? '🎉' : '💪'}</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{attempt.testName}</h1>
          <p className="text-secondary">Submitted on {new Date(attempt.submittedAt ?? attempt.startedAt).toLocaleString('en-IN')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
            {[
              { label: 'Score', value: `${attempt.finalScore}`, sub: `/ ${attempt.maxPossibleScore}`, color: isPassing ? 'var(--accent-success)' : 'var(--accent-danger)' },
              { label: 'Accuracy', value: `${attempt.accuracy.toFixed(1)}%`, color: isPassing ? 'var(--accent-success)' : 'var(--accent-warning)' },
              { label: 'Correct', value: String(attempt.correct), color: 'var(--accent-success)' },
              { label: 'Incorrect', value: String(attempt.incorrect), color: 'var(--accent-danger)' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>
                  {value}
                  {sub && <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{sub}</span>}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {(['summary', 'review'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)',
                background: activeTab === tab ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600,
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab === 'summary'
                ? <><BarChart2 size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />Subject Summary</>
                : <><BookOpen size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />Question Review</>
              }
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="glass-panel fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Subject Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(subjectBreakdown ?? []).map((s: any) => (
                <div key={s.subject}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{s.subject}</span>
                    <span style={{ color: s.accuracy >= 60 ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                      {s.correct}/{s.attempted} &nbsp;•&nbsp; {s.accuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.accuracy}%`, background: s.accuracy >= 60 ? 'var(--accent-success)' : s.accuracy >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)', borderRadius: '5px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Score: {s.score}</span>
                    {s.averageTimeSeconds != null && <span>Avg time: {s.averageTimeSeconds}s</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="glass-panel fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Question Review</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(questionAttempts ?? []).map((qa: any, idx: number) => {
                const isCorrect = qa.isCorrect;
                const isSkipped = qa.selectedOptionIndex === null || qa.selectedOptionIndex === undefined;
                return (
                  <div key={qa.questionId} style={{
                    padding: '1.5rem',
                    background: isCorrect ? 'rgba(16, 185, 129, 0.05)' : isSkipped ? 'rgba(100, 116, 139, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.2)' : isSkipped ? 'var(--glass-border)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                        {isCorrect
                          ? <CheckCircle2 size={22} color="var(--accent-success)" />
                          : isSkipped
                            ? <MinusCircle size={22} color="var(--text-muted)" />
                            : <XCircle size={22} color="var(--accent-danger)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Q{idx + 1}</div>
                        <p style={{ marginBottom: '1rem', lineHeight: 1.7 }}>{qa.questionText}</p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                          {!isSkipped && (
                            <div style={{ padding: '0.4rem 0.75rem', background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-md)', color: isCorrect ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                              Your: {String.fromCharCode(65 + qa.selectedOptionIndex)}) {qa.selectedOptionText}
                            </div>
                          )}
                          {!isCorrect && qa.correctOptionText && (
                            <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', color: 'var(--accent-success)' }}>
                              Correct: {String.fromCharCode(65 + qa.correctOptionIndex)}) {qa.correctOptionText}
                            </div>
                          )}
                          {isSkipped && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not attempted</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
          <Link to="/test/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem' }}>
            <PlayCircle size={18} />Take Another Test
          </Link>
          <Link to="/analytics" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem' }}>
            <BarChart2 size={18} />View Analytics<ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
