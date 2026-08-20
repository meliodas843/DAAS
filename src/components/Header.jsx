import {
  useEffect,
  useState
} from "react";
import { useLocation } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { getBranches } from "../api/dashboardApi";

const titles = {
  mn: {
    "/": "Тохиргоо",
    "/receivables": "Авлага",
    "/payables": "Өглөг",
    "/revenue-expense": "Орлого / Зардал",
    "/cash-flow": "Мөнгөн урсгал"
  },
  en: {
    "/": "Dashboard",
    "/receivables": "Receivables",
    "/payables": "Payables",
    "/revenue-expense": "Revenue / Expense",
    "/cash-flow": "Cash Flow"
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
  const location = useLocation();

  const {
    selectedMonth,
    setSelectedMonth,
    selectedBranch,
    setSelectedBranch,
    language,
    setLanguage
  } = useDashboard();

  const [branches, setBranches] =
    useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBranches();

        setBranches(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(error);
      }
    }

    load();
  }, []);

  return (
    <header className="top-header">
      <h1>
        {titles[language][
          location.pathname
        ] || titles[language]["/"]}
      </h1>

      <div className="header-actions">
        <div className="select-group">
          <label>
            {language === "mn"
              ? "ОГНОО"
              : "DATE"}
          </label>

          <select
            value={selectedMonth}
            onChange={(event) =>
              setSelectedMonth(
                event.target.value
              )
            }
          >
            <option value="all">
              {language === "mn"
                ? "Бүгд"
                : "All"}
            </option>

            {months.map((month) => (
              <option
                value={month}
                key={month}
              >
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="select-group branch-select">
          <label>
            {language === "mn"
              ? "САЛБАР"
              : "BRANCH"}
          </label>

          <select
            value={selectedBranch}
            onChange={(event) =>
              setSelectedBranch(
                event.target.value
              )
            }
          >
            <option value="all">
              {language === "mn"
                ? "Бүгд"
                : "All"}
            </option>

            {branches.map((branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`language-button ${
            language === "en"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setLanguage("en")
          }
        >
          🇬🇧
        </button>

        <button
          type="button"
          className={`language-button ${
            language === "mn"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setLanguage("mn")
          }
        >
          🇲🇳
        </button>
      </div>
    </header>
  );
}