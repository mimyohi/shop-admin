"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

interface HealthConsultation {
  id: string;
  user_id?: string | null;

  // 1) 개인정보
  referral_source?: string;
  name?: string;
  resident_number?: string;
  phone?: string;

  // 2) 기본 신체 정보
  current_height?: number;
  current_weight?: number;
  min_weight_since_20s?: number;
  max_weight_since_20s?: number;
  target_weight?: number;
  target_weight_loss_period?: string;

  // 3) 다이어트 경험
  previous_western_medicine?: string;
  previous_herbal_medicine?: string;
  previous_other_medicine?: string;

  // 4) 생활 패턴
  occupation?: string;
  work_hours?: string;
  has_shift_work?: boolean;
  wake_up_time?: string;
  bedtime?: string;
  has_daytime_sleepiness?: boolean;
  meal_pattern?: "1meals" | "2meals" | "3meals" | "irregular";
  alcohol_frequency?: "weekly_1_or_less" | "weekly_2_or_more";
  water_intake?: "1L_or_less" | "over_1L";

  // 5) 원하는 다이어트 방향
  diet_approach?: "sustainable" | "fast";
  preferred_stage?: "stage1" | "stage2" | "stage3";

  // 6) 과거 병력 및 복용 약
  medical_history?: string;

  // 관리자 전용
  consultation_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
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
  order_health_consultations?: HealthConsultation[];
}

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailDialogProps) {
  const router = useRouter();
  if (!order) return null;

  const healthConsultation = order.order_health_consultations?.[0];

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      payment_pending: "결제 대기",
      expired: "만료",
      chatting_required: "차팅 필요",
      consultation_required: "상담 필요",
      on_hold: "보류",
      consultation_completed: "배송필요(상담완료)",
      shipping_in_progress: "배송중",
      shipping_on_hold: "배송보류",
      shipping_completed: "배송처리 완료",
      cancelled: "취소건",
    };
    return statusMap[status] || status;
  };

  // 한글 레이블 변환 함수들
  const getMealPatternLabel = (pattern?: string) => {
    const labels: Record<string, string> = {
      "1meals": "하루 1식",
      "2meals": "하루 2식",
      "3meals": "하루 3식",
      irregular: "불규칙",
    };
    return pattern ? labels[pattern] || pattern : "-";
  };

  const getAlcoholFrequencyLabel = (frequency?: string) => {
    const labels: Record<string, string> = {
      weekly_1_or_less: "주 1회 이하",
      weekly_2_or_more: "주 2회 이상",
    };
    return frequency ? labels[frequency] || frequency : "-";
  };

  const getWaterIntakeLabel = (intake?: string) => {
    const labels: Record<string, string> = {
      "1L_or_less": "1L 이하",
      over_1L: "1L 초과",
    };
    return intake ? labels[intake] || intake : "-";
  };

  const getDietApproachLabel = (approach?: string) => {
    const labels: Record<string, string> = {
      sustainable: "몸에 부담 없이, 무리 없는 지속 감량",
      fast: "두근거림·항진감이 확실한 빠른 감량",
    };
    return approach ? labels[approach] || approach : "-";
  };

  const getPreferredStageLabel = (stage?: string) => {
    const labels: Record<string, string> = {
      stage1: "1단계: 처음 복용 / 카페인 민감",
      stage2: "2단계: 복용 6개월 이하 / 카페인 민감",
      stage3: "3단계: 복용 6개월 이상 / 기존 처방 효과 미미",
    };
    return stage ? labels[stage] || stage : "-";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">주문 상세 정보</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* 좌측: 유저정보 및 주문 상태 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 pb-2 border-b">
                유저 정보
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 block">주문자</span>
                  <span className="font-medium">{order.user_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">연락처</span>
                  <span className="font-medium">{order.user_phone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">이메일</span>
                  <span className="font-medium text-xs">
                    {order.user_email}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3 pb-2 border-b">
                주문 상태
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 block">상담 상태</span>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {getStatusLabel(order.consultation_status)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">결제 상태</span>
                  <span className="font-medium">{order.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">주문일시</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 가운데: 문진 결과 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-lg font-semibold">문진 결과</h3>
              {healthConsultation?.user_id && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/dashboard/users/${healthConsultation.user_id}`)
                  }
                  className="h-8"
                >
                  <User className="h-4 w-4 mr-2" />
                  유저 상세
                </Button>
              )}
            </div>
            {healthConsultation ? (
              <div className="space-y-4">
                {/* User ID 정보 */}
                {healthConsultation.user_id && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm">
                      <span className="text-gray-600">User ID:</span>
                      <span className="ml-2 font-mono text-xs text-blue-700">
                        {healthConsultation.user_id}
                      </span>
                    </div>
                  </div>
                )}

                {/* 1) 개인정보 */}
                {(healthConsultation.referral_source ||
                  healthConsultation.name ||
                  healthConsultation.resident_number ||
                  healthConsultation.phone) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">
                      1) 개인정보
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="text-sm space-y-1">
                        {healthConsultation.referral_source && (
                          <div>
                            <span className="text-gray-500">
                              알게 되신 경로:
                            </span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.referral_source}
                            </span>
                          </div>
                        )}
                        {healthConsultation.name && (
                          <div>
                            <span className="text-gray-500">이름:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.name}
                            </span>
                          </div>
                        )}
                        {healthConsultation.resident_number && (
                          <div>
                            <span className="text-gray-500">
                              주민등록번호:
                            </span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.resident_number}
                            </span>
                          </div>
                        )}
                        {healthConsultation.phone && (
                          <div>
                            <span className="text-gray-500">연락처:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2) 기본 신체 정보 */}
                {(healthConsultation.current_height ||
                  healthConsultation.current_weight ||
                  healthConsultation.min_weight_since_20s ||
                  healthConsultation.max_weight_since_20s ||
                  healthConsultation.target_weight ||
                  healthConsultation.target_weight_loss_period) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">
                      2) 기본 신체 정보
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="text-sm space-y-1">
                        {(healthConsultation.current_height ||
                          healthConsultation.current_weight) && (
                          <div>
                            <span className="text-gray-500">현재 키/체중:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.current_height || "-"}cm /{" "}
                              {healthConsultation.current_weight || "-"}kg
                            </span>
                          </div>
                        )}
                        {(healthConsultation.min_weight_since_20s ||
                          healthConsultation.max_weight_since_20s) && (
                          <div>
                            <span className="text-gray-500">
                              20대 이후 체중 변화:
                            </span>
                            <span className="ml-2 font-medium">
                              최저{" "}
                              {healthConsultation.min_weight_since_20s || "-"}
                              kg / 최고{" "}
                              {healthConsultation.max_weight_since_20s || "-"}kg
                            </span>
                          </div>
                        )}
                        {healthConsultation.target_weight && (
                          <div>
                            <span className="text-gray-500">희망 체중:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.target_weight}kg
                            </span>
                          </div>
                        )}
                        {healthConsultation.target_weight_loss_period && (
                          <div>
                            <span className="text-gray-500">
                              희망 감량 기간:
                            </span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.target_weight_loss_period}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3) 다이어트 경험 */}
                {(healthConsultation.previous_western_medicine ||
                  healthConsultation.previous_herbal_medicine ||
                  healthConsultation.previous_other_medicine) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">
                      3) 다이어트 경험
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="text-sm space-y-1">
                        {healthConsultation.previous_western_medicine && (
                          <div>
                            <span className="text-gray-500">양약:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.previous_western_medicine}
                            </span>
                          </div>
                        )}
                        {healthConsultation.previous_herbal_medicine && (
                          <div>
                            <span className="text-gray-500">한약:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.previous_herbal_medicine}
                            </span>
                          </div>
                        )}
                        {healthConsultation.previous_other_medicine && (
                          <div>
                            <span className="text-gray-500">기타:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.previous_other_medicine}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4) 생활 패턴 */}
                {(healthConsultation.occupation ||
                  healthConsultation.work_hours ||
                  healthConsultation.has_shift_work !== undefined ||
                  healthConsultation.wake_up_time ||
                  healthConsultation.bedtime ||
                  healthConsultation.has_daytime_sleepiness !== undefined ||
                  healthConsultation.meal_pattern ||
                  healthConsultation.alcohol_frequency ||
                  healthConsultation.water_intake) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">
                      4) 생활 패턴
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="text-sm space-y-1">
                        {healthConsultation.occupation && (
                          <div>
                            <span className="text-gray-500">직업:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.occupation}
                            </span>
                          </div>
                        )}
                        {healthConsultation.work_hours && (
                          <div>
                            <span className="text-gray-500">근무시간:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.work_hours}
                            </span>
                          </div>
                        )}
                        {healthConsultation.has_shift_work !== undefined && (
                          <div>
                            <span className="text-gray-500">교대근무:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.has_shift_work
                                ? "있음"
                                : "없음"}
                            </span>
                          </div>
                        )}
                        {(healthConsultation.wake_up_time ||
                          healthConsultation.bedtime) && (
                          <div>
                            <span className="text-gray-500">
                              기상/취침 시간:
                            </span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.wake_up_time || "-"} /{" "}
                              {healthConsultation.bedtime || "-"}
                            </span>
                          </div>
                        )}
                        {healthConsultation.has_daytime_sleepiness !==
                          undefined && (
                          <div>
                            <span className="text-gray-500">낮 졸림:</span>
                            <span className="ml-2 font-medium">
                              {healthConsultation.has_daytime_sleepiness
                                ? "있음"
                                : "없음"}
                            </span>
                          </div>
                        )}
                        {healthConsultation.meal_pattern && (
                          <div>
                            <span className="text-gray-500">식사 패턴:</span>
                            <span className="ml-2 font-medium">
                              {getMealPatternLabel(
                                healthConsultation.meal_pattern
                              )}
                            </span>
                          </div>
                        )}
                        {healthConsultation.alcohol_frequency && (
                          <div>
                            <span className="text-gray-500">음주 빈도:</span>
                            <span className="ml-2 font-medium">
                              {getAlcoholFrequencyLabel(
                                healthConsultation.alcohol_frequency
                              )}
                            </span>
                          </div>
                        )}
                        {healthConsultation.water_intake && (
                          <div>
                            <span className="text-gray-500">음수량:</span>
                            <span className="ml-2 font-medium">
                              {getWaterIntakeLabel(
                                healthConsultation.water_intake
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5) 원하는 다이어트 방향 */}
                {(healthConsultation.diet_approach ||
                  healthConsultation.preferred_stage) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">
                      5) 원하는 다이어트 방향
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="text-sm space-y-1">
                        {healthConsultation.diet_approach && (
                          <div>
                            <span className="text-gray-500">
                              다이어트 방향:
                            </span>
                            <span className="ml-2 font-medium">
                              {getDietApproachLabel(
                                healthConsultation.diet_approach
                              )}
                            </span>
                          </div>
                        )}
                        {healthConsultation.preferred_stage && (
                          <div>
                            <span className="text-gray-500">희망 단계:</span>
                            <span className="ml-2 font-medium">
                              {getPreferredStageLabel(
                                healthConsultation.preferred_stage
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6) 과거 병력 및 복용 약 */}
                {healthConsultation.medical_history && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-600">
                      6) 과거 병력 및 복용 약
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <p className="text-sm whitespace-pre-wrap">
                        {healthConsultation.medical_history}
                      </p>
                    </div>
                  </div>
                )}

                {/* 진단 */}
                {healthConsultation.diagnosis && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-green-600">
                      진단
                    </h4>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm whitespace-pre-wrap">
                        {healthConsultation.diagnosis}
                      </p>
                    </div>
                  </div>
                )}

                {/* 한의사 상담 메모 */}
                {healthConsultation.consultation_notes && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-orange-600">
                      상담 메모
                    </h4>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-sm whitespace-pre-wrap">
                        {healthConsultation.consultation_notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* 치료 계획 */}
                {healthConsultation.treatment_plan && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-purple-600">
                      치료 계획
                    </h4>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-sm whitespace-pre-wrap">
                        {healthConsultation.treatment_plan}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                문진 정보가 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* 우측: 상품/옵션/주문번호 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 pb-2 border-b">
                주문 정보
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">주문번호</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {order.order_id}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">주문 금액</span>
                  <span className="font-bold text-lg text-blue-600">
                    {order.total_amount.toLocaleString()}원
                  </span>
                </div>
                <Separator />
                <div>
                  <span className="text-gray-500 block mb-2">주문 상품</span>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium mb-1">상품명 (예시)</div>
                      <div className="text-gray-600 text-xs">
                        옵션: 기본형
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        수량: 1개
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    * 상품 정보는 order_items 테이블에서 불러올 수 있습니다
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
