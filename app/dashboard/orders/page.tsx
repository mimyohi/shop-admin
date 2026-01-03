"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, X, FileSpreadsheet, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ordersQueries } from "@/queries/orders.queries";
import { adminUsersQueries } from "@/queries/admin-users.queries";
import { productsQueries } from "@/queries/products.queries";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from "nuqs";
import {
  bulkUpdateConsultationStatus,
  setAssignedAdmin,
  setHandlerAdmin,
  exportShippingExcelAndUpdateStatus,
} from "@/lib/actions/orders";
import { OrderWithDetails } from "@/types/orders.types";
import { ConsultationStatus } from "@/models/order.model";
import { formatPhoneNumberWithHyphen } from "@/lib/utils/phone";

type ConsultationTabConfig = {
  value: ConsultationStatus;
  label: string;
  nextStatus?: ConsultationStatus;
  nextLabel?: string;
  extraActions?: Array<{
    targetStatus: ConsultationStatus;
    label: string;
  }>;
};

type SortOption = "latest" | "oldest" | "amount_high" | "amount_low";

const DEFAULT_TAB: ConsultationStatus = "chatting_required";
const PAGE_SIZE = 20;
const DEFAULT_FILTERS = {
  search: "",
  sortBy: "latest" as SortOption,
  startDate: "",
  endDate: "",
  assignedAdmin: "all",
  handlerAdmin: "all",
  product: "all",
  page: 1,
} as const;

const CONSULTATION_TABS: ConsultationTabConfig[] = [
  {
    value: "chatting_required",
    label: "접수 필요",
    nextStatus: "consultation_required",
    nextLabel: "상담 필요로 이동",
    extraActions: [
      {
        targetStatus: "consultation_completed",
        label: "배송준비로 이동",
      },
    ],
  },
  {
    value: "consultation_required",
    label: "상담 필요",
    nextStatus: "consultation_completed",
    nextLabel: "배송준비(상담완료)",
    extraActions: [
      {
        targetStatus: "on_hold",
        label: "부재중로 이동",
      },
      {
        targetStatus: "shipping_on_hold",
        label: "배송 보류",
      },
      {
        targetStatus: "chatting_required",
        label: "접수 필요로 이동",
      },
    ],
  },
  {
    value: "on_hold",
    label: "부재중",
    nextStatus: "consultation_completed",
    nextLabel: "배송준비(상담완료)",
    extraActions: [
      {
        targetStatus: "shipping_on_hold",
        label: "배송보류",
      },
    ],
  },
  {
    value: "shipping_on_hold",
    label: "배송보류",
    nextStatus: "shipped",
    nextLabel: "배송처리",
    extraActions: [
      {
        targetStatus: "consultation_completed",
        label: "배송준비로 이동",
      },
    ],
  },
  {
    value: "consultation_completed",
    label: "배송준비(상담완료)",
    nextStatus: "shipped",
    nextLabel: "배송처리",
    extraActions: [
      {
        targetStatus: "consultation_required",
        label: "상담 필요로 이동",
      },
      {
        targetStatus: "shipping_on_hold",
        label: "배송보류로 이동",
      },
    ],
  },
  {
    value: "shipped",
    label: "배송처리",
    extraActions: [
      {
        targetStatus: "consultation_completed",
        label: "배송준비로 이동",
      },
    ],
  },
  {
    value: "cancelled",
    label: "취소건",
  },
];

const CONSULTATION_TAB_VALUES = CONSULTATION_TABS.map(
  (tab) => tab.value
) as ConsultationStatus[];

// 컬럼 설정 타입
type ColumnKey =
  | "orderNumber"
  | "assignedAdmin"
  | "userName"
  | "visitType"
  | "createdAt"
  | "phone"
  | "handlerAdmin"
  | "handledAt"
  | "adminMemo"
  | "finalPrice";

type ColumnSettings = Record<ColumnKey, boolean>;

const DEFAULT_COLUMN_SETTINGS: ColumnSettings = {
  orderNumber: true,
  assignedAdmin: true,
  userName: true,
  visitType: true,
  createdAt: true,
  phone: true,
  handlerAdmin: true,
  handledAt: true,
  adminMemo: true,
  finalPrice: true,
};

const COLUMN_LABELS: Record<ColumnKey, string> = {
  orderNumber: "주문번호",
  assignedAdmin: "접수 담당자",
  userName: "주문자",
  visitType: "초진/재진",
  createdAt: "주문일시",
  phone: "연락처",
  handlerAdmin: "상담 담당자",
  handledAt: "처리일시",
  adminMemo: "관리자 메모",
  finalPrice: "최종 결제 가격",
};

const COLUMN_STORAGE_KEY = "orders-table-columns";

const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined) return "-";
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) return "-";
  return `${numericAmount.toLocaleString("ko-KR")}원`;
};

// 최종 결제 가격 계산 함수
// total_amount는 이미 최종 결제 금액 (상품 금액 + 배송비 - 쿠폰 할인 - 포인트 사용)
const calculateFinalPrice = (order: OrderWithDetails): number => {
  return order.total_amount || 0;
};

const getVisitTypeLabel = (visitType?: string | null) => {
  if (!visitType) return "-";
  const visitTypeMap: Record<string, string> = {
    first: "초진",
    revisit_with_consult: "재진(상담)",
    revisit_no_consult: "재진(상담X)",
  };
  return visitTypeMap[visitType] || visitType;
};

const getOrderVisitType = (order: OrderWithDetails) => {
  // 주문 항목에서 visit_type을 찾아 반환
  if (!order.order_items || order.order_items.length === 0) return null;

  // 첫 번째 order_item의 visit_type을 반환 (모든 항목이 같은 visit_type을 가진다고 가정)
  const firstItem = order.order_items[0];
  return firstItem.visit_type || null;
};

const INITIAL_SELECTION_STATE = CONSULTATION_TABS.reduce((acc, tab) => {
  acc[tab.value] = [];
  return acc;
}, {} as Record<ConsultationStatus, string[]>);

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum(CONSULTATION_TAB_VALUES).withDefault(DEFAULT_TAB)
  );
  const [selectedOrders, setSelectedOrders] = useState<
    Record<ConsultationStatus, string[]>
  >(INITIAL_SELECTION_STATE);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // 컬럼 설정 상태 (localStorage)
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_SETTINGS;
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_COLUMN_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Failed to load column settings:", error);
    }
    return DEFAULT_COLUMN_SETTINGS;
  });

  // 컬럼 설정 저장
  const saveColumnSettings = (settings: ColumnSettings) => {
    setColumnSettings(settings);
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save column settings:", error);
    }
  };

  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 필터 상태
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault(DEFAULT_FILTERS.search)
  );
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsStringEnum([
      "latest",
      "oldest",
      "amount_high",
      "amount_low",
    ] as const).withDefault(DEFAULT_FILTERS.sortBy)
  );
  const [startDate, setStartDate] = useQueryState(
    "start",
    parseAsString.withDefault(DEFAULT_FILTERS.startDate)
  );
  const [endDate, setEndDate] = useQueryState(
    "end",
    parseAsString.withDefault(DEFAULT_FILTERS.endDate)
  );
  const [assignedAdminFilter, setAssignedAdminFilter] = useQueryState(
    "assigned",
    parseAsString.withDefault(DEFAULT_FILTERS.assignedAdmin)
  );
  const [handlerAdminFilter, setHandlerAdminFilter] = useQueryState(
    "handler",
    parseAsString.withDefault(DEFAULT_FILTERS.handlerAdmin)
  );
  const [productFilter, setProductFilter] = useQueryState(
    "product",
    parseAsString.withDefault(DEFAULT_FILTERS.product)
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(DEFAULT_FILTERS.page)
  );

  const orderFilters = useMemo(() => {
    const filters = {
      consultationStatus: activeTab,
      search: searchTerm || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      assignedAdminId:
        assignedAdminFilter !== DEFAULT_FILTERS.assignedAdmin
          ? assignedAdminFilter
          : undefined,
      handlerAdminId:
        handlerAdminFilter !== DEFAULT_FILTERS.handlerAdmin
          ? handlerAdminFilter
          : undefined,
      productId:
        productFilter !== DEFAULT_FILTERS.product ? productFilter : undefined,
      sortBy: sortBy,
      page,
      limit: PAGE_SIZE,
    };

    return filters;
  }, [
    activeTab,
    searchTerm,
    startDate,
    endDate,
    assignedAdminFilter,
    handlerAdminFilter,
    productFilter,
    sortBy,
    page,
  ]);

  const {
    data: ordersResult,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(ordersQueries.list(orderFilters));
  const orderList = useMemo(() => ordersResult?.orders ?? [], [ordersResult]);
  const totalPages = ordersResult?.totalPages ?? 1;
  const currentPage = ordersResult?.currentPage ?? 1;
  const totalCount = ordersResult?.totalCount ?? orderList.length;
  const displayedRangeStart =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const displayedRangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  const { data: adminList } = useQuery(
    adminUsersQueries.list({ is_active: true })
  );
  const admins = adminList ?? [];

  const { data: productsResult } = useQuery(
    productsQueries.list({ limit: "all" })
  );
  const products = useMemo(
    () => productsResult?.products ?? [],
    [productsResult]
  );

  useEffect(() => {
    setSelectedOrders((prev) => {
      const currentSelection = prev[activeTab] || [];
      const visibleIds = new Set(orderList.map((order) => order.id));
      const nextSelection = currentSelection.filter((id) => visibleIds.has(id));

      if (nextSelection.length === currentSelection.length) {
        return prev;
      }

      return {
        ...prev,
        [activeTab]: nextSelection,
      };
    });
  }, [orderList, activeTab]);

  const { data: statusCountsData, refetch: refetchStatusCounts } = useQuery(
    ordersQueries.consultationStatusCounts(CONSULTATION_TAB_VALUES)
  );
  const statusCounts = statusCountsData || {};

  const resetFilters = () => {
    void setSearchTerm(DEFAULT_FILTERS.search);
    void setSortBy(DEFAULT_FILTERS.sortBy);
    void setStartDate(DEFAULT_FILTERS.startDate);
    void setEndDate(DEFAULT_FILTERS.endDate);
    void setAssignedAdminFilter(DEFAULT_FILTERS.assignedAdmin);
    void setHandlerAdminFilter(DEFAULT_FILTERS.handlerAdmin);
    void setProductFilter(DEFAULT_FILTERS.product);
    void setPage(DEFAULT_FILTERS.page);
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    if (clamped === page) return;
    void setPage(clamped);
  };

  const handleRowClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  // 옵션 설정이 미완료된 주문인지 확인
  const hasIncompleteOptionSettings = (order: OrderWithDetails): boolean => {
    if (!order.order_items) return false;
    return order.order_items.some(
      (item) =>
        item.option_id &&
        (!item.selected_option_settings ||
          item.selected_option_settings.length === 0)
    );
  };

  const handleBulkStatusUpdate = async (
    targetStatus: ConsultationStatus,
    sourceStatus: ConsultationStatus
  ) => {
    let selected = selectedOrders[sourceStatus] || [];
    if (selected.length === 0) {
      return;
    }

    // 상담 필요 -> 상담 완료 전환 시 옵션 설정 미완료 주문 제외
    let skippedCount = 0;
    if (
      sourceStatus === "consultation_required" &&
      targetStatus === "consultation_completed"
    ) {
      const originalCount = selected.length;
      const ordersToProcess = orderList.filter(
        (order) =>
          selected.includes(order.id) && !hasIncompleteOptionSettings(order)
      );
      const skippedOrders = orderList.filter(
        (order) =>
          selected.includes(order.id) && hasIncompleteOptionSettings(order)
      );
      skippedCount = skippedOrders.length;
      selected = ordersToProcess.map((order) => order.id);

      if (selected.length === 0) {
        toast({
          title: "알림",
          description:
            "선택한 모든 주문에 옵션 설정이 필요합니다. 옵션 설정 후 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsBulkUpdating(true);
      const result = await bulkUpdateConsultationStatus(selected, targetStatus);
      if (!result.success) {
        throw new Error(result.error || "주문 상태 변경에 실패했습니다.");
      }

      if (skippedCount > 0) {
        toast({
          title: "일부 완료",
          description: `${selected.length}건 변경 완료, ${skippedCount}건은 옵션 설정이 필요하여 제외되었습니다.`,
        });
      } else {
        toast({
          title: "성공",
          description: `선택한 주문 ${selected.length}건의 상담 상태를 변경했습니다.`,
        });
      }

      setSelectedOrders((prev) => ({
        ...prev,
        [sourceStatus]: [],
      }));
      // 모든 주문 목록 쿼리 무효화 (원본 탭, 대상 탭 모두 갱신)
      await queryClient.invalidateQueries({ queryKey: ordersQueries.lists() });
      await refetchStatusCounts();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "오류",
        description: "주문 상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleAssignedAdminChange = async (
    orderId: string,
    adminId: string
  ) => {
    try {
      const result = await setAssignedAdmin(
        orderId,
        adminId === "none" ? null : adminId
      );
      if (!result.success) {
        throw new Error(result.error || "접수 담당자 변경에 실패했습니다.");
      }

      toast({
        title: "성공",
        description: "접수 담당자가 변경되었습니다.",
      });

      await refetchOrders();
    } catch (error) {
      console.error("Error updating assigned admin:", error);
      toast({
        title: "오류",
        description: "접수 담당자 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleHandlerAdminChange = async (orderId: string, adminId: string) => {
    try {
      const result = await setHandlerAdmin(
        orderId,
        adminId === "none" ? null : adminId
      );
      if (!result.success) {
        throw new Error(result.error || "상담 담당자 변경에 실패했습니다.");
      }

      toast({
        title: "성공",
        description: "상담 담당자가 변경되었습니다.",
      });

      await refetchOrders();
    } catch (error) {
      console.error("Error updating handler admin:", error);
      toast({
        title: "오류",
        description: "상담 담당자 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    const selected = selectedOrders["consultation_completed"] || [];
    if (selected.length === 0) {
      toast({
        title: "알림",
        description: "엑셀로 추출할 주문을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportShippingExcelAndUpdateStatus(selected);

      if (!result.success) {
        throw new Error(result.error || "엑셀 추출에 실패했습니다.");
      }

      // base64 데이터를 Blob으로 변환하여 다운로드
      const byteCharacters = atob(result.data!);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // 다운로드 트리거
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().split("T")[0];
      link.download = `배송목록_${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "성공",
        description: `${result.count}건의 주문이 엑셀로 추출되었고, 배송중 상태로 변경되었습니다.`,
      });

      setSelectedOrders((prev) => ({
        ...prev,
        consultation_completed: [],
      }));
      // 모든 주문 목록 쿼리 무효화 (배송준비 -> 배송중 이동)
      await queryClient.invalidateQueries({ queryKey: ordersQueries.lists() });
      await refetchStatusCounts();
    } catch (error) {
      console.error("Error exporting excel:", error);
      toast({
        title: "오류",
        description: "엑셀 추출에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderOrderTable = () => {
    const orders = orderList;

    if (ordersLoading) {
      return <div className="text-center py-8">로딩중...</div>;
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          조건에 맞는 주문이 없습니다.
        </div>
      );
    }

    const currentSelected = selectedOrders[activeTab] || [];
    const headerCheckboxState =
      orders.length === 0
        ? false
        : currentSelected.length === orders.length
        ? true
        : currentSelected.length === 0
        ? false
        : "indeterminate";
    const activeTabConfig = CONSULTATION_TABS.find(
      (tab) => tab.value === activeTab
    );

    const handleSelectAllCurrent = (checked: boolean) => {
      setSelectedOrders((prev) => ({
        ...prev,
        [activeTab]: checked ? orders.map((order) => order.id) : [],
      }));
    };

    const toggleSelection = (orderId: string, checked: boolean) => {
      setSelectedOrders((prev) => {
        const current = new Set(prev[activeTab] || []);
        if (checked) {
          current.add(orderId);
        } else {
          current.delete(orderId);
        }
        return {
          ...prev,
          [activeTab]: Array.from(current),
        };
      });
    };

    return (
      <>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-gray-600">
            선택된 주문:{" "}
            <span className="font-semibold text-blue-600">
              {currentSelected.length}
            </span>
            건
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTabConfig?.nextStatus && (
              <Button
                size="sm"
                disabled={
                  currentSelected.length === 0 ||
                  isBulkUpdating ||
                  ordersLoading
                }
                onClick={() =>
                  handleBulkStatusUpdate(activeTabConfig.nextStatus!, activeTab)
                }
              >
                {activeTabConfig.nextLabel || "다음 단계로 이동"}
              </Button>
            )}
            {activeTabConfig?.extraActions?.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant="outline"
                disabled={
                  currentSelected.length === 0 ||
                  isBulkUpdating ||
                  ordersLoading
                }
                onClick={() =>
                  handleBulkStatusUpdate(action.targetStatus, activeTab)
                }
              >
                {action.label}
              </Button>
            ))}
            {activeTab === "consultation_completed" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  currentSelected.length === 0 || isExporting || ordersLoading
                }
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                {isExporting ? "추출 중..." : "엑셀 추출"}
              </Button>
            )}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={headerCheckboxState}
                  onCheckedChange={(checked) =>
                    handleSelectAllCurrent(checked === true)
                  }
                  aria-label="전체 선택"
                />
              </TableHead>
              {columnSettings.orderNumber && <TableHead>주문번호</TableHead>}
              {columnSettings.assignedAdmin && <TableHead>접수 담당자</TableHead>}
              {columnSettings.userName && <TableHead>주문자</TableHead>}
              {columnSettings.visitType && <TableHead>초진/재진</TableHead>}
              {columnSettings.createdAt && <TableHead>주문일시</TableHead>}
              {columnSettings.phone && <TableHead>연락처</TableHead>}
              {columnSettings.handlerAdmin && <TableHead>상담 담당자</TableHead>}
              {columnSettings.handledAt && <TableHead>처리일시</TableHead>}
              {columnSettings.adminMemo && <TableHead>관리자 메모</TableHead>}
              {columnSettings.finalPrice && <TableHead>최종 결제 가격</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(order.id)}
              >
                <TableCell className="w-12">
                  <Checkbox
                    checked={currentSelected.includes(order.id)}
                    onCheckedChange={(checked) =>
                      toggleSelection(order.id, checked === true)
                    }
                    onClick={(event) => event.stopPropagation()}
                    aria-label="주문 선택"
                  />
                </TableCell>
                {columnSettings.orderNumber && (
                  <TableCell className="font-mono text-xs">
                    {order.order_id}
                  </TableCell>
                )}
                {columnSettings.assignedAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={order.assigned_admin_id || "none"}
                      onValueChange={(value) =>
                        handleAssignedAdminChange(order.id, value)
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">미배정</SelectItem>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.full_name || admin.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                {columnSettings.userName && (
                  <TableCell className="font-medium">{order.user_name}</TableCell>
                )}
                {columnSettings.visitType && (
                  <TableCell className="text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        getOrderVisitType(order) === "first"
                          ? "bg-green-100 text-green-800"
                          : getOrderVisitType(order) === "revisit_with_consult"
                          ? "bg-blue-100 text-blue-800"
                          : getOrderVisitType(order) === "revisit_no_consult"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {getVisitTypeLabel(getOrderVisitType(order))}
                    </span>
                  </TableCell>
                )}
                {columnSettings.createdAt && (
                  <TableCell className="text-sm">
                    {new Date(order.created_at).toLocaleDateString("ko-KR", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                )}
                {columnSettings.phone && (
                  <TableCell className="text-sm">
                    {formatPhoneNumberWithHyphen(order.user_phone)}
                  </TableCell>
                )}
                {columnSettings.handlerAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={order.handler_admin_id || "none"}
                      onValueChange={(value) =>
                        handleHandlerAdminChange(order.id, value)
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">미배정</SelectItem>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.full_name || admin.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                {columnSettings.handledAt && (
                  <TableCell className="text-sm">
                    {order.handled_at
                      ? new Date(order.handled_at).toLocaleDateString("ko-KR", {
                          year: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                )}
                {columnSettings.adminMemo && (
                  <TableCell className="text-sm max-w-[200px]">
                    {order.admin_memo ? (
                      <span
                        className="block truncate text-gray-600"
                        title={order.admin_memo}
                      >
                        {order.admin_memo}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                )}
                {columnSettings.finalPrice && (
                  <TableCell className="text-sm font-semibold text-blue-600">
                    {formatCurrency(calculateFinalPrice(order))}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-600">
            {totalCount === 0
              ? "표시할 주문이 없습니다."
              : `${displayedRangeStart}-${displayedRangeEnd} / ${totalCount}건`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={ordersLoading || currentPage <= 1}
              onClick={(event) => {
                event.stopPropagation();
                handlePageChange(currentPage - 1);
              }}
            >
              이전
            </Button>
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={ordersLoading || currentPage >= totalPages}
              onClick={(event) => {
                event.stopPropagation();
                handlePageChange(currentPage + 1);
              }}
            >
              다음
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">주문 관리</h1>
        <p className="text-gray-500">상품 구매 내역을 상태별로 관리하세요</p>
      </div>

      {/* 필터 영역 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터 및 검색
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 검색 */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                검색
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="주문번호, 이름, 이메일, 전화번호"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value || null);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* 상품명 필터 */}
            <div className="space-y-2">
              <Label htmlFor="product-filter" className="text-sm font-medium">
                상품명
              </Label>
              <Select
                value={productFilter}
                onValueChange={(value) => {
                  setProductFilter(value);
                }}
              >
                <SelectTrigger id="product-filter">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 담당자 필터 */}
            <div className="space-y-2">
              <Label htmlFor="admin-filter" className="text-sm font-medium">
                접수 담당자
              </Label>
              <Select
                value={assignedAdminFilter}
                onValueChange={(value) => {
                  setAssignedAdminFilter(value);
                }}
              >
                <SelectTrigger id="admin-filter">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.full_name || admin.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="handler-filter" className="text-sm font-medium">
                상담 담당자
              </Label>
              <Select
                value={handlerAdminFilter}
                onValueChange={(value) => {
                  void setHandlerAdminFilter(value);
                  void setPage(1);
                }}
              >
                <SelectTrigger id="handler-filter">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.full_name || admin.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 정렬 */}
            <div className="space-y-2">
              <Label htmlFor="sort-by" className="text-sm font-medium">
                정렬
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as SortOption);
                  void setPage(1);
                }}
              >
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="최신순" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                  <SelectItem value="amount_high">금액 높은순</SelectItem>
                  <SelectItem value="amount_low">금액 낮은순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 시작일 */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">
                시작일
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  void setStartDate(e.target.value || null);
                  void setPage(1);
                }}
              />
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">
                종료일
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  void setEndDate(e.target.value || null);
                  void setPage(1);
                }}
              />
            </div>
          </div>

          {/* 활성 필터 표시 */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">검색 결과:</span>
            <span className="font-semibold text-blue-600">{totalCount}건</span>
            {(searchTerm ||
              assignedAdminFilter !== "all" ||
              handlerAdminFilter !== "all" ||
              productFilter !== "all" ||
              startDate ||
              endDate) && (
              <span className="text-gray-500">
                (필터 적용 중: 전체 {totalCount}건)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>주문 목록</CardTitle>
            <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  컬럼 설정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>테이블 컬럼 설정</DialogTitle>
                  <DialogDescription>
                    표시할 컬럼을 선택하세요. 설정은 브라우저에 저장됩니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${key}`}
                        checked={columnSettings[key]}
                        onCheckedChange={(checked) => {
                          saveColumnSettings({
                            ...columnSettings,
                            [key]: checked === true,
                          });
                        }}
                      />
                      <Label
                        htmlFor={`column-${key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {COLUMN_LABELS[key]}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      saveColumnSettings(DEFAULT_COLUMN_SETTINGS);
                    }}
                  >
                    초기화
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsColumnSettingsOpen(false)}
                  >
                    완료
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              void setActiveTab(value as ConsultationStatus);
              void setPage(1);
            }}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-7 mb-4">
              {CONSULTATION_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="ml-1 text-xs">
                    ({statusCounts[tab.value] || 0})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {CONSULTATION_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {renderOrderTable()}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
