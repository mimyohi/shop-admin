"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserCog, Copy, Truck, User, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ordersQueries } from "@/queries/orders.queries";
import { adminUsersQueries } from "@/queries/admin-users.queries";
import { calculateProductAmount } from "@/lib/utils/price-calculation";
import {
  setAdminMemo,
  setAssignedAdmin,
  setConsultationStatus,
  setHandlerAdmin,
  setShippingInfo,
} from "@/lib/actions/orders";

interface HealthConsultation {
  id: string;
  user_id?: string | null;
  order_id: string;
  name?: string | null;
  resident_number?: string | null;
  phone?: string | null;
  current_height?: number | null;
  current_weight?: number | null;
  min_weight_since_20s?: number | null;
  max_weight_since_20s?: number | null;
  target_weight?: number | null;
  target_weight_loss_period?: string | null;
  previous_western_medicine?: string | null;
  previous_herbal_medicine?: string | null;
  previous_other_medicine?: string | null;
  occupation?: string | null;
  work_hours?: string | null;
  has_shift_work?: boolean | null;
  wake_up_time?: string | null;
  bedtime?: string | null;
  has_daytime_sleepiness?: boolean | null;
  meal_pattern?: string | null;
  alcohol_frequency?: string | null;
  water_intake?: string | null;
  diet_approach?: string | null;
  preferred_stage?: string | null;
  medical_history: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminUser {
  id: string;
  username: string;
  full_name: string | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  total_amount: number;
  status: string;
  consultation_status: string;
  created_at: string;
  order_health_consultation: HealthConsultation;
  assigned_admin?: AdminUser;
  handler_admin?: AdminUser;
  handled_at?: string;
  order_items?: OrderItem[];
  shipping_name?: string;
  shipping_phone?: string;
  shipping_postal_code?: string;
  shipping_address?: string;
  shipping_address_detail?: string;
  shipping_company?: string;
  tracking_number?: string;
  shipped_at?: string;
  payment_key?: string;
  admin_memo?: string;
  shipping_fee?: number | null;
  coupon_discount?: number | null;
  used_points?: number | null;
}

type ConsultationStatus = Order["consultation_status"];

type StatusNavConfig = {
  prev?: ConsultationStatus;
  prevLabel?: string;
  next?: ConsultationStatus;
  nextLabel?: string;
  extraActions?: Array<{
    target: ConsultationStatus;
    label: string;
    variant?: "default" | "outline";
  }>;
};

const CONSULTATION_STATUS_FLOW: Partial<
  Record<ConsultationStatus, StatusNavConfig>
> = {
  chatting_required: {
    next: "consultation_required",
    nextLabel: "상담 필요로 이동",
  },
  consultation_required: {
    prev: "chatting_required",
    prevLabel: "접수 필요로 이동",
    next: "consultation_completed",
    nextLabel: "배송필요(상담완료)로 이동",
    extraActions: [
      {
        target: "on_hold",
        label: "보류로 이동",
        variant: "outline",
      },
    ],
  },
  on_hold: {
    extraActions: [
      {
        target: "consultation_required",
        label: "상담 재개",
      },
    ],
  },
  consultation_completed: {
    prev: "consultation_required",
    prevLabel: "상담 필요로 이동",
    next: "shipping_in_progress",
    nextLabel: "배송중으로 이동",
    extraActions: [
      {
        target: "shipping_on_hold",
        label: "배송보류로 이동",
        variant: "outline",
      },
    ],
  },
  shipping_in_progress: {
    prev: "consultation_completed",
    prevLabel: "배송필요(상담완료)로 이동",
    next: "shipping_completed",
    nextLabel: "배송완료 처리",
  },
  shipping_on_hold: {
    prev: "consultation_completed",
    prevLabel: "배송필요(상담완료)로 이동",
    next: "shipping_in_progress",
    nextLabel: "배송중으로 이동",
  },
  shipping_completed: {
    prev: "shipping_in_progress",
    prevLabel: "배송중으로 이동",
  },
};

const SHIPPING_PHASE_STATUSES: ConsultationStatus[] = [
  "consultation_completed",
  "shipping_in_progress",
  "shipping_on_hold",
  "shipping_completed",
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.id as string;
  const [selectedAssignedAdmin, setSelectedAssignedAdmin] =
    useState<string>("none");
  const [selectedHandlerAdmin, setSelectedHandlerAdmin] =
    useState<string>("none");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderMemo, setOrderMemo] = useState("");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    refetch: refetchOrder,
  } = useQuery(ordersQueries.detail(orderId));
  const { data: admins = [] } = useQuery(
    adminUsersQueries.list({ is_active: true })
  );

  useEffect(() => {
    if (order) {
      setSelectedAssignedAdmin(order.assigned_admin?.id || "none");
      setSelectedHandlerAdmin(order.handler_admin?.id || "none");
      setShippingCompany(order.shipping_company || "");
      setTrackingNumber(order.tracking_number || "");
      setOrderMemo(order.admin_memo ?? "");
    }
  }, [order]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "주문 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const handleCancelModalToggle = (open: boolean) => {
    if (isCancelling) return;
    setIsCancelModalOpen(open);
    if (!open) {
      setCancelReason("");
    }
  };

  // 클립보드 복사 헬퍼 함수
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "복사 완료",
        description: `${label}이(가) 복사되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드에 복사하는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const copyHealthField = (label: string, value?: string | number | null) => {
    if (value === null || value === undefined || value === "") return;
    copyToClipboard(String(value), label);
  };

  // 문진 결과 포맷팅 함수
  const formatHealthInfo = (hc: HealthConsultation): string => {
    let result = "📋 문진 결과\n\n";

    // 기본 정보
    if (hc.name) result += `[이름]: ${hc.name}\n`;
    if (hc.resident_number) result += `[주민등록번호]: ${hc.resident_number}\n`;
    if (hc.phone) result += `[연락처]: ${hc.phone}\n`;
    if (hc.name || hc.resident_number || hc.phone) result += "\n";

    // 신체 정보
    if (hc.current_height) result += `[현재 키]: ${hc.current_height}cm\n`;
    if (hc.current_weight) result += `[현재 체중]: ${hc.current_weight}kg\n`;
    if (hc.min_weight_since_20s)
      result += `[20대 이후 최소 체중]: ${hc.min_weight_since_20s}kg\n`;
    if (hc.max_weight_since_20s)
      result += `[20대 이후 최대 체중]: ${hc.max_weight_since_20s}kg\n`;
    if (hc.target_weight) result += `[목표 체중]: ${hc.target_weight}kg\n`;
    if (hc.target_weight_loss_period)
      result += `[목표 감량 기간]: ${hc.target_weight_loss_period}\n`;
    if (hc.current_height || hc.current_weight) result += "\n";

    // 이전 치료 이력
    if (hc.previous_western_medicine)
      result += `[이전 양방 치료]: ${hc.previous_western_medicine}\n`;
    if (hc.previous_herbal_medicine)
      result += `[이전 한방 치료]: ${hc.previous_herbal_medicine}\n`;
    if (hc.previous_other_medicine)
      result += `[기타 치료]: ${hc.previous_other_medicine}\n`;
    if (
      hc.previous_western_medicine ||
      hc.previous_herbal_medicine ||
      hc.previous_other_medicine
    )
      result += "\n";

    // 생활 패턴
    if (hc.occupation) result += `[직업]: ${hc.occupation}\n`;
    if (hc.work_hours) result += `[근무 시간]: ${hc.work_hours}\n`;
    if (hc.has_shift_work !== null && hc.has_shift_work !== undefined)
      result += `[교대 근무]: ${hc.has_shift_work ? "예" : "아니오"}\n`;
    if (hc.wake_up_time) result += `[기상 시간]: ${hc.wake_up_time}\n`;
    if (hc.bedtime) result += `[취침 시간]: ${hc.bedtime}\n`;
    if (
      hc.has_daytime_sleepiness !== null &&
      hc.has_daytime_sleepiness !== undefined
    )
      result += `[주간 졸림]: ${hc.has_daytime_sleepiness ? "있음" : "없음"}\n`;
    if (hc.occupation || hc.work_hours) result += "\n";

    // 식습관
    if (hc.meal_pattern) {
      const mealPatternMap: Record<string, string> = {
        "1meals": "1끼",
        "2meals": "2끼",
        "3meals": "3끼",
        irregular: "불규칙",
      };
      result += `[하루 식사]: ${
        mealPatternMap[hc.meal_pattern] || hc.meal_pattern
      }\n`;
    }
    if (hc.alcohol_frequency) {
      const alcoholMap: Record<string, string> = {
        weekly_1_or_less: "주 1회 이하",
        weekly_2_or_more: "주 2회 이상",
      };
      result += `[음주 빈도]: ${
        alcoholMap[hc.alcohol_frequency] || hc.alcohol_frequency
      }\n`;
    }
    if (hc.water_intake) {
      const waterMap: Record<string, string> = {
        "1L_or_less": "1L 이하",
        over_1L: "1L 이상",
      };
      result += `[하루 수분 섭취]: ${
        waterMap[hc.water_intake] || hc.water_intake
      }\n`;
    }
    if (hc.meal_pattern || hc.alcohol_frequency || hc.water_intake)
      result += "\n";

    // 다이어트 접근법
    if (hc.diet_approach) {
      const approachMap: Record<string, string> = {
        sustainable: "지속 가능한 방식",
        fast: "빠른 방식",
      };
      result += `[다이어트 접근법]: ${
        approachMap[hc.diet_approach] || hc.diet_approach
      }\n`;
    }
    if (hc.preferred_stage) {
      result += `[선호 단계]: ${hc.preferred_stage}\n`;
    }
    if (hc.diet_approach || hc.preferred_stage) result += "\n";

    // 의료 정보
    if (hc.medical_history) result += `[병력]: ${hc.medical_history}\n\n`;

    return result.trim();
  };

  // 문진 결과 복사
  const copyHealthInfo = () => {
    const healthConsultation = order?.order_health_consultation;
    if (!healthConsultation) {
      toast({
        title: "복사 실패",
        description: "문진 정보가 없습니다.",
        variant: "destructive",
      });
      return;
    }
    const formatted = formatHealthInfo(healthConsultation);
    copyToClipboard(formatted, "문진 결과");
  };

  const updateAssignedAdmin = async (adminId: string) => {
    try {
      const result = await setAssignedAdmin(
        orderId as string,
        adminId === "none" ? null : adminId
      );

      if (!result.success) {
        throw new Error(result.error || "담당자 설정 실패");
      }

      toast({
        title: "성공",
        description: "담당자가 설정되었습니다.",
      });

      refetchOrder(); // 주문 정보 다시 로드
    } catch (error) {
      console.error("Error updating assigned admin:", error);
      toast({
        title: "오류",
        description: "담당자 설정에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const updateHandlerAdmin = async (adminId: string) => {
    try {
      const result = await setHandlerAdmin(
        orderId as string,
        adminId === "none" ? null : adminId
      );

      if (!result.success) {
        throw new Error(result.error || "상담 담당자 설정 실패");
      }

      toast({
        title: "성공",
        description: "상담 담당자가 설정되었습니다.",
      });

      refetchOrder(); // 주문 정보 다시 로드
    } catch (error) {
      console.error("Error updating handler admin:", error);
      toast({
        title: "오류",
        description: "상담 담당자 설정에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const updateConsultationStatus = async (
    newStatus: Order["consultation_status"]
  ) => {
    try {
      setIsStatusUpdating(true);
      const result = await setConsultationStatus(orderId as string, newStatus);
      if (!result.success) {
        throw new Error(result.error || "상담 상태 변경 실패");
      }

      toast({
        title: "성공",
        description: `상담 상태가 "${getStatusLabel(
          newStatus
        )}"(으)로 변경되었습니다.`,
      });

      await refetchOrder();
    } catch (error) {
      console.error("Error updating consultation status:", error);
      toast({
        title: "오류",
        description: "상담 상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const updateShippingInfo = async () => {
    if (!shippingCompany || !trackingNumber) {
      toast({
        title: "입력 오류",
        description: "택배사와 송장번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await setShippingInfo(orderId as string, {
        shipping_company: shippingCompany,
        tracking_number: trackingNumber,
      });

      if (!result.success) {
        throw new Error(result.error || "배송 정보 업데이트 실패");
      }

      toast({
        title: "성공",
        description: "배송 정보가 업데이트되었습니다.",
      });

      // 배송 알림 이메일 발송
      try {
        const emailResponse = await fetch(
          "/api/orders/send-shipping-notification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          }
        );

        if (emailResponse.ok) {
          toast({
            title: "이메일 발송 완료",
            description: "고객에게 배송 알림이 전송되었습니다.",
          });
        } else {
          console.error("Email notification failed");
          toast({
            title: "알림",
            description:
              "배송 정보는 업데이트되었으나, 이메일 발송에 실패했습니다.",
            variant: "destructive",
          });
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }

      refetchOrder();
    } catch (error) {
      console.error("Error updating shipping info:", error);
      toast({
        title: "오류",
        description: "배송 정보 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSaveMemo = async () => {
    const memoValue = orderMemo.trim() ? orderMemo : null;

    try {
      setIsSavingMemo(true);
      const result = await setAdminMemo(orderId as string, memoValue);

      if (!result.success) {
        throw new Error(result.error || "메모 저장 실패");
      }

      toast({
        title: "성공",
        description: memoValue
          ? "메모가 저장되었습니다."
          : "메모가 삭제되었습니다.",
      });

      refetchOrder();
    } catch (error) {
      console.error("Error updating order memo:", error);
      toast({
        title: "오류",
        description: "메모 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSavingMemo(false);
    }
  };

  const cancelOrder = async () => {
    if (!order?.payment_key) {
      toast({
        title: "취소 불가",
        description: "결제 정보가 없어 취소할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!cancelReason.trim()) {
      toast({
        title: "취소 사유 필요",
        description: "취소 사유를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);

    try {
      const response = await fetch("/api/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: order.order_id,
          reason: cancelReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "결제 취소 실패");
      }

      toast({
        title: "성공",
        description: "주문이 취소되었습니다.",
      });

      setIsCancelModalOpen(false);
      setCancelReason("");
      refetchOrder();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast({
        title: "오류",
        description: error.message || "주문 취소에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      payment_pending: "결제 대기",
      expired: "만료",
      chatting_required: "접수 필요",
      consultation_required: "상담 필요",
      on_hold: "보류",
      consultation_completed: "배송필요(상담완료)",
      shipping_on_hold: "배송보류",
      shipping_completed: "배송처리 완료",
      cancelled: "취소건",
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">로딩중...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <div className="text-center py-12">주문을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const healthConsultation = order.order_health_consultation;
  // order_items에서 상품 금액을 동적으로 계산
  const formattedProductAmount = order.order_items
    ? calculateProductAmount(order.order_items)
    : 0;
  const formattedShippingFee = order.shipping_fee ?? 0;
  const formattedCouponDiscount = order.coupon_discount ?? 0;
  const formattedUsedPoints = order.used_points ?? 0;
  const memoChanged = orderMemo !== (order.admin_memo ?? "");
  const currentStatusConfig =
    CONSULTATION_STATUS_FLOW[order.consultation_status as ConsultationStatus] ||
    {};
  const previousStatus = currentStatusConfig.prev ?? null;
  const nextStatus = currentStatusConfig.next ?? null;
  const copyableRowClass =
    "cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors";
  const formatWon = (value?: number | null) => {
    if (value === null || value === undefined) return "-";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "-";
    return `${numericValue.toLocaleString("ko-KR")}원`;
  };
  const totalExplanation = `상품 금액 (${formatWon(
    formattedProductAmount
  )}) + 배송비 (${formatWon(formattedShippingFee)}) - 쿠폰 할인 (${formatWon(
    formattedCouponDiscount
  )}) - 포인트 사용 (${formatWon(formattedUsedPoints)})`;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/orders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
          <div>
            <h1 className="text-3xl font-bold">주문 상세</h1>
            <p
              className="text-gray-500 mt-1 cursor-pointer hover:text-gray-700 hover:underline transition-colors"
              onClick={() => copyToClipboard(order.order_id, "주문번호")}
              title="클릭하여 복사"
            >
              주문번호: {order.order_id}
            </p>
          </div>
        </div>
        {order.status !== "cancelled" && (
          <Button
            variant="destructive"
            onClick={() => handleCancelModalToggle(true)}
            disabled={isCancelling}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {isCancelling ? "취소 처리 중..." : "주문 취소"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 좌측: 유저정보 및 주문 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>유저 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">주문자</span>
                <span
                  className="font-medium cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                  onClick={() => copyToClipboard(order.user_name, "주문자명")}
                  title="클릭하여 복사"
                >
                  {order.user_name}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">연락처</span>
                <span
                  className="font-medium cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                  onClick={() => copyToClipboard(order.user_phone, "연락처")}
                  title="클릭하여 복사"
                >
                  {order.user_phone}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">이메일</span>
                <span
                  className="font-medium text-xs break-all cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                  onClick={() => copyToClipboard(order.user_email, "이메일")}
                  title="클릭하여 복사"
                >
                  {order.user_email}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">주문 상태</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">상담 상태</span>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {getStatusLabel(order.consultation_status)}
                  </span>
                  {(previousStatus ||
                    nextStatus ||
                    currentStatusConfig.extraActions) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previousStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isStatusUpdating}
                          onClick={() =>
                            updateConsultationStatus(previousStatus)
                          }
                        >
                          {currentStatusConfig.prevLabel ||
                            `이전 단계 (${getStatusLabel(previousStatus)})`}
                        </Button>
                      )}
                      {nextStatus && (
                        <Button
                          size="sm"
                          disabled={isStatusUpdating}
                          onClick={() => updateConsultationStatus(nextStatus)}
                        >
                          {currentStatusConfig.nextLabel ||
                            `다음 단계 (${getStatusLabel(nextStatus)})`}
                        </Button>
                      )}
                      {currentStatusConfig.extraActions?.map((action) => (
                        <Button
                          key={action.label}
                          variant={action.variant || "default"}
                          size="sm"
                          disabled={isStatusUpdating}
                          onClick={() =>
                            updateConsultationStatus(action.target)
                          }
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">결제 상태</span>
                  <span className="font-medium">{order.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">주문일시</span>
                  <span className="font-medium text-xs">
                    {new Date(order.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                담당자 설정
              </h3>
              <div className="space-y-4">
                {/* 담당자 설정 */}
                <div className="space-y-2">
                  <Label
                    htmlFor="assigned-admin"
                    className="text-xs text-gray-500"
                  >
                    접수 담당자
                  </Label>
                  <Select
                    value={selectedAssignedAdmin}
                    onValueChange={(value) => {
                      setSelectedAssignedAdmin(value);
                      updateAssignedAdmin(value);
                    }}
                  >
                    <SelectTrigger id="assigned-admin" className="text-sm">
                      <SelectValue placeholder="담당자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name || admin.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 상담 담당자 설정 */}
                <div className="space-y-2">
                  <Label
                    htmlFor="handler-admin"
                    className="text-xs text-gray-500"
                  >
                    상담 담당자
                  </Label>
                  <Select
                    value={selectedHandlerAdmin}
                    onValueChange={(value) => {
                      setSelectedHandlerAdmin(value);
                      updateHandlerAdmin(value);
                    }}
                  >
                    <SelectTrigger id="handler-admin" className="text-sm">
                      <SelectValue placeholder="처리자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name || admin.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {order.handled_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      처리일시:{" "}
                      {new Date(order.handled_at).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 가운데: 문진 결과 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>문진 결과</CardTitle>
            {healthConsultation && (
              <div className="flex items-center gap-2">
                {healthConsultation.user_id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      router.push(
                        `/dashboard/users/${healthConsultation.user_id}`
                      )
                    }
                    className="h-8"
                  >
                    <User className="h-4 w-4 mr-2" />
                    유저 상세
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHealthInfo}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  전체 복사
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* User ID 정보 */}
              {healthConsultation.user_id && (
                <div
                  className={`bg-blue-50 p-3 rounded-lg border border-blue-200 ${copyableRowClass}`}
                  onClick={() =>
                    copyHealthField("User ID", healthConsultation.user_id)
                  }
                  title="클릭하여 복사"
                >
                  <div className="text-sm">
                    <span className="text-gray-600">User ID:</span>
                    <span className="ml-2 font-mono text-xs text-blue-700">
                      {healthConsultation.user_id}
                    </span>
                  </div>
                </div>
              )}

              {/* 1. 기본 정보 (개인정보) */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  기본 정보 (개인정보)
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField("이름", healthConsultation.name)
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">이름:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.name}
                      </span>
                    </div>

                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "주민등록번호",
                          healthConsultation.resident_number
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">주민등록번호:</span>
                      <span className="ml-2 font-medium font-mono">
                        {healthConsultation.resident_number}
                      </span>
                    </div>

                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField("연락처", healthConsultation.phone)
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">연락처:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 기본 신체 정보 */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  2) 기본 신체 정보
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "키/체중",
                          `${
                            healthConsultation.current_height
                              ? `${Number(
                                  healthConsultation.current_height
                                ).toFixed(1)}cm`
                              : "-"
                          } / ${
                            healthConsultation.current_weight
                              ? `${Number(
                                  healthConsultation.current_weight
                                ).toFixed(1)}kg`
                              : "-"
                          }`
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">키/체중:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.current_height
                          ? `${Number(
                              healthConsultation.current_height
                            ).toFixed(1)}cm`
                          : "-"}{" "}
                        /{" "}
                        {healthConsultation.current_weight
                          ? `${Number(
                              healthConsultation.current_weight
                            ).toFixed(1)}kg`
                          : "-"}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "20대 이후 체중 범위",
                          `${
                            healthConsultation.min_weight_since_20s
                              ? `${Number(
                                  healthConsultation.min_weight_since_20s
                                ).toFixed(1)}kg`
                              : "-"
                          } ~ ${
                            healthConsultation.max_weight_since_20s
                              ? `${Number(
                                  healthConsultation.max_weight_since_20s
                                ).toFixed(1)}kg`
                              : "-"
                          }`
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">
                        20대 이후 체중 범위:
                      </span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.min_weight_since_20s
                          ? `${Number(
                              healthConsultation.min_weight_since_20s
                            ).toFixed(1)}kg`
                          : "-"}{" "}
                        ~{" "}
                        {healthConsultation.max_weight_since_20s
                          ? `${Number(
                              healthConsultation.max_weight_since_20s
                            ).toFixed(1)}kg`
                          : "-"}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "목표 체중",
                          `${Number(healthConsultation.target_weight).toFixed(
                            1
                          )}kg`
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">목표 체중:</span>
                      <span className="ml-2 font-medium">
                        {Number(healthConsultation.target_weight).toFixed(1)}
                        kg
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "목표 감량 기간",
                          healthConsultation.target_weight_loss_period
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">목표 감량 기간:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.target_weight_loss_period}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 다이어트 경험 (moved from 이전 치료 이력) */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  3) 다이어트 경험
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "양약",
                          healthConsultation.previous_western_medicine
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">양약:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.previous_western_medicine}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "한약",
                          healthConsultation.previous_herbal_medicine
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">한약:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.previous_herbal_medicine}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "기타",
                          healthConsultation.previous_other_medicine
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">기타:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.previous_other_medicine}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 생활 패턴 (merged with 식습관) */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  4) 생활 패턴
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField("직업", healthConsultation.occupation)
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">직업:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.occupation}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "근무 시간",
                          healthConsultation.work_hours
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">근무 시간:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.work_hours}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "교대 근무",
                          healthConsultation.has_shift_work ? "예" : "아니오"
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">교대 근무:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.has_shift_work ? "예" : "아니오"}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "수면 시간",
                          `${healthConsultation.wake_up_time || "-"} ~ ${
                            healthConsultation.bedtime || "-"
                          }`
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">수면 시간:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.wake_up_time || "-"} ~{" "}
                        {healthConsultation.bedtime || "-"}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "주간 졸림",
                          healthConsultation.has_daytime_sleepiness
                            ? "있음"
                            : "없음"
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">주간 졸림:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.has_daytime_sleepiness
                          ? "있음"
                          : "없음"}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() => {
                        const value =
                          (
                            {
                              "1meals": "1끼",
                              "2meals": "2끼",
                              "3meals": "3끼",
                              irregular: "불규칙",
                            } as Record<string, string>
                          )[healthConsultation.meal_pattern ?? ""] ||
                          healthConsultation.meal_pattern;
                        copyHealthField("하루 식사", value);
                      }}
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">하루 식사:</span>
                      <span className="ml-2 font-medium">
                        {{
                          "1meals": "1끼",
                          "2meals": "2끼",
                          "3meals": "3끼",
                          irregular: "불규칙",
                        }[healthConsultation.meal_pattern] ||
                          healthConsultation.meal_pattern}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() => {
                        const value =
                          (
                            {
                              weekly_1_or_less: "주 1회 이하",
                              weekly_2_or_more: "주 2회 이상",
                            } as Record<string, string>
                          )[healthConsultation.alcohol_frequency ?? ""] ||
                          healthConsultation.alcohol_frequency;
                        copyHealthField("음주 빈도", value);
                      }}
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">음주 빈도:</span>
                      <span className="ml-2 font-medium">
                        {{
                          weekly_1_or_less: "주 1회 이하",
                          weekly_2_or_more: "주 2회 이상",
                        }[healthConsultation.alcohol_frequency] ||
                          healthConsultation.alcohol_frequency}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() => {
                        const value =
                          (
                            {
                              "1L_or_less": "1L 이하",
                              over_1L: "1L 이상",
                            } as Record<string, string>
                          )[healthConsultation.water_intake ?? ""] ||
                          healthConsultation.water_intake;
                        copyHealthField("하루 수분 섭취", value);
                      }}
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">하루 수분 섭취:</span>
                      <span className="ml-2 font-medium">
                        {{
                          "1L_or_less": "1L 이하",
                          over_1L: "1L 이상",
                        }[healthConsultation.water_intake] ||
                          healthConsultation.water_intake}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. 원하는 다이어트 방향 */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  5) 원하는 다이어트 방향
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div
                      className={copyableRowClass}
                      onClick={() => {
                        const value =
                          (
                            {
                              sustainable: "지속 가능한 방식",
                              fast: "빠른 방식",
                            } as Record<string, string>
                          )[healthConsultation.diet_approach ?? ""] ||
                          healthConsultation.diet_approach;
                        copyHealthField("접근법", value);
                      }}
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">접근법:</span>
                      <span className="ml-2 font-medium">
                        {{
                          sustainable: "지속 가능한 방식",
                          fast: "빠른 방식",
                        }[healthConsultation.diet_approach] ||
                          healthConsultation.diet_approach}
                      </span>
                    </div>
                    <div
                      className={copyableRowClass}
                      onClick={() =>
                        copyHealthField(
                          "선호 단계",
                          healthConsultation.preferred_stage
                        )
                      }
                      title="클릭하여 복사"
                    >
                      <span className="text-gray-500">선호 단계:</span>
                      <span className="ml-2 font-medium">
                        {healthConsultation.preferred_stage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. 과거 병력 및 복용 약 */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  6) 과거 병력 및 복용 약
                </h4>
                <div
                  className={`bg-gray-50 p-3 rounded-lg ${copyableRowClass}`}
                  onClick={() =>
                    copyHealthField("병력", healthConsultation.medical_history)
                  }
                  title="클릭하여 복사"
                >
                  <p className="text-sm">
                    {healthConsultation.medical_history}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 우측: 주문 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>주문 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-2">주문번호</span>
                <span className="font-mono text-xs bg-gray-100 px-3 py-2 rounded block">
                  {order.order_id}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-2">주문 금액 내역</span>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">상품 금액</span>
                    <span className="font-medium">
                      {formatWon(formattedProductAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">배송비</span>
                    {order.shipping_fee !== undefined &&
                    order.shipping_fee !== null ? (
                      <span className="font-medium text-blue-600">
                        +{formatWon(order.shipping_fee)}
                      </span>
                    ) : (
                      <span className="font-medium text-gray-400">
                        배송비 정보 없음
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">쿠폰 할인</span>
                    <span
                      className={`font-medium ${
                        formattedCouponDiscount > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {formattedCouponDiscount > 0
                        ? `-${formatWon(formattedCouponDiscount)}`
                        : "0원"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">포인트 사용</span>
                    <span
                      className={`font-medium ${
                        formattedUsedPoints > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {formattedUsedPoints > 0
                        ? `-${formatWon(formattedUsedPoints)}`
                        : "0원"}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold">최종 결제 금액</span>
                    <span className="font-bold text-2xl text-blue-600">
                      {formatWon(order.total_amount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    최종 결제 금액 =
                    <span className="ml-1">{totalExplanation}</span>
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-gray-500 block mb-3">주문 상품</span>
                {order.order_items && order.order_items.length > 0 ? (
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium mb-2">
                            {item.product_name}
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>단가</span>
                            <span className="font-medium">
                              {formatWon(item.product_price)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mb-2">
                            <span>수량</span>
                            <span className="font-medium">
                              {item.quantity}개
                            </span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm font-semibold">
                            <span>소계</span>
                            <span className="text-blue-600">
                              {formatWon(item.product_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-sm text-gray-500">
                    주문 상품 정보가 없습니다.
                  </div>
                )}
              </div>

              {/* 배송지 정보 */}
              {(order.shipping_name || order.shipping_address) && (
                <>
                  <Separator />
                  <div>
                    <span className="text-gray-500 block mb-3">
                      배송지 정보
                    </span>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                      <div>
                        <span className="text-gray-600">받는 분:</span>
                        <span className="ml-2 font-medium">
                          {order.shipping_name}
                        </span>
                      </div>
                      {order.shipping_phone && (
                        <div>
                          <span className="text-gray-600">연락처:</span>
                          <span className="ml-2 font-medium">
                            {order.shipping_phone}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">주소:</span>
                        <div className="mt-1 font-medium text-gray-700">
                          {order.shipping_postal_code &&
                            `[${order.shipping_postal_code}] `}
                          {order.shipping_address}
                          {order.shipping_address_detail &&
                            `, ${order.shipping_address_detail}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {SHIPPING_PHASE_STATUSES.includes(
                order.consultation_status as ConsultationStatus
              ) && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500 font-medium">
                        배송 정보
                      </span>
                    </div>

                    {order.shipped_at ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm space-y-2">
                          <div className="font-semibold text-green-700">
                            배송 처리 완료
                          </div>
                          <div>
                            <span className="text-gray-600">택배사:</span>
                            <span className="ml-2 font-medium">
                              {order.shipping_company}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">송장번호:</span>
                            <span className="ml-2 font-medium font-mono">
                              {order.tracking_number}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">발송일시:</span>
                            <span className="ml-2 text-xs">
                              {new Date(order.shipped_at).toLocaleString(
                                "ko-KR"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="shipping-company" className="text-sm">
                            택배사
                          </Label>
                          <Input
                            id="shipping-company"
                            value={shippingCompany}
                            onChange={(e) => setShippingCompany(e.target.value)}
                            placeholder="예: CJ대한통운"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tracking-number" className="text-sm">
                            송장번호
                          </Label>
                          <Input
                            id="tracking-number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="송장번호 입력"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={updateShippingInfo}
                          disabled={!shippingCompany || !trackingNumber}
                          className="w-full"
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          배송 정보 등록
                        </Button>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <span>관리자 메모</span>
                  </div>
                  {!memoChanged && order.admin_memo && (
                    <span className="text-xs text-gray-400">최신 메모</span>
                  )}
                </div>
                <Textarea
                  value={orderMemo}
                  onChange={(e) => setOrderMemo(e.target.value)}
                  placeholder="주문 처리 중 남겨둘 메모를 입력하세요."
                  className="min-h-[120px]"
                />
                <Button
                  onClick={handleSaveMemo}
                  disabled={isSavingMemo || !memoChanged}
                  className="w-full mt-3"
                  variant="secondary"
                >
                  {isSavingMemo
                    ? "저장 중..."
                    : memoChanged
                    ? "메모 저장"
                    : "최신 상태"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isCancelModalOpen} onOpenChange={handleCancelModalToggle}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>주문 취소</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                결제가 즉시 취소되며 재고/혜택이 모두 회수됩니다. 고객에게
                안내한 후 진행해주세요.
              </p>
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">취소 사유</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="취소 사유를 입력하세요"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={isCancelling}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleCancelModalToggle(false)}
                disabled={isCancelling}
              >
                닫기
              </Button>
              <Button
                variant="destructive"
                onClick={cancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? "취소 처리 중..." : "결제 취소"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
