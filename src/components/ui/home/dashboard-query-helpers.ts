import { FilterState } from "@/components/ui/dashboard/global-filter-bar";

export const initialFilters: FilterState = {
  batchId: "ALL",
  cluster: "ALL",
  month: "ALL",
  unitCode: "ALL",
  lineName: "ALL",
  buyerName: "ALL",
  season: "ALL",
  orderStatus: "ALL",
  styleRef: "",
  startDate: "",
  endDate: "",
  search: "",
};

export function buildDashboardQueryParams(
  currentFilters: FilterState,
  monthVal?: string
): URLSearchParams {
  const params = new URLSearchParams();
  if (currentFilters.batchId && currentFilters.batchId !== "ALL")
    params.append("batchId", currentFilters.batchId);
  if (currentFilters.cluster && currentFilters.cluster !== "ALL")
    params.append("cluster", currentFilters.cluster);
  if (currentFilters.month && currentFilters.month !== "ALL") {
    params.append("month", currentFilters.month);
  } else if (
    monthVal &&
    (!currentFilters.batchId || currentFilters.batchId === "ALL")
  ) {
    params.append("month", monthVal);
  }
  if (currentFilters.unitCode && currentFilters.unitCode !== "ALL")
    params.append("unitCode", currentFilters.unitCode);
  if (currentFilters.lineName && currentFilters.lineName !== "ALL")
    params.append("lineName", currentFilters.lineName);
  if (currentFilters.buyerName && currentFilters.buyerName !== "ALL")
    params.append("buyerName", currentFilters.buyerName);
  if (currentFilters.season && currentFilters.season !== "ALL")
    params.append("season", currentFilters.season);
  if (currentFilters.orderStatus && currentFilters.orderStatus !== "ALL")
    params.append("orderStatus", currentFilters.orderStatus);
  if (currentFilters.styleRef)
    params.append("styleRef", currentFilters.styleRef);
  if (currentFilters.startDate)
    params.append("startDate", currentFilters.startDate);
  if (currentFilters.endDate)
    params.append("endDate", currentFilters.endDate);

  return params;
}
