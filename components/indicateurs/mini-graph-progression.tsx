interface MiniGraphProgressionProps {
  percentage: number; // 0-100
  color?: string;
  bgColor?: string;
  width?: number;
}

export function MiniGraphProgression({
  percentage,
  color = "#f59e0b",
  bgColor = "#e5e7eb",
  width = 64,
}: MiniGraphProgressionProps) {
  return (
    <div className="flex items-end h-10" style={{ width: `${width}px` }}>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: percentage > 0 ? color : bgColor,
          }}
        />
      </div>
    </div>
  );
}
