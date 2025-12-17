export default function CashFlowBar({ theme, income, expenses, creditCard = 0 }) {
  const inc = Number(income) || 0;
  const cc = Number(creditCard) || 0;
  const exp = Number(expenses) || 0;

  const total = inc + cc + exp;
  if (total <= 0) return null;

  const incomePct = (inc / total) * 100;
  const creditCardPct = (cc / total) * 100;

  const greenEnd = incomePct;
  const yellowEnd = incomePct + creditCardPct;

  const net = inc - cc - exp;

  // smooth gradient: green (income) → yellow (credit card) → red (expenses)
  const gradient = `linear-gradient(
    90deg,
    rgba(16,240,120,1) 0%,
    rgba(16,240,120,1) ${greenEnd}%,
    rgba(255,215,0,1) ${greenEnd}%,
    rgba(255,215,0,1) ${yellowEnd}%,
    rgba(255,30,60,1) ${yellowEnd}%,
    rgba(255,30,60,1) 100%
  )`;

  return (
    <div className="mt-4 space-y-2">
      {/* BAR */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-[#050505] border border-red-900">
        <div className="h-full w-full" style={{ background: gradient }} />
      </div>

      {/* LABEL UNDER BAR */}
      <div className="flex justify-center text-xs font-semibold">
        <span className="text-gray-300">
          Net:{" "}
          {net.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </span>
      </div>
    </div>
  );
}
