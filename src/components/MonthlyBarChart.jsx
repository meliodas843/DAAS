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

function formatMonth(value) {
  if (!value) {
    return "";
  }

  const text =
    String(value)
      .trim()
      .replace(
        /-/g,
        "/"
      );

  const match =
    text.match(
      /(\d{4})\/(\d{1,2})/
    );

  if (!match) {
    return text;
  }

  return `${match[1]}/${String(
    match[2]
  ).padStart(
    2,
    "0"
  )}`;
}

export default function MonthlyBarChart({
  data = [],
  color = "#a394eb",
  language = "mn",
  valueLabel
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

            month:
              formatMonth(
                item.month ||
                  item.name ||
                  ""
              ),

            value:
              Number(
                item.value ||
                  0
              )
          })
        )
      : [];

  const maxValue =
    Math.max(
      ...safeData.map(
        (item) =>
          item.value
      ),
      0
    );

  const calculatedMax =
    maxValue > 0
      ? maxValue * 1.22
      : 1;

  const chartWidth =
    Math.max(
      620,
      safeData.length *
        105
    );

  return (
    <div className="monthly-bar-chart">
      <HoverScroll
        direction="horizontal"
        className="monthly-bar-hover-scroll"
      >
        <div
          className="monthly-bar-chart-main"
          style={{
            width:
              `${chartWidth}px`
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
              margin={{
                top: 34,
                right: 18,
                bottom: 4,
                left: 8
              }}
              barCategoryGap="35%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={
                  false
                }
                stroke="#edf1f7"
              />

              <XAxis
                dataKey="month"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                interval={
                  0
                }
                height={
                  28
                }
                tickMargin={
                  7
                }
                tick={{
                  fill:
                    "#8292aa",
                  fontSize:
                    10,
                  fontWeight:
                    500
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
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                width={
                  62
                }
                tick={{
                  fill:
                    "#8292aa",
                  fontSize:
                    10
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
                  tooltipLabel
                ]}
                labelFormatter={
                  formatMonth
                }
              />

              <Bar
                dataKey="value"
                fill={
                  color
                }
                barSize={
                  24
                }
                radius={[
                  4,
                  4,
                  0,
                  0
                ]}
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
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(
                    value
                  ) =>
                    formatCompact(
                      value
                    )
                  }
                  style={{
                    fill:
                      "#101827",
                    fontSize:
                      10,
                    fontWeight:
                      800
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>
    </div>
  );
}