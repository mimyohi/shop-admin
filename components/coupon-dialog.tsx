"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { productsQueries } from "@/queries/products.queries";
import { couponProductsQueries } from "@/queries/coupon-products.queries";
import { supabase } from "@/lib/supabase";

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
}

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  onSuccess: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export function CouponDialog({
  open,
  onOpenChange,
  coupon,
  onSuccess,
}: CouponDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [applyToAllProducts, setApplyToAllProducts] = useState(true);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_purchase: 0,
    max_discount: null as number | null,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
    is_active: true,
  });

  const { data: productsResult } = useQuery({
    ...productsQueries.list({ limit: 'all' }),
    enabled: open,
  });
  const products = productsResult?.products ?? [];

  const { data: assignedProductIds } = useQuery({
    ...couponProductsQueries.byCouponId(coupon?.id || ''),
    enabled: open && !!coupon?.id,
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || "",
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase: coupon.min_purchase,
        max_discount: coupon.max_discount,
        valid_from: new Date(coupon.valid_from).toISOString().split("T")[0],
        valid_until: coupon.valid_until
          ? new Date(coupon.valid_until).toISOString().split("T")[0]
          : "",
        is_active: coupon.is_active,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        min_purchase: 0,
        max_discount: null,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
        is_active: true,
      });
      setSelectedProducts([]);
      setApplyToAllProducts(true);
    }
  }, [coupon, open]);

  useEffect(() => {
    if (!coupon) return;
    if (assignedProductIds && assignedProductIds.length > 0) {
      setSelectedProducts(assignedProductIds);
      setApplyToAllProducts(false);
    } else if (assignedProductIds) {
      setSelectedProducts([]);
      setApplyToAllProducts(true);
    }
  }, [assignedProductIds, coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_purchase: formData.min_purchase,
        max_discount: formData.max_discount || null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: formData.valid_until
          ? new Date(formData.valid_until).toISOString()
          : null,
        usage_limit: null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      let couponId: string;

      if (coupon) {
        // 수정
        const { error } = await supabase
          .from("coupons")
          .update(submitData)
          .eq("id", coupon.id);

        if (error) throw error;
        couponId = coupon.id;

        toast({
          title: "성공",
          description: "쿠폰이 수정되었습니다.",
        });
      } else {
        // 생성
        const { data, error } = await supabase
          .from("coupons")
          .insert(submitData)
          .select()
          .single();

        if (error) throw error;
        couponId = data.id;

        toast({
          title: "성공",
          description: "쿠폰이 생성되었습니다.",
        });
      }

      // 쿠폰-상품 연결 저장
      if (!applyToAllProducts) {
        // 기존 연결 삭제
        await supabase.from("coupon_products").delete().eq("coupon_id", couponId);

        // 새 연결 추가
        if (selectedProducts.length > 0) {
          const couponProducts = selectedProducts.map((productId) => ({
            coupon_id: couponId,
            product_id: productId,
          }));

          const { error: cpError } = await supabase
            .from("coupon_products")
            .insert(couponProducts);

          if (cpError) throw cpError;
        }
      } else {
        // 모든 상품에 적용이면 기존 연결 삭제
        await supabase.from("coupon_products").delete().eq("coupon_id", couponId);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast({
        title: "오류",
        description: error.message || "쿠폰 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? "쿠폰 수정" : "쿠폰 생성"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 쿠폰 코드 */}
            <div className="space-y-2">
              <Label htmlFor="code">
                쿠폰 코드 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="WELCOME2024"
                required
              />
            </div>

            {/* 쿠폰명 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                쿠폰명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="신규 회원 환영 쿠폰"
                required
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="쿠폰에 대한 상세 설명"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 할인 타입 */}
            <div className="space-y-2">
              <Label htmlFor="discount_type">
                할인 타입 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: "percentage" | "fixed") =>
                  setFormData({ ...formData, discount_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">퍼센트 (%)</SelectItem>
                  <SelectItem value="fixed">정액 (원)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 할인 값 */}
            <div className="space-y-2">
              <Label htmlFor="discount_value">
                할인 값 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_value: parseInt(e.target.value) || 0,
                  })
                }
                placeholder={formData.discount_type === "percentage" ? "10" : "5000"}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 최소 구매금액 */}
            <div className="space-y-2">
              <Label htmlFor="min_purchase">최소 구매금액</Label>
              <Input
                id="min_purchase"
                type="number"
                value={formData.min_purchase}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_purchase: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>

            {/* 최대 할인금액 (퍼센트일 때만) */}
            {formData.discount_type === "percentage" && (
              <div className="space-y-2">
                <Label htmlFor="max_discount">최대 할인금액</Label>
                <Input
                  id="max_discount"
                  type="number"
                  value={formData.max_discount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_discount: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="제한없음"
                />
              </div>
            )}

          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 시작일 */}
            <div className="space-y-2">
              <Label htmlFor="valid_from">시작일</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
              />
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <Label htmlFor="valid_until">종료일</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
              />
            </div>
          </div>

          {/* 활성화 여부 */}
          <div className="space-y-2 flex items-start pb-2">
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">활성화</Label>
            </div>
          </div>

          {/* 적용 상품 선택 */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">적용 상품</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply_all"
                  checked={applyToAllProducts}
                  onCheckedChange={(checked) => {
                    setApplyToAllProducts(checked as boolean);
                    if (checked) {
                      setSelectedProducts([]);
                    }
                  }}
                />
                <Label htmlFor="apply_all" className="font-normal cursor-pointer">
                  모든 상품에 적용
                </Label>
              </div>
            </div>

            {!applyToAllProducts && (
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                {products.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    등록된 상품이 없습니다.
                  </p>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.price.toLocaleString()}원
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}

            {!applyToAllProducts && selectedProducts.length > 0 && (
              <p className="text-sm text-gray-600">
                선택된 상품: {selectedProducts.length}개
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장중..." : coupon ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
