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
  useEffect,
  useMemo,
  useState
} from "react";
import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import CashFlowBar from "../components/CashFlowBar";
import HorizontalBarChart from "../components/HorizontalBarChart";
import {
  getCashAccounts,
  getCashActivities,
  getCashFlowBranches,
  getCashFlowMovement,
  getCashFlowSummary
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

function MovementValueLabel({
  x,
  y,
  width,
  height,
  value
}) {
  const number = Number(value || 0);
  const centerY = y + height / 2;

  if (number >= 0) {
    return (
      <text
        x={x + width + 7}
        y={centerY}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#101827"
        fontSize={11}
        fontWeight={800}
      >
        {formatMoney(number)}
      </text>
    );
  }

  const barWidth = Math.abs(width);

  if (barWidth >= 70) {
    return (
      <text
        x={x + 10}
        y={centerY}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#ffffff"
        fontSize={11}
        fontWeight={800}
      >
        {formatMoney(number)}
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
      fontSize={11}
      fontWeight={800}
    >
      {formatMoney(number)}
    </text>
  );
}

function MovementChart({
  data
}) {
  const safeData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        name: formatMonth(item.name),
        value: Number(item.value || 0)
      }))
    : [];

  const values = safeData.map(
    (item) => item.value
  );

  const minimum = Math.min(
    ...values,
    0
  );

  const maximum = Math.max(
    ...values,
    0
  );

  const negativeLimit =
    minimum < 0
      ? minimum * 1.25
      : 0;

  const positiveLimit =
    maximum > 0
      ? maximum * 1.25
      : 0;

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
            top: 12,
            right: 95,
            bottom: 15,
            left: 15
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
              negativeLimit,
              positiveLimit
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
            type="category"
            dataKey="name"
            width={95}
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{
              fontSize: 10,
              fill: "#52617a"
            }}
          />

          <ReferenceLine
            x={0}
            stroke="#cbd5e1"
            strokeWidth={1}
          />

          <Tooltip
            cursor={{
              fill:
                "rgba(15, 23, 42, 0.025)"
            }}
            formatter={(value) => [
              formatTooltipMoney(value),
              "Өөрчлөлт"
            ]}
          />

          <Bar
            dataKey="value"
            barSize={24}
            radius={[4, 4, 4, 4]}
            label={
              <MovementValueLabel />
            }
          >
            {safeData.map(
              (item, index) => (
                <Cell
                  key={`${item.name}-${index}`}
                  fill={
                    Number(
                      item.value
                    ) >= 0
                      ? "#2966e8"
                      : "#ef2b2d"
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

function ActivityValueLabel({
  x,
  y,
  width,
  value
}) {
  const number = Number(value || 0);

  if (number === 0) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y - 7}
      textAnchor="middle"
      fill={
        number < 0
          ? "#dc2626"
          : "#101827"
      }
      fontSize={11}
      fontWeight={800}
    >
      {formatMoney(number)}
    </text>
  );
}

function ActivityChart({
  data
}) {
  const safeData = Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        value: Number(
          item.value || 0
        )
      }))
    : [];

  return (
    <div className="chart-area">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={safeData}
          margin={{
            top: 35,
            right: 15,
            bottom: 10,
            left: 0
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
              fill: "#8292aa",
              fontSize: 10
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8292aa",
              fontSize: 10
            }}
            tickFormatter={
              formatMoney
            }
          />

          <Tooltip
            formatter={(value) => [
              formatTooltipMoney(value),
              "Дүн"
            ]}
          />

          <Bar
            dataKey="value"
            barSize={42}
            radius={[4, 4, 0, 0]}
            label={
              <ActivityValueLabel />
            }
          >
            {safeData.map(
              (item, index) => (
                <Cell
                  key={`${item.name}-${index}`}
                  fill={
                    Number(
                      item.value
                    ) < 0
                      ? "#dc2626"
                      : "#2966e8"
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

export default function CashFlow() {
  const {
    selectedMonth,
    selectedBranch
  } = useDashboard();

  const [summary, setSummary] =
    useState({
      total: 0,
      balance: 0,
      operating: 0,
      financing: 0,
      investing: 0
    });

  const [
    cashFlowBranch,
    setCashFlowBranch
  ] = useState([]);

  const [
    cashFlowMovement,
    setCashFlowMovement
  ] = useState([]);

  const [
    cashAccounts,
    setCashAccounts
  ] = useState([]);

  const [
    cashActivities,
    setCashActivities
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
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
          summaryData,
          branchData,
          movementData,
          accountsData,
          activitiesData
        ] = await Promise.all([
          getCashFlowSummary(
            filters
          ),
          getCashFlowBranches(
            filters
          ),
          getCashFlowMovement(
            monthlyFilters
          ),
          getCashAccounts(
            filters
          ),
          getCashActivities(
            filters
          )
        ]);

        if (!active) {
          return;
        }

        setSummary({
          total: Number(
            summaryData?.total ||
              0
          ),
          balance: Number(
            summaryData?.balance ||
              0
          ),
          operating: Number(
            summaryData?.operating ||
              0
          ),
          financing: Number(
            summaryData?.financing ||
              0
          ),
          investing: Number(
            summaryData?.investing ||
              0
          )
        });

        setCashFlowBranch(
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );

        setCashFlowMovement(
          Array.isArray(
            movementData
          )
            ? movementData
            : []
        );

        setCashAccounts(
          Array.isArray(
            accountsData
          )
            ? accountsData
            : []
        );

        setCashActivities(
          Array.isArray(
            activitiesData
          )
            ? activitiesData
            : []
        );
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Cash flow data load failed"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [
    selectedMonth,
    selectedBranch
  ]);

  const activityMap =
    useMemo(() => {
      const map = {
        operating: 0,
        financing: 0,
        investing: 0
      };

      cashActivities.forEach(
        (item) => {
          const name = String(
            item.name || ""
          ).toLowerCase();

          const value = Number(
            item.value || 0
          );

          if (
            name.includes(
              "operating"
            )
          ) {
            map.operating += value;
          } else if (
            name.includes(
              "financing"
            )
          ) {
            map.financing += value;
          } else if (
            name.includes(
              "investing"
            )
          ) {
            map.investing += value;
          }
        }
      );

      return map;
    }, [cashActivities]);

  const operating =
    summary.operating !== 0
      ? summary.operating
      : activityMap.operating;

  const financing =
    summary.financing !== 0
      ? summary.financing
      : activityMap.financing;

  const investing =
    summary.investing !== 0
      ? summary.investing
      : activityMap.investing;

  if (loading) {
    return (
      <div className="page-loading">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        {error}
      </div>
    );
  }

  return (
    <div className="cash-page">
      <div className="cash-kpis">
        <KpiCard
          value={summary.total}
          previousValue={0}
          label="Нийт"
          change={0}
        />

        <KpiCard
          value={summary.balance}
          previousValue={0}
          label="Үлдэгдэл"
          change={0}
        />

        <KpiCard
          value={operating}
          previousValue={0}
          label="Operating Үйл ажиллагааны"
          change={0}
        />

        <KpiCard
          value={financing}
          previousValue={0}
          label="Financing Санхүүжилтийн"
          change={0}
        />

        <KpiCard
          value={investing}
          previousValue={0}
          label="Investing Хөрөнгө оруулалтын"
          change={0}
        />
      </div>

      <div className="page-grid page-grid-2">
        <Card title="Мөнгөн хөрөнгийн дүн салбараар">
          <CashFlowBar
            data={cashFlowBranch}
          />
        </Card>

        <Card title="Мөнгөн хөрөнгийн хөдөлгөөн">
          <MovementChart
            data={cashFlowMovement}
          />
        </Card>

        <Card title="Мөнгөн хөрөнгийн дүн дансаар">
          <HorizontalBarChart
            data={cashAccounts}
          />
        </Card>

        <Card title="Мөнгөн хөрөнгө үйл ажиллагаагаар">
          <ActivityChart
            data={cashActivities}
          />
        </Card>
      </div>
    </div>
  );
}