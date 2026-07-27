export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostRate: number,
  unitCost: number
): number {
  const holdingCost = unitCost * holdingCostRate;
  if (holdingCost <= 0) return 0;
  return Math.round(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));
}

export function calculateReorderPoint(
  annualDemand: number,
  leadTimeDays: number
): number {
  const dailyDemand = annualDemand / 365;
  return Math.round(dailyDemand * leadTimeDays);
}

export function calculateTotalAnnualCost(
  annualDemand: number,
  orderingCost: number,
  holdingCostRate: number,
  unitCost: number,
  eoq: number
): number {
  const holdingCost = unitCost * holdingCostRate;
  if (eoq <= 0) return 0;
  const orderingTotal = (annualDemand / eoq) * orderingCost;
  const holdingTotal = (eoq / 2) * holdingCost;
  return Number((orderingTotal + holdingTotal).toFixed(2));
}

export function calculateHoldingCost(
  eoq: number,
  unitCost: number,
  holdingCostRate: number
): number {
  return Number(((eoq / 2) * unitCost * holdingCostRate).toFixed(2));
}

export function calculateOrderingCost(
  annualDemand: number,
  eoq: number,
  orderingCost: number
): number {
  if (eoq <= 0) return 0;
  return Number(((annualDemand / eoq) * orderingCost).toFixed(2));
}
