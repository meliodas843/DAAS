const API =
  import.meta.env
    .VITE_API_URL ||
  "http://localhost:8000/api";

const TOKEN_KEY =
  "admin_token";

const USER_KEY =
  "admin_user";

function getToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

function clearSession() {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}

function buildQuery(
  filters = {}
) {
  const params =
    new URLSearchParams();

  Object.entries(
    filters || {}
  ).forEach(
    ([key, value]) => {
      if (
        value !==
          undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        params.set(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

async function request(
  path,
  filters = {}
) {
  const token =
    getToken();

  if (!token) {
    clearSession();

    if (
      window.location
        .pathname !==
      "/login"
    ) {
      window.location.replace(
        "/login"
      );
    }

    throw new Error(
      "Authentication required"
    );
  }

  const response =
    await fetch(
      `${API}${path}${buildQuery(
        filters
      )}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (
    response.status ===
    401
  ) {
    clearSession();

    if (
      window.location
        .pathname !==
      "/login"
    ) {
      window.location.replace(
        "/login"
      );
    }

    throw new Error(
      "Session expired"
    );
  }

  if (
    response.status ===
    403
  ) {
    throw new Error(
      data?.message ||
        "Access denied"
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `HTTP ${response.status}`
    );
  }

  return data;
}

function toNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function normalizeRows(
  rows
) {
  if (
    !Array.isArray(
      rows
    )
  ) {
    return [];
  }

  return rows.map(
    (item) => ({
      ...item,
      value:
        toNumber(
          item.value
        )
    })
  );
}

export async function getBranches() {
  const data =
    await request(
      "/branches"
    );

  return Array.isArray(
    data
  )
    ? data
    : [];
}

export async function getMonths(
  filters = {}
) {
  const data =
    await request(
      "/months",
      filters
    );

  return Array.isArray(
    data
  )
    ? data
    : [];
}

export async function getKpis(
  filters = {}
) {
  const data =
    await request(
      "/kpis",
      filters
    );

  return {
    revenue:
      toNumber(
        data?.revenue
      ),
    revenue_previous:
      toNumber(
        data
          ?.revenue_previous
      ),
    revenue_change:
      toNumber(
        data
          ?.revenue_change
      ),
    expense:
      toNumber(
        data?.expense
      ),
    expense_previous:
      toNumber(
        data
          ?.expense_previous
      ),
    expense_change:
      toNumber(
        data
          ?.expense_change
      ),
    receivable:
      toNumber(
        data?.receivable
      ),
    receivable_previous:
      toNumber(
        data
          ?.receivable_previous
      ),
    receivable_change:
      toNumber(
        data
          ?.receivable_change
      ),
    payable:
      toNumber(
        data?.payable
      ),
    payable_previous:
      toNumber(
        data
          ?.payable_previous
      ),
    payable_change:
      toNumber(
        data
          ?.payable_change
      ),
    net_profit:
      toNumber(
        data?.net_profit
      ),
    net_profit_previous:
      toNumber(
        data
          ?.net_profit_previous
      ),
    net_profit_change:
      toNumber(
        data
          ?.net_profit_change
      ),
    margin:
      toNumber(
        data?.margin
      )
  };
}

export async function getAreaStats(
  filters = {}
) {
  const data =
    await request(
      "/area_stats",
      filters
    );

  return {
    rented:
      toNumber(
        data?.rented
      ),
    total:
      toNumber(
        data?.total
      ),
    vacant:
      toNumber(
        data?.vacant
      ),
    utilization:
      toNumber(
        data?.utilization
      )
  };
}

export async function getCollectionRate(
  filters = {}
) {
  return request(
    "/ar/collection_rate",
    filters
  );
}

export async function getReceivableBranches(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ar/by_branch",
      filters
    )
  );
}

export async function getReceivableAccounts(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ar/by_account",
      filters
    )
  );
}

export async function getReceivableMonthly(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ar/by_month",
      filters
    )
  );
}

export async function getReceivableChanges(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ar/month_change",
      filters
    )
  );
}

export async function getReceivableAging(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ar/aging",
      filters
    )
  );
}

export async function getPayableBranches(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ap/by_branch",
      filters
    )
  );
}

export async function getPayableAccounts(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ap/by_account",
      filters
    )
  );
}

export async function getPayableMonthly(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ap/by_month",
      filters
    )
  );
}

export async function getPayableChanges(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ap/month_change",
      filters
    )
  );
}

export async function getPayableAging(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/ap/aging",
      filters
    )
  );
}

export async function getRevenueMonthly(
  filters = {}
) {
  const data =
    await request(
      "/revenue",
      filters
    );

  return Array.isArray(
    data
  )
    ? data.map(
        (item) => ({
          month:
            item.month,
          revenue:
            toNumber(
              item.revenue
            ),
          expense:
            toNumber(
              item.expense
            ),
          profit:
            toNumber(
              item.profit
            )
        })
      )
    : [];
}

export async function getRevenueAccounts(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/income/by_account",
      filters
    )
  );
}

export async function getExpenseGroups(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/expense/by_group",
      filters
    )
  );
}

export async function getExpenseAccounts(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/expense/by_account",
      filters
    )
  );
}

export async function getBranchRevenueExpense(
  filters = {}
) {
  const data =
    await request(
      "/income_expense/by_branch",
      filters
    );

  return Array.isArray(
    data
  )
    ? data.map(
        (item) => ({
          name:
            item.name,
          revenue:
            toNumber(
              item.revenue
            ),
          expense:
            toNumber(
              item.expense
            )
        })
      )
    : [];
}

export async function getCashFlowSummary(
  filters = {}
) {
  const data =
    await request(
      "/cash-flow/summary",
      filters
    );

  return {
    total:
      toNumber(
        data?.total
      ),
    balance:
      toNumber(
        data?.balance
      ),
    operating:
      toNumber(
        data?.operating
      ),
    financing:
      toNumber(
        data?.financing
      ),
    investing:
      toNumber(
        data?.investing
      )
  };
}

export async function getCashFlowMovement(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/cash-flow/by_month",
      filters
    )
  );
}

export async function getCashFlowBranches(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/cash-flow/by_branch",
      filters
    )
  );
}

export async function getCashAccounts(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/cash-flow/by_account",
      filters
    )
  );
}

export async function getCashActivities(
  filters = {}
) {
  return normalizeRows(
    await request(
      "/cash-flow/by_activity",
      filters
    )
  );
}