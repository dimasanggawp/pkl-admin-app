function StatsCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      {icon && <div className="text-2xl">{icon}</div>}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default StatsCard;
