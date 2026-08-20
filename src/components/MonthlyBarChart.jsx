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

function formatMonth(value) {
  if (!value) {
    return "";
  }

  const text =
    String(value)
      .trim()
      .replace(/-/g, "/");

  const match =
    text.match(
      /(\d{4})\/(\d{1,2})/
    );

  if (!match) {
    return text;
  }

  return `${match[1]}/${String(
    match[2]
  ).padStart(2, "0")}`;
}

function ValueLabel({
  x = 0,
  y = 0,
  width = 0,
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

  return (
    <text
      x={
        x +
        width / 2
      }
      y={y - 7}
      textAnchor="middle"
      fill="#101827"
      fontSize={10}
      fontWeight={800}
    >
      {formatCompact(
        number
      )}
    </text>
  );
}

export default function MonthlyBarChart({
  data = [],
  color = "#43d77b"
}) {
  const safeData =
    Array.isArray(data)
      ? data.map(
          (item) => ({
            ...item,
            month:
              formatMonth(
                item.month ||
                  item.name ||
                  ""
              ),
            value:
              Number(
                item.value || 0
              )
          })
        )
      : [];

  const values =
    safeData.map(
      (item) =>
        Number(
          item.value || 0
        )
    );

  const maxValue =
    Math.max(
      ...values,
      0
    );

  const calculatedMax =
    maxValue > 0
      ? maxValue * 1.15
      : 1;

  return (
    <div className="monthly-bar-chart">
      <div className="monthly-bar-chart-main">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={safeData}
            margin={{
              top: 26,
              right: 18,
              bottom: 10,
              left: 8
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#edf1f7"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={28}
              tickMargin={7}
              tick={{
                fill:
                  "#8292aa",
                fontSize: 10,
                fontWeight: 500
              }}
              tickFormatter={(
                value
              ) => {
                const month =
                  String(
                    value
                  ).split(
                    "/"
                  )[1];

                return (
                  month ||
                  value
                );
              }}
            />

            <YAxis
              type="number"
              domain={[
                0,
                calculatedMax
              ]}
              axisLine={false}
              tickLine={false}
              width={62}
              tick={{
                fill:
                  "#8292aa",
                fontSize: 10
              }}
              tickFormatter={
                formatCompact
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
              labelFormatter={(
                value
              ) =>
                formatMonth(
                  value
                )
              }
            />

            <Bar
              dataKey="value"
              fill={color}
              barSize={38}
              radius={[
                5,
                5,
                0,
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
  );
}