export const BASE = `
FROM public.account_move_line aml
JOIN public.account_move am
  ON am.id = aml.move_id
JOIN public.account_account aa
  ON aa.id = aml.account_id
LEFT JOIN public.res_branch rb
  ON rb.id = aml.branch_id
WHERE am.state = 'posted'
`;

function validateDate(value, name) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const text = String(value).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`Invalid ${name}`);
  }

  const date = new Date(`${text}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    throw new Error(`Invalid ${name}`);
  }

  return text;
}

function validateBranchId(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "all"
  ) {
    return null;
  }

  const text = String(value).trim();

  if (!/^\d+$/.test(text)) {
    throw new Error("Invalid branch_id");
  }

  const number = Number(text);

  if (
    !Number.isSafeInteger(number) ||
    number <= 0
  ) {
    throw new Error("Invalid branch_id");
  }

  return number;
}

export function buildFilters(
  dateFrom,
  dateTo,
  branchId
) {
  const validatedDateFrom =
    validateDate(dateFrom, "date_from");

  const validatedDateTo =
    validateDate(dateTo, "date_to");

  const validatedBranchId =
    validateBranchId(branchId);

  if (
    validatedDateFrom &&
    validatedDateTo &&
    validatedDateFrom > validatedDateTo
  ) {
    throw new Error(
      "date_from must be before or equal to date_to"
    );
  }

  const values = [];
  const conditions = [];

  if (validatedDateFrom) {
    values.push(validatedDateFrom);

    conditions.push(
      `aml.date >= $${values.length}::date`
    );
  }

  if (validatedDateTo) {
    values.push(validatedDateTo);

    conditions.push(
      `aml.date <= $${values.length}::date`
    );
  }

  if (validatedBranchId !== null) {
    values.push(validatedBranchId);

    conditions.push(
      `aml.branch_id = $${values.length}`
    );
  }

  return {
    sql:
      conditions.length > 0
        ? `AND ${conditions.join(" AND ")}`
        : "",
    values,
  };
}

export function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export function percentageChange(
  current,
  previous
) {
  const currentValue =
    toNumber(current);

  const previousValue =
    toNumber(previous);

  if (previousValue === 0) {
    if (currentValue === 0) {
      return 0;
    }

    return 100;
  }

  return Number(
    (
      ((currentValue - previousValue) /
        Math.abs(previousValue)) *
      100
    ).toFixed(1)
  );
}

export function rowsToNumbers(rows) {
  return rows.map((row) => {
    const output = {};

    for (
      const [key, value]
      of Object.entries(row)
    ) {
      if (
        [
          "value",
          "revenue",
          "expense",
          "profit",
          "invoiced",
          "residual",
          "collected",
          "rate",
          "total",
          "receivable",
          "payable",
          "net_profit",
          "operating",
          "investing",
          "financing",
        ].includes(key)
      ) {
        output[key] =
          toNumber(value);
      } else {
        output[key] =
          value;
      }
    }

    return output;
  });
}

export function parseDateParam(
  value,
  name
) {
  return validateDate(
    value,
    name
  );
}

export function parsePositiveIntegerParam(
  value,
  name
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (!/^\d+$/.test(text)) {
    throw new Error(
      `Invalid ${name}`
    );
  }

  const number =
    Number(text);

  if (
    !Number.isSafeInteger(number) ||
    number <= 0
  ) {
    throw new Error(
      `Invalid ${name}`
    );
  }

  return number;
}

export function parseDashboardFilters(
  query
) {
  const dateFrom =
    validateDate(
      query.date_from,
      "date_from"
    );

  const dateTo =
    validateDate(
      query.date_to,
      "date_to"
    );

  const branchId =
    validateBranchId(
      query.branch_id
    );

  if (
    dateFrom &&
    dateTo &&
    dateFrom > dateTo
  ) {
    throw new Error(
      "date_from must be before or equal to date_to"
    );
  }

  return {
    dateFrom,
    dateTo,
    branchId,
  };
}

export function sendInvalidQuery(
  res,
  error
) {
  return res
    .status(400)
    .json({
      success: false,
      message:
        error?.message ||
        "Invalid query parameters",
    });
}