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

    byAccount:
      "Авлагын дүн дансаар",

    monthlyChange:
      "Сарын Авлагын Өөрчлөлт",

    byMonth:
      "Авлагын дүн сараар",

    branch:
      "Салбараар",

    account:
      "Дансаар",

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

    loadError:
      "Data load failed",

    byBranch:
      "Receivables Amount by Branch",

    byAccount:
      "Receivables Amount by Account",

    monthlyChange:
      "Monthly Receivables Change",

    byMonth:
      "Receivables Amount by Month",

    branch:
      "By branch",

    account:
      "By account",

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
    accounts,
    setAccounts
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
    viewType,
    setViewType
  ] = useState("branch");

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
          accountsData,
          changesData,
          monthlyData
        ] =
          await Promise.all([
            getReceivableBranches(
              filters
            ),

            getReceivableAccounts(
              filters
            ),

            getReceivableChanges(
              monthlyFilters
            ),

            getReceivableMonthly(
              monthlyFilters
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
      active = false;
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

  const combinedData =
    viewType === "branch"
      ? branches
      : accounts;

  const combinedTitle =
    viewType === "branch"
      ? t.byBranch
      : t.byAccount;

  const yAxisWidth = 210;

  return (
    <div className="receivables-layout">
      <div className="receivables-combined-column">
        <Card>
          <div className="receivables-card-header">
            <h3 className="receivables-card-title">
              {combinedTitle}
            </h3>

            <div className="chart-header-actions">
              <div className="receivables-view-selector">
                <span className="receivables-view-label">
                  {t.viewType}
                </span>

                <select
                  className="receivables-view-select"
                  value={viewType}
                  onChange={(event) =>
                    setViewType(
                      event.target.value
                    )
                  }
                >
                  <option value="branch">
                    {t.branch}
                  </option>

                  <option value="account">
                    {t.account}
                  </option>
                </select>
              </div>

              <ExcelDownloadButton
                title={t.downloadExcel}
                onClick={() =>
                  exportChartToExcel({
                    data:
                      combinedData,

                    fileName:
                      combinedTitle,

                    sheetName:
                      viewType ===
                      "branch"
                        ? "Branches"
                        : "Accounts",

                    nameHeader:
                      currentLanguage ===
                      "en"
                        ? viewType ===
                          "branch"
                          ? "Branch"
                          : "Account"
                        : viewType ===
                          "branch"
                        ? "Салбар"
                        : "Данс",

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

          <div className="receivables-combined-chart">
            <HorizontalBarChart
              data={
                combinedData
              }
              color="#2966e8"
              yAxisWidth={
                yAxisWidth
              }
              barSize={20}
              language={
                currentLanguage
              }
              valueLabel={
                t.amount
              }
            />
          </div>
        </Card>
      </div>

      <div className="receivables-right-column">
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
            color="#43d77b"
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