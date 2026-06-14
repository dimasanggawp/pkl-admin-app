function StatsCard({ label, value, icon }) {
  return (
    <div className="panel p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="kicker mb-2">{label}</p>
        <p className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-ink truncate">{value}</p>
      </div>
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl">
          {icon}
        </div>
      )}
    </div>
  );
}

export default StatsCard;
