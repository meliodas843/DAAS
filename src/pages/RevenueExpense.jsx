import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import HoverScroll from "../components/HoverScroll";
import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";
import ExcelDownloadButton from "../components/ExcelDownloadButton";

import {
  exportChartToExcel,
  exportRevenueExpenseToExcel
} from "../utils/exportExcel";

import {
  getBranchRevenueExpense,
  getExpenseAccounts,
  getExpenseGroups,
  getRevenueAccounts
} from "../api/dashboardApi";

import {
  useDashboard
} from "../context/DashboardContext";

function formatCompact(value) {
  const number =
    Number(value || 0);

  const absolute =
    Math.abs(number);

  const sign =
    number < 0
      ? "-"
      : "";

  if (
    absolute >=
    1_000_000_000
  ) {
    const result =
      absolute /
      1_000_000_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    const result =
      absolute /
      1_000_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }M`;
  }

  if (
    absolute >=
    1_000
  ) {
    const result =
      absolute /
      1_000;

    return `${sign}${
      Number.isInteger(result)
        ? result.toFixed(0)
        : result.toFixed(1)
    }K`;
  }

  return `${Math.round(
    number
  )}`;
}

function formatTooltip(value) {
  const number =
    Number(value || 0);

  return `₮${Math.round(
    number
  ).toLocaleString(
    "en-US"
  )}`;
}

function wrapLabel(
  text,
  maxLength = 24
) {
  if (!text) {
    return [""];
  }

  const words =
    String(text).split(
      " "
    );

  const lines = [];
  let current = "";

  for (
    const word of words
  ) {
    const next =
      current
        ? `${current} ${word}`
        : word;

    if (
      next.length <=
      maxLength
    ) {
      current = next;
    } else {
      if (current) {
        lines.push(
          current
        );
      }

      current = word;
    }
  }

  if (current) {
    lines.push(
      current
    );
  }

  return lines.slice(
    0,
    3
  );
}

function RightSideYAxisTick({
  x = 0,
  y = 0,
  payload
}) {
  const lines =
    wrapLabel(
      payload?.value ||
        "",
      22
    );

  const lineHeight =
    12;

  const startY =
    y -
    (
      (
        lines.length -
        1
      ) *
      lineHeight
    ) /
      2;

  return (
    <g>
      <text
        x={x - 10}
        y={startY}
        textAnchor="end"
        fill="#536177"
        fontSize={10.5}
        fontWeight={500}
      >
        {lines.map(
          (
            line,
            index
          ) => (
            <tspan
              key={`${line}-${index}`}
              x={x - 10}
              dy={
                index === 0
                  ? 0
                  : lineHeight
              }
            >
              {line}
            </tspan>
          )
        )}
      </text>
    </g>
  );
}

function RightValueLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value
}) {
  const number =
    Number(
      value || 0
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number === 0
  ) {
    return null;
  }

  return (
    <text
      x={
        x +
        width +
        7
      }
      y={
        y +
        height / 2
      }
      dominantBaseline="middle"
      textAnchor="start"
      fill="#101827"
      fontSize={10}
      fontWeight={800}
    >
      {formatCompact(
        number
      )}
    </text>
  );
}

function getExpenseAxisMax(
  data
) {
  const maxValue =
    Math.max(
      ...data.map(
        (item) =>
          Math.abs(
            Number(
              item.value ||
                0
            )
          )
      ),
      0
    );

  if (
    maxValue <=
    500_000_000
  ) {
    return 500_000_000;
  }

  if (
    maxValue <=
    1_000_000_000
  ) {
    return 1_000_000_000;
  }

  if (
    maxValue <=
    2_000_000_000
  ) {
    return 2_000_000_000;
  }

  if (
    maxValue <=
    3_000_000_000
  ) {
    return 3_000_000_000;
  }

  return (
    Math.ceil(
      maxValue /
        1_000_000_000
    ) *
    1_000_000_000
  );
}

function getTicks(max) {
  if (
    max <=
    500_000_000
  ) {
    return [
      0,
      100_000_000,
      200_000_000,
      300_000_000,
      400_000_000,
      500_000_000
    ];
  }

  if (
    max <=
    1_000_000_000
  ) {
    return [
      0,
      250_000_000,
      500_000_000,
      750_000_000,
      1_000_000_000
    ];
  }

  if (
    max <=
    2_000_000_000
  ) {
    return [
      0,
      500_000_000,
      1_000_000_000,
      1_500_000_000,
      2_000_000_000
    ];
  }

  if (
    max <=
    3_000_000_000
  ) {
    return [
      0,
      500_000_000,
      1_000_000_000,
      2_000_000_000,
      3_000_000_000
    ];
  }

  const ticks = [
    0
  ];

  for (
    let value =
      1_000_000_000;
    value <= max;
    value +=
      1_000_000_000
  ) {
    ticks.push(
      value
    );
  }

  return ticks;
}

function ExpenseGroupChart({
  data = [],
  language = "mn"
}) {
  const safeData =
    Array.isArray(
      data
    )
      ? data.map(
          (item) => ({
            ...item,
            value:
              Number(
                item.value ||
                  0
              )
          })
        )
      : [];

  const axisMax =
    getExpenseAxisMax(
      safeData
    );

  const ticks =
    getTicks(
      axisMax
    );

  const rowHeight =
    36;

  const visibleHeight =
    270;

  const chartHeight =
    Math.max(
      visibleHeight,
      safeData.length *
        rowHeight +
        20
    );

  const tooltipLabel =
    language === "en"
      ? "Amount"
      : "Дүн";

  return (
    <div className="right-scroll-chart">
      <HoverScroll
        direction="vertical"
        className="right-chart-hover-scroll"
      >
        <div
          className="right-scroll-chart-body"
          style={{
            height:
              `${chartHeight}px`
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
  <BarChart
    data={safeData}
    layout="vertical"
    margin={{
      top: 8,
      right: 70,
      bottom: 4,
      left: -18
    }}
  >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={
                  false
                }
                stroke="#edf1f7"
              />

              <XAxis
                type="number"
                domain={[
                  0,
                  axisMax
                ]}
                hide
                allowDataOverflow
              />

              <YAxis
                type="category"
                dataKey="name"
                width={180}
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={
                  <RightSideYAxisTick />
                }
              />

              <Tooltip
                cursor={{
                  fill:
                    "rgba(15, 23, 42, 0.025)"
                }}
                formatter={(
                  value
                ) => [
                  formatTooltip(
                    value
                  ),
                  tooltipLabel
                ]}
              />

              <Bar
                dataKey="value"
                fill="#2966e8"
                barSize={
                  15
                }
                radius={[
                  0,
                  4,
                  4,
                  0
                ]}
                animationDuration={
                  700
                }
              >
                <LabelList
                  dataKey="value"
                  content={
                    <RightValueLabel />
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>

      <div className="right-scroll-axis">
        <div className="right-scroll-axis-track">
          {ticks.map(
            (tick) => (
              <span
                key={
                  tick
                }
                style={{
                  left:
                    `${
                      (
                        tick /
                        axisMax
                      ) *
                      100
                    }%`
                }}
              >
                {formatCompact(
                  tick
                )}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function getBranchAxisMax(
  data
) {
  const maxValue =
    Math.max(
      ...data.flatMap(
        (item) => [
          Math.abs(
            Number(
              item.revenue ||
                0
            )
          ),
          Math.abs(
            Number(
              item.expense ||
                0
            )
          )
        ]
      ),
      0
    );

  if (
    maxValue <=
    500_000_000
  ) {
    return 500_000_000;
  }

  if (
    maxValue <=
    1_000_000_000
  ) {
    return 1_000_000_000;
  }

  if (
    maxValue <=
    2_000_000_000
  ) {
    return 2_000_000_000;
  }

  if (
    maxValue <=
    3_000_000_000
  ) {
    return 3_000_000_000;
  }

  return (
    Math.ceil(
      maxValue /
        1_000_000_000
    ) *
    1_000_000_000
  );
}

function getBranchTicks(
  max
) {
  return getTicks(
    max
  );
}

function BranchRevenueExpenseChart({
  data = [],
  language = "mn"
}) {
  const safeData =
    Array.isArray(
      data
    )
      ? data.map(
          (item) => ({
            ...item,

            revenue:
              Number(
                item.revenue ||
                  0
              ),

            expense:
              Number(
                item.expense ||
                  0
              )
          })
        )
      : [];

  const axisMax =
    getBranchAxisMax(
      safeData
    );

  const ticks =
    getBranchTicks(
      axisMax
    );

  const rowHeight =
    44;

  const visibleHeight =
    250;

  const chartHeight =
    Math.max(
      visibleHeight,
      safeData.length *
        rowHeight +
        24
    );

  const expenseLabel =
    language === "en"
      ? "Expense"
      : "Зардал";

  const revenueLabel =
    language === "en"
      ? "Revenue"
      : "Орлого";

  return (
    <div className="branch-re-chart">
      <div className="branch-re-legend">
        <span className="branch-re-legend-item">
          <span className="branch-re-legend-dot expense" />

          {expenseLabel}
        </span>

        <span className="branch-re-legend-item">
          <span className="branch-re-legend-dot revenue" />

          {revenueLabel}
        </span>
      </div>

      <HoverScroll
        direction="vertical"
        className="branch-re-hover-scroll"
      >
        <div
          className="branch-re-body"
          style={{
            height:
              `${chartHeight}px`
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={safeData}
              layout="vertical"
              margin={{
                top: 8,
                right: 105,
                bottom: 4,
                left: -18
              }}
              barCategoryGap={10}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={
                  false
                }
                stroke="#edf1f7"
              />

              <XAxis
                type="number"
                domain={[
                  0,
                  axisMax
                ]}
                hide
                allowDataOverflow
              />

              <YAxis
                type="category"
                dataKey="name"
                width={175}
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={
                  <RightSideYAxisTick />
                }
              />

              <Tooltip
                cursor={{
                  fill:
                    "rgba(15, 23, 42, 0.025)"
                }}
                formatter={(
                  value,
                  name
                ) => [
                  formatTooltip(
                    value
                  ),
                  name
                ]}
              />

              <Bar
                dataKey="expense"
                name={
                  expenseLabel
                }
                fill="#2966e8"
                barSize={
                  10
                }
                radius={[
                  0,
                  4,
                  4,
                  0
                ]}
                animationDuration={
                  700
                }
              >
                <LabelList
                  dataKey="expense"
                  content={
                    <RightValueLabel />
                  }
                />
              </Bar>

              <Bar
                dataKey="revenue"
                name={
                  revenueLabel
                }
                fill="#43d77b"
                barSize={
                  10
                }
                radius={[
                  0,
                  4,
                  4,
                  0
                ]}
                animationDuration={
                  700
                }
              >
                <LabelList
                  dataKey="revenue"
                  content={
                    <RightValueLabel />
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HoverScroll>

      <div className="branch-re-fixed-axis">
        <div className="branch-re-fixed-axis-track">
          {ticks.map(
            (tick) => (
              <span
                key={
                  tick
                }
                style={{
                  left:
                    `${
                      (
                        tick /
                        axisMax
                      ) *
                      100
                    }%`
                }}
              >
                {formatCompact(
                  tick
                )}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

const translations = {
  mn: {
    loading:
      "Уншиж байна...",

    backendError:
      "Backend алдаа",

    revenueAccount:
      "Орлогын дүн дансаар",

    expenseAccount:
      "Зардлын дүн дансаар",

    expenseGroup:
      "Зардлын бүлгээр",

    branch:
      "Орлого Зардлын дүн салбараар",

    revenue:
      "Орлого",

    expense:
      "Зардал",

    viewType:
      "Харах төрөл",

    amount:
      "Дүн",

    downloadExcel:
      "Excel татах"
  },

  en: {
    loading:
      "Loading...",

    backendError:
      "Backend error",

    revenueAccount:
      "Revenue Amount by Account",

    expenseAccount:
      "Expense Amount by Account",

    expenseGroup:
      "Expense by Group",

    branch:
      "Revenue and Expense by Branch",

    revenue:
      "Revenue",

    expense:
      "Expense",

    viewType:
      "View type",

    amount:
      "Amount",

    downloadExcel:
      "Download Excel"
  }
};

export default function RevenueExpense() {
  const {
    filters,
    language
  } = useDashboard();

  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

  const [
    revenueAccounts,
    setRevenueAccounts
  ] = useState([]);

  const [
    expenseGroups,
    setExpenseGroups
  ] = useState([]);

  const [
    branchRevenueExpense,
    setBranchRevenueExpense
  ] = useState([]);

  const [
    expenseAccounts,
    setExpenseAccounts
  ] = useState([]);

  const [
    viewType,
    setViewType
  ] = useState(
    "revenue"
  );

  const [
    loading,
    setLoading
  ] = useState(
    true
  );

  const [
    error,
    setError
  ] = useState(
    ""
  );

  useEffect(() => {
    let mounted =
      true;

    async function load() {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const [
          revenueData,
          groupsData,
          branchData,
          expenseData
        ] =
          await Promise.all([
            getRevenueAccounts(
              filters
            ),

            getExpenseGroups(
              filters
            ),

            getBranchRevenueExpense(
              filters
            ),

            getExpenseAccounts(
              filters
            )
          ]);

        if (
          !mounted
        ) {
          return;
        }

        setRevenueAccounts(
          Array.isArray(
            revenueData
          )
            ? revenueData
            : []
        );

        setExpenseGroups(
          Array.isArray(
            groupsData
          )
            ? groupsData
            : []
        );

        setBranchRevenueExpense(
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );

        setExpenseAccounts(
          Array.isArray(
            expenseData
          )
            ? expenseData
            : []
        );
      } catch (
        err
      ) {
        console.error(
          "REVENUE EXPENSE ERROR:",
          err
        );

        if (
          mounted
        ) {
          setError(
            err?.message ||
              "Data load failed"
          );
        }
      } finally {
        if (
          mounted
        ) {
          setLoading(
            false
          );
        }
      }
    }

    load();

    return () => {
      mounted =
        false;
    };
  }, [
    filters
  ]);

  const revenueRows =
    useMemo(
      () =>
        [
          ...revenueAccounts
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              b.value ||
                0
            ) -
            Number(
              a.value ||
                0
            )
        ),
      [
        revenueAccounts
      ]
    );

  const expenseGroupRows =
    useMemo(
      () =>
        [
          ...expenseGroups
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              b.value ||
                0
            ) -
            Number(
              a.value ||
                0
            )
        ),
      [
        expenseGroups
      ]
    );

  const expenseAccountRows =
    useMemo(
      () =>
        [
          ...expenseAccounts
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              b.value ||
                0
            ) -
            Number(
              a.value ||
                0
            )
        ),
      [
        expenseAccounts
      ]
    );

  if (
    loading
  ) {
    return (
      <div className="page-loading">
        {t.loading}
      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="page-error">
        {t.backendError}:{" "}
        {error}
      </div>
    );
  }

  const combinedData =
    viewType ===
    "revenue"
      ? revenueRows
      : expenseAccountRows;

  const combinedTitle =
    viewType ===
    "revenue"
      ? t.revenueAccount
      : t.expenseAccount;

  const combinedColor =
    viewType ===
    "revenue"
      ? "#43d77b"
      : "#2966e8";

  const combinedYAxisWidth =
    viewType ===
    "revenue"
      ? 195
      : 210;

  return (
    <div className="revenue-expense-layout">
      <div className="revenue-expense-combined-column">
        <Card>
          <div className="revenue-expense-card-header">
            <h3 className="revenue-expense-card-title">
              {combinedTitle}
            </h3>

            <div className="chart-header-actions">
              <div className="revenue-expense-view-selector">
                <span className="revenue-expense-view-label">
                  {t.viewType}
                </span>

                <select
                  className="revenue-expense-view-select"
                  value={
                    viewType
                  }
                  onChange={(
                    event
                  ) =>
                    setViewType(
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option value="revenue">
                    {
                      t.revenue
                    }
                  </option>

                  <option value="expense">
                    {
                      t.expense
                    }
                  </option>
                </select>
              </div>

              <ExcelDownloadButton
                title={
                  t.downloadExcel
                }
                onClick={() =>
                  exportChartToExcel({
                    data:
                      combinedData,

                    fileName:
                      combinedTitle,

                    sheetName:
                      viewType ===
                      "revenue"
                        ? "Revenue Accounts"
                        : "Expense Accounts",

                    nameHeader:
                      currentLanguage ===
                      "en"
                        ? "Account"
                        : "Данс",

                    valueHeader:
                      currentLanguage ===
                      "en"
                        ? "Amount"
                        : "Дүн"
                  })
                }
              />
            </div>
          </div>

          <div className="revenue-expense-combined-chart">
            <HorizontalBarChart
              data={
                combinedData
              }
              color={
                combinedColor
              }
              yAxisWidth={
                combinedYAxisWidth
              }
              barSize={
                20
              }
              language={
                currentLanguage
              }
              valueLabel={
                t.amount
              }
            />
          </div>
        </Card>
      </div>

      <div className="revenue-expense-right-column">
        <Card>
          <div className="chart-card-custom-header">
            <h3>
              {
                t.expenseGroup
              }
            </h3>

            <ExcelDownloadButton
              title={
                t.downloadExcel
              }
              onClick={() =>
                exportChartToExcel({
                  data:
                    expenseGroupRows,

                  fileName:
                    t.expenseGroup,

                  sheetName:
                    "Expense Groups",

                  nameHeader:
                    currentLanguage ===
                    "en"
                      ? "Expense Group"
                      : "Зардлын бүлэг",

                  valueHeader:
                    currentLanguage ===
                    "en"
                      ? "Amount"
                      : "Дүн"
                })
              }
            />
          </div>

          <div className="revenue-expense-right-chart">
            <ExpenseGroupChart
              data={
                expenseGroupRows
              }
              language={
                currentLanguage
              }
            />
          </div>
        </Card>

        <Card>
          <div className="chart-card-custom-header">
            <h3>
              {t.branch}
            </h3>

            <ExcelDownloadButton
              title={
                t.downloadExcel
              }
              onClick={() =>
                exportRevenueExpenseToExcel({
                  data:
                    branchRevenueExpense,

                  fileName:
                    t.branch,

                  sheetName:
                    "Branches",

                  nameHeader:
                    currentLanguage ===
                    "en"
                      ? "Branch"
                      : "Салбар",

                  expenseHeader:
                    currentLanguage ===
                    "en"
                      ? "Expense"
                      : "Зардал",

                  revenueHeader:
                    currentLanguage ===
                    "en"
                      ? "Revenue"
                      : "Орлого"
                })
              }
            />
          </div>

          <div className="revenue-expense-right-chart">
            <BranchRevenueExpenseChart
              data={
                branchRevenueExpense
              }
              language={
                currentLanguage
              }
            />
          </div>
        </Card>
      </div>
    </div>
  );
}