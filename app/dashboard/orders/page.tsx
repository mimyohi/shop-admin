"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Filter, X } from "lucide-react";
import { ordersQueries } from "@/queries/orders.queries";
import { adminUsersQueries } from "@/queries/admin-users.queries";
import { productsQueries } from "@/queries/products.queries";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { bulkUpdateConsultationStatus } from "@/lib/actions/orders";

interface AdminUser {
  id: string;
  username: string;
  full_name: string | null;
}

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
}

interface HealthConsultation {
  id: string;
  user_id?: string | null;
  chief_complaint?: string;
  symptom_duration?: string;
  symptom_severity?: string;
  symptom_checklist?: any;
  consultation_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  basic_info?: {
    birth_date?: string;
    height?: number;
    weight?: number;
    gender?: string;
    blood_pressure?: string;
    pulse?: string;
    medications?: string;
  };
  goals?: {
    target_weight?: number;
    target_period?: string;
    diet_experience?: string;
    min_weight?: number;
    max_weight?: number;
  };
  lifestyle_info?: {
    meals_per_day?: string;
    late_night_snack?: string;
    sleep_hours?: string;
    weekly_drinks?: string;
    weekly_alcohol?: string;
  };
  health?: {
    allergies?: string;
    diseases?: string;
    current_medications?: string;
  };
}

interface Order {
  id: string;
  order_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  total_amount: number;
  status: string;
  payment_key: string;
  consultation_status: string;
  assigned_admin_id: string | null;
  handler_admin_id: string | null;
  handled_at: string | null;
  created_at: string;
  order_health_consultations?: HealthConsultation[];
  assigned_admin?: AdminUser;
  handler_admin?: AdminUser;
  order_items?: OrderItem[];
}

type ConsultationTabConfig = {
  value: Order["consultation_status"];
  label: string;
  nextStatus?: Order["consultation_status"];
  nextLabel?: string;
  extraActions?: Array<{
    targetStatus: Order["consultation_status"];
    label: string;
  }>;
};

type PaymentStatusFilter = "all" | "paid" | "pending" | "cancelled";
type SortOption = "latest" | "oldest" | "amount_high" | "amount_low";

const DEFAULT_TAB: Order["consultation_status"] = "chatting_required";
const DEFAULT_FILTERS = {
  search: "",
  paymentStatus: "all" as PaymentStatusFilter,
  sortBy: "latest" as SortOption,
  startDate: "",
  endDate: "",
  assignedAdmin: "all",
  handlerAdmin: "all",
  product: "all",
} as const;

const CONSULTATION_TABS: ConsultationTabConfig[] = [
  {
    value: "chatting_required",
    label: "차팅 필요",
    nextStatus: "consultation_required",
    nextLabel: "선택 상담 필요로 이동",
  },
  {
    value: "consultation_required",
    label: "상담 필요",
    nextStatus: "consultation_completed",
    nextLabel: "선택 배송필요(상담완료) 이동",
    extraActions: [
      {
        targetStatus: "on_hold",
        label: "선택 보류로 이동",
      },
    ],
  },
  {
    value: "on_hold",
    label: "보류",
    nextStatus: "consultation_required",
    nextLabel: "선택 상담 재개",
  },
  {
    value: "consultation_completed",
    label: "배송필요(상담완료)",
    nextStatus: "shipping_in_progress",
    nextLabel: "선택 배송중으로 이동",
    extraActions: [
      {
        targetStatus: "shipping_on_hold",
        label: "선택 배송보류로 이동",
      },
    ],
  },
  {
    value: "shipping_in_progress",
    label: "배송중",
    nextStatus: "shipping_completed",
    nextLabel: "선택 배송완료 처리",
    extraActions: [
      {
        targetStatus: "consultation_completed",
        label: "선택 배송필요 단계로 복귀",
      },
    ],
  },
  {
    value: "shipping_on_hold",
    label: "배송보류",
    nextStatus: "shipping_in_progress",
    nextLabel: "선택 배송중으로 이동",
    extraActions: [
      {
        targetStatus: "consultation_completed",
        label: "선택 배송필요 단계로 복귀",
      },
    ],
  },
  {
    value: "shipping_completed",
    label: "배송완료",
  },
  {
    value: "cancelled",
    label: "취소건",
  },
];

const CONSULTATION_TAB_VALUES = CONSULTATION_TABS.map(
  (tab) => tab.value
) as Order["consultation_status"][];

const formatCurrency = (amount?: number | null) => {
  if (amount === null || amount === undefined) return "-";
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) return "-";
  return `${numericAmount.toLocaleString("ko-KR")}원`;
};

const INITIAL_SELECTION_STATE = CONSULTATION_TABS.reduce((acc, tab) => {
  acc[tab.value] = [];
  return acc;
}, {} as Record<Order["consultation_status"], string[]>);

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum(CONSULTATION_TAB_VALUES).withDefault(DEFAULT_TAB)
  );
  const [selectedOrders, setSelectedOrders] = useState<
    Record<Order["consultation_status"], string[]>
  >(INITIAL_SELECTION_STATE);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const { toast } = useToast();

  // 필터 상태
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault(DEFAULT_FILTERS.search)
  );
  const [paymentStatus, setPaymentStatus] = useQueryState(
    "payment",
    parseAsStringEnum([
      "all",
      "paid",
      "pending",
      "cancelled",
    ] as const).withDefault(DEFAULT_FILTERS.paymentStatus)
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

  const orderFilters = useMemo(() => {
    const filters = {
      consultationStatus: activeTab,
      search: searchTerm || undefined,
      paymentStatus:
        paymentStatus !== DEFAULT_FILTERS.paymentStatus
          ? paymentStatus
          : undefined,
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
      limit: "all" as const,
    };

    return filters;
  }, [
    activeTab,
    searchTerm,
    paymentStatus,
    startDate,
    endDate,
    assignedAdminFilter,
    handlerAdminFilter,
    productFilter,
    sortBy,
  ]);

  const {
    data: ordersResult,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(ordersQueries.list(orderFilters));
  const orderList = useMemo(() => ordersResult?.orders ?? [], [ordersResult]);

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

  const statusCountsQuery = useQuery(
    ordersQueries.consultationStatusCounts(CONSULTATION_TAB_VALUES)
  );
  const statusCounts = statusCountsQuery.data || {};

  const resetFilters = () => {
    void setSearchTerm(DEFAULT_FILTERS.search);
    void setPaymentStatus(DEFAULT_FILTERS.paymentStatus);
    void setSortBy(DEFAULT_FILTERS.sortBy);
    void setStartDate(DEFAULT_FILTERS.startDate);
    void setEndDate(DEFAULT_FILTERS.endDate);
    void setAssignedAdminFilter(DEFAULT_FILTERS.assignedAdmin);
    void setHandlerAdminFilter(DEFAULT_FILTERS.handlerAdmin);
    void setProductFilter(DEFAULT_FILTERS.product);
  };

  const handleRowClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const handleBulkStatusUpdate = async (
    targetStatus: Order["consultation_status"],
    sourceStatus: Order["consultation_status"]
  ) => {
    const selected = selectedOrders[sourceStatus] || [];
    if (selected.length === 0) {
      return;
    }

    try {
      setIsBulkUpdating(true);
      const result = await bulkUpdateConsultationStatus(selected, targetStatus);
      if (!result.success) {
        throw new Error(result.error || "주문 상태 변경에 실패했습니다.");
      }

      toast({
        title: "성공",
        description: `선택한 주문 ${selected.length}건의 상담 상태를 변경했습니다.`,
      });

      setSelectedOrders((prev) => ({
        ...prev,
        [sourceStatus]: [],
      }));
      await refetchOrders();
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
              <TableHead>주문번호</TableHead>
              <TableHead>차팅 담당자</TableHead>
              <TableHead>주문자</TableHead>
              <TableHead>주문일시</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>상담 담당자</TableHead>
              <TableHead>처리일시</TableHead>
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
                <TableCell className="font-mono text-xs">
                  {order.order_id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  {order.assigned_admin?.full_name ||
                    order.assigned_admin?.username ||
                    "-"}
                </TableCell>
                <TableCell className="font-medium">{order.user_name}</TableCell>
                <TableCell className="text-sm">
                  {new Date(order.created_at).toLocaleDateString("ko-KR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(order.total_amount)}
                </TableCell>
                <TableCell className="text-sm">
                  {order.user_phone || "-"}
                </TableCell>
                <TableCell>
                  {order.handler_admin?.full_name ||
                    order.handler_admin?.username ||
                    "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {order.handled_at
                    ? new Date(order.handled_at).toLocaleDateString("ko-KR", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  onChange={(e) => void setSearchTerm(e.target.value || null)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* 결제 상태 */}
            <div className="space-y-2">
              <Label htmlFor="payment-status" className="text-sm font-medium">
                결제 상태
              </Label>
              <Select
                value={paymentStatus}
                onValueChange={(value) =>
                  setPaymentStatus(value as PaymentStatusFilter)
                }
              >
                <SelectTrigger id="payment-status">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="paid">결제완료</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 상품명 필터 */}
            <div className="space-y-2">
              <Label htmlFor="product-filter" className="text-sm font-medium">
                상품명
              </Label>
              <Select
                value={productFilter}
                onValueChange={(value) => setProductFilter(value)}
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
                차팅 담당자
              </Label>
              <Select
                value={assignedAdminFilter}
                onValueChange={(value) => setAssignedAdminFilter(value)}
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
                onValueChange={(value) => setHandlerAdminFilter(value)}
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
                onValueChange={(value) => setSortBy(value as SortOption)}
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
                onChange={(e) => void setStartDate(e.target.value || null)}
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
                onChange={(e) => void setEndDate(e.target.value || null)}
              />
            </div>
          </div>

          {/* 활성 필터 표시 */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">검색 결과:</span>
            <span className="font-semibold text-blue-600">
              {orderList.length}건
            </span>
            {(searchTerm ||
              paymentStatus !== "all" ||
              assignedAdminFilter !== "all" ||
              handlerAdminFilter !== "all" ||
              productFilter !== "all" ||
              startDate ||
              endDate) && (
              <span className="text-gray-500">
                (필터 적용 중: 전체 {orderList.length}건)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>주문 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as Order["consultation_status"])
            }
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-8 mb-4">
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
