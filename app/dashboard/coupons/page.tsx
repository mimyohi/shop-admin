"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Copy } from "lucide-react";
import { CouponDialog } from "@/components/coupon-dialog";
import { IssueCouponDialog } from "@/components/issue-coupon-dialog";
import {
  couponsQueries,
  useDeleteCoupon,
  useToggleCouponActive,
} from "@/queries/coupons.queries";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

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
  created_at: string;
  updated_at: string;
  product_count?: number;
  product_names?: string[];
}

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"] as const).withDefault("all")
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();
  const deleteCouponMutation = useDeleteCoupon();
  const toggleCouponMutation = useToggleCouponActive();
  const {
    data: couponsResult,
    isLoading,
    isError,
    refetch: refetchCoupons,
  } = useQuery(
    couponsQueries.list({
      search: searchTerm || undefined,
      is_active:
        statusFilter === "all"
          ? undefined
          : statusFilter === "active"
          ? true
          : false,
      limit: "all",
    })
  );
  const coupons = useMemo(() => couponsResult?.coupons ?? [], [couponsResult]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "쿠폰 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 쿠폰을 삭제하시겠습니까?")) return;

    try {
      await deleteCouponMutation.mutateAsync(id);

      toast({
        title: "성공",
        description: "쿠폰이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "오류",
        description: "쿠폰 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await toggleCouponMutation.mutateAsync({
        id: coupon.id,
        isActive: !coupon.is_active,
      });

      toast({
        title: "성공",
        description: `쿠폰이 ${
          !coupon.is_active ? "활성화" : "비활성화"
        }되었습니다.`,
      });
    } catch (error) {
      console.error("Error toggling coupon:", error);
      toast({
        title: "오류",
        description: "쿠폰 상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "복사 완료",
      description: "쿠폰 코드가 클립보드에 복사되었습니다.",
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}%`;
    }
    return `${coupon.discount_value.toLocaleString()}원`;
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">쿠폰 관리</h1>
          <p className="text-gray-500">쿠폰을 생성하고 관리하세요</p>
        </div>
        <Button
          onClick={() => {
            setSelectedCoupon(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          쿠폰 생성
        </Button>
      </div>

      {/* 필터 영역 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">검색</Label>
              <Input
                id="search"
                placeholder="쿠폰 코드, 이름, 설명"
                value={searchTerm}
                onChange={(e) => void setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => void setStatusFilter("all")}
                >
                  전체
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => void setStatusFilter("active")}
                >
                  활성
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => void setStatusFilter("inactive")}
                >
                  비활성
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                총{" "}
                <span className="font-semibold text-blue-600">
                  {coupons.length}
                </span>
                개
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 쿠폰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>쿠폰 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              조건에 맞는 쿠폰이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>쿠폰명</TableHead>
                  <TableHead>할인</TableHead>
                  <TableHead>적용 상품</TableHead>
                  <TableHead>최소 구매금액</TableHead>
                  <TableHead>유효기간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{coupon.name}</div>
                        {coupon.description && (
                          <div className="text-xs text-gray-500">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {formatDiscount(coupon)}
                    </TableCell>
                    <TableCell>
                      {coupon.product_count === 0 ? (
                        <Badge variant="outline" className="text-green-600">
                          모든 상품
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="secondary">
                            {coupon.product_count}개 상품
                          </Badge>
                          {coupon.product_names &&
                            coupon.product_names.length > 0 && (
                              <div className="text-xs text-gray-500 max-w-[200px] truncate">
                                {coupon.product_names.slice(0, 2).join(", ")}
                                {coupon.product_names.length > 2 &&
                                  ` 외 ${coupon.product_names.length - 2}개`}
                              </div>
                            )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.min_purchase > 0
                        ? `${coupon.min_purchase.toLocaleString()}원`
                        : "제한없음"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {coupon.valid_until ? (
                          <div
                            className={isExpired(coupon) ? "text-red-500" : ""}
                          >
                            ~{" "}
                            {new Date(coupon.valid_until).toLocaleDateString(
                              "ko-KR"
                            )}
                            {isExpired(coupon) && " (만료)"}
                          </div>
                        ) : (
                          "무기한"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={coupon.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(coupon)}
                      >
                        {coupon.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setIsIssueDialogOpen(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 쿠폰 생성/수정 다이얼로그 */}
      <CouponDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        coupon={selectedCoupon}
        onSuccess={() => refetchCoupons()}
      />

      {/* 쿠폰 발급 다이얼로그 */}
      <IssueCouponDialog
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
        coupon={selectedCoupon}
      />
    </div>
  );
}
