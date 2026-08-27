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

  return `${Math.round(number)}`;
}

function formatTooltip(value) {
  const number =
    Number(value || 0);

  return `₮${Math.round(
    number
  ).toLocaleString("en-US")}`;
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
        lines.push(current);
      }

      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

function CustomYAxisTick({
  x,
  y,
  payload
}) {
  const lines =
    wrapLabel(
      payload?.value || "",
      24
    );

  const lineHeight = 12;

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
        fontSize={12}
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
    !Number.isFinite(number) ||
    number === 0
  ) {
    return null;
  }

  const centerY =
    y + height / 2;

  const label =
    formatCompact(number);

  if (number > 0) {
    return (
      <text
        x={x + width + 8}
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

  return (
    <text
      x={x + width - 8}
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
    maxValue > max
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
  max,
  tickMode
) {
  if (
    tickMode ===
    "spaced"
  ) {
    const ticks = [];

    const start =
      Math.floor(
        min /
          1_000_000_000
      ) *
      1_000_000_000;

    const end =
      Math.ceil(
        max /
          1_000_000_000
      ) *
      1_000_000_000;

    for (
      let value =
        start;
      value <= end;
      value +=
        1_000_000_000
    ) {
      ticks.push(
        value
      );
    }

    return ticks;
  }

  const ticks = [];

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
    value <= max;
    value +=
      1_000_000_000
  ) {
    ticks.push(
      value
    );
  }

  return [
    ...new Set(
      ticks
    )
  ].sort(
    (a, b) =>
      a - b
  );
}

export default function HorizontalBarChart({
  data = [],
  color = "#2966e8",
  yAxisWidth = 220,
  barSize = 20,
  language = "mn",
  valueLabel,
  tickMode = "default"
}) {
  const tooltipLabel =
    valueLabel ||
    (
      language === "en"
        ? "Amount"
        : "Дүн"
    );

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

  let {
    min: axisMin,
    max: axisMax
  } =
    calculateAxis(
      safeData
    );

  if (
    tickMode ===
    "spaced"
  ) {
    axisMin =
      Math.floor(
        axisMin /
          1_000_000_000
      ) *
      1_000_000_000;

    if (
      axisMin === 0
    ) {
      axisMin =
        -1_000_000_000;
    }

    axisMax =
      Math.ceil(
        axisMax /
          1_000_000_000
      ) *
      1_000_000_000;
  }

  const axisTicks =
    createTicks(
      axisMin,
      axisMax,
      tickMode
    );

  const leftMargin = 15;
  const rightMargin = 70;

  return (
    <div className="fixed-axis-chart">
      <div className="fixed-axis-chart-main">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={safeData}
            layout="vertical"
            margin={{
              top: 12,
              right:
                rightMargin,
              bottom: 8,
              left:
                leftMargin
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
              axisLine={
                false
              }
              tickLine={
                false
              }
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
                tooltipLabel
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
              animationDuration={
                700
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

      <div className="shared-bottom-axis">
        <div
          className="shared-bottom-axis-track"
          style={{
            marginLeft:
              `${
                yAxisWidth +
                leftMargin
              }px`,

            marginRight:
              `${rightMargin}px`
          }}
        >
          {axisTicks.map(
            (tick) => {
              const position =
                (
                  (tick -
                    axisMin) /
                  (axisMax -
                    axisMin)
                ) *
                100;

              return (
                <span
                  key={
                    tick
                  }
                  className="shared-bottom-axis-tick"
                  style={{
                    left:
                      `${position}%`
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