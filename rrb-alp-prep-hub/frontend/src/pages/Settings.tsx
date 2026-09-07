import { useState } from 'react';
import { Save, Info } from 'lucide-react';

export default function Settings() {
  const [marksPerCorrect, setMarksPerCorrect] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(1 / 3);
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a full implementation, POST to /api/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1>Settings</h1>
        <p className="text-secondary">Configure your exam preferences.</p>
      </header>

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '700px' }}>

        {/* Marking Scheme */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Marking Scheme</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Marks per correct answer</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>+{marksPerCorrect}</span>
              </label>
              <input
                type="range" min={0.5} max={4} step={0.5}
                value={marksPerCorrect}
                onChange={(e) => setMarksPerCorrect(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-success)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>0.5</span><span>4</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Negative marks per wrong answer</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-danger)' }}>−{negativeMarks.toFixed(2)}</span>
              </label>
              <input
                type="range" min={0} max={1} step={0.01}
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-danger)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>0 (no negative)</span><span>1</span>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '0.1rem' }} />
              RRB ALP standard is +1 for correct and −⅓ for wrong. These settings apply to new tests generated from this point forward.
            </div>
          </div>
        </div>

        {/* Timer Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Test Defaults</h2>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Default test duration</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{defaultDuration} min</span>
            </label>
            <input
              type="range" min={5} max={180} step={5}
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>

        {/* About */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>About</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text-primary)' }}>RRB ALP Prep Hub</strong> — A personal exam preparation platform for RRB Assistant Loco Pilot CBT-1 & CBT-2.<br /><br />
            Built with React, Vite, Express, Drizzle ORM, and SQLite.
          </p>
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Version 1.0.0 — Single-user mode
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {saved ? '✓ Saved!' : <><Save size={18} />Save Settings</>}
        </button>
      </div>
    </div>
  );
}
