import {
  Bar,
  BarChart,
  CartesianGrid,
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

import {
  getDashboardFilters
} from "../utils/filters";

import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";

import {
  getBranchRevenueExpense,
  getExpenseAccounts,
  getExpenseGroups,
  getRevenueAccounts
} from "../api/dashboardApi";

import {
  useDashboard
} from "../context/DashboardContext";

const translations = {
  mn: {
    incomeByAccount:
      "Орлогын дүн дансаар",

    expenseByCategory:
      "Зардлын бүлгээр",

    incomeExpenseByBranch:
      "Орлого Зардлын дүн салбараар",

    expenseByAccount:
      "Зардлын дүн дансаар",

    income:
      "Орлого",

    expense:
      "Зардал",

    amount:
      "Дүн",

    loading:
      "Уншиж байна...",

    backendError:
      "Backend алдаа"
  },

  en: {
    incomeByAccount:
      "Income Amount by Account",

    expenseByCategory:
      "Expense by Category",

    incomeExpenseByBranch:
      "Income & Expense Amount by Branch",

    expenseByAccount:
      "Expense Amount by Account",

    income:
      "Income",

    expense:
      "Expense",

    amount:
      "Amount",

    loading:
      "Loading...",

    backendError:
      "Backend error"
  }
};

function formatCompact(
  value
) {
  const number =
    Number(
      value || 0
    );

  const absolute =
    Math.abs(
      number
    );

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
      Number.isInteger(
        result
      )
        ? result.toFixed(
            0
          )
        : result.toFixed(
            1
          )
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
      Number.isInteger(
        result
      )
        ? result.toFixed(
            0
          )
        : result.toFixed(
            1
          )
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
      Number.isInteger(
        result
      )
        ? result.toFixed(
            0
          )
        : result.toFixed(
            1
          )
    }K`;
  }

  return `${Math.round(
    number
  )}`;
}

function formatTooltip(
  value
) {
  const number =
    Number(
      value || 0
    );

  return `₮${Math.round(
    number
  ).toLocaleString(
    "en-US"
  )}`;
}

function wrapLabel(
  text,
  maxLength = 20
) {
  if (!text) {
    return [""];
  }

  const words =
    String(
      text
    ).split(" ");

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
      current =
        next;
    } else {
      if (
        current
      ) {
        lines.push(
          current
        );
      }

      current =
        word;
    }
  }

  if (
    current
  ) {
    lines.push(
      current
    );
  }

  return lines.slice(
    0,
    3
  );
}

function CustomYAxisTick({
  x,
  y,
  payload
}) {
  const lines =
    wrapLabel(
      payload?.value ||
        "",
      20
    );

  const lineHeight =
    12;

  const startY =
    y -
    ((lines.length -
      1) *
      lineHeight) /
      2;

  return (
    <g>
      <text
        x={
          x - 8
        }
        y={
          startY
        }
        textAnchor="end"
        fill="#536177"
        fontSize={
          10.5
        }
        fontWeight={
          500
        }
      >
        {lines.map(
          (
            line,
            index
          ) => (
            <tspan
              key={`${line}-${index}`}
              x={
                x - 8
              }
              dy={
                index ===
                0
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

const BRANCH_AXIS_MIN =
  0;

const BRANCH_AXIS_MAX =
  3_000_000_000;

const BRANCH_AXIS_TICKS = [
  0,
  500_000_000,
  1_000_000_000,
  2_000_000_000,
  3_000_000_000
];

function BranchRevenueExpenseChart({
  data = [],
  language = "mn"
}) {
  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

  const safeData =
    Array.isArray(
      data
    )
      ? data.map(
          (
            item
          ) => ({
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

  const yAxisWidth =
    170;

  const chartLeftMargin =
    8;

  const chartRightMargin =
    75;

  const rowHeight =
    40;

  const visibleHeight =
    310;

  const chartHeight =
    Math.max(
      visibleHeight,
      safeData.length *
        rowHeight +
        10
    );

  return (
    <div className="branch-re-chart">
      <div className="branch-re-legend">
        <span className="branch-re-legend-item">
          <span className="branch-re-legend-dot expense" />

          {t.expense}
        </span>

        <span className="branch-re-legend-item">
          <span className="branch-re-legend-dot revenue" />

          {t.income}
        </span>
      </div>

      <div className="branch-re-scroll">
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
              data={
                safeData
              }
              layout="vertical"
              margin={{
                top:
                  5,

                right:
                  chartRightMargin,

                bottom:
                  0,

                left:
                  chartLeftMargin
              }}
              barCategoryGap={
                8
              }
              barGap={
                3
              }
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
                  BRANCH_AXIS_MIN,
                  BRANCH_AXIS_MAX
                ]}
                hide
                allowDataOverflow
              />

              <YAxis
                type="category"
                dataKey="name"
                width={
                  yAxisWidth
                }
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                interval={
                  0
                }
                tick={
                  <CustomYAxisTick />
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
                  t.expense
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
                isAnimationActive={
                  true
                }
                animationBegin={
                  100
                }
                animationDuration={
                  1000
                }
                animationEasing="ease-out"
              />

              <Bar
                dataKey="revenue"
                name={
                  t.income
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
                isAnimationActive={
                  true
                }
                animationBegin={
                  100
                }
                animationDuration={
                  1000
                }
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="shared-bottom-axis">
        <div
          className="shared-bottom-axis-track"
          style={{
            marginLeft:
              `${
                yAxisWidth +
                chartLeftMargin
              }px`,

            marginRight:
              `${chartRightMargin}px`
          }}
        >
          {BRANCH_AXIS_TICKS.map(
            (
              tick
            ) => (
              <span
                key={
                  tick
                }
                className="shared-bottom-axis-tick"
                style={{
                  left:
                    `${
                      ((tick -
                        BRANCH_AXIS_MIN) /
                        (BRANCH_AXIS_MAX -
                          BRANCH_AXIS_MIN)) *
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

export default function RevenueExpense() {
  const {
    selectedMonth,
    selectedBranch,
    language
  } =
    useDashboard();

  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

  const filters =
    useMemo(
      () =>
        getDashboardFilters(
          selectedMonth,
          selectedBranch
        ),
      [
        selectedMonth,
        selectedBranch
      ]
    );

  const [
    revenueAccounts,
    setRevenueAccounts
  ] = useState(
    []
  );

  const [
    expenseGroups,
    setExpenseGroups
  ] = useState(
    []
  );

  const [
    branchRevenueExpense,
    setBranchRevenueExpense
  ] = useState(
    []
  );

  const [
    expenseAccounts,
    setExpenseAccounts
  ] = useState(
    []
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

  useEffect(
    () => {
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
            await Promise.all(
              [
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
              ]
            );

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
    },
    [
      filters
    ]
  );

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
      <div className="revenue-expense-page">
        <div className="page-loading">
          {t.loading}
        </div>
      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="revenue-expense-page">
        <div className="page-error">
          {t.backendError}
          :{" "}
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-expense-page">
      <div className="revenue-expense-grid">
        <Card
          title={
            t.incomeByAccount
          }
          className="revenue-expense-card"
        >
          <HorizontalBarChart
            data={
              revenueRows
            }
            yAxisWidth={
              195
            }
            rowHeight={
              40
            }
            barSize={
              20
            }
            visibleHeight={
              310
            }
            language={
              currentLanguage
            }
            valueLabel={
              t.amount
            }
          />
        </Card>

        <Card
          title={
            t.expenseByCategory
          }
          className="revenue-expense-card"
        >
          <HorizontalBarChart
            data={
              expenseGroupRows
            }
            yAxisWidth={
              210
            }
            rowHeight={
              40
            }
            barSize={
              20
            }
            visibleHeight={
              310
            }
            language={
              currentLanguage
            }
            valueLabel={
              t.amount
            }
          />
        </Card>

        <Card
          title={
            t.incomeExpenseByBranch
          }
          className="revenue-expense-card"
        >
          <BranchRevenueExpenseChart
            data={
              branchRevenueExpense
            }
            language={
              currentLanguage
            }
          />
        </Card>

        <Card
          title={
            t.expenseByAccount
          }
          className="revenue-expense-card"
        >
          <HorizontalBarChart
            data={
              expenseAccountRows
            }
            yAxisWidth={
              210
            }
            rowHeight={
              40
            }
            barSize={
              20
            }
            visibleHeight={
              310
            }
            language={
              currentLanguage
            }
            valueLabel={
              t.amount
            }
          />
        </Card>
      </div>
    </div>
  );
}