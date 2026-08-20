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
  const sign = number < 0 ? "-" : "";

  if (absolute >= 1_000_000_000) {
    return `${sign}${(
      absolute / 1_000_000_000
    ).toFixed(1)}bn`;
  }

  if (absolute >= 1_000_000) {
    return `${sign}${(
      absolute / 1_000_000
    ).toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    return `${sign}${(
      absolute / 1_000
    ).toFixed(1)}K`;
  }

  return `${Math.round(number)}`;
}

function formatTooltip(value) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";

  return `${sign}₮${Math.round(
    Math.abs(number)
  ).toLocaleString("en-US")}`;
}

const COLORS = [
  "#2d6bea",
  "#1f55c5",
  "#ff6a1a",
  "#17439d"
];

export default function AgingDonut({
  data = [],
  previous = ""
}) {
  const safeData =
    Array.isArray(data)
      ? data
          .map((item) => ({
            ...item,
            value: Number(
              item.value || 0
            )
          }))
          .filter(
            (item) =>
              Number(item.value) > 0
          )
      : [];

  const total =
    safeData.reduce(
      (sum, item) =>
        sum +
        Number(
          item.value || 0
        ),
      0
    );

  return (
    <div className="aging-donut">
      <div className="aging-donut-main">
        <div className="aging-donut-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={safeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={1}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={false}
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

        <div className="aging-donut-legend">
          {safeData.map(
            (
              item,
              index
            ) => {
              const value =
                Number(
                  item.value || 0
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

                  <div className="aging-legend-text">
                    <span className="aging-legend-name">
                      {item.name}
                    </span>

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
                </div>
              );
            }
          )}
        </div>
      </div>

      {previous && (
        <div className="aging-donut-previous">
          {previous}
        </div>
      )}
    </div>
  );
}