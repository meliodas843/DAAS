import {
  useEffect,
  useState
} from "react";
import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";
import ChangeBarChart from "../components/ChangeBarChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import {
  getReceivableAccounts,
  getReceivableBranches,
  getReceivableChanges,
  getReceivableMonthly
} from "../api/dashboardApi";
import {
  useDashboard
} from "../context/DashboardContext";
import {
  getDashboardFilters,
  getMonthlyFilters
} from "../utils/filters";

export default function Receivables() {
  const {
    selectedMonth,
    selectedBranch
  } = useDashboard();

  const [
    branches,
    setBranches
  ] = useState([]);

  const [
    changes,
    setChanges
  ] = useState([]);

  const [
    monthly,
    setMonthly
  ] = useState([]);

  const [
    accounts,
    setAccounts
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
          branchesData,
          changesData,
          monthlyData,
          accountsData
        ] =
          await Promise.all([
            getReceivableBranches(
              filters
            ),
            getReceivableChanges(
              monthlyFilters
            ),
            getReceivableMonthly(
              monthlyFilters
            ),
            getReceivableAccounts(
              filters
            )
          ]);

        if (!active) {
          return;
        }

        setBranches(
          Array.isArray(
            branchesData
          )
            ? branchesData
            : []
        );

        setChanges(
          Array.isArray(
            changesData
          )
            ? changesData
            : []
        );

        setMonthly(
          Array.isArray(
            monthlyData
          )
            ? monthlyData
            : []
        );

        setAccounts(
          Array.isArray(
            accountsData
          )
            ? accountsData
            : []
        );
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Data load failed"
          );
        }
      } finally {
        if (active) {
          setLoading(
            false
          );
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
    <div className="page-grid page-grid-2">
      <Card title="Авлагын дүн салбараар">
        <HorizontalBarChart
          data={branches}
          yAxisWidth={195}
          visibleHeight={285}
          rowHeight={40}
          barSize={20}
        />
      </Card>

      <Card title="Сарын Авлагын Өөрчлөлт">
        <ChangeBarChart
          data={changes}
        />
      </Card>

      <Card title="Авлагын дүн сараар">
        <MonthlyBarChart
          data={monthly}
        />
      </Card>

      <Card title="Авлагын дүн дансаар">
        <HorizontalBarChart
          data={accounts}
          yAxisWidth={210}
          visibleHeight={285}
          rowHeight={40}
          barSize={20}
        />
      </Card>
    </div>
  );
}