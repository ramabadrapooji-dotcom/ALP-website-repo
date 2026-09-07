import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Search, Trash2, ChevronLeft, ChevronRight, Library } from 'lucide-react';
import { clsx } from 'clsx';

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

const DIFFICULTY_OPTIONS = ['ALL', 'EASY', 'MEDIUM', 'HARD'];

export default function QuestionBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load subjects once
  useEffect(() => {
    api.get('/subjects').then((res: any) => setSubjects(res)).catch(() => {});
  }, []);

  // Load questions whenever filters change
  const fetchQuestions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (difficulty !== 'ALL') params.set('difficulty', difficulty);
    if (subjectFilter !== 'ALL') params.set('subjectId', subjectFilter);

    api.get(`/questions?${params.toString()}`)
      .then((res: any) => {
        setQuestions(res.questions);
        setTotal(res.total);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [page, pageSize, debouncedSearch, difficulty, subjectFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/questions/${id}`);
    fetchQuestions();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page-container fade-in">
      <header className="page-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Library className="text-accent-primary" size={32} />
            Question Bank
          </h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
            {total} total questions across all subjects
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions..."
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.6rem 1rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Subjects</option>
          {subjects.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Difficulty Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); setPage(1); }}
              className={clsx('tag', d !== 'ALL' && DIFFICULTY_COLORS[d])}
              style={{
                padding: '0.4rem 0.9rem',
                cursor: 'pointer',
                border: difficulty === d ? '2px solid currentColor' : '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-full)',
                background: difficulty === d ? undefined : 'var(--bg-tertiary)',
                fontWeight: difficulty === d ? 700 : 400,
                fontSize: '0.8rem',
                color: d === 'ALL' ? 'var(--text-secondary)' : undefined,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', color: 'var(--accent-danger)' }}>Error: {error}</div>
        ) : questions.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Library size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No questions found. Import a PDF to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                {['#', 'Question', 'Subject', 'Difficulty', 'Source', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q: any, idx: number) => (
                <tr
                  key={q.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', width: '48px' }}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', maxWidth: '420px' }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                      {q.questionText}
                    </p>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {q.subjectName || '—'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={clsx('tag', DIFFICULTY_COLORS[q.difficulty] || '')} style={{ fontSize: '0.75rem' }}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {q.source === 'PDF_IMPORT' ? 'PDF Import' : q.source === 'MANUAL' ? 'Manual' : q.source}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(q.id)}
                        style={{ color: 'var(--text-muted)', transition: 'color var(--transition-fast)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages} ({total} total)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
