import {
  useEffect,
  useState
} from "react";
import { useLocation}  from "react-router-dom";
import { CalendarDays, Building2} from "lucide-react";
import { useDashboard} from "../context/DashboardContext";
import { getBranches } from "../api/dashboardApi";

const titles = {
  mn: {
    "/": "Тохиргоо",
    "/receivables": "Авлага",
    "/payables": "Өглөг",
    "/revenue-expense":
      "Орлого / Зардал",
    "/cash-flow":
      "Мөнгөн урсгал"
  },
  en: {
    "/": "Dashboard",
    "/receivables":
      "Receivables",
    "/payables":
      "Payables",
    "/revenue-expense":
      "Revenue / Expense",
    "/cash-flow":
      "Cash Flow"
  }
};

const months = [
  "2026/01",
  "2026/02",
  "2026/03",
  "2026/04",
  "2026/05",
  "2026/06",
  "2026/07",
  "2026/08",
  "2026/09",
  "2026/10",
  "2026/11",
  "2026/12"
];

export default function Header() {
  const location =
    useLocation();

  const {
    selectedMonth,
    setSelectedMonth,
    selectedBranch,
    setSelectedBranch,
    language,
    setLanguage
  } = useDashboard();

  const [
    branches,
    setBranches
  ] = useState([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data =
          await getBranches();

        if (!active) {
          return;
        }

        setBranches(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          error
        );

        if (active) {
          setBranches([]);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const currentTitle =
    titles[language]?.[
      location.pathname
    ] ||
    titles[language]?.["/"] ||
    "Dashboard";

  return (
    <header className="top-header">
      <h1>
        {currentTitle}
      </h1>

      <div className="header-actions">
        <div className="header-filter">
          <label className="header-filter-label">
            {language === "mn"
              ? "ОГНОО"
              : "DATE"}
          </label>

          <div className="header-select-wrap">
            <span className="header-select-icon">
              <CalendarDays
                size={15}
                strokeWidth={2}
              />
            </span>

            <select
              className="header-select"
              value={
                selectedMonth
              }
              onChange={(
                event
              ) =>
                setSelectedMonth(
                  event
                    .target
                    .value
                )
              }
            >
              <option value="all">
                {language ===
                "mn"
                  ? "Бүгд"
                  : "All"}
              </option>

              {months.map(
                (month) => (
                  <option
                    value={
                      month
                    }
                    key={month}
                  >
                    {month}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="header-filter header-branch-filter">
          <label className="header-filter-label">
            {language === "mn"
              ? "САЛБАР"
              : "BRANCH"}
          </label>

          <div className="header-select-wrap">
            <span className="header-select-icon">
              <Building2
                size={15}
                strokeWidth={2}
              />
            </span>

            <select
              className="header-select"
              value={
                selectedBranch
              }
              onChange={(
                event
              ) =>
                setSelectedBranch(
                  event
                    .target
                    .value
                )
              }
            >
              <option value="all">
                {language ===
                "mn"
                  ? "Бүгд"
                  : "All"}
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={
                      branch.id
                    }
                    value={
                      branch.id
                    }
                  >
                    {
                      branch.name
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="language-switcher">
          <button
            type="button"
            aria-label="English"
            className={`language-button ${
              language ===
              "en"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setLanguage(
                "en"
              )
            }
          >
            <span className="language-flag">
              🇬🇧
            </span>
          </button>

          <button
            type="button"
            aria-label="Монгол"
            className={`language-button ${
              language ===
              "mn"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setLanguage(
                "mn"
              )
            }
          >
            <span className="language-flag">
              🇲🇳
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}