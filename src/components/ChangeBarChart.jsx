import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
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

function ValueLabel({
  x,
  y,
  width,
  height,
  value
}) {
  const number =
    Number(value || 0);

  if (number >= 0) {
    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#101827"
        fontSize={10}
        fontWeight={700}
      >
        {formatMoney(number)}
      </text>
    );
  }

  if (
    Math.abs(width) > 60
  ) {
    return (
      <text
        x={x + 8}
        y={y + height / 2}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#ffffff"
        fontSize={10}
        fontWeight={700}
      >
        {formatMoney(number)}
      </text>
    );
  }

  return (
    <text
      x={x - 8}
      y={y + height / 2}
      dominantBaseline="middle"
      textAnchor="end"
      fill="#dc2626"
      fontSize={10}
      fontWeight={700}
    >
      {formatMoney(number)}
    </text>
  );
}

export default function ChangeBarChart({
  data = []
}) {
  const safeData =
    Array.isArray(data)
      ? data
      : [];

  const values =
    safeData.map((item) =>
      Number(item.value || 0)
    );

  const range = Math.max(
    ...values.map(Math.abs),
    1
  );

  return (
    <div className="chart-area">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={safeData}
          layout="vertical"
          margin={{
            top: 10,
            right: 80,
            bottom: 20,
            left: 10
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#edf1f7"
          />

          <XAxis
            type="number"
            domain={[
              -range * 1.2,
              range * 1.2
            ]}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#8292aa"
            }}
            tickFormatter={
              formatMoney
            }
          />

          <YAxis
            dataKey="name"
            type="category"
            width={90}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#52617a"
            }}
            tickFormatter={
              formatMonth
            }
          />

          <ReferenceLine
            x={0}
            stroke="#cbd5e1"
          />

          <Tooltip
            labelFormatter={
              formatMonth
            }
            formatter={(value) => [
              formatTooltipMoney(
                value
              ),
              "Өөрчлөлт"
            ]}
          />

          <Bar
            dataKey="value"
            barSize={22}
            radius={[4, 4, 4, 4]}
            label={<ValueLabel />}
          >
            {safeData.map(
              (item, index) => (
                <Cell
                  key={index}
                  fill={
                    Number(
                      item.value
                    ) >= 0
                      ? "#2966e8"
                      : "#dc2626"
                  }
                />
              )
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}