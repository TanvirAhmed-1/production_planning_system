"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithCache } from "@/lib/api-cache";
import {
  Search,
  Download,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OrderRow {
  id: string;
  orderCode: string;
  buyer: string;
  unit: string;
  line: string;
  style: string;
  article?: string;
  poNo?: string;
  color?: string;
  season?: string;
  orderQty: number;
  planQty: number;
  actualQty: number;
  remainingQty: number;
  smv: number;
  achievementRate: number;
  status: string;
}

interface OrdersTableProps {
  onExport?: () => void;
}

export function OrdersTable({ onExport }: OrdersTableProps) {
  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
        ...(selectedStatus !== "ALL" ? { orderStatus: selectedStatus } : {})
      });
      const data = await fetchWithCache(`/api/analytics/orders?${params.toString()}`);
      if (data) {
        setOrders(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedStatus]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
      <CardHeader className="p-3.5 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start sm:items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="truncate">All Garments Orders & Styles</span>
            </CardTitle>
            <CardDescription className="text-xs line-clamp-1 sm:line-clamp-none mt-0.5">
              Detailed tracking of order quantities, styles, PO numbers, colors, and remaining balances
            </CardDescription>
          </div>

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-7 sm:h-8 px-2.5 sm:px-3 gap-1.5 text-xs font-semibold shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export Orders</span>
              <span className="inline sm:hidden">Export</span>
            </Button>
          )}
        </div>

        {/* Search & Filter bar */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search style, PO, color, order..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 pl-8 text-xs w-full"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <SearchableSelect
                label="Status:"
                placeholder="All Statuses"
                searchPlaceholder="Search status..."
                allOptionLabel="All Statuses"
                allOptionValue="ALL"
                value={selectedStatus}
                options={[
                  { label: "On Track", value: "ON_TRACK" },
                  { label: "In Progress", value: "IN_PROGRESS" },
                  { label: "Delayed", value: "DELAYED" },
                  { label: "Completed", value: "COMPLETED" }
                ]}
                onChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
                className="w-full sm:w-48"
                triggerClassName="w-full h-8 text-xs"
                dropdownWidth="w-52"
              />

              <div className="sm:hidden text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 whitespace-nowrap">
                Total: <span className="font-bold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Orders: <span className="font-bold text-slate-900 dark:text-slate-100">{totalCount.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-900/80">
                <TableHead className="font-semibold">Buyer</TableHead>
                <TableHead className="font-semibold">Style Ref</TableHead>
                <TableHead className="font-semibold">PO NO</TableHead>
                <TableHead className="font-semibold">Color</TableHead>
                <TableHead className="font-semibold">Unit / Line</TableHead>
                <TableHead className="font-semibold">Season</TableHead>
                <TableHead className="text-right font-semibold">Order Qty</TableHead>
                <TableHead className="text-right font-semibold">Planned Qty</TableHead>
                <TableHead className="text-right font-semibold">Actual Produced</TableHead>
                <TableHead className="text-right font-semibold">Remaining</TableHead>
                <TableHead className="text-right font-semibold">SMV</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10 text-slate-400">
                    No orders match the current search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((ord) => {
                  let badgeVariant: any = "secondary";
                  if (ord.status === "COMPLETED") badgeVariant = "success";
                  else if (ord.status === "ON_TRACK") badgeVariant = "info";
                  else if (ord.status === "DELAYED") badgeVariant = "destructive";
                  else badgeVariant = "warning";

                  return (
                    <TableRow key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {ord.buyer}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-sky-700 dark:text-sky-300">
                        {ord.style}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {ord.poNo || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[130px] truncate" title={ord.color}>
                        {ord.color || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] py-0 font-semibold">{ord.unit}</Badge>
                          <span className="text-xs font-semibold">{ord.line}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {ord.season || "Spring-2027"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {ord.orderQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        {ord.planQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ord.actualQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {ord.remainingQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-500">
                        {ord.smv}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={badgeVariant} className="text-[10px] font-semibold">
                          {ord.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-slate-850 dark:bg-slate-900"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages || loading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
