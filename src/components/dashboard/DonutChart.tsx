type DonutSegment = { label: string; value: number; colorClassName: string };

export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  centerLabel,
  centerSublabel,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulativeFraction = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {total > 0 &&
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => {
              const fraction = segment.value / total;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const offset = -cumulativeFraction * circumference;
              cumulativeFraction += fraction;
              return (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  className={segment.colorClassName}
                />
              );
            })}
      </svg>
      {(centerLabel || centerSublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <span className="text-xl font-bold text-foreground">{centerLabel}</span>}
          {centerSublabel && <span className="text-xs text-muted-foreground">{centerSublabel}</span>}
        </div>
      )}
    </div>
  );
}
