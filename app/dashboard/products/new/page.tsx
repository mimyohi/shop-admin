"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/MultiImageUpload";
import ProductAddonsManager from "@/components/ProductAddonsManager";
import ProductOptionsManager from "@/components/ProductOptionsManager";
import { createProductWithOptions } from "@/lib/actions/products";
import { productsQueries } from "@/queries/products.queries";
import { PermissionGuard } from "@/components/permission-guard";
import { ProductOption } from "@/models";
import { datetimeLocalToKST } from "@/lib/utils";

interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    image_url: "",
    detail_images: [] as string[],
    sale_start_at: "",
    sale_end_at: "",
    is_visible_on_main: true,
    is_new_badge: false,
    is_sale_badge: false,
  });

  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast({
        title: "오류",
        description: "필수 항목을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (options.length === 0) {
      toast({
        title: "오류",
        description: "최소 1개 이상의 옵션을 등록해주세요.",
        variant: "destructive",
      });
      return;
    }

    const hasRepresentative = options.some(opt => opt.is_representative);
    if (!hasRepresentative) {
      toast({
        title: "오류",
        description: "대표 옵션을 1개 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        image_url: formData.image_url,
        detail_images: formData.detail_images,
        sale_start_at: datetimeLocalToKST(formData.sale_start_at),
        sale_end_at: datetimeLocalToKST(formData.sale_end_at),
        is_visible_on_main: formData.is_visible_on_main,
        is_new_badge: formData.is_new_badge,
        is_sale_badge: formData.is_sale_badge,
      };

      const newProduct = await createProductWithOptions({
        product: productData,
        options: options,
        addons: addons,
      });

      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: productsQueries.lists() });
      queryClient.invalidateQueries({
        queryKey: productsQueries.categories().queryKey,
      });

      toast({
        title: "성공",
        description: "상품이 등록되었습니다.",
      });

      router.push("/dashboard/products");
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "오류",
        description: error.message || "상품 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-3xl font-bold">새 상품 등록</h1>
          <p className="text-gray-500 mt-2">
            상품 기본 정보를 입력하고 옵션을 설정하세요
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
              </div>
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                💡 가격과 할인율은 아래 &quot;상품 옵션&quot; 섹션에서 옵션별로 설정합니다. 대표 옵션의 가격이 상품 목록에 표시됩니다.
              </p>

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
                  <Label
                    htmlFor="is_visible_on_main"
                    className="cursor-pointer"
                  >
                    메인 페이지에 노출
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
          <ProductOptionsManager
            initialOptions={options}
            onOptionsChange={setOptions}
          />

          {/* 추가상품 섹션 */}
          <ProductAddonsManager
            initialAddons={addons}
            onAddonsChange={setAddons}
          />

          {/* 제출 버튼 */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "저장 중..." : "상품 등록"}
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
