import {
  useEffect,
  useState
} from "react";

import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";
import ChangeBarChart from "../components/ChangeBarChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import ExcelDownloadButton from "../components/ExcelDownloadButton";

import {
  exportChartToExcel
} from "../utils/exportExcel";

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

    byBranch:
      "Өглөгийн дүн салбараар",

    monthlyChange:
      "Сарын Өглөгийн Өөрчлөлт",

    byMonth:
      "Өглөгийн дүн сараар",

    account:
      "Дансаар",

    branch:
      "Салбараар",

    viewType:
      "Харах төрөл",

    amount:
      "Дүн",

    change:
      "Өөрчлөлт",

    downloadExcel:
      "Excel татах"
  },

  en: {
    loading:
      "Loading...",

    backendError:
      "Backend error",

    byAccount:
      "Payables Amount by Account",

    byBranch:
      "Payables Amount by Branch",

    monthlyChange:
      "Monthly Payables Change",

    byMonth:
      "Payables Amount by Month",

    account:
      "By account",

    branch:
      "By branch",

    viewType:
      "View type",

    amount:
      "Amount",

    change:
      "Change",

    downloadExcel:
      "Download Excel"
  }
};

export default function Payables() {
  const {
    language
  } =
    useDashboard();

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
    viewType,
    setViewType
  ] = useState(
    "account"
  );

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

        if (!mounted) {
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
      mounted =
        false;
    };
  }, []);

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
        {t.backendError}:{" "}
        {error}
      </div>
    );
  }

  const combinedData =
    viewType ===
    "account"
      ? accounts
      : branches;

  const combinedTitle =
    viewType ===
    "account"
      ? t.byAccount
      : t.byBranch;

  return (
    <div className="payables-layout">
      <div className="payables-combined-column">
        <Card>
          <div className="payables-card-header">
            <h3 className="payables-card-title">
              {combinedTitle}
            </h3>

            <div className="chart-header-actions">
              <div className="payables-view-selector">
                <span className="payables-view-label">
                  {t.viewType}
                </span>

                <select
                  className="payables-view-select"
                  value={viewType}
                  onChange={(event) =>
                    setViewType(
                      event.target.value
                    )
                  }
                >
                  <option value="account">
                    {t.account}
                  </option>

                  <option value="branch">
                    {t.branch}
                  </option>
                </select>
              </div>

              <ExcelDownloadButton
                title={t.downloadExcel}
                onClick={() =>
                  exportChartToExcel({
                    data: combinedData,

                    fileName:
                      combinedTitle,

                    sheetName:
                      viewType ===
                      "account"
                        ? "Accounts"
                        : "Branches",

                    nameHeader:
                      currentLanguage ===
                      "en"
                        ? "Name"
                        : "Нэр",

                    valueHeader:
                      currentLanguage ===
                      "en"
                        ? "Amount"
                        : "Дүн"
                  })
                }
              />
            </div>
          </div>

          <div className="payables-combined-chart">
            <HorizontalBarChart
              data={
                combinedData
              }
              color="#2966e8"
              language={
                currentLanguage
              }
              valueLabel={
                t.amount
              }
              tickMode={
                viewType ===
                "branch"
                  ? "spaced"
                  : "default"
              }
            />
          </div>
        </Card>
      </div>

      <div className="payables-right-column">
        <Card>
          <div className="chart-card-custom-header">
            <h3>
              {t.monthlyChange}
            </h3>

            <ExcelDownloadButton
              title={
                t.downloadExcel
              }
              onClick={() =>
                exportChartToExcel({
                  data:
                    changes,

                  fileName:
                    t.monthlyChange,

                  sheetName:
                    "Monthly Change",

                  nameHeader:
                    currentLanguage ===
                    "en"
                      ? "Month"
                      : "Сар",

                  valueHeader:
                    currentLanguage ===
                    "en"
                      ? "Change"
                      : "Өөрчлөлт"
                })
              }
            />
          </div>

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

        <Card>
          <div className="chart-card-custom-header">
            <h3>
              {t.byMonth}
            </h3>

            <ExcelDownloadButton
              title={
                t.downloadExcel
              }
              onClick={() =>
                exportChartToExcel({
                  data:
                    monthly,

                  fileName:
                    t.byMonth,

                  sheetName:
                    "Monthly",

                  nameHeader:
                    currentLanguage ===
                    "en"
                      ? "Month"
                      : "Сар",

                  valueHeader:
                    currentLanguage ===
                    "en"
                      ? "Amount"
                      : "Дүн"
                })
              }
            />
          </div>

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
    </div>
  );
}