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
}

export default function ProductOptionsManager({
  initialOptions = [],
  onOptionsChange,
}: Props) {
  const options = initialOptions;

  // 설정 자동 생성 (1개월, 2개월, 3개월)
  const generateSettings = (
    optionId: string,
    count: number,
    hasTypes: boolean
  ): ProductOptionSetting[] => {
    // count가 0이면 빈 배열 반환 (설정 없음)
    if (count === 0) return [];

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

  // 옵션에 설정(개월수)이 있는지 확인
  const hasSettings = (option: ProductOption): boolean => {
    return (option.settings?.length ?? 0) > 0;
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

  // 개월 개수 변경 (0 = 설정 없음)
  const updateSettingsCount = (optionId: string, count: number) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    // count가 0이면 설정 없음 (types도 없음)
    const currentHasTypes = count === 0 ? false : hasTypes(option);
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
      opt.id === optionId ? {
        ...opt,
        settings: updatedSettings,
        // 단계가 존재하면 재진 시 설정 사용하도록 자동 설정
        use_settings_on_revisit_with_consult: newHasTypes,
        use_settings_on_revisit_no_consult: newHasTypes,
      } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 옵션 가격 변경
  const updateOptionPrice = (optionId: string, price: number) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, price } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 옵션 할인율 변경
  const updateOptionDiscountRate = (optionId: string, discountRate: number) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, discount_rate: discountRate } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  // 대표 옵션 설정
  const setRepresentativeOption = (optionId: string) => {
    const updatedOptions = options.map((opt) => ({
      ...opt,
      is_representative: opt.id === optionId,
    }));
    onOptionsChange?.(updatedOptions);
  };

  // 옵션 할인가 계산
  const getDiscountedPrice = (option: ProductOption): number => {
    const discountRate = option.discount_rate || 0;
    if (discountRate > 0) {
      return Math.floor(option.price * (1 - discountRate / 100));
    }
    return option.price;
  };

  // 옵션 삭제
  const deleteOption = (optionId: string) => {
    const updatedOptions = options.filter((opt) => opt.id !== optionId);
    onOptionsChange?.(updatedOptions);
  };

  // 새 옵션 추가
  const addNewOption = () => {
    const optionId = `temp-${Date.now()}`;
    const isFirstOption = options.length === 0;
    const newOption: ProductOption = {
      id: optionId,
      product_id: "",
      name: "",
      price: 0,
      discount_rate: 0,
      is_representative: isFirstOption, // 첫 번째 옵션은 자동으로 대표로 설정
      use_settings_on_first: false,
      use_settings_on_revisit_with_consult: true,
      use_settings_on_revisit_no_consult: true,
      display_order: options.length,
      settings: [], // 기본: 설정 없음 (개월수/단계 불필요)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOptions = [...options, newOption];
    onOptionsChange?.(updatedOptions);
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
                <Select
                  value={String(option.settings?.length ?? 0)}
                  onValueChange={(value) =>
                    updateSettingsCount(option.id, parseInt(value))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">없음</SelectItem>
                    <SelectItem value="1">1개월</SelectItem>
                    <SelectItem value="2">2개월</SelectItem>
                    <SelectItem value="3">3개월</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 단계여부 - 개월수가 있을 때만 표시 */}
              {hasSettings(option) && (
                <>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label>단계여부</Label>
                    <Select
                      value={hasTypes(option) ? "존재" : "없음"}
                      onValueChange={(value) =>
                        updateHasTypes(option.id, value === "존재")
                      }
                    >
                      <SelectTrigger className="w-40">
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
                </>
              )}

              {/* 대표 옵션 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>대표 옵션</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="representative"
                    checked={option.is_representative || false}
                    onChange={() => setRepresentativeOption(option.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-500">
                    {option.is_representative ? "✓ 상품 목록에 이 옵션의 가격이 표시됩니다" : "선택하면 대표 옵션으로 설정됩니다"}
                  </span>
                </div>
              </div>

              {/* 가격 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>가격</Label>
                <Input
                  type="number"
                  value={option.price}
                  onChange={(e) =>
                    updateOptionPrice(
                      option.id,
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="옵션 가격"
                />
              </div>

              {/* 할인율 */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>할인율 (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={option.discount_rate || 0}
                    onChange={(e) =>
                      updateOptionDiscountRate(
                        option.id,
                        Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      )
                    }
                    placeholder="0"
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {(option.discount_rate || 0) > 0 ? (
                      <>
                        할인가: <span className="font-semibold text-red-500">{getDiscountedPrice(option).toLocaleString()}원</span>
                        <span className="text-gray-400 ml-1 line-through">{option.price.toLocaleString()}원</span>
                      </>
                    ) : (
                      `판매가: ${option.price.toLocaleString()}원`
                    )}
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
