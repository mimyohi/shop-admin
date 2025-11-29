"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { fetchOptionSettingsWithTypes } from "@/lib/actions/product-options";
import { updateOrderItemOptionSettings } from "@/lib/actions/orders";
import { SelectedOptionSetting } from "@/models";

interface ProductOptionSetting {
  id: string;
  option_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_required: boolean;
  types?: ProductOptionSettingType[];
}

interface ProductOptionSettingType {
  id: string;
  setting_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_available: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: string;
  orderId: string;
  optionId: string;
  optionName: string;
  currentSelections?: SelectedOptionSetting[] | null;
  onSaved?: () => void;
}

export default function OptionSettingsSelector({
  open,
  onOpenChange,
  orderItemId,
  orderId,
  optionId,
  optionName,
  currentSelections = [],
  onSaved,
}: Props) {
  const [settings, setSettings] = useState<ProductOptionSetting[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && optionId) {
      loadSettings();
    }
  }, [open, optionId]);

  useEffect(() => {
    // Initialize selections from current selections
    if (currentSelections && currentSelections.length > 0) {
      const initialSelections: Record<string, string> = {};
      currentSelections.forEach((sel) => {
        initialSelections[sel.setting_id] = sel.type_id;
      });
      setSelections(initialSelections);
    } else {
      setSelections({});
    }
  }, [currentSelections, open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await fetchOptionSettingsWithTypes(optionId);
      if (result.success) {
        setSettings(result.data || []);
      } else {
        alert(result.error || "설정을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      alert("설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert selections to SelectedOptionSetting format
      const selectedOptionSettings: SelectedOptionSetting[] = Object.entries(
        selections
      )
        .map(([settingId, typeId]) => {
          const setting = settings.find((s) => s.id === settingId);
          if (!setting || !setting.types) return null;

          const type = setting.types.find((t) => t.id === typeId);
          if (!type) return null;

          return {
            setting_id: settingId,
            setting_name: setting.name,
            type_id: typeId,
            type_name: type.name,
          };
        })
        .filter((item): item is SelectedOptionSetting => item !== null);

      const result = await updateOrderItemOptionSettings(
        orderItemId,
        orderId,
        selectedOptionSettings
      );

      if (result.success) {
        onSaved?.();
        onOpenChange(false);
      } else {
        alert(result.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving selections:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>옵션 설정</DialogTitle>
          <DialogDescription>
            {optionName}의 설정을 선택하세요.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            로딩 중...
          </div>
        ) : settings.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            설정 가능한 항목이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {setting.name}
                </Label>
                <Select
                  value={selections[setting.id] || ""}
                  onValueChange={(value) =>
                    setSelections({ ...selections, [setting.id]: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="설정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.types?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
