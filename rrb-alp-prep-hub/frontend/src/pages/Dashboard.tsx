import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, Target, Zap, Clock, BrainCircuit } from 'lucide-react';
import ScoreTrendChart from '../components/analytics/ScoreTrendChart';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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

  const { overview, scoreTrend, weakTopics, insights } = data;

  return (
    <div className="dashboard-container space-y-6 fade-in">
      <header className="page-header mb-8">
        <h1>Welcome to <span className="text-gradient">ALP Hub</span></h1>
        <p className="text-secondary mt-2">Your personalized preparation dashboard.</p>
      </header>

      {/* KPI Grid */}
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--accent-primary)' }}>
            <Activity size={24} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Tests</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {overview.totalTests}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--accent-success)' }}>
            <Target size={24} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Avg Accuracy</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {overview.averageAccuracy}%
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--accent-warning)' }}>
            <Zap size={24} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Current Streak</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {overview.currentStreak} Days
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-2" style={{ color: 'var(--accent-purple)' }}>
            <Clock size={24} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Avg Time / Q</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {Math.round(overview.averageTimePerQuestionMs / 1000)}s
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Trend Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Performance Trend</h3>
          <ScoreTrendChart data={scoreTrend} />
        </div>

        {/* AI Insights & Weak Areas */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit className="text-accent-primary" />
              <span>Smart Insights</span>
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insights.map((insight: string, i: number) => (
                <li key={i} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)', fontSize: '0.9rem' }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Priority Topics</h3>
            {weakTopics.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {weakTopics.slice(0, 3).map((wt: any, i: number) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{wt.topic}</span>
                    <span style={{ color: 'var(--accent-danger)', fontWeight: 600, fontSize: '0.9rem' }}>{wt.accuracy}% acc</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Take more tests to identify weak topics.</p>
            )}
            
            <Link to="/test/new" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Practice Weak Areas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
