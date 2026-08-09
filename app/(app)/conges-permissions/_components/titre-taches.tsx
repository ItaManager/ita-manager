interface TitreTachesProps {
  count: number;
}

export function TitreTaches({ count }: TitreTachesProps) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>
      {count > 0 && (
        <span className="flex items-center justify-center size-6 rounded-full bg-[#dc2626] text-white text-xs font-medium">
          {count}
        </span>
      )}
    </div>
  );
}
