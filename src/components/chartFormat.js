export function formatCompact(value) {
  const number = Number(value || 0);
  const absolute = Math.abs(number);
  const sign = number < 0 ? "-" : "";

  if (absolute >= 1_000_000_000) {
    const result = absolute / 1_000_000_000;
    return `${sign}${Number.isInteger(result) ? result.toFixed(0) : result.toFixed(1)}B`;
  }

  if (absolute >= 1_000_000) {
    const result = absolute / 1_000_000;
    return `${sign}${Number.isInteger(result) ? result.toFixed(0) : result.toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    const result = absolute / 1_000;
    return `${sign}${Number.isInteger(result) ? result.toFixed(0) : result.toFixed(1)}K`;
  }

  return `${Math.round(number)}`;
}

export function formatTooltip(value) {
  const number = Number(value || 0);
  return `₮${Math.round(number).toLocaleString("en-US")}`;
}

export function formatMonth(value) {
  if (!value) return "";

  const text = String(value).trim().replace(/-/g, "/");
  const match = text.match(/(\d{4})\/(\d{1,2})/);

  if (!match) return text;

  return `${match[1]}/${String(match[2]).padStart(2, "0")}`;
}
