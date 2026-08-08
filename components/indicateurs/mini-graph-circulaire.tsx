interface MiniGraphCirculaireProps {
  percentage: number; // 0-1
  color?: string;
  size?: number;
}

export function MiniGraphCirculaire({
  percentage,
  color = "#13850b",
  size = 50,
}: MiniGraphCirculaireProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="transform -rotate-90"
    >
      {/* Cercle de fond */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
      />
      {/* Cercle de progression */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}
