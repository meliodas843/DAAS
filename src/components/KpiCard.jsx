import {
  formatMoney,
  formatPercent
} from "../utils/formatters";

export default function KpiCard({
  value = 0,
  previousValue = 0,
  label = "",
  change = 0,
  inverse = false,
  warning = false
}) {
  const current = Number(value);
  const previous = Number(previousValue);
  const changeNumber = Number(change);

  const safeCurrent =
    Number.isFinite(current)
      ? current
      : 0;

  const safePrevious =
    Number.isFinite(previous)
      ? previous
      : 0;

  const safeChange =
    Number.isFinite(changeNumber)
      ? changeNumber
      : 0;

  const increased =
    safeChange > 0;

  const decreased =
    safeChange < 0;

  let positive;

  if (safeChange === 0) {
    positive = false;
  } else if (inverse) {
    positive = decreased;
  } else {
    positive = increased;
  }

  return (
    <div
      className={`kpi-card ${
        warning ? "warning" : ""
      }`}
    >
      <div
        className={`kpi-value ${
          safeCurrent < 0
            ? "negative-money"
            : ""
        }`}
      >
        {formatMoney(
          safeCurrent,
          true
        )}
      </div>

      <div className="kpi-previous">
        {formatMoney(
          safePrevious,
          true
        )}{" "}
        өмнөх сар
      </div>

      <div className="kpi-label">
        {label}
      </div>

      <div
        className={`kpi-change ${
          safeChange === 0
            ? "neutral"
            : positive
              ? "positive"
              : "negative"
        }`}
      >
        {increased
          ? "▲"
          : decreased
            ? "▼"
            : "•"}{" "}
        {formatPercent(
          safeChange
        )}
      </div>
    </div>
  );
}