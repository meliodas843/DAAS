import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  useEffect,
  useMemo,
  useState
} from "react";
import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";
import {
  getBranchRevenueExpense,
  getExpenseAccounts,
  getExpenseGroups,
  getRevenueAccounts
} from "../api/dashboardApi";
import {
  useDashboard
} from "../context/DashboardContext";

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
    return `${sign}${Math.floor(
      absolute /
        1_000_000_000
    )}bn`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    return `${sign}${Math.floor(
      absolute /
        1_000_000
    )}M`;
  }

  if (
    absolute >=
    1_000
  ) {
    return `${sign}${Math.floor(
      absolute /
        1_000
    )}K`;
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
  maxLength = 20
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
      20
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

function BranchRevenueExpenseChart({
  data = []
}) {
  const safeData =
    Array.isArray(data)
      ? data.map(
          (item) => ({
            ...item,
            revenue:
              Number(
                item.revenue ||
                  0
              ),
            expense:
              Number(
                item.expense ||
                  0
              )
          })
        )
      : [];

  const calculatedHeight =
    Math.max(
      340,
      safeData.length *
        44 +
        50
    );

  return (
    <div className="horizontal-chart-scroll">
      <div
        className="horizontal-chart-inner"
        style={{
          height:
            calculatedHeight
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
              top: 10,
              right: 70,
              bottom: 25,
              left: 10
            }}
            barCategoryGap={10}
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
                fill:
                  "#8190a7",
                fontSize: 10
              }}
              tickFormatter={
                formatCompact
              }
            />

            <YAxis
              type="category"
              dataKey="name"
              width={165}
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={
                <CustomYAxisTick />
              }
            />

            <Tooltip
              formatter={(
                value,
                name
              ) => [
                formatTooltip(
                  value
                ),
                name
              ]}
            />

            <Legend
              verticalAlign="bottom"
              height={30}
            />

            <Bar
              dataKey="expense"
              name="Зардал"
              fill="#2966e8"
              barSize={10}
              radius={[
                0,
                4,
                4,
                0
              ]}
            />

            <Bar
              dataKey="revenue"
              name="Орлого"
              fill="#43d77b"
              barSize={10}
              radius={[
                0,
                4,
                4,
                0
              ]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function RevenueExpense() {
  const {
    filters
  } = useDashboard();

  const [
    revenueAccounts,
    setRevenueAccounts
  ] = useState([]);

  const [
    expenseGroups,
    setExpenseGroups
  ] = useState([]);

  const [
    branchRevenueExpense,
    setBranchRevenueExpense
  ] = useState([]);

  const [
    expenseAccounts,
    setExpenseAccounts
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [
          revenueData,
          groupsData,
          branchData,
          expenseData
        ] =
          await Promise.all([
            getRevenueAccounts(
              filters
            ),
            getExpenseGroups(
              filters
            ),
            getBranchRevenueExpense(
              filters
            ),
            getExpenseAccounts(
              filters
            )
          ]);

        if (!mounted) {
          return;
        }

        setRevenueAccounts(
          Array.isArray(
            revenueData
          )
            ? revenueData
            : []
        );

        setExpenseGroups(
          Array.isArray(
            groupsData
          )
            ? groupsData
            : []
        );

        setBranchRevenueExpense(
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );

        setExpenseAccounts(
          Array.isArray(
            expenseData
          )
            ? expenseData
            : []
        );
      } catch (err) {
        if (mounted) {
          setError(
            err?.message ||
              "Data load failed"
          );
        }
      } finally {
        if (mounted) {
          setLoading(
            false
          );
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const revenueRows =
    useMemo(
      () =>
        [
          ...revenueAccounts
        ].sort(
          (a, b) =>
            Number(
              b.value || 0
            ) -
            Number(
              a.value || 0
            )
        ),
      [
        revenueAccounts
      ]
    );

  const expenseGroupRows =
    useMemo(
      () =>
        [
          ...expenseGroups
        ].sort(
          (a, b) =>
            Number(
              b.value || 0
            ) -
            Number(
              a.value || 0
            )
        ),
      [
        expenseGroups
      ]
    );

  const expenseAccountRows =
    useMemo(
      () =>
        [
          ...expenseAccounts
        ].sort(
          (a, b) =>
            Number(
              b.value || 0
            ) -
            Number(
              a.value || 0
            )
        ),
      [
        expenseAccounts
      ]
    );

  if (loading) {
    return (
      <div className="revenue-expense-page">
        <div className="page-loading">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revenue-expense-page">
        <div className="page-error">
          Backend error:{" "}
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-expense-page">
      <div className="revenue-expense-grid">
        <Card
          title="Орлогын дүн дансаар"
          className="revenue-expense-card"
        >
          <HorizontalBarChart
            data={revenueRows}
            yAxisWidth={195}
            minHeight={340}
          />
        </Card>

        <Card
          title="Зардлын бүлгээр"
          className="revenue-expense-card"
        >
          <HorizontalBarChart
            data={
              expenseGroupRows
            }
            yAxisWidth={210}
            minHeight={340}
          />
        </Card>

        <Card
          title="Орлого Зардлын дүн салбараар"
          className="revenue-expense-card"
        >
          <BranchRevenueExpenseChart
            data={
              branchRevenueExpense
            }
          />
        </Card>

        <Card
          title="Зардлын дүн дансаар"
          className="revenue-expense-card"
        >
          <HorizontalBarChart
            data={
              expenseAccountRows
            }
            yAxisWidth={210}
            minHeight={340}
          />
        </Card>
      </div>
    </div>
  );
}