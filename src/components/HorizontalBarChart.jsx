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
  const number = Number(value || 0);
  const absolute = Math.abs(number);
  const sign = number < 0 ? "-" : "";

  if (absolute >= 1_000_000_000) {
    return `${sign}${Math.floor(
      absolute / 1_000_000_000
    )}bn`;
  }

  if (absolute >= 1_000_000) {
    return `${sign}${Math.floor(
      absolute / 1_000_000
    )}M`;
  }

  if (absolute >= 1_000) {
    return `${sign}${Math.floor(
      absolute / 1_000
    )}K`;
  }

  return `${Math.round(number)}`;
}

function formatAxis(value) {
  const number = Number(value || 0);
  const absolute = Math.abs(number);
  const sign = number < 0 ? "-" : "";

  if (Math.abs(number) < 0.000001) {
    return "0";
  }

  if (absolute >= 1_000_000_000) {
    return `${sign}₮${(
      absolute / 1_000_000_000
    ).toFixed(1)}bn`;
  }

  if (absolute >= 1_000_000) {
    return `${sign}₮${(
      absolute / 1_000_000
    ).toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    return `${sign}₮${(
      absolute / 1_000
    ).toFixed(1)}K`;
  }

  return `${sign}₮${Math.round(
    absolute
  )}`;
}

function formatTooltip(value) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";

  return `${sign}₮${Math.round(
    Math.abs(number)
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

      if (
        word.length >
        maxLength
      ) {
        let rest = word;

        while (
          rest.length >
          maxLength
        ) {
          lines.push(
            rest.slice(
              0,
              maxLength
            )
          );

          rest =
            rest.slice(
              maxLength
            );
        }

        current = rest;
      } else {
        current = word;
      }
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
        x={x - 8}
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
              x={x - 8}
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
  x,
  y,
  width,
  height,
  value
}) {
  const number =
    Number(value || 0);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }

  const centerY =
    y +
    height / 2;

  if (number >= 0) {
    return (
      <text
        x={
          x +
          width +
          7
        }
        y={centerY}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#101827"
        fontSize={10.5}
        fontWeight={800}
      >
        {formatCompact(
          number
        )}
      </text>
    );
  }

  return (
    <text
      x={x - 7}
      y={centerY}
      dominantBaseline="middle"
      textAnchor="end"
      fill="#dc2626"
      fontSize={10.5}
      fontWeight={800}
    >
      {formatCompact(
        number
      )}
    </text>
  );
}

function getDomain(data) {
  const values =
    data.map(
      (item) =>
        Number(
          item.value || 0
        )
    );

  const max =
    Math.max(
      ...values,
      0
    );

  const min =
    Math.min(
      ...values,
      0
    );

  if (
    min === 0 &&
    max === 0
  ) {
    return [
      0,
      1
    ];
  }

  const largest =
    Math.max(
      Math.abs(min),
      Math.abs(max),
      1
    );

  const padding =
    largest * 0.12;

  return [
    min < 0
      ? min - padding
      : 0,
    max > 0
      ? max + padding
      : 0
  ];
}

function createTicks(
  domain,
  count = 5
) {
  const [
    min,
    max
  ] = domain;

  if (count <= 1) {
    return [min];
  }

  const step =
    (max - min) /
    (count - 1);

  return Array.from(
    {
      length: count
    },
    (
      _,
      index
    ) =>
      min +
      step *
        index
  );
}

export default function HorizontalBarChart({
  data = [],
  color = "#2966e8",
  yAxisWidth = 195,
  rowHeight = 40,
  barSize = 20,
  visibleHeight = 285
}) {
  const rightMargin = 90;
  const leftMargin = 10;

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
        rowHeight
    );

  const domain =
    getDomain(
      safeData
    );

  const ticks =
    createTicks(
      domain,
      5
    );

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
                top: 8,
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
                domain={domain}
                hide
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
                barSize={barSize}
                radius={[
                  0,
                  5,
                  5,
                  0
                ]}
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

      <div
        className="fixed-axis-bottom"
        style={{
          paddingLeft:
            `${
              yAxisWidth +
              leftMargin
            }px`,
          paddingRight:
            `${rightMargin}px`
        }}
      >
        <div className="fixed-axis-line">
          {ticks.map(
            (
              tick,
              index
            ) => (
              <span
                key={index}
                className="fixed-axis-tick"
                style={{
                  left:
                    `${
                      (index /
                        (ticks.length -
                          1)) *
                      100
                    }%`
                }}
              >
                {formatAxis(
                  tick
                )}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}