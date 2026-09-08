export function getMonthRange(month) {
  if (!month || month === "all") {
    return {
      date_from: "2026-01-01",
      date_to: "2026-12-31"
    };
  }

  const [year, monthNumber] = month.split("/");

  const dateFrom = `${year}-${monthNumber}-01`;

  const lastDay = new Date(
    Number(year),
    Number(monthNumber),
    0
  );

  const dateTo = `${lastDay.getFullYear()}-${String(
    lastDay.getMonth() + 1
  ).padStart(2, "0")}-${String(
    lastDay.getDate()
  ).padStart(2, "0")}`;

  return {
    date_from: dateFrom,
    date_to: dateTo
  };
}

export function getDashboardFilters(
  selectedMonth,
  selectedBranch
) {
  const filters = {
    ...getMonthRange(selectedMonth)
  };

  if (
    selectedBranch &&
    selectedBranch !== "all"
  ) {
    filters.branch_id = selectedBranch;
  }

  return filters;
}

export function getMonthlyFilters(
  selectedBranch
) {
  const filters = {
    date_from: "2026-01-01",
    date_to: "2026-12-31"
  };

  if (
    selectedBranch &&
    selectedBranch !== "all"
  ) {
    filters.branch_id = selectedBranch;
  }

  return filters;
}