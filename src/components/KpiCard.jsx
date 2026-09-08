import {
  ArrowDown,
  ArrowUp,
  Minus,
  TrendingUp
} from "lucide-react";
import {
  formatMoney
} from "../utils/formatters";

const translations = {
  mn: {
    previousMonth:
      "өмнөх сар",
    increased:
      "өссөн",
    decreased:
      "буурсан",
    unchanged:
      "Өөрчлөлтгүй",
    target:
      "Зорилт"
  },

  en: {
    previousMonth:
      "previous month",
    increased:
      "increased",
    decreased:
      "decreased",
    unchanged:
      "No change",
    target:
      "Target"
  }
};

function formatDifference(
  value
) {
  const number =
    Number(value || 0);

  const absolute =
    Math.abs(number);

  if (
    absolute >=
    1_000_000_000
  ) {
    const result =
      absolute /
      1_000_000_000;

    return `₮${
      result >= 10
        ? result.toFixed(1)
        : result.toFixed(2)
    }bn`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    const result =
      absolute /
      1_000_000;

    return `₮${
      result >= 10
        ? result.toFixed(0)
        : result.toFixed(1)
    }M`;
  }

  if (
    absolute >=
    1_000
  ) {
    const result =
      absolute /
      1_000;

    return `₮${
      result >= 10
        ? result.toFixed(0)
        : result.toFixed(1)
    }K`;
  }

  return `₮${Math.round(
    absolute
  ).toLocaleString(
    "en-US"
  )}`;
}

function getCalculatedChange(
  current,
  previous
) {
  const currentNumber =
    Number(current);

  const previousNumber =
    Number(previous);

  if (
    !Number.isFinite(
      currentNumber
    ) ||
    !Number.isFinite(
      previousNumber
    )
  ) {
    return 0;
  }

  if (
    previousNumber === 0
  ) {
    return 0;
  }

  return (
    (
      currentNumber -
      previousNumber
    ) /
    Math.abs(
      previousNumber
    )
  ) *
    100;
}

function normalizeChange(
  change,
  current,
  previous
) {
  const backendChange =
    Number(change);

  if (
    Number.isFinite(
      backendChange
    ) &&
    Math.abs(
      backendChange
    ) <= 1000
  ) {
    return backendChange;
  }

  return getCalculatedChange(
    current,
    previous
  );
}

function formatChangePercent(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "0.0%";
  }

  return `${Math.abs(
    number
  ).toFixed(1)}%`;
}

export default function KpiCard({
  value = 0,
  previousValue = 0,
  label = "",
  change = null,
  warning = false,
  icon = null,
  target = null,
  inverse = false,
  language = "mn"
}) {
  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

  const currentNumber =
    Number(value);

  const previousNumber =
    Number(
      previousValue
    );

  const safeCurrent =
    Number.isFinite(
      currentNumber
    )
      ? currentNumber
      : 0;

  const safePrevious =
    Number.isFinite(
      previousNumber
    )
      ? previousNumber
      : 0;

  const difference =
    safeCurrent -
    safePrevious;

  const increased =
    difference > 0;

  const decreased =
    difference < 0;

  const unchanged =
    difference === 0;

  let movementClass =
    "neutral";

  if (!unchanged) {
    if (inverse) {
      movementClass =
        increased
          ? "negative"
          : "positive";
    } else {
      movementClass =
        increased
          ? "positive"
          : "negative";
    }
  }

  const safeChange =
    normalizeChange(
      change,
      safeCurrent,
      safePrevious
    );

  const targetNumber =
    Number(target);

  const hasTarget =
    target !== null &&
    target !== undefined &&
    Number.isFinite(
      targetNumber
    ) &&
    targetNumber > 0;

  const progress =
    hasTarget
      ? Math.min(
          Math.max(
            (
              safeCurrent /
              targetNumber
            ) *
              100,
            0
          ),
          100
        )
      : 0;

  const Icon =
    icon ||
    TrendingUp;

  return (
    <div
      className={`kpi-card ${
        warning
          ? "warning"
          : ""
      }`}
    >
      <div className="kpi-card-top">
        <div className="kpi-card-title">
          <span className="kpi-card-title-icon">
            <Icon
              size={16}
              strokeWidth={2.1}
            />
          </span>

          <span className="kpi-card-title-text">
            {label}
          </span>
        </div>

        <div
          className={`kpi-change-badge ${movementClass}`}
        >
          {unchanged ? (
            <Minus
              size={13}
              strokeWidth={3}
            />
          ) : increased ? (
            <ArrowUp
              size={13}
              strokeWidth={3}
            />
          ) : (
            <ArrowDown
              size={13}
              strokeWidth={3}
            />
          )}

          <span>
            {formatChangePercent(
              safeChange
            )}
          </span>
        </div>
      </div>

      <div className="kpi-card-body">
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
          )}
          {" "}
          {t.previousMonth}
        </div>
      </div>

      <div
        className={`kpi-mini-trend ${movementClass}`}
      >
        <svg
          viewBox="0 0 100 38"
          preserveAspectRatio="none"
        >
          <path
            className="kpi-mini-trend-fill"
            d={
              decreased
                ? "M2 8 C12 9 18 14 27 13 C38 11 45 19 54 18 C64 17 70 24 80 23 C88 23 94 29 98 30 L98 38 L2 38 Z"

                : unchanged
                  ? "M2 20 C17 20 32 20 49 20 C66 20 82 20 98 20 L98 38 L2 38 Z"

                  : "M2 28 C13 25 19 23 28 27 C39 31 45 20 55 21 C66 23 72 14 82 15 C89 15 94 10 98 7 L98 38 L2 38 Z"
            }
          />

          <path
            className="kpi-mini-trend-line"
            d={
              decreased
                ? "M2 8 C12 9 18 14 27 13 C38 11 45 19 54 18 C64 17 70 24 80 23 C88 23 94 29 98 30"

                : unchanged
                  ? "M2 20 C17 20 32 20 49 20 C66 20 82 20 98 20"

                  : "M2 28 C13 25 19 23 28 27 C39 31 45 20 55 21 C66 23 72 14 82 15 C89 15 94 10 98 7"
            }
          />
        </svg>
      </div>

      <div
        className={`kpi-difference ${movementClass}`}
      >
        {unchanged ? (
          t.unchanged
        ) : (
          <>
            {increased
              ? "+"
              : "-"}

            {formatDifference(
              difference
            )}
            {" "}

            {increased
              ? t.increased
              : t.decreased}
          </>
        )}
      </div>

      {hasTarget && (
        <div className="kpi-progress-section">
          <div className="kpi-progress-header">
            <span>
              {t.target}
            </span>

            <strong>
              {Math.round(
                progress
              )}
              %
            </strong>
          </div>

          <div className="kpi-progress-track">
            <div
              className="kpi-progress-bar"
              style={{
                width:
                  `${progress}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}