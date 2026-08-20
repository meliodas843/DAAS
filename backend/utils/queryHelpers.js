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

export function buildFilters(
  dateFrom,
  dateTo,
  branchId
) {
  const values = [];
  const conditions = [];

  if (dateFrom) {
    values.push(dateFrom);

    conditions.push(
      `aml.date >= $${values.length}::date`
    );
  }

  if (dateTo) {
    values.push(dateTo);

    conditions.push(
      `aml.date <= $${values.length}::date`
    );
  }

  if (
    branchId !== undefined &&
    branchId !== null &&
    branchId !== "" &&
    branchId !== "all"
  ) {
    values.push(Number(branchId));

    conditions.push(
      `aml.branch_id = $${values.length}`
    );
  }

  return {
    sql:
      conditions.length > 0
        ? `AND ${conditions.join(" AND ")}`
        : "",
    values
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

    for (const [key, value] of Object.entries(row)) {
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
          "total"
        ].includes(key)
      ) {
        output[key] =
          toNumber(value);
      } else {
        output[key] = value;
      }
    }

    return output;
  });
}