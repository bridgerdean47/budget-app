// src/components/OverviewStat.jsx
export default function OverviewStat({ label, value, color }) {
  const num = Number(value) || 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs tracking-widest text-gray-400">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>
        {num.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
}
