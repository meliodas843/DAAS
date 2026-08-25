import {
  useEffect,
  useState
} from "react";
import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";
import ChangeBarChart from "../components/ChangeBarChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import {
  getPayableAccounts,
  getPayableBranches,
  getPayableChanges,
  getPayableMonthly
} from "../api/dashboardApi";
import {
  useDashboard
} from "../context/DashboardContext";

const translations = {
  mn: {
    loading:
      "Уншиж байна...",
    backendError:
      "Backend алдаа",

    byAccount:
      "Өглөгийн дүн дансаар",

    monthlyChange:
      "Сарын Өглөгийн Өөрчлөлт",

    byBranch:
      "Өглөгийн дүн салбараар",

    byMonth:
      "Өглөгийн дүн сараар",

    amount:
      "Дүн",

    change:
      "Өөрчлөлт"
  },

  en: {
    loading:
      "Loading...",
    backendError:
      "Backend error",

    byAccount:
      "Payables Amount by Account",

    monthlyChange:
      "Monthly Payables Change",

    byBranch:
      "Payables Amount by Branch",

    byMonth:
      "Payables Amount by Month",

    amount:
      "Amount",

    change:
      "Change"
  }
};

export default function Payables() {
  const {
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
    accounts,
    setAccounts
  ] = useState([]);

  const [
    changes,
    setChanges
  ] = useState([]);

  const [
    branches,
    setBranches
  ] = useState([]);

  const [
    monthly,
    setMonthly
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
    let mounted =
      true;

    async function load() {
      try {
        setLoading(
          true
        );

        setError("");

        const filters = {
          date_from:
            "2026-01-01",

          date_to:
            "2026-08-31"
        };

        const [
          accountsData,
          changesData,
          branchesData,
          monthlyData
        ] =
          await Promise.all([
            getPayableAccounts(
              filters
            ),

            getPayableChanges(
              filters
            ),

            getPayableBranches(
              filters
            ),

            getPayableMonthly(
              filters
            )
          ]);

        if (
          !mounted
        ) {
          return;
        }

        setAccounts(
          Array.isArray(
            accountsData
          )
            ? accountsData
            : []
        );

        setChanges(
          Array.isArray(
            changesData
          )
            ? changesData
            : []
        );

        setBranches(
          Array.isArray(
            branchesData
          )
            ? branchesData
            : []
        );

        setMonthly(
          Array.isArray(
            monthlyData
          )
            ? monthlyData
            : []
        );
      } catch (err) {
        console.error(
          err
        );

        if (
          mounted
        ) {
          setError(
            err?.message ||
              "Data load failed"
          );
        }
      } finally {
        if (
          mounted
        ) {
          setLoading(
            false
          );
        }
      }
    }

    load();

    return () => {
      mounted =
        false;
    };
  }, []);

  if (
    loading
  ) {
    return (
      <div className="page-loading">
        {t.loading}
      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="page-error">
        {t.backendError}
        :{" "}
        {error}
      </div>
    );
  }

  return (
    <div className="page-grid page-grid-2">
      <Card
        title={
          t.byAccount
        }
      >
        <HorizontalBarChart
          data={
            accounts
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
          t.byBranch
        }
      >
        <HorizontalBarChart
          data={
            branches
          }
          color="#2966e8"
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
          t.byMonth
        }
        className="monthly-card"
      >
        <MonthlyBarChart
          data={
            monthly
          }
          color="#a394eb"
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