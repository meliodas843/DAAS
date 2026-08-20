import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatCompact(value) {
  const number =
    Number(value || 0);

  const absolute =
    Math.abs(number);

  const sign =
    number < 0
      ? "-"
      : "";

  if (
    absolute >=
    1_000_000_000
  ) {
    const result =
      absolute /
      1_000_000_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    const result =
      absolute /
      1_000_000;

    return `${sign}${
      Number.isInteger(result)
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

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }K`;
  }

  return `${Math.round(
    number
  )}`;
}

function formatTooltip(value) {
  const number =
    Number(value || 0);

  return `₮${Math.round(
    number
  ).toLocaleString(
    "en-US"
  )}`;
}

function wrapLabel(
  text,
  maxLength = 24
) {
  if (!text) {
    return [""];
  }

  const words =
    String(text).split(" ");

  const lines = [];

  let current = "";

  for (const word of words) {
    const next =
      current
        ? `${current} ${word}`
        : word;

    if (
      next.length <=
      maxLength
    ) {
      current = next;
    } else {
      if (current) {
        lines.push(
          current
        );
      }

      current = word;
    }
  }

  if (current) {
    lines.push(
      current
    );
  }

  return lines.slice(
    0,
    3
  );
}

function CustomYAxisTick({
  x,
  y,
  payload
}) {
  const lines =
    wrapLabel(
      payload?.value ||
        "",
      24
    );

  const lineHeight =
    12;

  const startY =
    y -
    ((lines.length - 1) *
      lineHeight) /
      2;

  return (
    <g>
      <text
        x={x - 14}
        y={startY}
        textAnchor="end"
        fill="#536177"
        fontSize={10.5}
        fontWeight={500}
      >
        {lines.map(
          (
            line,
            index
          ) => (
            <tspan
              key={`${line}-${index}`}
              x={x - 14}
              dy={
                index === 0
                  ? 0
                  : lineHeight
              }
            >
              {line}
            </tspan>
          )
        )}
      </text>
    </g>
  );
}

function ValueLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value
}) {
  const number =
    Number(value || 0);

  if (
    !Number.isFinite(
      number
    ) ||
    number === 0
  ) {
    return null;
  }

  const centerY =
    y +
    height / 2;

  const label =
    formatCompact(
      number
    );

  if (number > 0) {
    return (
      <text
        x={
          x +
          width +
          8
        }
        y={centerY}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#101827"
        fontSize={10.5}
        fontWeight={800}
      >
        {label}
      </text>
    );
  }

  const zeroX =
    x + width;

  return (
    <text
      x={zeroX - 8}
      y={centerY}
      dominantBaseline="middle"
      textAnchor="end"
      fill="#dc2626"
      fontSize={10.5}
      fontWeight={800}
    >
      {label}
    </text>
  );
}

function calculateAxis(data) {
  const values =
    data.map(
      (item) =>
        Number(
          item.value || 0
        )
    );

  const minValue =
    Math.min(
      ...values,
      0
    );

  const maxValue =
    Math.max(
      ...values,
      0
    );

  let min = 0;

  if (minValue < 0) {
    const absMin =
      Math.abs(
        minValue
      );

    if (
      absMin <=
      500_000_000
    ) {
      min =
        -500_000_000;
    } else if (
      absMin <=
      1_000_000_000
    ) {
      min =
        -1_000_000_000;
    } else if (
      absMin <=
      2_000_000_000
    ) {
      min =
        -2_000_000_000;
    } else {
      min =
        -Math.ceil(
          absMin /
            1_000_000_000
        ) *
        1_000_000_000;
    }
  }

  let max =
    3_000_000_000;

  if (
    maxValue >
    3_000_000_000
  ) {
    max =
      Math.ceil(
        maxValue /
          1_000_000_000
      ) *
      1_000_000_000;
  }

  return {
    min,
    max
  };
}

function createTicks(
  min,
  max
) {
  const ticks = [];

  if (min < 0) {
    if (
      min <=
      -2_000_000_000
    ) {
      ticks.push(
        -2_000_000_000
      );
    }

    if (
      min <=
      -1_000_000_000
    ) {
      ticks.push(
        -1_000_000_000
      );
    }

    if (
      min <=
      -500_000_000
    ) {
      ticks.push(
        -500_000_000
      );
    }
  }

  ticks.push(0);

  if (
    max >=
    500_000_000
  ) {
    ticks.push(
      500_000_000
    );
  }

  if (
    max >=
    1_000_000_000
  ) {
    ticks.push(
      1_000_000_000
    );
  }

  for (
    let value =
      2_000_000_000;
    value <=
      Math.min(
        max,
        5_000_000_000
      );
    value +=
      1_000_000_000
  ) {
    ticks.push(
      value
    );
  }

  return [
    ...new Set(ticks)
  ].sort(
    (a, b) =>
      a - b
  );
}

export default function HorizontalBarChart({
  data = [],
  color = "#2966e8",
  yAxisWidth = 220,
  rowHeight = 40,
  barSize = 20,
  visibleHeight = 310
}) {
  const safeData =
    Array.isArray(data)
      ? data.map(
          (item) => ({
            ...item,
            value:
              Number(
                item.value || 0
              )
          })
        )
      : [];

  const chartHeight =
    Math.max(
      visibleHeight,
      safeData.length *
        rowHeight +
        10
    );

  const {
    min: axisMin,
    max: axisMax
  } =
    calculateAxis(
      safeData
    );

  const axisTicks =
    createTicks(
      axisMin,
      axisMax
    );

  const chartLeftMargin =
    10;

  const chartRightMargin =
    75;

  return (
    <div className="fixed-axis-chart">
      <div
        className="fixed-axis-chart-scroll"
        style={{
          height:
            `${visibleHeight}px`
        }}
      >
        <div
          className="fixed-axis-chart-body"
          style={{
            height:
              `${chartHeight}px`
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={safeData}
              layout="vertical"
              margin={{
                top: 5,
                right:
                  chartRightMargin,
                bottom: 0,
                left:
                  chartLeftMargin
              }}
              barCategoryGap={12}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#edf1f7"
              />

              <XAxis
                type="number"
                domain={[
                  axisMin,
                  axisMax
                ]}
                hide
                allowDataOverflow
              />

              <YAxis
                type="category"
                dataKey="name"
                width={
                  yAxisWidth
                }
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={
                  <CustomYAxisTick />
                }
              />

              <Tooltip
                cursor={{
                  fill:
                    "rgba(15, 23, 42, 0.025)"
                }}
                formatter={(
                  value
                ) => [
                  formatTooltip(
                    value
                  ),
                  "Дүн"
                ]}
              />

              <Bar
                dataKey="value"
                fill={color}
                barSize={
                  barSize
                }
                radius={[
                  0,
                  5,
                  5,
                  0
                ]}
                isAnimationActive={
                  false
                }
              >
                <LabelList
                  dataKey="value"
                  content={
                    <ValueLabel />
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="shared-bottom-axis">
        <div
          className="shared-bottom-axis-track"
          style={{
            marginLeft:
              `${
                yAxisWidth +
                chartLeftMargin
              }px`,
            marginRight:
              `${chartRightMargin}px`
          }}
        >
          {axisTicks.map(
            (tick) => {
              const position =
                axisMax ===
                axisMin
                  ? 0
                  : (
                      (tick -
                        axisMin) /
                      (axisMax -
                        axisMin)
                    ) *
                    100;

              let transform =
                "translateX(-50%)";

              if (
                axisMin < 0 &&
                tick ===
                  -500_000_000
              ) {
                transform =
                  "translateX(-90%)";
              }

              if (
                axisMin < 0 &&
                tick === 0
              ) {
                transform =
                  "translateX(-65%)";
              }

              if (
                axisMin < 0 &&
                tick ===
                  500_000_000
              ) {
                transform =
                  "translateX(-65%)";
              }

              if (
                tick ===
                  axisTicks[0] &&
                axisMin >= 0
              ) {
                transform =
                  "translateX(0)";
              }

              if (
                tick ===
                axisTicks[
                  axisTicks.length -
                    1
                ]
              ) {
                transform =
                  "translateX(-100%)";
              }

              return (
                <span
                  key={tick}
                  className="shared-bottom-axis-tick"
                  style={{
                    left:
                      `${position}%`,
                    transform
                  }}
                >
                  {formatCompact(
                    tick
                  )}
                </span>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}