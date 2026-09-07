import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import type { TestSession, QuestionAttemptRecord } from 'shared/src/types/exam';

export type ExamStatus = 'loading' | 'ready' | 'started' | 'submitting' | 'submitted' | 'error';

export interface ExamState {
  status: ExamStatus;
  sessionData: { session: TestSession; questions: any[] } | null;
  error: string | null;
  currentIndex: number;
  answers: Record<string, number>;
  markedForReview: string[];
  timings: Record<string, { totalTimeMs: number; answerChanges: number }>;
  timeLeftMs: number;
}

export function useExamEngine(sessionId: string) {
  const [state, setState] = useState<ExamState>({
    status: 'loading',
    sessionData: null,
    error: null,
    currentIndex: 0,
    answers: {},
    markedForReview: [],
    timings: {},
    timeLeftMs: 0,
  });

  const lastTickRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number>(0);

  // Load session
  useEffect(() => {
    if (!sessionId) return;
    
    api.get<{ session: TestSession; questions: any[] }>(`/tests/${sessionId}`)
      .then((data) => {
        // Recover from local storage if available
        const recoveredStateRaw = localStorage.getItem(`exam_state_${sessionId}`);
        let recoveredState = null;
        if (recoveredStateRaw) {
          try {
            recoveredState = JSON.parse(recoveredStateRaw);
          } catch (e) {
            console.error('Failed to parse recovered state');
          }
        }

        setState((prev) => ({
          ...prev,
          status: 'ready',
          sessionData: data,
          answers: recoveredState?.answers || {},
          markedForReview: recoveredState?.markedForReview || [],
          timings: recoveredState?.timings || {},
          currentIndex: recoveredState?.currentIndex || 0,
          timeLeftMs: recoveredState?.timeLeftMs || (data.session.durationSeconds * 1000),
        }));
      })
      .catch((err) => {
        setState((prev) => ({ ...prev, status: 'error', error: err.message }));
      });
  }, [sessionId]);

  // Persist state
  useEffect(() => {
    if (state.status === 'started' || state.status === 'ready') {
      const stateToPersist = {
        answers: state.answers,
        markedForReview: state.markedForReview,
        timings: state.timings,
        currentIndex: state.currentIndex,
        timeLeftMs: state.timeLeftMs,
      };
      localStorage.setItem(`exam_state_${sessionId}`, JSON.stringify(stateToPersist));
    }
  }, [state.answers, state.markedForReview, state.timings, state.currentIndex, state.timeLeftMs, state.status, sessionId]);

  const startExam = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'started' }));
    startedAtRef.current = Date.now();
    lastTickRef.current = Date.now();
  }, []);

  // Timer logic
  useEffect(() => {
    if (state.status === 'started') {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        setState((prev) => {
          if (!prev.sessionData) return prev;
          const currentQId = prev.sessionData.questions[prev.currentIndex]?.id;
          
          // Update timings for current question
          const currentTimings = { ...prev.timings };
          if (currentQId) {
            const currentQTiming = currentTimings[currentQId] || { totalTimeMs: 0, answerChanges: 0 };
            currentTimings[currentQId] = {
              ...currentQTiming,
              totalTimeMs: currentQTiming.totalTimeMs + delta,
            };
          }

          const newTimeLeft = Math.max(0, prev.timeLeftMs - delta);
          
          if (newTimeLeft === 0) {
            // Auto submit
            clearInterval(timerRef.current!);
            setTimeout(() => submitExam(true), 0);
            return { ...prev, timeLeftMs: 0, timings: currentTimings };
          }

          return { ...prev, timeLeftMs: newTimeLeft, timings: currentTimings };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status]); // depends only on status to avoid recreating interval on every tick

  const setAnswer = useCallback((questionId: string, answerIndex: number) => {
    setState((prev) => {
      const currentTimings = { ...prev.timings };
      const currentQTiming = currentTimings[questionId] || { totalTimeMs: 0, answerChanges: 0 };
      currentTimings[questionId] = {
        ...currentQTiming,
        answerChanges: currentQTiming.answerChanges + 1,
      };

      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: answerIndex },
        timings: currentTimings,
      };
    });
  }, []);

  const clearAnswer = useCallback((questionId: string) => {
    setState((prev) => {
      const newAnswers = { ...prev.answers };
      delete newAnswers[questionId];
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const toggleMarkForReview = useCallback((questionId: string) => {
    setState((prev) => {
      const isMarked = prev.markedForReview.includes(questionId);
      return {
        ...prev,
        markedForReview: isMarked
          ? prev.markedForReview.filter((id) => id !== questionId)
          : [...prev.markedForReview, questionId],
      };
    });
  }, []);

  const navigateTo = useCallback((index: number) => {
    setState((prev) => {
      if (!prev.sessionData) return prev;
      const safeIndex = Math.max(0, Math.min(index, prev.sessionData.questions.length - 1));
      return { ...prev, currentIndex: safeIndex };
    });
  }, []);

  const submitExam = useCallback(async (autoSubmitted: boolean = false) => {
    setState((prev) => ({ ...prev, status: 'submitting' }));
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const result = await api.post('/attempts/submit', {
        sessionId,
        answers: state.answers,
        questionTimings: state.timings,
        markedForReview: state.markedForReview,
        startedAt: startedAtRef.current,
        submittedAt: Date.now(),
        autoSubmitted,
      });

      // Clear local storage
      localStorage.removeItem(`exam_state_${sessionId}`);
      setState((prev) => ({ ...prev, status: 'submitted' }));
      return result;
    } catch (err: any) {
      setState((prev) => ({ ...prev, status: 'error', error: err.message }));
      throw err;
    }
  }, [sessionId, state.answers, state.timings, state.markedForReview]);

  return {
    state,
    startExam,
    setAnswer,
    clearAnswer,
    toggleMarkForReview,
    navigateTo,
    submitExam,
  };
}
