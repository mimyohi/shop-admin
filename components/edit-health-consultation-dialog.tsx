"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updateHealthConsultation } from "@/lib/actions/orders";
import { OrderHealthConsultation } from "@/models/order.model";
import { ordersQueries } from "@/queries/orders.queries";

interface EditHealthConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  healthConsultation: OrderHealthConsultation | null;
  orderId: string;
}

export function EditHealthConsultationDialog({
  open,
  onOpenChange,
  healthConsultation,
  orderId,
}: EditHealthConsultationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    resident_number: "",
    phone: "",
    current_height: 0,
    current_weight: 0,
    min_weight_since_20s: 0,
    max_weight_since_20s: 0,
    target_weight: 0,
    target_weight_loss_period: "",
    previous_western_medicine: "",
    previous_herbal_medicine: "",
    previous_other_medicine: "",
    occupation: "",
    work_hours: "",
    has_shift_work: false,
    wake_up_time: "",
    bedtime: "",
    has_daytime_sleepiness: false,
    meal_pattern: "3meals" as "1meals" | "2meals" | "3meals" | "irregular",
    alcohol_frequency: "weekly_1_or_less" as "weekly_1_or_less" | "weekly_2_or_more",
    water_intake: "1L_or_less" as "1L_or_less" | "over_1L",
    diet_approach: "sustainable" as "sustainable" | "fast",
    preferred_stage: "stage1" as "stage1" | "stage2" | "stage3",
    medical_history: "",
    consultation_available_time: "",
  });

  useEffect(() => {
    if (healthConsultation) {
      setFormData({
        name: healthConsultation.name || "",
        resident_number: healthConsultation.resident_number || "",
        phone: healthConsultation.phone || "",
        current_height: healthConsultation.current_height || 0,
        current_weight: healthConsultation.current_weight || 0,
        min_weight_since_20s: healthConsultation.min_weight_since_20s || 0,
        max_weight_since_20s: healthConsultation.max_weight_since_20s || 0,
        target_weight: healthConsultation.target_weight || 0,
        target_weight_loss_period: healthConsultation.target_weight_loss_period || "",
        previous_western_medicine: healthConsultation.previous_western_medicine || "",
        previous_herbal_medicine: healthConsultation.previous_herbal_medicine || "",
        previous_other_medicine: healthConsultation.previous_other_medicine || "",
        occupation: healthConsultation.occupation || "",
        work_hours: healthConsultation.work_hours || "",
        has_shift_work: healthConsultation.has_shift_work || false,
        wake_up_time: healthConsultation.wake_up_time || "",
        bedtime: healthConsultation.bedtime || "",
        has_daytime_sleepiness: healthConsultation.has_daytime_sleepiness || false,
        meal_pattern: healthConsultation.meal_pattern || "3meals",
        alcohol_frequency: healthConsultation.alcohol_frequency || "weekly_1_or_less",
        water_intake: healthConsultation.water_intake || "1L_or_less",
        diet_approach: healthConsultation.diet_approach || "sustainable",
        preferred_stage: healthConsultation.preferred_stage || "stage1",
        medical_history: healthConsultation.medical_history || "",
        consultation_available_time: healthConsultation.consultation_available_time || "",
      });
    }
  }, [healthConsultation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateHealthConsultation(orderId, formData);

      if (result.success) {
        toast({
          title: "성공",
          description: "문진표가 수정되었습니다.",
        });

        // React Query 캐시 무효화하여 즉시 반영
        await queryClient.invalidateQueries({
          queryKey: ordersQueries.detail(orderId).queryKey
        });

        onOpenChange(false);
      } else {
        toast({
          title: "오류",
          description: result.error || "문진표 수정에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "문진표 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문진표 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resident_number">주민등록번호</Label>
                <Input
                  id="resident_number"
                  value={formData.resident_number}
                  onChange={(e) => setFormData({ ...formData, resident_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="consultation_available_time">상담 가능한 시간</Label>
                <Input
                  id="consultation_available_time"
                  value={formData.consultation_available_time}
                  onChange={(e) => setFormData({ ...formData, consultation_available_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 신체 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">신체 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_height">키 (cm)</Label>
                <Input
                  id="current_height"
                  type="number"
                  step="0.1"
                  value={formData.current_height}
                  onChange={(e) => setFormData({ ...formData, current_height: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_weight">현재 체중 (kg)</Label>
                <Input
                  id="current_weight"
                  type="number"
                  step="0.1"
                  value={formData.current_weight}
                  onChange={(e) => setFormData({ ...formData, current_weight: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_weight_since_20s">20대 이후 최저 체중 (kg)</Label>
                <Input
                  id="min_weight_since_20s"
                  type="number"
                  step="0.1"
                  value={formData.min_weight_since_20s}
                  onChange={(e) => setFormData({ ...formData, min_weight_since_20s: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_weight_since_20s">20대 이후 최고 체중 (kg)</Label>
                <Input
                  id="max_weight_since_20s"
                  type="number"
                  step="0.1"
                  value={formData.max_weight_since_20s}
                  onChange={(e) => setFormData({ ...formData, max_weight_since_20s: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_weight">목표 체중 (kg)</Label>
                <Input
                  id="target_weight"
                  type="number"
                  step="0.1"
                  value={formData.target_weight}
                  onChange={(e) => setFormData({ ...formData, target_weight: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_weight_loss_period">희망 감량 기간</Label>
                <Input
                  id="target_weight_loss_period"
                  value={formData.target_weight_loss_period}
                  onChange={(e) => setFormData({ ...formData, target_weight_loss_period: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 이전 치료/복용 경험 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">이전 치료/복용 경험</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="previous_western_medicine">양약 복용 경험</Label>
                <Textarea
                  id="previous_western_medicine"
                  value={formData.previous_western_medicine}
                  onChange={(e) => setFormData({ ...formData, previous_western_medicine: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_herbal_medicine">한약 복용 경험</Label>
                <Textarea
                  id="previous_herbal_medicine"
                  value={formData.previous_herbal_medicine}
                  onChange={(e) => setFormData({ ...formData, previous_herbal_medicine: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_other_medicine">기타 복용 경험</Label>
                <Textarea
                  id="previous_other_medicine"
                  value={formData.previous_other_medicine}
                  onChange={(e) => setFormData({ ...formData, previous_other_medicine: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* 직업/생활 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">직업/생활 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">직업</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_hours">근무시간</Label>
                <Input
                  id="work_hours"
                  value={formData.work_hours}
                  onChange={(e) => setFormData({ ...formData, work_hours: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wake_up_time">기상 시간</Label>
                <Input
                  id="wake_up_time"
                  value={formData.wake_up_time}
                  onChange={(e) => setFormData({ ...formData, wake_up_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedtime">취침 시간</Label>
                <Input
                  id="bedtime"
                  value={formData.bedtime}
                  onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
                />
              </div>
              <div className="space-y-2 flex items-center gap-2">
                <Switch
                  id="has_shift_work"
                  checked={formData.has_shift_work}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_shift_work: checked })}
                />
                <Label htmlFor="has_shift_work">교대근무</Label>
              </div>
              <div className="space-y-2 flex items-center gap-2">
                <Switch
                  id="has_daytime_sleepiness"
                  checked={formData.has_daytime_sleepiness}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_daytime_sleepiness: checked })}
                />
                <Label htmlFor="has_daytime_sleepiness">낮 졸림</Label>
              </div>
            </div>
          </div>

          {/* 식습관/생활습관 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">식습관/생활습관</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meal_pattern">식사 패턴</Label>
                <Select
                  value={formData.meal_pattern}
                  onValueChange={(value: any) => setFormData({ ...formData, meal_pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1meals">1끼</SelectItem>
                    <SelectItem value="2meals">2끼</SelectItem>
                    <SelectItem value="3meals">3끼</SelectItem>
                    <SelectItem value="irregular">불규칙</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alcohol_frequency">음주 빈도</Label>
                <Select
                  value={formData.alcohol_frequency}
                  onValueChange={(value: any) => setFormData({ ...formData, alcohol_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly_1_or_less">주 1회 이하</SelectItem>
                    <SelectItem value="weekly_2_or_more">주 2회 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="water_intake">수분 섭취량</Label>
                <Select
                  value={formData.water_intake}
                  onValueChange={(value: any) => setFormData({ ...formData, water_intake: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1L_or_less">1L 이하</SelectItem>
                    <SelectItem value="over_1L">1L 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 다이어트 선호 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">다이어트 선호</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diet_approach">다이어트 방향</Label>
                <Select
                  value={formData.diet_approach}
                  onValueChange={(value: any) => setFormData({ ...formData, diet_approach: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sustainable">지속 가능한</SelectItem>
                    <SelectItem value="fast">빠른</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_stage">선호 단계</Label>
                <Select
                  value={formData.preferred_stage}
                  onValueChange={(value: any) => setFormData({ ...formData, preferred_stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage1">Stage 1</SelectItem>
                    <SelectItem value="stage2">Stage 2</SelectItem>
                    <SelectItem value="stage3">Stage 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 과거 병력 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-600">과거 병력</h3>
            <div className="space-y-2">
              <Label htmlFor="medical_history">과거 진단받았거나 현재 치료 중인 질환, 복용 중인 약</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
