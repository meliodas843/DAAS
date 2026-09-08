export function formatMoney(
  value,
  currency = false
) {
  const number = Number(value);

  const safeNumber =
    Number.isFinite(number)
      ? number
      : 0;

  const absolute =
    Math.abs(safeNumber);

  let result;

  if (
    absolute >=
    1_000_000_000
  ) {
    result = `${(
      absolute /
      1_000_000_000
    ).toFixed(1)}bn`;
  } else if (
    absolute >=
    1_000_000
  ) {
    result = `${(
      absolute /
      1_000_000
    ).toFixed(1)}M`;
  } else if (
    absolute >= 1_000
  ) {
    result = `${(
      absolute / 1_000
    ).toFixed(1)}K`;
  } else {
    result =
      Math.round(
        absolute
      ).toString();
  }

  if (safeNumber < 0) {
    result = `-${result}`;
  }

  if (currency) {
    if (safeNumber < 0) {
      return `-₮${result.replace(
        "-",
        ""
      )}`;
    }

    return `₮${result}`;
  }

  return result;
}

export function formatTooltipMoney(
  value
) {
  const number =
    Math.round(
      Number(value) || 0
    );

  if (number < 0) {
    return `-₮${Math.abs(
      number
    ).toLocaleString(
      "en-US"
    )}`;
  }

  return `₮${number.toLocaleString(
    "en-US"
  )}`;
}

export function formatPercent(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0.0%";
  }

  return `${Math.abs(
    number
  ).toFixed(1)}%`;
}

export function formatMonth(
  value
) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}$/.test(
      text
    )
  ) {
    return text.replace(
      "-",
      "/"
    );
  }

  if (
    /^\d{4}\/\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  if (
    /^\d{1,2}$/.test(
      text
    )
  ) {
    return `2026/${String(
      text
    ).padStart(
      2,
      "0"
    )}`;
  }

  return text;
}