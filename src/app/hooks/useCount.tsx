import { useCallback } from "react";

function formatNumber(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "0";

  if (value < 1000) return value.toString();

  const units = ["k", "m", "b", "t"];
  let unitIndex = -1;
  let shortValue = value;

  while (shortValue >= 1000 && unitIndex < units.length - 1) {
    shortValue /= 1000;
    unitIndex++;
  }

  const formatted =
    shortValue % 1 === 0 ? shortValue.toFixed(0) : shortValue.toFixed(1);

  return `${formatted}${units[unitIndex]}`;
}

export function useCount() {
  const format = useCallback((count: number): string => {
    return formatNumber(count);
  }, []);

  return { format };
}
