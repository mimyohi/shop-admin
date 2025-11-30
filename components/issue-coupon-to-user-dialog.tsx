"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { couponsQueries } from "@/queries/coupons.queries";
import { issueCouponToUser } from "@/lib/actions/coupons";

interface User {
  user_id: string | null;
  email: string;
  display_name: string | null;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface IssueCouponToUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function IssueCouponToUserDialog({
  open,
  onOpenChange,
  user,
}: IssueCouponToUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const { data: couponsResult, isError } = useQuery({
    ...couponsQueries.list({ is_active: true, limit: 'all' }),
    enabled: open,
  });
  const coupons = couponsResult?.coupons ?? [];

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "쿠폰 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCouponId || !user.user_id) return;

    setIsLoading(true);

    try {
      const result = await issueCouponToUser(user.user_id, selectedCouponId);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "성공",
        description: "쿠폰이 발급되었습니다.",
      });

      setSelectedCouponId("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error issuing coupon:", error);
      toast({
        title: "오류",
        description: error.message || "쿠폰 발급에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>쿠폰 발급</DialogTitle>
          <DialogDescription>
            {user.display_name || user.email}님에게 쿠폰을 발급합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleIssue} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coupon">
              쿠폰 선택 <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
              <SelectTrigger>
                <SelectValue placeholder="쿠폰을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {coupons.map((coupon) => (
                  <SelectItem key={coupon.id} value={coupon.id}>
                    [{coupon.code}] {coupon.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedCouponId("");
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading || !selectedCouponId}>
              {isLoading ? "발급중..." : "발급"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
