interface MiniGraphBarresProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function MiniGraphBarres({
  values,
  color = "#13850b",
  width = 64,
  height = 40,
}: MiniGraphBarresProps) {
  const max = Math.max(...values);

  return (
    <div
      className="flex items-end gap-1"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {values.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-300"
          style={{
            backgroundColor: color,
            height: `${(val / max) * 100}%`,
            opacity: 0.4 + (val / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}
