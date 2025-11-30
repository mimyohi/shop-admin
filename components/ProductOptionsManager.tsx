"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ProductOption, ProductOptionSetting } from "@/models";

interface Props {
  initialOptions?: ProductOption[];
  onOptionsChange?: (options: ProductOption[]) => void;
  basePrice?: number;
}

export default function ProductOptionsManager({
  initialOptions = [],
  onOptionsChange,
  basePrice = 0,
}: Props) {
  const options = initialOptions;

  // 설정 자동 생성 (1개월, 2개월, 3개월)
  const generateSettings = (
    optionId: string,
    count: number,
    hasTypes: boolean
  ): ProductOptionSetting[] => {
    const settingNames = ["1개월", "2개월", "3개월"];
    const typeNames = ["1단계", "2단계", "3단계"];

    return settingNames.slice(0, count).map((name, index) => {
      const settingId = `temp-setting-${Date.now()}-${index}`;
      return {
        id: settingId,
        option_id: optionId,
        name,
        display_order: index,
        types: hasTypes
          ? typeNames.map((typeName, typeIndex) => ({
              id: `temp-type-${Date.now()}-${index}-${typeIndex}`,
              setting_id: settingId,
              name: typeName,
              is_available: true,
              display_order: typeIndex,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  };

  // 옵션의 타입 존재 여부 확인
  const hasTypes = (option: ProductOption): boolean => {
    return (
      option.settings?.some(
        (setting) => setting.types && setting.types.length > 0
      ) ?? false
    );
  };

  // 옵션명 변경
  const updateOptionName = (optionId: string, name: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, name } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 개월 개수 변경
  const updateSettingsCount = (optionId: string, count: number) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    const currentHasTypes = hasTypes(option);
    const newSettings = generateSettings(optionId, count, currentHasTypes);

    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, settings: newSettings } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 단계여부 변경
  const updateHasTypes = (optionId: string, newHasTypes: boolean) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    const typeNames = ["1단계", "2단계", "3단계"];
    const timestamp = Date.now();

    // settings가 없거나 비어있으면 기본 설정 1개 생성
    let currentSettings = option.settings || [];
    if (currentSettings.length === 0) {
      const defaultSettingId = `temp-setting-${timestamp}-0`;
      currentSettings = [
        {
          id: defaultSettingId,
          option_id: optionId,
          name: "1개월",
          display_order: 0,
          types: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    const updatedSettings = currentSettings.map((setting, settingIndex) => ({
      ...setting,
      types: newHasTypes
        ? typeNames.map((typeName, typeIndex) => ({
            id: `temp-type-${timestamp}-${settingIndex}-${typeIndex}`,
            setting_id: setting.id,
            name: typeName,
            is_available: true,
            display_order: typeIndex,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        : [],
    }));

    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, settings: updatedSettings } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 가격 변경 (실제 가격 입력 → 추가가격 계산)
  const updateOptionPrice = (optionId: string, actualPrice: number) => {
    const additionalPrice = actualPrice - basePrice;
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, price: additionalPrice } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 옵션 삭제
  const deleteOption = (optionId: string) => {
    const updatedOptions = options.filter((opt) => opt.id !== optionId);
    onOptionsChange?.(updatedOptions);
  };

  // 새 옵션 추가
  const addNewOption = () => {
    const optionId = `temp-${Date.now()}`;
    const newOption: ProductOption = {
      id: optionId,
      product_id: "",
      name: "",
      price: 0,
      use_settings_on_first: false,
      use_settings_on_revisit_with_consult: true,
      use_settings_on_revisit_no_consult: true,
      display_order: options.length,
      settings: generateSettings(optionId, 1, true), // 기본 1개월, 단계 있음
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOptions = [...options, newOption];
    onOptionsChange?.(updatedOptions);
  };

  // 실제 가격 계산 (추가가격 + 기본가격)
  const getActualPrice = (option: ProductOption): number => {
    return basePrice + option.price;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>상품 옵션</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => (
          <Card key={option.id}>
            <CardContent className="p-6 space-y-4">
              {/* 상품명 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>상품명</Label>
                <Input
                  value={option.name}
                  onChange={(e) => updateOptionName(option.id, e.target.value)}
                  placeholder="예: 채유패키지 - 2개월"
                />
              </div>

              {/* 개월 개수 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>개월수</Label>
                <Input
                  type="number"
                  min={1}
                  max={3}
                  value={option.settings?.length || 1}
                  onChange={(e) => {
                    const count = Math.min(
                      3,
                      Math.max(1, parseInt(e.target.value) || 1)
                    );
                    updateSettingsCount(option.id, count);
                  }}
                />
              </div>

              {/* 단계여부 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>단계여부</Label>
                <Select
                  value={hasTypes(option) ? "존재" : "없음"}
                  onValueChange={(value) =>
                    updateHasTypes(option.id, value === "존재")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="존재">존재</SelectItem>
                    <SelectItem value="없음">없음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasTypes(option) && (
                <p className="text-sm text-gray-500 ml-[136px]">
                  단계는 재진인 사람에게만 노출됩니다.
                </p>
              )}

              {/* 가격 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>가격</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={getActualPrice(option)}
                    onChange={(e) =>
                      updateOptionPrice(
                        option.id,
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="실제 판매 가격"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    (추가가격: {option.price >= 0 ? "+" : ""}
                    {option.price.toLocaleString()}원)
                  </span>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteOption(option.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 옵션 추가 버튼 */}
        <Button
          type="button"
          onClick={addNewOption}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          옵션 추가
        </Button>
      </CardContent>
    </Card>
  );
}
