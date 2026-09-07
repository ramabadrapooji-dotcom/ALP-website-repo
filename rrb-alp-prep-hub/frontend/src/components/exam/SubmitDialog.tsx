import { X, AlertTriangle } from 'lucide-react';

interface SubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  totalQuestions: number;
  answeredCount: number;
  markedCount: number;
  isSubmitting: boolean;
}

export default function SubmitDialog({
  isOpen,
  onClose,
  onSubmit,
  totalQuestions,
  answeredCount,
  markedCount,
  isSubmitting,
}: SubmitDialogProps) {
  if (!isOpen) return null;

  const notAnswered = totalQuestions - answeredCount;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel fade-in">
        <div className="modal-header">
          <h2>Submit Exam</h2>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="submit-summary">
            <div className="summary-item">
              <span className="label">Total Questions</span>
              <span className="value">{totalQuestions}</span>
            </div>
            <div className="summary-item answered">
              <span className="label">Answered</span>
              <span className="value">{answeredCount}</span>
            </div>
            <div className="summary-item not-answered">
              <span className="label">Not Answered</span>
              <span className="value">{notAnswered}</span>
            </div>
            <div className="summary-item marked">
              <span className="label">Marked for Review</span>
              <span className="value">{markedCount}</span>
            </div>
          </div>

          {notAnswered > 0 && (
            <div className="warning-box">
              <AlertTriangle size={18} />
              <p>You still have {notAnswered} unanswered questions. Are you sure you want to submit?</p>
            </div>
          )}
          
          <p className="confirmation-text">
            Once submitted, you will not be able to change your answers.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn-primary btn-submit" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Yes, Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
