"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, Search } from "lucide-react";
import {
  homeProductsQueries,
  useSetHomeProducts,
  useUpdateHomeProductOrder,
  useRemoveHomeProduct,
} from "@/queries/home-products.queries";
import { HomeProductWithProduct, Product } from "@/models";
import { PermissionGuard } from "@/components/permission-guard";
import Image from "next/image";

const MAX_HOME_PRODUCTS = 6;

export default function HomeProductsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Queries
  const { data: homeProducts = [], isLoading } = useQuery(homeProductsQueries.list());
  const { data: allProducts = [], isLoading: productsLoading } = useQuery(
    homeProductsQueries.allProducts()
  );

  // Mutations
  const setHomeProducts = useSetHomeProducts();
  const updateOrder = useUpdateHomeProductOrder();
  const removeHomeProduct = useRemoveHomeProduct();

  const handleOpenDialog = () => {
    setSelectedProductIds(homeProducts.map((hp) => hp.product_id));
    setSearchTerm("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProductIds([]);
    setSearchTerm("");
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= MAX_HOME_PRODUCTS) {
        toast({
          title: "최대 개수 초과",
          description: `홈 상품은 최대 ${MAX_HOME_PRODUCTS}개까지만 선택할 수 있습니다.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleSave = async () => {
    try {
      await setHomeProducts.mutateAsync(selectedProductIds);
      toast({ title: "성공", description: "홈 상품이 설정되었습니다." });
      handleCloseDialog();
    } catch (error) {
      console.error("Set home products error:", error);
      toast({
        title: "오류",
        description: "홈 상품 설정에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("이 상품을 홈에서 제거하시겠습니까?")) return;

    try {
      await removeHomeProduct.mutateAsync(id);
      toast({ title: "성공", description: "상품이 홈에서 제거되었습니다." });
    } catch (error) {
      console.error("Remove error:", error);
      toast({
        title: "오류",
        description: "상품 제거에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const items = [...homeProducts];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= items.length) return;

    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    const orderUpdates = items.map((item, i) => ({
      id: item.id,
      display_order: i,
    }));

    try {
      await updateOrder.mutateAsync(orderUpdates);
      toast({ title: "성공", description: "순서가 변경되었습니다." });
    } catch (error) {
      console.error("Order update error:", error);
      toast({
        title: "오류",
        description: "순서 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">홈 상품 설정</h1>
            <p className="text-gray-500">
              홈 페이지에 표시할 상품을 최대 {MAX_HOME_PRODUCTS}개까지 선택하세요
            </p>
          </div>
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" />
            상품 설정
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>현재 홈 상품 ({homeProducts.length}/{MAX_HOME_PRODUCTS})</CardTitle>
            <CardDescription>
              화살표 버튼으로 순서를 변경할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">로딩중...</div>
            ) : homeProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">설정된 홈 상품이 없습니다.</p>
                <Button onClick={handleOpenDialog} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  상품 설정하기
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {homeProducts.map((homeProduct, index) => (
                  <div
                    key={homeProduct.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveOrder(index, "up")}
                        disabled={index === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveOrder(index, "down")}
                        disabled={index === homeProducts.length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <span className="w-8 text-center font-bold text-lg text-gray-400">
                      {index + 1}
                    </span>

                    {homeProduct.product?.image_url ? (
                      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={homeProduct.product.image_url}
                          alt={homeProduct.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {homeProduct.product?.name || "알 수 없는 상품"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {homeProduct.product?.category || "카테고리 없음"}
                      </p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatPrice(homeProduct.product?.price || 0)}원
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(homeProduct.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 상품 선택 Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                홈 상품 선택 ({selectedProductIds.length}/{MAX_HOME_PRODUCTS})
              </DialogTitle>
            </DialogHeader>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="상품명 또는 카테고리로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {productsLoading ? (
                <div className="text-center py-8">상품 로딩중...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    const selectionIndex = selectedProductIds.indexOf(product.id);

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleToggleProduct(product.id)}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {product.image_url ? (
                          <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-xs">No</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500">{product.category}</p>
                          <p className="text-xs font-semibold text-blue-600">
                            {formatPrice(product.price)}원
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {selectionIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseDialog}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={setHomeProducts.isPending}
              >
                {setHomeProducts.isPending ? "저장중..." : "저장"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
