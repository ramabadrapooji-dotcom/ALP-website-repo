import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamEngine } from '../hooks/useExamEngine';
import QuestionView from '../components/exam/QuestionView';
import QuestionPalette from '../components/exam/QuestionPalette';
import ExamTimer from '../components/exam/ExamTimer';
import SubmitDialog from '../components/exam/SubmitDialog';
import { PlayCircle, AlertCircle } from 'lucide-react';
import '../styles/exam.css';

export default function ExamEngine() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const {
    state,
    startExam,
    setAnswer,
    clearAnswer,
    toggleMarkForReview,
    navigateTo,
    submitExam,
  } = useExamEngine(sessionId!);

  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'submitted' && attemptId) {
      navigate(`/results/${attemptId}`);
    }
  }, [state.status, attemptId, navigate]);

  if (state.status === 'loading') {
    return (
      <div className="exam-loading-screen">
        <div className="spinner"></div>
        <p>Loading Exam Environment...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="exam-error-screen">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2>Failed to load exam</h2>
        <p className="text-secondary mb-6">{state.error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { session, questions } = state.sessionData!;
  const currentQuestion = questions[state.currentIndex];

  if (state.status === 'ready') {
    return (
      <div className="exam-instruction-screen bg-glow">
        <div className="instruction-card glass-panel fade-in">
          <h2>{session.name}</h2>
          <p className="exam-meta">
            Total Questions: {session.totalQuestions} | Duration: {Math.floor(session.durationSeconds / 60)} minutes
          </p>
          
          <div className="instruction-content">
            <h3>Instructions:</h3>
            <ul>
              <li>Do not refresh the page during the exam.</li>
              <li>You can navigate between questions using the palette on the right.</li>
              <li>Each question has positive marks for correct answers and negative marks for incorrect ones.</li>
              <li>You can mark questions for review if you are unsure.</li>
              <li>The exam will auto-submit when the timer runs out.</li>
            </ul>
          </div>
          
          <button className="btn btn-primary start-btn" onClick={startExam}>
            <PlayCircle size={20} />
            <span>Start Exam</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-engine-layout">
      {/* Background aesthetics */}
      <div className="bg-glow"></div>
      
      {/* Top Navigation Bar */}
      <header className="exam-header glass-panel">
        <div className="exam-title">{session.name}</div>
        <div className="exam-header-actions">
          <ExamTimer timeLeftMs={state.timeLeftMs} />
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => setShowSubmitDialog(true)}
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="exam-main-content">
        <div className="question-area">
          <QuestionView
            question={currentQuestion}
            index={state.currentIndex}
            total={questions.length}
            selectedAnswer={state.answers[currentQuestion?.id]}
            isMarkedForReview={state.markedForReview.includes(currentQuestion?.id)}
            onSelectAnswer={(optIdx) => setAnswer(currentQuestion.id, optIdx)}
            onClearAnswer={() => clearAnswer(currentQuestion.id)}
            onToggleMark={() => toggleMarkForReview(currentQuestion.id)}
            onNext={() => {
              if (state.currentIndex < questions.length - 1) {
                navigateTo(state.currentIndex + 1);
              } else {
                setShowSubmitDialog(true);
              }
            }}
            onPrev={() => navigateTo(state.currentIndex - 1)}
          />
        </div>

        <div className="palette-area">
          <QuestionPalette
            questions={questions}
            currentIndex={state.currentIndex}
            answers={state.answers}
            markedForReview={state.markedForReview}
            onNavigate={navigateTo}
          />
        </div>
      </div>

      <SubmitDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onSubmit={async () => {
          setShowSubmitDialog(false);
          try {
            const result = await submitExam() as any;
            if (result?.attemptId) setAttemptId(result.attemptId);
          } catch (_) {}
        }}
        totalQuestions={questions.length}
        answeredCount={Object.keys(state.answers).length}
        markedCount={state.markedForReview.length}
        isSubmitting={state.status === 'submitting'}
      />
    </div>
  );
}
