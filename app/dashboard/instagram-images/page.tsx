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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  instagramImagesQueries,
  useCreateInstagramImage,
  useUpdateInstagramImage,
  useDeleteInstagramImage,
  useToggleInstagramImageActive,
  useUpdateInstagramImageOrder,
} from "@/queries/instagram-images.queries";
import { InstagramImage } from "@/models";
import { CreateInstagramImageData, UpdateInstagramImageData } from "@/types/instagram-images.types";
import BannerImageUpload from "@/components/BannerImageUpload";
import { PermissionGuard } from "@/components/permission-guard";
import Image from "next/image";

type ImageFormData = {
  image_url: string;
  link_url: string;
  is_active: boolean;
};

const initialFormData: ImageFormData = {
  image_url: "",
  link_url: "",
  is_active: true,
};

export default function InstagramImagesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<InstagramImage | null>(null);
  const [formData, setFormData] = useState<ImageFormData>(initialFormData);

  const { data, isLoading } = useQuery(
    instagramImagesQueries.list({ limit: "all" })
  );
  const createImage = useCreateInstagramImage();
  const updateImage = useUpdateInstagramImage();
  const deleteImage = useDeleteInstagramImage();
  const toggleActive = useToggleInstagramImageActive();
  const updateOrder = useUpdateInstagramImageOrder();

  const images = data?.images || [];

  const handleOpenDialog = (image?: InstagramImage) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        image_url: image.image_url,
        link_url: image.link_url || "",
        is_active: image.is_active,
      });
    } else {
      setEditingImage(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingImage(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url) {
      toast({ title: "오류", description: "이미지를 업로드해주세요.", variant: "destructive" });
      return;
    }

    const imageData: CreateInstagramImageData = {
      image_url: formData.image_url,
      link_url: formData.link_url || undefined,
      is_active: formData.is_active,
    };

    try {
      if (editingImage) {
        await updateImage.mutateAsync({ id: editingImage.id, data: imageData });
        toast({ title: "성공", description: "인스타그램 이미지가 수정되었습니다." });
      } else {
        await createImage.mutateAsync(imageData);
        toast({ title: "성공", description: "인스타그램 이미지가 등록되었습니다." });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Image save error:", error);
      toast({ title: "오류", description: "이미지 저장에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteImage.mutateAsync(id);
      toast({ title: "성공", description: "인스타그램 이미지가 삭제되었습니다." });
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "오류", description: "이미지 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, isActive: !currentStatus });
      toast({
        title: "성공",
        description: !currentStatus ? "이미지가 활성화되었습니다." : "이미지가 비활성화되었습니다.",
      });
    } catch (error) {
      console.error("Toggle error:", error);
      toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const imagesList = [...images];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= imagesList.length) return;

    [imagesList[index], imagesList[newIndex]] = [imagesList[newIndex], imagesList[index]];

    const orderUpdates = imagesList.map((img, i) => ({ id: img.id, display_order: i }));

    try {
      await updateOrder.mutateAsync(orderUpdates);
      toast({ title: "성공", description: "순서가 변경되었습니다." });
    } catch (error) {
      console.error("Order update error:", error);
      toast({ title: "오류", description: "순서 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">인스타그램 이미지 관리</h1>
            <p className="text-gray-500">홈 하단에 표시될 인스타그램 이미지를 관리하세요</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            이미지 등록
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>인스타그램 이미지 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">로딩중...</div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">등록된 이미지가 없습니다.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순서</TableHead>
                    <TableHead className="w-32">이미지</TableHead>
                    <TableHead>링크</TableHead>
                    <TableHead className="w-20">상태</TableHead>
                    <TableHead className="text-right w-40">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image, index) => (
                    <TableRow key={image.id}>
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
                            disabled={index === images.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={image.image_url}
                            alt="Instagram"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {image.link_url || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={image.is_active}
                          onCheckedChange={() => handleToggleActive(image.id, image.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(image)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(image.id)}
                          >
                            <Trash2 className="h-3 w-3" />
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

        {/* Image Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "인스타그램 이미지 수정" : "인스타그램 이미지 등록"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>이미지 *</Label>
                <BannerImageUpload
                  currentImageUrl={formData.image_url}
                  onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                  label="이미지 선택"
                  aspectRatio="square"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">인스타그램 링크</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">활성화</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createImage.isPending || updateImage.isPending}
                >
                  {editingImage ? "수정" : "등록"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
