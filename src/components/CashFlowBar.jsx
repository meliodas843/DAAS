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

export default function CashFlowBar({ data }) {
  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 20, right: 70, top: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#edf1f7"
          />

          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#8292aa"
            }}
          />

          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={80}
            tick={{
              fontSize: 11,
              fill: "#52617a"
            }}
          />

          <Tooltip />

          <Bar dataKey="value" barSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value >= 0 ? "#43d77b" : "#24b860"}
              />
            ))}

            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => `${value}M`}
              style={{
                fill: "#101827",
                fontWeight: 800,
                fontSize: 11
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}