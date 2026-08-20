import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import AgingDonut from "../components/AgingDonut";
import {
  getAreaStats,
  getCollectionRate,
  getKpis,
  getPayableAging,
  getReceivableAging,
  getRevenueMonthly
} from "../api/dashboardApi";
import { useDashboard } from "../context/DashboardContext";
import {
  getDashboardFilters,
  getMonthlyFilters
} from "../utils/filters";
import {
  formatMoney,
  formatMonth,
  formatTooltipMoney
} from "../utils/formatters";

function CollectionChart({ data }) {
  const safeData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        month: formatMonth(item.month),
        value: Number(item.value || 0)
      }))
    : [];

  const maxValue = Math.max(
    20,
    ...safeData.map((item) => item.value)
  );

  const yMax =
    Math.ceil(maxValue / 10) * 10 + 10;

  return (
    <div className="dashboard-chart collection-chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={safeData}
          margin={{
            top: 28,
            left: 0,
            right: 25,
            bottom: 10
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
            tick={{
              fill: "#8796ad",
              fontSize: 10
            }}
          />

          <YAxis
            domain={[0, yMax]}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8796ad",
              fontSize: 10
            }}
            tickFormatter={(value) =>
              `${value}%`
            }
          />

          <Tooltip
            formatter={(value) => [
              `${Number(value || 0).toFixed(1)}%`,
              "Цуглуулалт"
            ]}
          />

          <ReferenceLine
            y={20}
            stroke="#ff6423"
            strokeDasharray="5 4"
            label={{
              value: "Зорилт 20%",
              position: "insideTopRight",
              fill: "#ff6423",
              fontSize: 10,
              fontWeight: 700
            }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2467e8"
            strokeWidth={3}
            connectNulls
            dot={(props) => {
              const {
                cx,
                cy,
                payload,
                index
              } = props;

              const value = Number(
                payload?.value || 0
              );

              return (
                <g key={index}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={
                      value >= 20
                        ? "#22ad58"
                        : "#df2f2f"
                    }
                    stroke="#ffffff"
                    strokeWidth={2}
                  />

                  <text
                    x={cx}
                    y={cy - 13}
                    textAnchor="middle"
                    fill="#101827"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {value.toFixed(1)}%
                  </text>
                </g>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FinancialChart({ data }) {
  const safeData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        month: formatMonth(item.month),
        revenue: Number(item.revenue || 0),
        expense: Number(item.expense || 0),
        profit: Number(item.profit || 0)
      }))
    : [];

  return (
    <div className="dashboard-chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={safeData}
          margin={{
            top: 30,
            left: 0,
            right: 15,
            bottom: 5
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
            tick={{
              fill: "#8796ad",
              fontSize: 10
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8796ad",
              fontSize: 10
            }}
            tickFormatter={(value) =>
              formatMoney(value)
            }
          />

          <Tooltip
            formatter={(value, name) => [
              formatTooltipMoney(value),
              name
            ]}
          />

          <Legend />

          <Bar
            name="Орлого"
            dataKey="revenue"
            fill="#2164e8"
            barSize={16}
            radius={[3, 3, 0, 0]}
          >
            <LabelList
              dataKey="revenue"
              position="top"
              formatter={(value) =>
                formatMoney(value)
              }
              style={{
                fill: "#101827",
                fontSize: 9,
                fontWeight: 700
              }}
            />
          </Bar>

          <Bar
            name="Зардал"
            dataKey="expense"
            fill="#75b9ff"
            barSize={16}
            radius={[3, 3, 0, 0]}
          >
            <LabelList
              dataKey="expense"
              position="top"
              formatter={(value) =>
                formatMoney(value)
              }
              style={{
                fill: "#101827",
                fontSize: 9,
                fontWeight: 700
              }}
            />
          </Bar>

          <Line
            name="Ашиг"
            type="monotone"
            dataKey="profit"
            stroke="#f15b16"
            strokeWidth={2}
            dot={{
              r: 4,
              fill: "#f15b16"
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniStat({
  value,
  label
}) {
  return (
    <div className="mini-stat">
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const {
    selectedMonth,
    selectedBranch
  } = useDashboard();

  const [kpis, setKpis] = useState({
    revenue: 0,
    revenue_previous: 0,
    revenue_change: 0,
    expense: 0,
    expense_previous: 0,
    expense_change: 0,
    receivable: 0,
    receivable_previous: 0,
    receivable_change: 0,
    payable: 0,
    payable_previous: 0,
    payable_change: 0,
    net_profit: 0,
    net_profit_previous: 0,
    net_profit_change: 0
  });

  const [areaStats, setAreaStats] =
    useState({
      rented: 0,
      total: 0,
      vacant: 0,
      utilization: 0
    });

  const [
    collectionMonthly,
    setCollectionMonthly
  ] = useState([]);

  const [
    incomeExpenseMonthly,
    setIncomeExpenseMonthly
  ] = useState([]);

  const [
    receivableAging,
    setReceivableAging
  ] = useState([]);

  const [
    payableAging,
    setPayableAging
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const filters =
          getDashboardFilters(
            selectedMonth,
            selectedBranch
          );

        const monthlyFilters =
          getMonthlyFilters(
            selectedBranch
          );

        const [
          kpiData,
          areaData,
          collectionData,
          revenueData,
          receivableAgingData,
          payableAgingData
        ] = await Promise.all([
          getKpis(filters),
          getAreaStats(filters),
          getCollectionRate(
            monthlyFilters
          ),
          getRevenueMonthly(
            monthlyFilters
          ),
          getReceivableAging(
            filters
          ),
          getPayableAging(
            filters
          )
        ]);

        if (!mounted) {
          return;
        }

        setKpis({
          revenue: Number(
            kpiData?.revenue || 0
          ),

          revenue_previous:
            Number(
              kpiData?.revenue_previous ||
                0
            ),

          revenue_change:
            Number(
              kpiData?.revenue_change ||
                0
            ),

          expense: Number(
            kpiData?.expense || 0
          ),

          expense_previous:
            Number(
              kpiData?.expense_previous ||
                0
            ),

          expense_change:
            Number(
              kpiData?.expense_change ||
                0
            ),

          receivable: Number(
            kpiData?.receivable || 0
          ),

          receivable_previous:
            Number(
              kpiData?.receivable_previous ||
                0
            ),

          receivable_change:
            Number(
              kpiData?.receivable_change ||
                0
            ),

          payable: Number(
            kpiData?.payable || 0
          ),

          payable_previous:
            Number(
              kpiData?.payable_previous ||
                0
            ),

          payable_change:
            Number(
              kpiData?.payable_change ||
                0
            ),

          net_profit: Number(
            kpiData?.net_profit || 0
          ),

          net_profit_previous:
            Number(
              kpiData?.net_profit_previous ||
                0
            ),

          net_profit_change:
            Number(
              kpiData?.net_profit_change ||
                0
            )
        });

        setAreaStats({
          rented: Number(
            areaData?.rented || 0
          ),

          total: Number(
            areaData?.total || 0
          ),

          vacant: Number(
            areaData?.vacant || 0
          ),

          utilization: Number(
            areaData?.utilization || 0
          )
        });

        setCollectionMonthly(
          Array.isArray(
            collectionData
          )
            ? collectionData
            : []
        );

        setIncomeExpenseMonthly(
          Array.isArray(
            revenueData
          )
            ? revenueData
            : []
        );

        setReceivableAging(
          Array.isArray(
            receivableAgingData
          )
            ? receivableAgingData
            : []
        );

        setPayableAging(
          Array.isArray(
            payableAgingData
          )
            ? payableAgingData
            : []
        );
      } catch (err) {
        console.error(
          "Dashboard load error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Dashboard data load failed"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [
    selectedMonth,
    selectedBranch
  ]);

  const latestCollection =
    useMemo(() => {
      if (
        collectionMonthly.length === 0
      ) {
        return null;
      }

      return collectionMonthly[
        collectionMonthly.length - 1
      ];
    }, [collectionMonthly]);

  const previousCollection =
    useMemo(() => {
      if (
        collectionMonthly.length < 2
      ) {
        return null;
      }

      return collectionMonthly[
        collectionMonthly.length - 2
      ];
    }, [collectionMonthly]);

  const missedTargetCount =
    useMemo(
      () =>
        collectionMonthly.filter(
          (item) =>
            Number(
              item.value || 0
            ) < 20
        ).length,
      [collectionMonthly]
    );

  const latestFinancial =
    useMemo(() => {
      if (
        incomeExpenseMonthly.length ===
        0
      ) {
        return null;
      }

      return incomeExpenseMonthly[
        incomeExpenseMonthly.length -
          1
      ];
    }, [incomeExpenseMonthly]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="page-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="page-error">
          Backend error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-kpis">
        <KpiCard
          value={kpis.revenue}
          previousValue={
            kpis.revenue_previous
          }
          label="Нийт Орлого"
          change={
            kpis.revenue_change
          }
        />

        <KpiCard
          value={kpis.expense}
          previousValue={
            kpis.expense_previous
          }
          label="Нийт Зардал"
          change={
            kpis.expense_change
          }
          inverse
        />

        <KpiCard
          value={kpis.receivable}
          previousValue={
            kpis.receivable_previous
          }
          label="Богино Хугацаат Авлага"
          change={
            kpis.receivable_change
          }
          warning
        />

        <KpiCard
          value={kpis.payable}
          previousValue={
            kpis.payable_previous
          }
          label="Богино Хугацаат Өглөг"
          change={
            kpis.payable_change
          }
        />

        <KpiCard
          value={kpis.net_profit}
          previousValue={
            kpis.net_profit_previous
          }
          label="Үйл ажиллагааны ашиг"
          change={
            kpis.net_profit_change
          }
          warning
        />
      </div>

      <div className="dashboard-main-row">
        <Card
          title="Авлага цуглуулалтын хувь сараар"
          className="collection-card"
        >
          <CollectionChart
            data={collectionMonthly}
          />

          <div className="chart-summary">
            Энэ сар:{" "}
            <strong>
              {Number(
                latestCollection?.value ||
                  0
              ).toFixed(1)}
              %
            </strong>{" "}
            (өмнөх:{" "}
            {Number(
              previousCollection?.value ||
                0
            ).toFixed(1)}
            %) ·{" "}
            <span>
              ⚠ Зорилт 20%-д
              хүрээгүй:{" "}
              {missedTargetCount}/
              {collectionMonthly.length}{" "}
              сар
            </span>
          </div>
        </Card>

        <div className="mini-stats-column">
          <MiniStat
            value={Number(
              areaStats.rented || 0
            ).toLocaleString(
              "en-US"
            )}
            label="Түрээслэгдсэн тоо"
          />

          <MiniStat
            value={`${Number(
              areaStats.utilization ||
                0
            ).toFixed(2)}%`}
            label="Ашиглалт %"
          />

          <MiniStat
            value={Number(
              areaStats.vacant || 0
            ).toLocaleString(
              "en-US"
            )}
            label="Сул тоо"
          />
        </div>

        <Card
          title="Авлагын насжилт"
          className="aging-card"
        >
          <AgingDonut
            data={receivableAging}
            previous=""
          />
        </Card>
      </div>

      <div className="dashboard-bottom-row">
        <Card
          title="Нийт Орлого, Зардал, Ашиг сараар"
          className="financial-card"
        >
          <FinancialChart
            data={
              incomeExpenseMonthly
            }
          />

          <div className="chart-summary">
            Энэ сар: Орлого{" "}
            <strong>
              {formatMoney(
                latestFinancial?.revenue ||
                  0,
                true
              )}
            </strong>{" "}
            / Зардал{" "}
            <strong>
              {formatMoney(
                latestFinancial?.expense ||
                  0,
                true
              )}
            </strong>{" "}
            · Ашиг:{" "}
            <strong
              className={
                Number(
                  latestFinancial?.profit ||
                    0
                ) < 0
                  ? "negative-money"
                  : ""
              }
            >
              {formatMoney(
                latestFinancial?.profit ||
                  0,
                true
              )}
            </strong>
          </div>
        </Card>

        <Card
          title="Өглөгийн насжилт"
          className="aging-card"
        >
          <AgingDonut
            data={payableAging}
            previous=""
          />
        </Card>
      </div>
    </div>
  );
}