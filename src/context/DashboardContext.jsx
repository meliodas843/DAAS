import {
  createContext,
  useContext,
  useMemo,
  useState
} from "react";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [language, setLanguage] = useState("mn");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      selectedMonth,
      setSelectedMonth,
      selectedBranch,
      setSelectedBranch,
      language,
      setLanguage,
      sidebarCollapsed,
      setSidebarCollapsed
    }),
    [
      selectedMonth,
      selectedBranch,
      language,
      sidebarCollapsed
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}