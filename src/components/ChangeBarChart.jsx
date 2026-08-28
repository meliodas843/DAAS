import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import HoverScroll from "./HoverScroll";

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

function CustomBarShape(props) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload
  } = props;

  const value =
    Number(
      payload?.value ||
        0
    );

  if (
    !Number.isFinite(
      value
    ) ||
    value === 0
  ) {
    return null;
  }

  const negative =
    value < 0;

  const fill =
    negative
      ? "#e1262c"
      : "#2966e8";

  const actualWidth =
    Math.max(
      Math.abs(width),
      2
    );

  const rectX =
    negative
      ? x + width
      : x;

  const centerY =
    y +
    height / 2;

  const labelX =
    negative
      ? rectX - 12
      : rectX +
        actualWidth +
        12;

  return (
    <g>
      <rect
        x={rectX}
        y={y}
        width={
          actualWidth
        }
        height={
          height
        }
        rx={5}
        ry={5}
        fill={
          fill
        }
      />

      <text
        x={
          labelX
        }
        y={
          centerY
        }
        dominantBaseline="middle"
        textAnchor={
          negative
            ? "end"
            : "start"
        }
        fill={
          negative
            ? "#dc2626"
            : "#101827"
        }
        fontSize={
          10.5
        }
        fontWeight={
          800
        }
      >
        {formatCompact(
          value
        )}
      </text>
    </g>
  );
}

function CustomYAxisTick(
  props
) {
  const {
    x = 0,
    y = 0,
    payload
  } = props;

  return (
    <text
      x={
        Number(x) - 30
      }
      y={
        Number(y)
      }
      dy={3}
      textAnchor="end"
      fill="#536177"
      fontSize={10}
      fontWeight={500}
    >
      {
        payload?.value ||
        ""
      }
    </text>
  );
}

function calculateAxis(
  data
) {
  const values =
    data.map(
      (item) =>
        Number(
          item.value ||
            0
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

  const maxAbsolute =
    Math.max(
      Math.abs(
        minValue
      ),
      Math.abs(
        maxValue
      ),
      1
    );

  let step =
    500_000_000;

  if (
    maxAbsolute >
    2_000_000_000
  ) {
    step =
      1_000_000_000;
  }

  const paddedMaximum =
    maxAbsolute *
    1.18;

  const edge =
    Math.ceil(
      paddedMaximum /
        step
    ) *
    step;

  return {
    min:
      -edge,
    max:
      edge,
    step
  };
}

function createTicks(
  min,
  max,
  step
) {
  const ticks = [];

  for (
    let value = min;
    value <= max;
    value += step
  ) {
    ticks.push(
      value
    );
  }

  return ticks;
}

export default function ChangeBarChart({
  data = [],
  language = "mn",
  valueLabel
}) {
  const tooltipLabel =
    valueLabel ||
    (
      language === "en"
        ? "Change"
        : "Өөрчлөлт"
    );

  const safeData =
    Array.isArray(data)
      ? data.map(
          (item) => ({
            ...item,

            value:
              Number(
                item.value ||
                  0
              )
          })
        )
      : [];

  const {
    min: axisMin,
    max: axisMax,
    step: axisStep
  } =
    calculateAxis(
      safeData
    );

  const axisTicks =
    createTicks(
      axisMin,
      axisMax,
      axisStep
    );

  const yAxisWidth =
    135;

  const chartLeftMargin =
    0;

  const chartRightMargin =
    65;

  const bottomAxisRightMargin =
    45;

  const visibleHeight =
    285;

  const rowHeight =
    56;

  const chartHeight =
    Math.max(
      visibleHeight + 1,
      safeData.length *
        rowHeight +
        12
    );

  return (
    <div className="change-bar-chart">
      <HoverScroll
        direction="vertical"
        className="change-bar-hover-scroll"
      >
        <div
          className="change-bar-chart-main"
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
              data={
                safeData
              }
              layout="vertical"
              margin={{
                top: 5,

                right:
                  chartRightMargin,

                bottom: 0,

                left:
                  chartLeftMargin
              }}
              barCategoryGap={
                16
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={
                  false
                }
                stroke="#edf1f7"
              />

              <XAxis
                type="number"
                domain={[
                  axisMin,
                  axisMax
                ]}
                hide
                allowDataOverflow={
                  false
                }
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
                interval={
                  0
                }
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
                barSize={
                  22
                }
                shape={
                  <CustomBarShape />
                }
                isAnimationActive={
                  true
                }
                animationBegin={
                  100
                }
                animationDuration={
                  1000
                }
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>

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
              `${bottomAxisRightMargin}px`
          }}
        >
          {axisTicks.map(
            (tick) => {
              const position =
                (
                  (
                    tick -
                    axisMin
                  ) /
                  (
                    axisMax -
                    axisMin
                  )
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