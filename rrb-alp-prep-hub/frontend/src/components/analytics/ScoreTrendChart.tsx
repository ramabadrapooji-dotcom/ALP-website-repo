import { useMemo } from 'react';

interface Point {
  x: number;
  y: number;
  label: string;
  value: number;
}

interface ScoreTrendChartProps {
  data: Array<{ date: string; score: number; maxScore: number }>;
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-secondary">
        Not enough data to display trend. Take more tests!
      </div>
    );
  }

  const { points } = useMemo(() => {
    const scores = data.map(d => d.score);
    const minS = Math.min(...scores, 0);
    const maxS = Math.max(...scores, 100);
    
    // Padding for chart bounds
    const yMax = maxS + (maxS * 0.1);
    const yMin = Math.max(0, minS - (maxS * 0.1));
    
    const pts: Point[] = data.map((d, i) => {
      // Normalize X (0 to 1)
      const nx = data.length > 1 ? i / (data.length - 1) : 0.5;
      // Normalize Y (0 to 1, inverted because SVG y goes down)
      const ny = 1 - ((d.score - yMin) / (yMax - yMin));
      
      return {
        x: nx * 100, // percentage
        y: ny * 100, // percentage
        label: d.date,
        value: d.score
      };
    });
    
    return { points: pts };
  }, [data]);

  const pathD = points.length === 1 
    ? '' 
    : `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  const fillPathD = points.length === 1
    ? ''
    : `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div style={{ position: 'relative', width: '100%', height: '250px', padding: '1rem 0' }}>
      <svg width="100%" height="100%" viewBox="0 -10 100 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        <line x1="0" y1="0" x2="100" y2="0" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="2" />
        
        {/* Area fill */}
        {points.length > 1 && (
          <path 
            d={fillPathD} 
            fill="url(#gradient-fill)" 
            opacity="0.3"
          />
        )}
        
        {/* Line */}
        {points.length > 1 && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="var(--accent-primary)" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="2.5" 
              fill="var(--bg-secondary)" 
              stroke="var(--accent-primary)" 
              strokeWidth="1.5" 
            />
            {/* Tooltip-like label */}
            <text 
              x={p.x} 
              y={p.y - 6} 
              textAnchor="middle" 
              fill="var(--text-primary)" 
              fontSize="4"
              fontWeight="bold"
            >
              {p.value}
            </text>
            {/* Date label at bottom */}
            <text 
              x={p.x} 
              y="112" 
              textAnchor="middle" 
              fill="var(--text-secondary)" 
              fontSize="3.5"
            >
              {p.label}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="gradient-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
