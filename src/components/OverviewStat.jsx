export default function OverviewStat({ label, value, color }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <p className={`text-xl font-semibold ${color}`}>
        ${value.toLocaleString()}
      </p>
    </div>
  );
}