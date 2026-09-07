import { clsx } from 'clsx';
import { Bookmark } from 'lucide-react';

interface QuestionPaletteProps {
  questions: any[];
  currentIndex: number;
  answers: Record<string, number>;
  markedForReview: string[];
  onNavigate: (index: number) => void;
}

export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  markedForReview,
  onNavigate,
}: QuestionPaletteProps) {
  
  // Calculate stats
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.length;
  const notAnsweredCount = questions.length - answeredCount;

  return (
    <div className="question-palette-container glass-panel">
      <div className="palette-header">
        <h3>Question Palette</h3>
      </div>
      
      <div className="palette-stats">
        <div className="stat-badge answered">
          <span className="count">{answeredCount}</span>
          <span className="label">Answered</span>
        </div>
        <div className="stat-badge not-answered">
          <span className="count">{notAnsweredCount}</span>
          <span className="label">Not Answered</span>
        </div>
        <div className="stat-badge marked">
          <span className="count">{markedCount}</span>
          <span className="label">Marked</span>
        </div>
      </div>

      <div className="palette-grid">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          const isMarked = markedForReview.includes(q.id);
          const isActive = idx === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              className={clsx(
                'palette-btn',
                isActive && 'active',
                isAnswered && !isMarked && 'answered',
                !isAnswered && !isMarked && 'not-answered',
                isMarked && isAnswered && 'marked-answered',
                isMarked && !isAnswered && 'marked-unanswered'
              )}
            >
              {isMarked && <Bookmark size={10} className="mark-indicator" />}
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
