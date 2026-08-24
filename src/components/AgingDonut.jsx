import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

function formatCompact(value) {
  const number = Number(value || 0);
  const absolute = Math.abs(number);
  const sign =
    number < 0
      ? "-"
      : "";

  if (absolute >= 1_000_000_000) {
    const result =
      absolute /
      1_000_000_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }bn`;
  }

  if (absolute >= 1_000_000) {
    const result =
      absolute /
      1_000_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }M`;
  }

  if (absolute >= 1_000) {
    const result =
      absolute /
      1_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }K`;
  }

  return `${Math.round(number)}`;
}

function formatTooltip(value) {
  const number =
    Number(value || 0);

  const sign =
    number < 0
      ? "-"
      : "";

  return `${sign}₮${Math.round(
    Math.abs(number)
  ).toLocaleString("en-US")}`;
}

const COLORS = [
  "#2d6bea",
  "#5ca0f2",
  "#ff6a1a",
  "#17439d"
];

function PercentageLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent
}) {
  if (
    !percent ||
    percent < 0.02
  ) {
    return null;
  }

  const RADIAN =
    Math.PI / 180;

  const radius =
    outerRadius + 22;

  const x =
    cx +
    radius *
      Math.cos(
        -midAngle *
          RADIAN
      );

  const y =
    cy +
    radius *
      Math.sin(
        -midAngle *
          RADIAN
      );

  return (
    <text
      x={x}
      y={y}
      fill="#536177"
      textAnchor={
        x > cx
          ? "start"
          : "end"
      }
      dominantBaseline="central"
      fontSize={10}
      fontWeight={800}
    >
      {`${(
        percent * 100
      ).toFixed(1)}%`}
    </text>
  );
}

export default function AgingDonut({
  data = [],
  previous = ""
}) {
  const safeData =
    Array.isArray(data)
      ? data
          .map(
            (item) => ({
              ...item,
              value:
                Number(
                  item.value ||
                    0
                )
            })
          )
          .filter(
            (item) =>
              Number(
                item.value
              ) > 0
          )
      : [];

  const total =
    safeData.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.value ||
            0
        ),
      0
    );

  const itemCount =
    Math.min(
      Math.max(
        safeData.length,
        1
      ),
      4
    );

  return (
    <div className="aging-donut">
      <div className="aging-donut-chart-section">
        <div className="aging-donut-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart
              margin={{
                top: 28,
                right: 45,
                bottom: 28,
                left: 45
              }}
            >
              <Pie
                data={safeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={82}
                paddingAngle={1}
                stroke="#ffffff"
                strokeWidth={2}
                labelLine={{
                  stroke:
                    "#cbd5e1",
                  strokeWidth: 1
                }}
                label={
                  <PercentageLabel />
                }
                isAnimationActive={
                  false
                }
              >
                {safeData.map(
                  (
                    item,
                    index
                  ) => (
                    <Cell
                      key={`${item.name}-${index}`}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip
                formatter={(
                  value,
                  name
                ) => [
                  formatTooltip(
                    value
                  ),
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {safeData.length >
        0 && (
        <div
          className={`aging-donut-legend aging-count-${itemCount}`}
        >
          {safeData.map(
            (
              item,
              index
            ) => {
              const value =
                Number(
                  item.value ||
                    0
                );

              const percent =
                total > 0
                  ? (value /
                      total) *
                    100
                  : 0;

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="aging-legend-item"
                >
                  <div className="aging-legend-title">
                    <span
                      className="aging-legend-dot"
                      style={{
                        background:
                          COLORS[
                            index %
                              COLORS.length
                          ]
                      }}
                    />

                    <span className="aging-legend-name">
                      {
                        item.name
                      }
                    </span>
                  </div>

                  <strong className="aging-legend-value">
                    {formatCompact(
                      value
                    )}
                  </strong>

                  <span className="aging-legend-percent">
                    (
                    {percent.toFixed(
                      1
                    )}
                    %)
                  </span>
                </div>
              );
            }
          )}
        </div>
      )}

      {previous && (
        <div className="aging-donut-previous">
          {previous}
        </div>
      )}
    </div>
  );
}