import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  formatMoney,
  formatMonth,
  formatTooltipMoney
} from "../utils/formatters";

export default function MonthlyBarChart({
  data = [],
  color = "#43d77b"
}) {
  return (
    <div className="chart-area">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 30,
            right: 15,
            left: 10,
            bottom: 10
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#edf1f7"
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#8190a7"
            }}
            tickFormatter={
              formatMonth
            }
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#8190a7"
            }}
            tickFormatter={
              formatMoney
            }
          />

          <Tooltip
            labelFormatter={
              formatMonth
            }
            formatter={(value) => [
              formatTooltipMoney(
                value
              ),
              "Дүн"
            ]}
          />

          <Bar
            dataKey="value"
            barSize={36}
            radius={[4, 4, 0, 0]}
          >
            {data.map(
              (item, index) => (
                <Cell
                  key={index}
                  fill={
                    Number(
                      item.value
                    ) < 0
                      ? "#dc2626"
                      : color
                  }
                />
              )
            )}

            <LabelList
              dataKey="value"
              position="top"
              formatter={
                formatMoney
              }
              style={{
                fill: "#101827",
                fontWeight: 700,
                fontSize: 10
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}