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
import { useToast } from "@/hooks/use-toast";
import { issueCouponToUserByEmail } from "@/lib/actions/coupons";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

interface IssueCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
}

export function IssueCouponDialog({
  open,
  onOpenChange,
  coupon,
}: IssueCouponDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon) return;

    setIsLoading(true);

    try {
      const result = await issueCouponToUserByEmail(email, coupon.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "성공",
        description: "쿠폰이 발급되었습니다.",
      });

      setEmail("");
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

  if (!coupon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>쿠폰 발급</DialogTitle>
          <DialogDescription>
            사용자에게 "{coupon.name}" 쿠폰을 발급합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleIssue} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              사용자 이메일 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <p className="text-sm text-gray-500">
              가입된 사용자의 이메일을 입력하세요.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail("");
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "발급중..." : "발급"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
