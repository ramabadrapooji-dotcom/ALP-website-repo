import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  RRB_ALP_CBT1_CONFIG,
  QUICK_TEST_PRESETS,
  DIFFICULTY_PRESETS,
} from '../../../shared/src/constants/examConfig';
import { PlayCircle, BookOpen, Zap, Target, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

type DifficultyPresetKey = keyof typeof DIFFICULTY_PRESETS;

export default function TestConfigurator() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Config state
  const [testType, setTestType] = useState<'FULL_MOCK' | 'SUBJECT_PRACTICE' | 'WEAK_AREA_PRACTICE' | 'CUSTOM'>('FULL_MOCK');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(75);
  const [durationSeconds, setDurationSeconds] = useState(3600);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [difficultyPreset, setDifficultyPreset] = useState<DifficultyPresetKey>('BALANCED');
  const [marksPerCorrect] = useState(1);
  const [negativeMarksPerWrong] = useState(1 / 3);

  useEffect(() => {
    api.get('/subjects').then((res: any) => setSubjects(res)).catch(() => {});
    api.get('/questions/stats').then((res: any) => setStats(res)).catch(() => {});
  }, []);

  const handleQuickPreset = (preset: typeof QUICK_TEST_PRESETS[number]) => {
    setSelectedQuestionCount(preset.value);
    setDurationSeconds(preset.durationSeconds);
  };

  const handleTestTypeChange = (type: typeof testType) => {
    setTestType(type);
    if (type === 'FULL_MOCK') {
      setSelectedQuestionCount(75);
      setDurationSeconds(3600);
      setSelectedSubjects([]);
    } else if (type === 'WEAK_AREA_PRACTICE') {
      setSelectedQuestionCount(30);
      setDurationSeconds(1800);
    }
  };

  const handleStart = async () => {
    setGenerating(true);
    setError(null);
    try {
      const payload = {
        testType,
        totalQuestions: selectedQuestionCount,
        durationSeconds,
        subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
        difficultyDistribution: DIFFICULTY_PRESETS[difficultyPreset],
        marksPerCorrect,
        negativeMarksPerWrong,
        name:
          testType === 'FULL_MOCK' ? `Full Mock — ${new Date().toLocaleDateString('en-IN')}`
          : testType === 'WEAK_AREA_PRACTICE' ? 'Weak Area Practice'
          : testType === 'SUBJECT_PRACTICE' ? 'Subject Practice'
          : 'Custom Test',
      };

      const session = await api.post<{ id: string }>('/tests/generate', payload);
      navigate(`/exam/${session.id}`);
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    }
  };

  const totalAvailableQuestions = stats?.total ?? 0;
  const canStart = !generating && totalAvailableQuestions >= selectedQuestionCount;

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-8">
        <h1>Configure <span className="text-gradient">Test</span></h1>
        <p className="text-secondary">Customize your practice session.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

        {/* Left: Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Test Type */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Test Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {([
                { type: 'FULL_MOCK', icon: Target, label: 'Full Mock', desc: 'RRB ALP CBT-1 pattern', color: 'var(--accent-primary)' },
                { type: 'SUBJECT_PRACTICE', icon: BookOpen, label: 'Subject Practice', desc: 'Focus on specific subjects', color: 'var(--accent-success)' },
                { type: 'WEAK_AREA_PRACTICE', icon: Zap, label: 'Weak Areas', desc: 'AI-targeted practice', color: 'var(--accent-warning)' },
                { type: 'CUSTOM', icon: PlayCircle, label: 'Custom', desc: 'Your own settings', color: 'var(--accent-purple)' },
              ] as const).map(({ type, icon: Icon, label, desc, color }) => (
                <button
                  key={type}
                  onClick={() => handleTestTypeChange(type)}
                  className={clsx('test-type-card', testType === type && 'active')}
                  style={{
                    padding: '1rem',
                    background: testType === type ? `${color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${testType === type ? color : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    color: 'inherit',
                  }}
                >
                  <Icon size={24} style={{ color, marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          {(testType === 'FULL_MOCK' || testType === 'CUSTOM') && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Quick Presets</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {QUICK_TEST_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleQuickPreset(preset)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedQuestionCount === preset.value ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: selectedQuestionCount === preset.value ? 'white' : 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom sliders */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Questions</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedQuestionCount}</span>
                  </label>
                  <input
                    type="range"
                    min={5} max={100} value={selectedQuestionCount}
                    onChange={(e) => setSelectedQuestionCount(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Duration</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.floor(durationSeconds / 60)} min</span>
                  </label>
                  <input
                    type="range"
                    min={5 * 60} max={180 * 60} step={5 * 60} value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subject Selection */}
          {(testType === 'SUBJECT_PRACTICE' || testType === 'CUSTOM') && subjects.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Select Subjects</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {subjects.map((s: any) => {
                  const isSelected = selectedSubjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubjects(prev =>
                        isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                      )}
                      style={{
                        padding: '0.5rem 1rem',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-tertiary)',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Difficulty Distribution */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Difficulty Mix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {(Object.keys(DIFFICULTY_PRESETS) as DifficultyPresetKey[]).map((key) => {
                const preset = DIFFICULTY_PRESETS[key];
                const isActive = difficultyPreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => setDifficultyPreset(key)}
                    style={{
                      padding: '0.75rem',
                      background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.5rem' }}>{key}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <div style={{ color: 'var(--accent-success)' }}>Easy {preset.EASY}%</div>
                      <div style={{ color: 'var(--accent-warning)' }}>Med {preset.MEDIUM}%</div>
                      <div style={{ color: 'var(--accent-danger)' }}>Hard {preset.HARD}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Summary & Start */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Test Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Type', value: testType.replace('_', ' ') },
                { label: 'Questions', value: selectedQuestionCount },
                { label: 'Duration', value: `${Math.floor(durationSeconds / 60)} minutes` },
                { label: 'Marking', value: `+${marksPerCorrect} / -${negativeMarksPerWrong.toFixed(2)}` },
                { label: 'Difficulty', value: difficultyPreset },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{String(value)}</span>
                </div>
              ))}
            </div>

            {stats && (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {totalAvailableQuestions} questions available in bank
              </div>
            )}

            {!canStart && totalAvailableQuestions < selectedQuestionCount && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--accent-danger)' }}>
                Not enough questions. Import more PDFs first.
              </div>
            )}

            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--accent-danger)' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!canStart}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '1rem', padding: '1rem', opacity: !canStart ? 0.5 : 1, cursor: !canStart ? 'not-allowed' : 'pointer' }}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginBottom: 0 }}></div>
                  Generating...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlayCircle size={20} />
                  Start Test
                  <ChevronRight size={16} />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
