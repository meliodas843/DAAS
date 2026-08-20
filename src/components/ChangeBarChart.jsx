import {
  Bar,
  BarChart,
  CartesianGrid,
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
      payload?.value || 0
    );

  if (
    !Number.isFinite(value) ||
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

  const centerY =
    y +
    height / 2;

  const label =
    formatCompact(
      value
    );

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={Math.max(
          width,
          2
        )}
        height={height}
        rx={5}
        ry={5}
        fill={fill}
      />

      <text
        x={
          negative
            ? x - 9
            : x +
              width +
              9
        }
        y={centerY}
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
        fontSize={10.5}
        fontWeight={800}
      >
        {label}
      </text>
    </g>
  );
}

const AXIS_MIN =
  -2_000_000_000;

const AXIS_MAX =
  2_000_000_000;

const AXIS_TICKS = [
  -2_000_000_000,
  -1_000_000_000,
  0,
  1_000_000_000,
  2_000_000_000
];

export default function ChangeBarChart({
  data = []
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

  const yAxisWidth =
    90;

  const chartLeftMargin =
    15;

  const chartRightMargin =
    75;

  return (
    <div className="change-bar-chart">
      <div className="change-bar-chart-main">
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
            barCategoryGap={16}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#edf1f7"
            />

            <XAxis
              type="number"
              domain={[
                AXIS_MIN,
                AXIS_MAX
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
              tick={{
                fill:
                  "#536177",
                fontSize: 10
              }}
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
                "Өөрчлөлт"
              ]}
            />

            <Bar
              dataKey="value"
              barSize={22}
              shape={
                <CustomBarShape />
              }
              isAnimationActive={
                false
              }
            />
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
                chartLeftMargin
              }px`,
            marginRight:
              `${chartRightMargin}px`
          }}
        >
          {AXIS_TICKS.map(
            (tick) => (
              <span
                key={tick}
                className="shared-bottom-axis-tick"
                style={{
                  left: `${
                    ((tick -
                      AXIS_MIN) /
                      (AXIS_MAX -
                        AXIS_MIN)) *
                    100
                  }%`
                }}
              >
                {formatCompact(
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