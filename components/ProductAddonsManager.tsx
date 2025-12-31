"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url?: string | null;
  is_available: boolean;
  display_order: number;
}

interface Props {
  initialAddons?: ProductAddon[];
  onAddonsChange?: (addons: ProductAddon[]) => void;
}

export default function ProductAddonsManager({
  initialAddons = [],
  onAddonsChange,
}: Props) {
  const addons = initialAddons;

  // Editing state
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    name: string;
    description: string;
    price: string;
    image_url: string;
  }>({
    name: "",
    description: "",
    price: "",
    image_url: "",
  });

  // New addon form
  const [newAddon, setNewAddon] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    is_available: true,
  });

  // === Editing Functions ===
  const startEditingAddon = (addon: ProductAddon) => {
    setEditingAddonId(addon.id);
    setEditingData({
      name: addon.name,
      description: addon.description || "",
      price: addon.price.toString(),
      image_url: addon.image_url || "",
    });
  };

  const cancelEditingAddon = () => {
    setEditingAddonId(null);
    setEditingData({
      name: "",
      description: "",
      price: "",
      image_url: "",
    });
  };

  const saveEditingAddon = () => {
    if (!editingData.name.trim() || !editingData.price) {
      alert("상품명과 가격은 필수 항목입니다.");
      return;
    }
    if (!editingData.image_url.trim()) {
      alert("이미지를 업로드해주세요.");
      return;
    }

    const updatedAddons = addons.map((a) =>
      a.id === editingAddonId
        ? {
            ...a,
            name: editingData.name,
            description: editingData.description || null,
            price: parseFloat(editingData.price),
            image_url: editingData.image_url || null,
          }
        : a
    );
    onAddonsChange?.(updatedAddons);
    cancelEditingAddon();
  };

  // === Addons Management ===
  const addAddonItem = () => {
    if (!newAddon.name.trim() || !newAddon.price) {
      alert("상품명과 가격은 필수 항목입니다.");
      return;
    }
    if (!newAddon.image_url.trim()) {
      alert("이미지를 업로드해주세요.");
      return;
    }

    const newAddonData: ProductAddon = {
      id: `temp-addon-${Date.now()}`,
      product_id: "",
      name: newAddon.name,
      description: newAddon.description || null,
      price: parseFloat(newAddon.price),
      image_url: newAddon.image_url || null,
      is_available: newAddon.is_available,
      display_order: addons.length,
    };
    const updatedAddons = [...addons, newAddonData];
    onAddonsChange?.(updatedAddons);
    setNewAddon({
      name: "",
      description: "",
      price: "",
      image_url: "",
      is_available: true,
    });
  };

  const deleteAddonItem = (addonId: string) => {
    if (!confirm("이 추가상품을 삭제하시겠습니까?")) return;

    const updatedAddons = addons.filter((a) => a.id !== addonId);
    onAddonsChange?.(updatedAddons);
  };

  const toggleAddonAvailability = (addonId: string, isAvailable: boolean) => {
    const updatedAddons = addons.map((a) =>
      a.id === addonId ? { ...a, is_available: isAvailable } : a
    );
    onAddonsChange?.(updatedAddons);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>추가 상품 (선택 구매)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Addons */}
        {addons.map((addon) => {
          const isEditing = editingAddonId === addon.id;

          return (
            <div
              key={addon.id}
              className="flex items-start gap-3 p-3 border rounded"
            >
              {/* 편집 모드 */}
              {isEditing ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="상품명"
                      value={editingData.name}
                      onChange={(e) =>
                        setEditingData({ ...editingData, name: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="가격"
                      value={editingData.price}
                      onChange={(e) =>
                        setEditingData({ ...editingData, price: e.target.value })
                      }
                    />
                  </div>
                  <Input
                    placeholder="설명 (선택사항)"
                    value={editingData.description}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        description: e.target.value,
                      })
                    }
                  />
                  <div className="space-y-2">
                    <Label className="text-sm">추가상품 이미지</Label>
                    <ImageUpload
                      currentImageUrl={editingData.image_url}
                      onUploadComplete={(url) =>
                        setEditingData({ ...editingData, image_url: url })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveEditingAddon}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      저장
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingAddon}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 보기 모드 */}
                  {addon.image_url && (
                    <img
                      src={addon.image_url}
                      alt={addon.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{addon.name}</div>
                    <div className="text-sm text-gray-500">
                      {addon.description}
                    </div>
                    <div className="text-sm">
                      가격: {addon.price.toLocaleString()}원
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={addon.is_available}
                      onCheckedChange={(checked) =>
                        toggleAddonAvailability(addon.id, checked as boolean)
                      }
                    />
                    <Label className="text-sm">판매중</Label>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEditingAddon(addon)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAddonItem(addon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        })}

        {/* Add New Addon */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold mb-3">새 추가상품 등록</h4>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="상품명"
                value={newAddon.name}
                onChange={(e) =>
                  setNewAddon({ ...newAddon, name: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="가격"
                value={newAddon.price}
                onChange={(e) =>
                  setNewAddon({ ...newAddon, price: e.target.value })
                }
              />
            </div>
            <Input
              placeholder="설명 (선택사항)"
              value={newAddon.description}
              onChange={(e) =>
                setNewAddon({ ...newAddon, description: e.target.value })
              }
            />
            <div className="space-y-2">
              <Label className="text-sm">
                추가상품 이미지 <span className="text-red-500">*</span>
              </Label>
              <ImageUpload
                currentImageUrl={newAddon.image_url}
                onUploadComplete={(url) =>
                  setNewAddon({ ...newAddon, image_url: url })
                }
              />
            </div>
            <Button type="button" onClick={addAddonItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
