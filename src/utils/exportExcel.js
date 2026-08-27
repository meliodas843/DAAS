import * as XLSX from "xlsx";

function sanitizeFileName(value) {
  return String(value || "data")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
}

function createWorkbook({
  rows,
  fileName,
  sheetName
}) {
  const worksheet =
    XLSX.utils.json_to_sheet(
      rows
    );

  worksheet["!cols"] = [
    {
      wch: 8
    },
    {
      wch: 40
    },
    {
      wch: 22
    },
    {
      wch: 22
    }
  ];

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    String(
      sheetName ||
        "Data"
    ).slice(
      0,
      31
    )
  );

  XLSX.writeFile(
    workbook,
    `${sanitizeFileName(
      fileName
    )}.xlsx`
  );
}

export function exportIncomeExpenseProfitToExcel({
  data = [],
  fileName = "income-expense-profit",
  language = "mn"
}) {
  const rows =
    Array.isArray(data)
      ? data.map(
          (
            item,
            index
          ) => ({
            No:
              index + 1,

            [
              language === "en"
                ? "Month"
                : "Сар"
            ]:
              item.month ??
              item.name ??
              "",

            [
              language === "en"
                ? "Revenue"
                : "Орлого"
            ]:
              Number(
                item.revenue ||
                  0
              ),

            [
              language === "en"
                ? "Expense"
                : "Зардал"
            ]:
              Number(
                item.expense ||
                  0
              ),

            [
              language === "en"
                ? "Profit"
                : "Ашиг"
            ]:
              Number(
                item.profit ||
                  0
              )
          })
        )
      : [];

  createWorkbook({
    rows,
    fileName,
    sheetName:
      language === "en"
        ? "Revenue Expense Profit"
        : "Орлого Зардал Ашиг"
  });
}

export function exportChartToExcel({
  data = [],
  fileName = "chart-data",
  sheetName = "Data",
  nameHeader = "Name",
  valueHeader = "Value"
}) {
  const rows =
    Array.isArray(data)
      ? data.map(
          (
            item,
            index
          ) => ({
            No:
              index + 1,

            [nameHeader]:
              item.name ??
              item.month ??
              item.label ??
              "",

            [valueHeader]:
              Number(
                item.value ??
                  item.amount ??
                  0
              )
          })
        )
      : [];

  createWorkbook({
    rows,
    fileName,
    sheetName
  });
}

export function exportRevenueExpenseToExcel({
  data = [],
  fileName = "revenue-expense",
  sheetName = "Revenue Expense",
  nameHeader = "Name",
  expenseHeader = "Expense",
  revenueHeader = "Revenue"
}) {
  const rows =
    Array.isArray(data)
      ? data.map(
          (
            item,
            index
          ) => ({
            No:
              index + 1,

            [nameHeader]:
              item.name ??
              "",

            [expenseHeader]:
              Number(
                item.expense ||
                  0
              ),

            [revenueHeader]:
              Number(
                item.revenue ||
                  0
              )
          })
        )
      : [];

  createWorkbook({
    rows,
    fileName,
    sheetName
  });
}