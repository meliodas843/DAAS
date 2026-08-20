import {
  NavLink
} from "react-router-dom";
import {
  useDashboard
} from "../context/DashboardContext";
import {
  useAuth
} from "../context/AuthContext";

const baseItems = [
  {
    to: "/",
    mn: "Удирдлагын талбар",
    en: "Dashboard"
  },
  {
    to: "/receivables",
    mn: "Авлага",
    en: "Receivables"
  },
  {
    to: "/payables",
    mn: "Өглөг",
    en: "Payables"
  },
  {
    to: "/revenue-expense",
    mn: "Орлого/Зардал",
    en: "Revenue/Expense"
  },
  {
    to: "/cash-flow",
    mn: "Мөнгөн урсгал",
    en: "Cash Flow"
  }
];

export default function Sidebar() {
  const {
    language,
    sidebarCollapsed,
    setSidebarCollapsed
  } = useDashboard();

  const {
    user,
    logout
  } = useAuth();

  const items = [
    ...baseItems,
    ...(user?.role ===
    "admin"
      ? [
          {
            to: "/users",
            mn: "Хүмүүс",
            en: "People"
          }
        ]
      : [])
  ];

  const userInitial =
    String(
      user?.email ||
        "U"
    )
      .charAt(0)
      .toUpperCase();

  return (
    <aside
      className={`sidebar ${
        sidebarCollapsed
          ? "sidebar-collapsed"
          : ""
      }`}
    >
      <div className="brand">
        <div className="brand-icon">
          M
        </div>

        {!sidebarCollapsed && (
          <div className="brand-text">
            <strong>
              MISHEEL
            </strong>

            <span>
              GROUP
            </span>
          </div>
        )}

        <button
          className="sidebar-collapse-button"
          type="button"
          onClick={() =>
            setSidebarCollapsed(
              (value) =>
                !value
            )
          }
        >
          {sidebarCollapsed
            ? "▶"
            : "◀"}
        </button>
      </div>

      <nav className="side-nav">
        {items.map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={
                item.to === "/"
              }
              title={
                language ===
                "mn"
                  ? item.mn
                  : item.en
              }
              className={({
                isActive
              }) =>
                `side-nav-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              {sidebarCollapsed
                ? (
                    language ===
                    "mn"
                      ? item.mn
                      : item.en
                  ).charAt(
                    0
                  )
                : language ===
                    "mn"
                  ? item.mn
                  : item.en}
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-user-area">
        {sidebarCollapsed ? (
          <button
            type="button"
            className="sidebar-user-avatar-only"
            onClick={
              logout
            }
            title={
              language ===
              "mn"
                ? "Гарах"
                : "Logout"
            }
          >
            {userInitial}
          </button>
        ) : (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {userInitial}
            </div>

            <div className="sidebar-user-details">
              <strong>
                {user?.email}
              </strong>

              <span>
                {user?.role ===
                "admin"
                  ? language ===
                    "mn"
                    ? "Админ"
                    : "Admin"
                  : language ===
                    "mn"
                    ? "Viewer"
                    : "Viewer"}
              </span>
            </div>

            <button
              type="button"
              className="sidebar-user-logout"
              onClick={
                logout
              }
              title={
                language ===
                "mn"
                  ? "Гарах"
                  : "Logout"
              }
            >
              ↪
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}