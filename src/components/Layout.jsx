import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useDashboard } from "../context/DashboardContext";

export default function Layout() {
  const { sidebarCollapsed } =
    useDashboard();

  return (
    <div
      className={`app-shell ${
        sidebarCollapsed
          ? "app-shell-collapsed"
          : ""
      }`}
    >
      <Sidebar />

      <div className="main-area">
        <Header />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}