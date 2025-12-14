"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  mainBannersQueries,
  productBannersQueries,
  useCreateMainBanner,
  useUpdateMainBanner,
  useDeleteMainBanner,
  useToggleMainBannerActive,
  useUpdateMainBannerOrder,
  useCreateProductBanner,
  useUpdateProductBanner,
  useDeleteProductBanner,
  useToggleProductBannerActive,
  useUpdateProductBannerOrder,
} from "@/queries/banners.queries";
import { MainBanner, ProductBanner, LinkTarget } from "@/models";
import { CreateMainBannerData, CreateProductBannerData } from "@/types/banners.types";
import BannerImageUpload from "@/components/BannerImageUpload";
import { PermissionGuard } from "@/components/permission-guard";
import Image from "next/image";

// 메인 배너용 폼 데이터 (이미지만)
type MainBannerFormData = {
  image_url: string;
  mobile_image_url: string;
  is_active: boolean;
};

// 상품 배너용 폼 데이터 (이미지 + 링크 + 기간)
type ProductBannerFormData = {
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  link_target: LinkTarget;
  is_active: boolean;
  start_at: string;
  end_at: string;
};

const initialMainFormData: MainBannerFormData = {
  image_url: "",
  mobile_image_url: "",
  is_active: true,
};

const initialProductFormData: ProductBannerFormData = {
  image_url: "",
  mobile_image_url: "",
  link_url: "",
  link_target: "_self",
  is_active: true,
  start_at: "",
  end_at: "",
};

export default function BannersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"main" | "product">("main");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<MainBanner | ProductBanner | null>(null);
  const [mainFormData, setMainFormData] = useState<MainBannerFormData>(initialMainFormData);
  const [productFormData, setProductFormData] = useState<ProductBannerFormData>(initialProductFormData);

  // Main Banner Queries & Mutations
  const { data: mainBannerData, isLoading: mainLoading } = useQuery(
    mainBannersQueries.list({ limit: "all" })
  );
  const createMainBanner = useCreateMainBanner();
  const updateMainBanner = useUpdateMainBanner();
  const deleteMainBanner = useDeleteMainBanner();
  const toggleMainBannerActive = useToggleMainBannerActive();
  const updateMainBannerOrder = useUpdateMainBannerOrder();

  // Product Banner Queries & Mutations
  const { data: productBannerData, isLoading: productLoading } = useQuery(
    productBannersQueries.list({ limit: "all" })
  );
  const createProductBanner = useCreateProductBanner();
  const updateProductBanner = useUpdateProductBanner();
  const deleteProductBanner = useDeleteProductBanner();
  const toggleProductBannerActive = useToggleProductBannerActive();
  const updateProductBannerOrder = useUpdateProductBannerOrder();

  const mainBanners = mainBannerData?.banners || [];
  const productBanners = productBannerData?.banners || [];

  const handleOpenDialog = (banner?: MainBanner | ProductBanner) => {
    if (banner) {
      setEditingBanner(banner);
      if (activeTab === "main") {
        setMainFormData({
          image_url: banner.image_url,
          mobile_image_url: banner.mobile_image_url || "",
          is_active: banner.is_active,
        });
      } else {
        const productBanner = banner as ProductBanner;
        setProductFormData({
          image_url: banner.image_url,
          mobile_image_url: banner.mobile_image_url || "",
          link_url: productBanner.link_url || "",
          link_target: productBanner.link_target,
          is_active: banner.is_active,
          start_at: productBanner.start_at ? productBanner.start_at.split("T")[0] : "",
          end_at: productBanner.end_at ? productBanner.end_at.split("T")[0] : "",
        });
      }
    } else {
      setEditingBanner(null);
      setMainFormData(initialMainFormData);
      setProductFormData(initialProductFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setMainFormData(initialMainFormData);
    setProductFormData(initialProductFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "main") {
      // 메인 배너 검증
      if (!mainFormData.image_url) {
        toast({ title: "오류", description: "PC 이미지를 업로드해주세요.", variant: "destructive" });
        return;
      }
      if (!mainFormData.mobile_image_url) {
        toast({ title: "오류", description: "모바일 이미지를 업로드해주세요.", variant: "destructive" });
        return;
      }

      const bannerData: CreateMainBannerData = {
        image_url: mainFormData.image_url,
        mobile_image_url: mainFormData.mobile_image_url,
        device_type: "both",
        is_active: mainFormData.is_active,
      };

      try {
        if (editingBanner) {
          await updateMainBanner.mutateAsync({ id: editingBanner.id, data: bannerData });
        } else {
          await createMainBanner.mutateAsync(bannerData);
        }
        toast({ title: "성공", description: editingBanner ? "배너가 수정되었습니다." : "배너가 등록되었습니다." });
        handleCloseDialog();
      } catch (error) {
        console.error("Banner save error:", error);
        toast({ title: "오류", description: "배너 저장에 실패했습니다.", variant: "destructive" });
      }
    } else {
      // 상품 배너 검증
      if (!productFormData.image_url) {
        toast({ title: "오류", description: "PC 이미지를 업로드해주세요.", variant: "destructive" });
        return;
      }
      if (!productFormData.mobile_image_url) {
        toast({ title: "오류", description: "모바일 이미지를 업로드해주세요.", variant: "destructive" });
        return;
      }

      const bannerData: CreateProductBannerData = {
        image_url: productFormData.image_url,
        mobile_image_url: productFormData.mobile_image_url,
        link_url: productFormData.link_url || undefined,
        link_target: productFormData.link_target,
        device_type: "both",
        is_active: productFormData.is_active,
        start_at: productFormData.start_at ? new Date(productFormData.start_at).toISOString() : null,
        end_at: productFormData.end_at ? new Date(productFormData.end_at).toISOString() : null,
      };

      try {
        if (editingBanner) {
          await updateProductBanner.mutateAsync({ id: editingBanner.id, data: bannerData });
        } else {
          await createProductBanner.mutateAsync(bannerData);
        }
        toast({ title: "성공", description: editingBanner ? "배너가 수정되었습니다." : "배너가 등록되었습니다." });
        handleCloseDialog();
      } catch (error) {
        console.error("Banner save error:", error);
        toast({ title: "오류", description: "배너 저장에 실패했습니다.", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      if (activeTab === "main") {
        await deleteMainBanner.mutateAsync(id);
      } else {
        await deleteProductBanner.mutateAsync(id);
      }
      toast({ title: "성공", description: "배너가 삭제되었습니다." });
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "오류", description: "배너 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      if (activeTab === "main") {
        await toggleMainBannerActive.mutateAsync({ id, isActive: !currentStatus });
      } else {
        await toggleProductBannerActive.mutateAsync({ id, isActive: !currentStatus });
      }
      toast({
        title: "성공",
        description: !currentStatus ? "배너가 활성화되었습니다." : "배너가 비활성화되었습니다.",
      });
    } catch (error) {
      console.error("Toggle error:", error);
      toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const banners = activeTab === "main" ? [...mainBanners] : [...productBanners];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= banners.length) return;

    [banners[index], banners[newIndex]] = [banners[newIndex], banners[index]];

    const orderUpdates = banners.map((b, i) => ({ id: b.id, display_order: i }));

    try {
      if (activeTab === "main") {
        await updateMainBannerOrder.mutateAsync(orderUpdates);
      } else {
        await updateProductBannerOrder.mutateAsync(orderUpdates);
      }
      toast({ title: "성공", description: "순서가 변경되었습니다." });
    } catch (error) {
      console.error("Order update error:", error);
      toast({ title: "오류", description: "순서 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  const renderMainBannerTable = (banners: MainBanner[], loading: boolean) => {
    if (loading) {
      return <div className="text-center py-8">로딩중...</div>;
    }

    if (banners.length === 0) {
      return <div className="text-center py-8 text-gray-500">등록된 배너가 없습니다.</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">순서</TableHead>
            <TableHead className="w-24">PC</TableHead>
            <TableHead className="w-24">Mobile</TableHead>
            <TableHead className="w-20">상태</TableHead>
            <TableHead className="text-right w-40">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner, index) => (
            <TableRow key={banner.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveOrder(index, "up")}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveOrder(index, "down")}
                    disabled={index === banners.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {banner.image_url && (
                  <div className="relative w-20 h-12 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={banner.image_url}
                      alt="메인 배너 PC"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                {banner.mobile_image_url && (
                  <div className="relative w-20 h-12 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={banner.mobile_image_url}
                      alt="메인 배너 Mobile"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={banner.is_active}
                  onCheckedChange={() => handleToggleActive(banner.id, banner.is_active)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(banner)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderProductBannerTable = (banners: ProductBanner[], loading: boolean) => {
    if (loading) {
      return <div className="text-center py-8">로딩중...</div>;
    }

    if (banners.length === 0) {
      return <div className="text-center py-8 text-gray-500">등록된 배너가 없습니다.</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">순서</TableHead>
            <TableHead className="w-24">PC</TableHead>
            <TableHead className="w-24">Mobile</TableHead>
            <TableHead className="w-20">상태</TableHead>
            <TableHead className="w-32">기간</TableHead>
            <TableHead className="text-right w-40">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner, index) => (
            <TableRow key={banner.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveOrder(index, "up")}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveOrder(index, "down")}
                    disabled={index === banners.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {banner.image_url && (
                  <div className="relative w-20 h-12 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={banner.image_url}
                      alt="상품 배너 PC"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                {banner.mobile_image_url && (
                  <div className="relative w-20 h-12 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={banner.mobile_image_url}
                      alt="상품 배너 Mobile"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={banner.is_active}
                  onCheckedChange={() => handleToggleActive(banner.id, banner.is_active)}
                />
              </TableCell>
              <TableCell className="text-xs">
                {banner.start_at && banner.end_at ? (
                  <>
                    <div>{new Date(banner.start_at).toLocaleDateString()}</div>
                    <div>~ {new Date(banner.end_at).toLocaleDateString()}</div>
                  </>
                ) : (
                  <span className="text-gray-400">상시</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(banner)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">배너 관리</h1>
            <p className="text-gray-500">메인 배너와 상품 배너를 관리하세요</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            배너 등록
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "main" | "product")}>
          <TabsList className="mb-4">
            <TabsTrigger value="main">메인 배너</TabsTrigger>
            <TabsTrigger value="product">상품 배너</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <Card>
              <CardHeader>
                <CardTitle>메인 배너 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMainBannerTable(mainBanners, mainLoading)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="product">
            <Card>
              <CardHeader>
                <CardTitle>상품 배너 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {renderProductBannerTable(productBanners, productLoading)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Banner Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "배너 수정" : "배너 등록"} ({activeTab === "main" ? "메인" : "상품"})
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 메인 배너 폼 - 이미지만 */}
              {activeTab === "main" && (
                <>
                  <div className="space-y-2">
                    <Label>PC 이미지 *</Label>
                    <p className="text-xs text-blue-600 mb-2">
                      권장 크기: 1440 x 501px (비율 약 2.87:1)
                    </p>
                    <BannerImageUpload
                      currentImageUrl={mainFormData.image_url}
                      onUploadComplete={(url) => setMainFormData({ ...mainFormData, image_url: url })}
                      label="PC 이미지 선택"
                      aspectRatio="wide"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>모바일 이미지 *</Label>
                    <p className="text-xs text-blue-600 mb-2">
                      권장 크기: 393 x 153px (비율 약 2.57:1)
                    </p>
                    <BannerImageUpload
                      currentImageUrl={mainFormData.mobile_image_url}
                      onUploadComplete={(url) => setMainFormData({ ...mainFormData, mobile_image_url: url })}
                      label="모바일 이미지 선택"
                      aspectRatio="mobile"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={mainFormData.is_active}
                      onCheckedChange={(checked) => setMainFormData({ ...mainFormData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">활성화</Label>
                  </div>
                </>
              )}

              {/* 상품 배너 폼 - 이미지 + 링크 + 기간 */}
              {activeTab === "product" && (
                <>
                  <div className="space-y-2">
                    <Label>PC 이미지 *</Label>
                    <p className="text-xs text-blue-600 mb-2">
                      권장 크기: 1380 x 501px (비율 약 2.75:1)
                    </p>
                    <BannerImageUpload
                      currentImageUrl={productFormData.image_url}
                      onUploadComplete={(url) => setProductFormData({ ...productFormData, image_url: url })}
                      label="PC 이미지 선택"
                      aspectRatio="wide"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>모바일 이미지 *</Label>
                    <p className="text-xs text-blue-600 mb-2">
                      권장 크기: 378 x 137px (비율 약 2.76:1)
                    </p>
                    <BannerImageUpload
                      currentImageUrl={productFormData.mobile_image_url}
                      onUploadComplete={(url) => setProductFormData({ ...productFormData, mobile_image_url: url })}
                      label="모바일 이미지 선택"
                      aspectRatio="mobile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link_url">링크 URL</Label>
                    <Input
                      id="link_url"
                      value={productFormData.link_url}
                      onChange={(e) => setProductFormData({ ...productFormData, link_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>링크 열기 방식</Label>
                    <Select
                      value={productFormData.link_target}
                      onValueChange={(v: LinkTarget) => setProductFormData({ ...productFormData, link_target: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_self">현재 창</SelectItem>
                        <SelectItem value="_blank">새 창</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_at">시작일</Label>
                      <Input
                        id="start_at"
                        type="date"
                        value={productFormData.start_at}
                        onChange={(e) => setProductFormData({ ...productFormData, start_at: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_at">종료일</Label>
                      <Input
                        id="end_at"
                        type="date"
                        value={productFormData.end_at}
                        onChange={(e) => setProductFormData({ ...productFormData, end_at: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={productFormData.is_active}
                      onCheckedChange={(checked) => setProductFormData({ ...productFormData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">활성화</Label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createMainBanner.isPending || updateMainBanner.isPending ||
                            createProductBanner.isPending || updateProductBanner.isPending}
                >
                  {editingBanner ? "수정" : "등록"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
