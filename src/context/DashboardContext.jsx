import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const DashboardContext =
  createContext(null);

export function DashboardProvider({
  children
}) {
  const [
    selectedMonth,
    setSelectedMonth
  ] = useState(() => {
    return (
      localStorage.getItem(
        "selectedMonth"
      ) || "all"
    );
  });

  const [
    selectedBranch,
    setSelectedBranch
  ] = useState(() => {
    return (
      localStorage.getItem(
        "selectedBranch"
      ) || "all"
    );
  });

  const [
    language,
    setLanguageState
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "language"
      );

    if (
      saved === "en" ||
      saved === "mn"
    ) {
      return saved;
    }

    return "mn";
  });

  const [
    sidebarCollapsed,
    setSidebarCollapsed
  ] = useState(() => {
    return (
      localStorage.getItem(
        "sidebarCollapsed"
      ) === "true"
    );
  });

  function setLanguage(
    nextLanguage
  ) {
    if (
      nextLanguage !== "mn" &&
      nextLanguage !== "en"
    ) {
      return;
    }

    setLanguageState(
      nextLanguage
    );

    localStorage.setItem(
      "language",
      nextLanguage
    );
  }

  useEffect(() => {
    localStorage.setItem(
      "selectedMonth",
      selectedMonth
    );
  }, [
    selectedMonth
  ]);

  useEffect(() => {
    localStorage.setItem(
      "selectedBranch",
      selectedBranch
    );
  }, [
    selectedBranch
  ]);

  useEffect(() => {
    localStorage.setItem(
      "sidebarCollapsed",
      String(
        sidebarCollapsed
      )
    );
  }, [
    sidebarCollapsed
  ]);

  useEffect(() => {
    function handleStorage(
      event
    ) {
      if (
        event.key ===
        "language"
      ) {
        if (
          event.newValue === "mn" ||
          event.newValue === "en"
        ) {
          setLanguageState(
            event.newValue
          );
        }

        return;
      }

      if (
        event.key ===
        "selectedMonth"
      ) {
        setSelectedMonth(
          event.newValue ||
            "all"
        );

        return;
      }

      if (
        event.key ===
        "selectedBranch"
      ) {
        setSelectedBranch(
          event.newValue ||
            "all"
        );

        return;
      }

      if (
        event.key ===
        "sidebarCollapsed"
      ) {
        setSidebarCollapsed(
          event.newValue ===
            "true"
        );
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,

        selectedBranch,
        setSelectedBranch,

        language,
        setLanguage,

        sidebarCollapsed,
        setSidebarCollapsed
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context =
    useContext(
      DashboardContext
    );

  if (!context) {
    throw new Error(
      "useDashboard must be used inside DashboardProvider"
    );
  }

  return context;
}