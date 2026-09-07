import { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  timeLeftMs: number;
}

export default function ExamTimer({ timeLeftMs }: ExamTimerProps) {
  const formattedTime = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timeLeftMs]);

  const isLowTime = timeLeftMs < 5 * 60 * 1000; // 5 minutes

  return (
    <div className={`exam-timer ${isLowTime ? 'time-low' : ''}`}>
      <Clock size={18} className={isLowTime ? 'text-danger' : 'text-primary'} />
      <span className={`timer-text ${isLowTime ? 'text-danger animate-pulse' : ''}`}>
        {formattedTime}
      </span>
    </div>
  );
}
