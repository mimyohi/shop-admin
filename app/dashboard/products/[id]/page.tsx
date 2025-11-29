"use client";

import { useEffect, useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/MultiImageUpload";
import ProductAddonsManager from "@/components/ProductAddonsManager";
import ProductOptionsManager from "@/components/ProductOptionsManager";
import { productsQueries, useUpdateProduct } from "@/queries/products.queries";
import { PermissionGuard } from "@/components/permission-guard";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  detail_images?: string[];
  sale_start_at: string | null;
  sale_end_at: string | null;
  is_visible_on_main: boolean;
  is_out_of_stock?: boolean;
  is_new_badge?: boolean;
  is_sale_badge?: boolean;
  discount_rate?: number;
  created_at: string;
}

export default function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount_rate: "",
    category: "",
    image_url: "",
    detail_images: [] as string[],
    sale_start_at: "",
    sale_end_at: "",
    is_visible_on_main: true,
    is_out_of_stock: false,
    is_new_badge: false,
    is_sale_badge: false,
  });

  const updateProductMutation = useUpdateProduct();
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery(productsQueries.detail(id));

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        discount_rate:
          product.discount_rate !== null && product.discount_rate !== undefined
            ? product.discount_rate.toString()
            : "0",
        category: product.category,
        image_url: product.image_url || "",
        detail_images: product.detail_images || [],
        sale_start_at: product.sale_start_at
          ? product.sale_start_at.slice(0, 16)
          : "",
        sale_end_at: product.sale_end_at
          ? product.sale_end_at.slice(0, 16)
          : "",
        is_visible_on_main: product.is_visible_on_main ?? true,
        is_out_of_stock: product.is_out_of_stock ?? false,
        is_new_badge: product.is_new_badge ?? false,
        is_sale_badge: product.is_sale_badge ?? false,
      });
    }
  }, [product]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "상품을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "오류",
        description: "필수 항목을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        discount_rate: formData.discount_rate
          ? parseInt(formData.discount_rate)
          : 0,
        category: formData.category,
        image_url: formData.image_url,
        detail_images: formData.detail_images,
        sale_start_at: formData.sale_start_at || null,
        sale_end_at: formData.sale_end_at || null,
        is_visible_on_main: formData.is_visible_on_main,
        is_out_of_stock: formData.is_out_of_stock,
        is_new_badge: formData.is_new_badge,
        is_sale_badge: formData.is_sale_badge,
      };

      await updateProductMutation.mutateAsync({
        id,
        data: productData,
      });

      toast({
        title: "성공",
        description: "상품 정보가 수정되었습니다.",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "오류",
        description: "상품 수정에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (!product) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">상품을 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/dashboard/products")}>
            상품 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/products")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          상품 목록으로
        </Button>
        <h1 className="text-3xl font-bold">상품 수정</h1>
        <p className="text-gray-500 mt-2">
          상품 기본 정보를 수정하고 옵션을 관리하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 상품 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>상품 기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  상품명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">
                  가격 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_rate">할인률 (%)</Label>
                <Input
                  id="discount_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_rate: e.target.value })
                  }
                  placeholder="0"
                />
                <p className="text-sm text-gray-500">
                  할인률을 0-100 사이의 숫자로 입력하세요 (0이면 할인 없음)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">상품 설명</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_visible_on_main"
                  checked={formData.is_visible_on_main}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_visible_on_main: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_visible_on_main" className="cursor-pointer">
                  메인 페이지에 노출
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_out_of_stock"
                  checked={formData.is_out_of_stock}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_out_of_stock: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_out_of_stock" className="cursor-pointer">
                  품절 상태로 설정
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_new_badge"
                  checked={formData.is_new_badge}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_new_badge: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_new_badge" className="cursor-pointer">
                  NEW 뱃지 표시
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_sale_badge"
                  checked={formData.is_sale_badge}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_sale_badge: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_sale_badge" className="cursor-pointer">
                  SALE 뱃지 표시
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>상품 메인 이미지</Label>
              <ImageUpload
                currentImageUrl={formData.image_url}
                onUploadComplete={(url) =>
                  setFormData({ ...formData, image_url: url })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>상세 설명 이미지</Label>
              <p className="text-sm text-gray-500 mb-2">
                상품 상세 페이지에 표시될 이미지들입니다
              </p>
              <MultiImageUpload
                currentImages={formData.detail_images}
                onImagesChange={(urls) =>
                  setFormData({ ...formData, detail_images: urls })
                }
              />
            </div>

            {/* 판매 기간 설정 */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">
                판매 기간 설정 (선택)
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                판매 기간을 설정하지 않으면 상시 판매됩니다.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sale_start_at">판매 시작일시</Label>
                  <Input
                    id="sale_start_at"
                    type="datetime-local"
                    value={formData.sale_start_at}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sale_start_at: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_end_at">판매 종료일시</Label>
                  <Input
                    id="sale_end_at"
                    type="datetime-local"
                    value={formData.sale_end_at}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sale_end_at: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상품 옵션 관리 */}
        <ProductOptionsManager productId={product.id} />

        {/* 추가상품 관리 */}
        <ProductAddonsManager productId={product.id} />

        {/* 제출 버튼 */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/products")}
          >
            취소
          </Button>
        </div>
      </form>
      </div>
    </PermissionGuard>
  );
}
