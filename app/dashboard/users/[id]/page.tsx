"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  User,
  Coins,
  ShoppingBag,
  Package,
  ListChecks,
} from "lucide-react";
import { PointAdjustDialog } from "@/components/point-adjust-dialog";
import { PointHistoryDialog } from "@/components/point-history-dialog";
import { IssueCouponToUserDialog } from "@/components/issue-coupon-to-user-dialog";
import { fetchUserOrderHistory, fetchUserProfileWithPoints } from "@/lib/actions/users";

interface UserDetail {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  points: number;
  total_earned: number;
  total_used: number;
}

interface OrderItemSummary {
  id: string;
  product_name: string;
  quantity: number;
}

interface OrderHistoryItem {
  id: string;
  order_id: string;
  status: string;
  consultation_status: string;
  total_amount: number;
  created_at: string;
  order_items?: OrderItemSummary[];
}

const paymentStatusLabels: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipping: "배송중",
  delivered: "배송 완료",
  cancelled: "취소",
};

const consultationStatusLabels: Record<string, string> = {
  chatting_required: "차팅 필요",
  consultation_required: "상담 필요",
  on_hold: "보류",
  consultation_completed: "배송필요(상담완료)",
  shipping_in_progress: "배송중",
  shipping_on_hold: "배송 보류",
  shipping_completed: "배송 완료",
  cancelled: "취소",
};

const statusBadgeClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipping: "bg-sky-100 text-sky-800 border-sky-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

const consultationBadgeClasses: Record<string, string> = {
  chatting_required: "bg-orange-100 text-orange-800 border-orange-200",
  consultation_required: "bg-blue-100 text-blue-800 border-blue-200",
  on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  consultation_completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  shipping_on_hold: "bg-purple-100 text-purple-800 border-purple-200",
  shipping_completed: "bg-teal-100 text-teal-800 border-teal-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPointDialogOpen, setIsPointDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [pointDialogType, setPointDialogType] = useState<"add" | "subtract">(
    "add"
  );

  useEffect(() => {
    if (!userId) return;
    loadUserDetail();
  }, [userId]);

  const loadUserDetail = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await fetchUserProfileWithPoints(userId as string);

      if (!data) {
        throw new Error("유저 정보를 찾을 수 없습니다.");
      }

      const formattedUser: UserDetail = {
        id: data.id,
        user_id: data.user_id,
        email: data.email,
        display_name: data.display_name,
        phone: data.phone,
        phone_verified: data.phone_verified,
        phone_verified_at: data.phone_verified_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        points: data.user_points?.points || 0,
        total_earned: data.user_points?.total_earned || 0,
        total_used: data.user_points?.total_used || 0,
      };

      setUser(formattedUser);
      await loadOrderHistory(data.email);
    } catch (error) {
      console.error("Error loading user detail:", error);
      toast({
        title: "오류",
        description: "유저 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      setUser(null);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrderHistory = async (email: string) => {
    try {
      const data = await fetchUserOrderHistory(email);
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading order history:", error);
      toast({
        title: "오류",
        description: "주문 내역을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      setOrders([]);
    }
  };

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );
    const lastOrderDate = orders[0]?.created_at || null;
    const consultationCounts = orders.reduce(
      (acc, order) => {
        const key = order.consultation_status || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { totalOrders, totalSpent, lastOrderDate, consultationCounts };
  }, [orders]);

  const userPointPayload = user
    ? {
        user_id: user.user_id,
        points: user.points,
        user_profiles: {
          email: user.email,
          display_name: user.display_name,
          phone: user.phone,
        },
      }
    : null;

  const couponUserPayload = user
    ? {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
      }
    : null;

  if (isLoading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            유저 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 space-y-4">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/dashboard/users")}
        >
          <ArrowLeft className="h-4 w-4" />
          유저 목록으로
        </Button>
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            유저 정보를 찾을 수 없습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              className="px-0 h-auto text-gray-500 hover:text-gray-900"
              onClick={() => router.push("/dashboard/users")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              유저 목록으로
            </Button>
            <span>•</span>
            <span>{user.user_id}</span>
          </div>
          <h1 className="text-3xl font-bold mt-2">
            {user.display_name || "이름 없음"}
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={loadUserDetail}
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">이름</p>
                <p className="text-lg font-semibold">
                  {user.display_name || "이름 없음"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="font-medium">
                  {user.phone || "-"}
                  {user.phone_verified && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      인증 완료
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">가입일</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-gray-500">
                  최종 업데이트:{" "}
                  {new Date(user.updated_at).toLocaleString("ko-KR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>포인트 & 액션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">보유 포인트</p>
              <p className="text-3xl font-bold text-blue-600">
                {user.points.toLocaleString()}P
              </p>
              <div className="mt-2 text-sm text-gray-600">
                <span className="text-green-600 font-semibold">
                  +{user.total_earned.toLocaleString()}P
                </span>{" "}
                적립 /{" "}
                <span className="text-red-600 font-semibold">
                  -{user.total_used.toLocaleString()}P
                </span>{" "}
                사용
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                className="gap-1"
                onClick={() => {
                  setPointDialogType("add");
                  setIsPointDialogOpen(true);
                }}
                disabled={!userPointPayload}
              >
                <Coins className="h-4 w-4" />
                지급
              </Button>
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => {
                  setPointDialogType("subtract");
                  setIsPointDialogOpen(true);
                }}
                disabled={!userPointPayload}
              >
                <Coins className="h-4 w-4" />
                차감
              </Button>
              <Button
                variant="ghost"
                className="col-span-2 justify-start gap-2"
                onClick={() => setIsHistoryDialogOpen(true)}
                disabled={!userPointPayload}
              >
                <ListChecks className="h-4 w-4" />
                포인트 내역 보기
              </Button>
              <Button
                variant="ghost"
                className="col-span-2 justify-start gap-2"
                onClick={() => setIsCouponDialogOpen(true)}
                disabled={!couponUserPayload}
              >
                <ShoppingBag className="h-4 w-4" />
                쿠폰 발급
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              총 주문 수
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Package className="h-10 w-10 text-blue-500" />
            <div>
              <p className="text-3xl font-bold">{orderStats.totalOrders}</p>
              <p className="text-sm text-gray-500">등록된 모든 주문</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              총 구매 금액
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Coins className="h-10 w-10 text-amber-500" />
            <div>
              <p className="text-3xl font-bold">
                {orderStats.totalSpent.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-500">모든 주문의 합계</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">
              최근 주문
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Calendar className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold">
                {orderStats.lastOrderDate
                  ? new Date(orderStats.lastOrderDate).toLocaleString("ko-KR")
                  : "주문 내역 없음"}
              </p>
              <p className="text-sm text-gray-500">
                최신 주문 일시 기준
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>주문 히스토리</CardTitle>
              <p className="text-sm text-gray-500">
                유저가 진행한 모든 주문을 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(orderStats.consultationCounts).map(
                ([status, count]) => (
                  <Badge
                    key={status}
                    variant="outline"
                    className={`gap-1 ${
                      consultationBadgeClasses[status] || ""
                    }`}
                  >
                    {consultationStatusLabels[status] || status}
                    <span className="font-semibold">{count}</span>
                  </Badge>
                )
              )}
              {orders.length === 0 && (
                <Badge variant="outline" className="text-gray-500">
                  주문 내역 없음
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              주문 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>주문일시</TableHead>
                    <TableHead>상담 상태</TableHead>
                    <TableHead>결제 상태</TableHead>
                    <TableHead className="text-right">결제금액</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.order_id}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            consultationBadgeClasses[order.consultation_status] ||
                            ""
                          }
                        >
                          {consultationStatusLabels[order.consultation_status] ||
                            order.consultation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusBadgeClasses[order.status] || "text-gray-600"
                          }
                        >
                          {paymentStatusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.total_amount.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items
                            .map(
                              (item) => `${item.product_name} x${item.quantity}`
                            )
                            .join(", ")
                        ) : (
                          <span className="text-gray-400">상품 정보 없음</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/orders/${order.id}`)
                          }
                        >
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PointAdjustDialog
        open={isPointDialogOpen}
        onOpenChange={setIsPointDialogOpen}
        userPoint={userPointPayload}
        type={pointDialogType}
        onSuccess={loadUserDetail}
      />

      <PointHistoryDialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        userPoint={userPointPayload}
      />

      <IssueCouponToUserDialog
        open={isCouponDialogOpen}
        onOpenChange={setIsCouponDialogOpen}
        user={couponUserPayload}
      />
    </div>
  );
}
