"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { productOptionsQueries } from "@/queries/product-options.queries";
import { createAddon, deleteAddon, updateAddon } from "@/lib/actions/products";

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
  productId?: string;
  mode?: "create" | "edit";
  initialAddons?: ProductAddon[];
  onAddonsChange?: (addons: ProductAddon[]) => void;
}

export default function ProductAddonsManager({
  productId,
  mode = "edit",
  initialAddons = [],
  onAddonsChange,
}: Props) {
  const [addons, setAddons] = useState<ProductAddon[]>(initialAddons);
  const [loading, setLoading] = useState(mode === "edit");

  // New addon form
  const [newAddon, setNewAddon] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    is_available: true,
  });

  const shouldFetchConfiguration = mode === "edit" && !!productId;
  const { data: configurationData } = useQuery({
    ...productOptionsQueries.configuration(productId || ""),
    enabled: shouldFetchConfiguration,
  });

  useEffect(() => {
    if (shouldFetchConfiguration && configurationData) {
      setAddons(configurationData.addons as ProductAddon[]);
      setLoading(false);
    } else if (!shouldFetchConfiguration) {
      setLoading(false);
    }
  }, [shouldFetchConfiguration, configurationData]);

  // === Addons Management ===
  const addAddonItem = async () => {
    if (!newAddon.name.trim() || !newAddon.price) {
      alert("상품명과 가격은 필수 항목입니다.");
      return;
    }
    if (!newAddon.image_url.trim()) {
      alert("이미지를 업로드해주세요.");
      return;
    }

    try {
      if (mode === "create") {
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
        setAddons(updatedAddons);
        onAddonsChange?.(updatedAddons);
        setNewAddon({
          name: "",
          description: "",
          price: "",
          image_url: "",
          is_available: true,
        });
      } else {
        const result = await createAddon(productId!, {
          name: newAddon.name,
          description: newAddon.description || null,
          price: parseFloat(newAddon.price),
          image_url: newAddon.image_url || null,
          is_available: newAddon.is_available,
          display_order: addons.length,
        });

        if (!result.success) throw new Error(result.error);

        setAddons([...addons, result.data as ProductAddon]);
        setNewAddon({
          name: "",
          description: "",
          price: "",
          image_url: "",
          is_available: true,
        });
      }
    } catch (error: any) {
      console.error("Error adding addon:", error);
      alert(error.message || "추가상품 등록에 실패했습니다.");
    }
  };

  const deleteAddonItem = async (addonId: string) => {
    if (!confirm("이 추가상품을 삭제하시겠습니까?")) return;

    try {
      if (mode === "create") {
        const updatedAddons = addons.filter((a) => a.id !== addonId);
        setAddons(updatedAddons);
        onAddonsChange?.(updatedAddons);
      } else {
        const result = await deleteAddon(addonId);

        if (!result.success) throw new Error(result.error);
        setAddons(addons.filter((a) => a.id !== addonId));
      }
    } catch (error: any) {
      console.error("Error deleting addon:", error);
      alert(error.message || "추가상품 삭제에 실패했습니다.");
    }
  };

  const toggleAddonAvailability = async (
    addonId: string,
    isAvailable: boolean
  ) => {
    try {
      if (mode === "create") {
        const updatedAddons = addons.map((a) =>
          a.id === addonId ? { ...a, is_available: isAvailable } : a
        );
        setAddons(updatedAddons);
        onAddonsChange?.(updatedAddons);
      } else {
        const result = await updateAddon(addonId, {
          is_available: isAvailable,
        });

        if (!result.success) throw new Error(result.error);

        setAddons(
          addons.map((a) =>
            a.id === addonId ? { ...a, is_available: isAvailable } : a
          )
        );
      }
    } catch (error: any) {
      console.error("Error updating addon:", error);
      alert(error.message || "추가상품 업데이트에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>추가 상품 (선택 구매)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Addons */}
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="flex items-start gap-3 p-3 border rounded"
          >
            {addon.image_url && (
              <img
                src={addon.image_url}
                alt={addon.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <div className="font-semibold">{addon.name}</div>
              <div className="text-sm text-gray-500">{addon.description}</div>
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
              variant="destructive"
              onClick={() => deleteAddonItem(addon.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

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
