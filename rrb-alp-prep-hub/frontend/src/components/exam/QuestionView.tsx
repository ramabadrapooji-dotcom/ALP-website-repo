import { clsx } from 'clsx';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface QuestionViewProps {
  question: any;
  index: number;
  total: number;
  selectedAnswer?: number;
  isMarkedForReview: boolean;
  onSelectAnswer: (index: number) => void;
  onClearAnswer: () => void;
  onToggleMark: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function QuestionView({
  question,
  index,
  total,
  selectedAnswer,
  isMarkedForReview,
  onSelectAnswer,
  onClearAnswer,
  onToggleMark,
  onNext,
  onPrev,
}: QuestionViewProps) {
  if (!question) return null;

  return (
    <div className="question-view-container glass-panel">
      <div className="question-header">
        <div className="question-meta">
          <span className="question-number">Question {index + 1} of {total}</span>
          <div className="question-tags">
            {question.subjectName && <span className="tag subject">{question.subjectName}</span>}
            {question.difficulty && (
              <span className={clsx('tag difficulty', question.difficulty.toLowerCase())}>
                {question.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="question-content">
        <p className="question-text">{question.questionText}</p>
      </div>

      <div className="options-container">
        {question.options.map((opt: any, optIdx: number) => {
          const isSelected = selectedAnswer === optIdx;
          return (
            <button
              key={opt.id}
              className={clsx('option-btn', isSelected && 'selected')}
              onClick={() => onSelectAnswer(optIdx)}
            >
              <div className="option-label">{String.fromCharCode(65 + optIdx)}</div>
              <div className="option-text">{opt.optionText}</div>
            </button>
          );
        })}
      </div>

      <div className="question-actions">
        <div className="action-group left">
          <button 
            className={clsx('btn-action mark-btn', isMarkedForReview && 'active')}
            onClick={onToggleMark}
          >
            {isMarkedForReview ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
          <button 
            className="btn-action clear-btn"
            onClick={onClearAnswer}
            disabled={selectedAnswer === undefined}
          >
            Clear Response
          </button>
        </div>
        
        <div className="action-group right">
          <button 
            className="btn-nav"
            onClick={onPrev}
            disabled={index === 0}
          >
            Previous
          </button>
          <button 
            className="btn-nav btn-primary"
            onClick={onNext}
          >
            {index === total - 1 ? 'Save & Next' : 'Save & Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
