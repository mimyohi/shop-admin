"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adjustUserPoints } from "@/lib/actions/points";

interface UserPoint {
  user_id: string;
  points: number;
  user_profiles: {
    email: string;
    display_name: string | null;
  };
}

interface PointAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPoint: UserPoint | null;
  type: "add" | "subtract";
  onSuccess: () => void;
}

export function PointAdjustDialog({
  open,
  onOpenChange,
  userPoint,
  type,
  onSuccess,
}: PointAdjustDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPoint) return;

    const pointValue = parseInt(points);
    if (isNaN(pointValue) || pointValue <= 0) {
      toast({
        title: "오류",
        description: "올바른 포인트를 입력하세요.",
        variant: "destructive",
      });
      return;
    }

    if (type === "subtract" && pointValue > userPoint.points) {
      toast({
        title: "오류",
        description: "보유 포인트보다 많은 포인트를 차감할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const adjustType = type === "add" ? "earn" : "use";
      const adjustReason = reason || (type === "add" ? "관리자 지급" : "관리자 차감");

      const result = await adjustUserPoints(
        userPoint.user_id,
        pointValue,
        adjustReason,
        adjustType
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "성공",
        description: type === "add"
          ? `${pointValue.toLocaleString()}P가 지급되었습니다.`
          : `${pointValue.toLocaleString()}P가 차감되었습니다.`,
      });

      setPoints("");
      setReason("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adjusting points:", error);
      toast({
        title: "오류",
        description: error.message || "포인트 처리에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userPoint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            포인트 {type === "add" ? "지급" : "차감"}
          </DialogTitle>
          <DialogDescription>
            {userPoint.user_profiles.display_name || userPoint.user_profiles.email}님의
            포인트를 {type === "add" ? "지급" : "차감"}합니다.
            <br />
            현재 보유: <span className="font-semibold">{userPoint.points.toLocaleString()}P</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="points">
              {type === "add" ? "지급" : "차감"} 포인트 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="1000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">사유</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="포인트 지급/차감 사유를 입력하세요"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPoints("");
                setReason("");
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리중..." : type === "add" ? "지급" : "차감"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
