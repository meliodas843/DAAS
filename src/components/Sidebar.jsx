import {
  NavLink
} from "react-router-dom";

import {
  LayoutDashboard,
  HandCoins,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelRightOpen,
  CircleHelp
} from "lucide-react";

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
    en: "Executive Overview",
    icon: LayoutDashboard
  },
  {
    to: "/receivables",
    mn: "Авлага",
    en: "Receivables",
    icon: HandCoins
  },
  {
    to: "/payables",
    mn: "Өглөг",
    en: "Payables",
    icon: ReceiptText
  },
  {
    to: "/revenue-expense",
    mn: "Орлого / Зардал",
    en: "Revenue / Expense",
    icon: ChartNoAxesCombined
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

  return (
    <aside
      className={`sidebar ${
        sidebarCollapsed
          ? "sidebar-collapsed"
          : ""
      }`}
    >
      <div className="brand">
        <div className="brand-main">
          <img
            src="/misheel.jpeg"
            alt={language === "mn" ? "Мишээл групп" : "Misheel group"}
            className="brand-logo"
          />

          {!sidebarCollapsed && (
            <div className="brand-text">
              <strong>
                {language === "mn" ? "МИШЭЭЛ" : "MISHEEL"}
              </strong>

              <span>
                {language === "mn" ? "ГРУПП" : "GROUP"}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={() =>
            setSidebarCollapsed(
              (value) => !value
            )
          }
          title={
            sidebarCollapsed
              ? language === "mn"
                ? "Sidebar нээх"
                : "Open sidebar"
              : language === "mn"
                ? "Sidebar хаах"
                : "Close sidebar"
          }
        >
          {sidebarCollapsed ? (
            <PanelRightOpen
              size={18}
              strokeWidth={2}
            />
          ) : (
            <PanelLeftClose
              size={18}
              strokeWidth={2}
            />
          )}
        </button>
      </div>

      <nav className="side-nav">
        {baseItems.map(
          (item) => {
            const Icon =
              item.icon;

            const label =
              language === "mn"
                ? item.mn
                : item.en;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={
                  item.to === "/"
                }
                title={
                  sidebarCollapsed
                    ? label
                    : undefined
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
                <span className="side-nav-icon">
                  <Icon
                    size={18}
                    strokeWidth={2}
                  />
                </span>

                {!sidebarCollapsed && (
                  <span className="side-nav-label">
                    {label}
                  </span>
                )}
              </NavLink>
            );
          }
        )}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/help"
          title={
            sidebarCollapsed
              ? language === "mn"
                ? "Тусламж"
                : "Help"
              : undefined
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
          <span className="side-nav-icon">
            <CircleHelp
              size={18}
              strokeWidth={2}
            />
          </span>

          {!sidebarCollapsed && (
            <span className="side-nav-label">
              {language === "mn"
                ? "Тусламж"
                : "Help"}
            </span>
          )}
        </NavLink>

        {user?.role === "admin" && (
          <NavLink
            to="/users"
            title={
              sidebarCollapsed
                ? language === "mn"
                  ? "Тохиргоо"
                  : "Settings"
                : undefined
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
            <span className="side-nav-icon">
              <Settings
                size={18}
                strokeWidth={2}
              />
            </span>

            {!sidebarCollapsed && (
              <span className="side-nav-label">
                {language === "mn"
                  ? "Тохиргоо"
                  : "Settings"}
              </span>
            )}
          </NavLink>
        )}

        {sidebarCollapsed ? (
          <button
            type="button"
            className="sidebar-logout-collapsed"
            onClick={logout}
            title={
              language === "mn"
                ? "Гарах"
                : "Logout"
            }
          >
            <LogOut
              size={18}
              strokeWidth={2}
            />
          </button>
        ) : (
          <div className="sidebar-user-card">
            <button
              type="button"
              className="sidebar-logout-button"
              onClick={logout}
            >
              <LogOut
                size={17}
                strokeWidth={2}
              />

              <span>
                {language === "mn"
                  ? "Гарах"
                  : "Log out"}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}