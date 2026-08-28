import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const DashboardContext =
  createContext(null);

function buildDashboardFilters(
  selectedMonth,
  selectedBranch
) {
  const filters = {};

  if (
    selectedMonth &&
    selectedMonth !== "all"
  ) {
    const match =
      String(
        selectedMonth
      ).match(
        /^(\d{4})[-/](\d{1,2})$/
      );

    if (match) {
      const year =
        Number(match[1]);

      const month =
        Number(match[2]);

      const lastDay =
        new Date(
          year,
          month,
          0
        ).getDate();

      const paddedMonth =
        String(
          month
        ).padStart(
          2,
          "0"
        );

      filters.date_from =
        `${year}-${paddedMonth}-01`;

      filters.date_to =
        `${year}-${paddedMonth}-${String(
          lastDay
        ).padStart(
          2,
          "0"
        )}`;
    }
  }

  if (
    selectedBranch &&
    selectedBranch !== "all"
  ) {
    filters.branch_id =
      selectedBranch;
  }

  return filters;
}

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

  const filters =
    useMemo(
      () =>
        buildDashboardFilters(
          selectedMonth,
          selectedBranch
        ),
      [
        selectedMonth,
        selectedBranch
      ]
    );

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
    console.log(
      "DASHBOARD FILTERS:",
      filters
    );
  }, [
    filters
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

        filters,

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