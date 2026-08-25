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

const translations = {
  mn: {
    loading:
      "Уншиж байна...",
    loadError:
      "Өгөгдөл ачаалахад алдаа гарлаа",

    byBranch:
      "Авлагын дүн салбараар",

    monthlyChange:
      "Сарын Авлагын Өөрчлөлт",

    byMonth:
      "Авлагын дүн сараар",

    byAccount:
      "Авлагын дүн дансаар",

    amount:
      "Дүн",

    change:
      "Өөрчлөлт"
  },

  en: {
    loading:
      "Loading...",
    loadError:
      "Data load failed",

    byBranch:
      "Receivables Amount by Branch",

    monthlyChange:
      "Monthly Receivables Change",

    byMonth:
      "Receivables Amount by Month",

    byAccount:
      "Receivables Amount by Account",

    amount:
      "Amount",

    change:
      "Change"
  }
};

export default function Receivables() {
  const {
    selectedMonth,
    selectedBranch,
    language
  } = useDashboard();

  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

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
    let active =
      true;

    async function load() {
      try {
        setLoading(
          true
        );

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
              t.loadError
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
      active =
        false;
    };
  }, [
    selectedMonth,
    selectedBranch,
    t.loadError
  ]);

  if (loading) {
    return (
      <div className="page-loading">
        {t.loading}
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
      <Card
        title={
          t.byBranch
        }
      >
        <HorizontalBarChart
          data={
            branches
          }
          yAxisWidth={
            195
          }
          visibleHeight={
            285
          }
          rowHeight={
            52
          }
          barSize={
            20
          }
          language={
            currentLanguage
          }
          valueLabel={
            t.amount
          }
        />
      </Card>

      <Card
        title={
          t.monthlyChange
        }
      >
        <ChangeBarChart
          data={
            changes
          }
          language={
            currentLanguage
          }
          valueLabel={
            t.change
          }
        />
      </Card>

      <Card
        title={
          t.byMonth
        }
        className="monthly-card"
      >
        <MonthlyBarChart
          data={
            monthly
          }
          color="#43d77b"
          language={
            currentLanguage
          }
          valueLabel={
            t.amount
          }
        />
      </Card>

      <Card
        title={
          t.byAccount
        }
      >
        <HorizontalBarChart
          data={
            accounts
          }
          yAxisWidth={
            210
          }
          visibleHeight={
            285
          }
          rowHeight={
            52
          }
          barSize={
            20
          }
          language={
            currentLanguage
          }
          valueLabel={
            t.amount
          }
        />
      </Card>
    </div>
  );
}