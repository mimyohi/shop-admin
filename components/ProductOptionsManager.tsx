"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { ProductOption, ProductOptionSetting } from "@/models";

interface Props {
  initialOptions?: ProductOption[];
  onOptionsChange?: (options: ProductOption[]) => void;
}

interface ExpandedState {
  [optionId: string]: {
    option: boolean;
    settings: {
      [settingId: string]: boolean;
    };
  };
}

export default function ProductOptionsManager({
  initialOptions = [],
  onOptionsChange,
}: Props) {
  const options = initialOptions;
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Default setup dialog
  const [showDefaultSetupDialog, setShowDefaultSetupDialog] = useState(false);
  const [selectedDefaultOptions, setSelectedDefaultOptions] = useState({
    oneMonth: true,
    twoMonths: true,
    threeMonths: true,
  });

  // New option form
  const [newOption, setNewOption] = useState({
    name: "",
    price: "",
    /** @note 일단은 기본값으로 아래와 같이 설정 */
    use_settings_on_first: false,
    use_settings_on_revisit_with_consult: true,
    use_settings_on_revisit_no_consult: true,
  });

  // New setting forms (keyed by option id)
  const [newSettings, setNewSettings] = useState<{
    [optionId: string]: {
      name: string;
    };
  }>({});

  // New type forms (keyed by setting id)
  const [newTypes, setNewTypes] = useState<{
    [settingId: string]: {
      name: string;
      is_available: boolean;
    };
  }>({});

  const addOption = () => {
    if (!newOption.name.trim()) {
      alert("옵션명은 필수 항목입니다.");
      return;
    }
    if (!newOption.price) {
      alert("추가 가격은 필수 항목입니다.");
      return;
    }

    const newOptionData: ProductOption = {
      id: `temp-${Date.now()}`,
      product_id: "",
      name: newOption.name,
      price: parseFloat(newOption.price) || 0,
      use_settings_on_first: newOption.use_settings_on_first,
      use_settings_on_revisit_with_consult:
        newOption.use_settings_on_revisit_with_consult,
      use_settings_on_revisit_no_consult:
        newOption.use_settings_on_revisit_no_consult,
      display_order: options.length,
      settings: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOptions = [...options, newOptionData];
    onOptionsChange?.(updatedOptions);

    // Reset form
    setNewOption({
      name: "",
      price: "",
      use_settings_on_first: false,
      use_settings_on_revisit_with_consult: true,
      use_settings_on_revisit_no_consult: true,
    });
  };

  const toggleOptionExpanded = (optionId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        option: !prev[optionId]?.option,
        settings: prev[optionId]?.settings || {},
      },
    }));
  };

  const toggleSettingExpanded = (optionId: string, settingId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        option: prev[optionId]?.option ?? false,
        settings: {
          ...prev[optionId]?.settings,
          [settingId]: !prev[optionId]?.settings?.[settingId],
        },
      },
    }));
  };

  const deleteOption = (optionId: string) => {
    if (!confirm("이 옵션과 모든 하위 설정/타입을 삭제하시겠습니까?")) return;

    const updatedOptions = options.filter((opt) => opt.id !== optionId);
    onOptionsChange?.(updatedOptions);
  };

  const updateOptionField = (optionId: string, field: string, value: any) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    );
    onOptionsChange?.(updatedOptions);
  };

  const addSetting = (optionId: string) => {
    const newSetting = newSettings[optionId];
    if (!newSetting?.name.trim()) {
      alert("설정명은 필수 항목입니다.");
      return;
    }

    const option = options.find((o) => o.id === optionId);

    const newSettingData: ProductOptionSetting = {
      id: `temp-setting-${Date.now()}`,
      option_id: optionId,
      name: newSetting.name,
      display_order: option?.settings?.length || 0,
      types: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOptions = options.map((opt) =>
      opt.id === optionId
        ? { ...opt, settings: [...(opt.settings || []), newSettingData] }
        : opt
    );
    onOptionsChange?.(updatedOptions);

    setNewSettings((prev) => ({
      ...prev,
      [optionId]: {
        name: "",
      },
    }));
  };

  const deleteSetting = (settingId: string) => {
    if (!confirm("이 설정과 모든 하위 타입을 삭제하시겠습니까?")) return;

    const updatedOptions = options.map((opt) => ({
      ...opt,
      settings: opt.settings?.filter((s) => s.id !== settingId),
    }));
    onOptionsChange?.(updatedOptions);
  };

  // === Type Management ===
  const initNewType = (settingId: string) => {
    if (!newTypes[settingId]) {
      setNewTypes((prev) => ({
        ...prev,
        [settingId]: {
          name: "",
          is_available: true,
        },
      }));
    }
  };

  const addType = (settingId: string) => {
    const newType = newTypes[settingId];
    if (!newType?.name.trim()) {
      alert("타입명은 필수 항목입니다.");
      return;
    }

    let setting: ProductOptionSetting | undefined;
    for (const option of options) {
      setting = option.settings?.find((s) => s.id === settingId);
      if (setting) break;
    }

    const newTypeData = {
      id: `temp-type-${Date.now()}`,
      setting_id: settingId,
      name: newType.name,
      is_available: newType.is_available,
      display_order: setting?.types?.length || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedOptions = options.map((opt) => ({
      ...opt,
      settings: opt.settings?.map((s) =>
        s.id === settingId
          ? { ...s, types: [...(s.types || []), newTypeData] }
          : s
      ),
    }));
    onOptionsChange?.(updatedOptions);

    setNewTypes((prev) => ({
      ...prev,
      [settingId]: {
        name: "",
        is_available: true,
      },
    }));
  };

  const deleteType = (typeId: string) => {
    if (!confirm("이 타입을 삭제하시겠습니까?")) return;

    const updatedOptions = options.map((opt) => ({
      ...opt,
      settings: opt.settings?.map((setting) => ({
        ...setting,
        types: setting.types?.filter((t) => t.id !== typeId),
      })),
    }));
    onOptionsChange?.(updatedOptions);
  };

  // === Default Setup ===
  const openDefaultSetupDialog = () => {
    setShowDefaultSetupDialog(true);
  };

  const applyDefaultOptions = () => {
    setShowDefaultSetupDialog(false);

    const defaultOptionsData = [];
    if (selectedDefaultOptions.oneMonth) {
      defaultOptionsData.push({ name: "1개월", price: 0 });
    }
    if (selectedDefaultOptions.twoMonths) {
      defaultOptionsData.push({ name: "2개월", price: 0 });
    }
    if (selectedDefaultOptions.threeMonths) {
      defaultOptionsData.push({ name: "3개월", price: 0 });
    }

    if (defaultOptionsData.length === 0) {
      alert("최소 하나의 옵션을 선택해주세요.");
      return;
    }

    const defaultSettings = ["1개월", "2개월", "3개월"];
    const defaultTypes = ["1단계", "2단계", "3단계"];

    const newOptions: ProductOption[] = [];

    // Create options with settings and types
    for (let i = 0; i < defaultOptionsData.length; i++) {
      const optionData = defaultOptionsData[i];
      const optionId = `temp-${Date.now()}-${i}`;

      const settings = defaultSettings.map((settingName, j) => {
        const settingId = `temp-setting-${Date.now()}-${i}-${j}`;
        const types = defaultTypes.map((typeName, k) => ({
          id: `temp-type-${Date.now()}-${i}-${j}-${k}`,
          setting_id: settingId,
          name: typeName,
          is_available: true,
          display_order: k,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        return {
          id: settingId,
          option_id: optionId,
          name: settingName,
          display_order: j,
          types,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      newOptions.push({
        id: optionId,
        product_id: "",
        name: optionData.name,
        price: optionData.price,
        use_settings_on_first: true,
        use_settings_on_revisit_with_consult: true,
        use_settings_on_revisit_no_consult: true,
        display_order: options.length + i,
        settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const updatedOptions = [...options, ...newOptions];
    onOptionsChange?.(updatedOptions);

    alert("기본 옵션이 성공적으로 생성되었습니다.");

    // Reset selection
    setSelectedDefaultOptions({
      oneMonth: true,
      twoMonths: true,
      threeMonths: true,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>상품 옵션 관리</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                옵션: 유저가 선택하는 상품 단위(ex.1개월 패키지, 2개월 패키지,
                3개월 패키지)
              </p>
              <p className="text-sm text-gray-500 mt-2">
                설정: 유저가 선택한 옵션에 대해서 설정을 무조건 해야하는
                값(ex.첫번째 개월,두번째 개월,세번째 개월) -{" "}
                <b className="text-black">
                  다만 초진인 경우 유저가 설정하지 않고 상담 이후에 결정됨
                </b>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                타입: 각 설정에 대해서 유저가 선택할 수 있는
                값(ex.1단계,2단계,3단계)
              </p>
            </div>
            <Button
              type="button"
              onClick={openDefaultSetupDialog}
              variant="outline"
              className="ml-4"
            >
              기본 옵션 세팅
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Options */}
          {options.map((option) => (
            <div key={option.id} className="border rounded-lg">
              {/* Option Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-start gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOptionExpanded(option.id)}
                    className="p-0 h-6 w-6"
                  >
                    {expanded[option.id]?.option ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{option.name}</div>
                    <div className="text-sm text-gray-600">
                      추가 가격: +{option.price.toLocaleString()}원
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteOption(option.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Option Details (Expanded) */}
              {expanded[option.id]?.option && (
                <div className="p-4 space-y-4">
                  {/* Option Edit Section */}
                  <div className="space-y-3 border-b pb-4">
                    <h4 className="font-semibold text-sm">옵션 정보 수정</h4>

                    <div className="grid gap-3">
                      <div>
                        <Label className="text-xs">추가 가격</Label>
                        <Input
                          type="number"
                          value={option.price}
                          onChange={(e) =>
                            updateOptionField(
                              option.id,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">설정 목록</h4>
                    {option.settings && option.settings.length > 0 ? (
                      option.settings.map((setting) => (
                        <div
                          key={setting.id}
                          className="border rounded-lg ml-4"
                        >
                          {/* Setting Header */}
                          <div className="p-3 bg-blue-50 border-b">
                            <div className="flex items-start gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleSettingExpanded(option.id, setting.id)
                                }
                                className="p-0 h-5 w-5"
                              >
                                {expanded[option.id]?.settings?.[setting.id] ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">
                                  {setting.name}
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteSetting(setting.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Setting Details (Expanded) */}
                          {expanded[option.id]?.settings?.[setting.id] && (
                            <div className="p-3 space-y-3">
                              {/* Types List */}
                              <div className="space-y-2">
                                <h5 className="font-semibold text-xs">
                                  타입 목록
                                </h5>
                                {setting.types && setting.types.length > 0 ? (
                                  setting.types.map((type) => (
                                    <div
                                      key={type.id}
                                      className="flex items-start gap-2 p-2 border rounded ml-4"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-xs">
                                          {type.name}
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteType(type.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-500 ml-4">
                                    타입이 없습니다
                                  </div>
                                )}
                              </div>

                              {/* Add New Type */}
                              <div className="border-t pt-3 ml-4">
                                <h5 className="font-semibold text-xs mb-2">
                                  새 타입 추가
                                </h5>
                                <div className="grid gap-2">
                                  <Input
                                    placeholder="타입명 *"
                                    value={newTypes[setting.id]?.name || ""}
                                    onChange={(e) =>
                                      setNewTypes((prev) => ({
                                        ...prev,
                                        [setting.id]: {
                                          ...prev[setting.id],
                                          name: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addType(setting.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    타입 추가
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 ml-4">
                        설정이 없습니다
                      </div>
                    )}
                  </div>

                  {/* Add New Setting */}
                  <div className="border-t pt-4 ml-4">
                    <h4 className="font-semibold text-sm mb-3">새 설정 추가</h4>
                    <div className="grid gap-2">
                      <Input
                        placeholder="설정명 *"
                        value={newSettings[option.id]?.name || ""}
                        onChange={(e) =>
                          setNewSettings((prev) => ({
                            ...prev,
                            [option.id]: {
                              ...prev[option.id],
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addSetting(option.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        설정 추가
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Option */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">새 옵션 추가</h3>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="옵션명 *"
                  value={newOption.name}
                  onChange={(e) =>
                    setNewOption({ ...newOption, name: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="추가 가격 *"
                  value={newOption.price}
                  onChange={(e) =>
                    setNewOption({ ...newOption, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Button type="button" onClick={addOption} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  옵션 추가
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Setup Dialog */}
      <Dialog
        open={showDefaultSetupDialog}
        onOpenChange={setShowDefaultSetupDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기본 옵션 세팅</DialogTitle>
            <DialogDescription>
              추가할 옵션을 선택해주세요. 각 옵션에는 1/2/3개월 설정과 1/2/3단계
              타입이 자동으로 추가됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="oneMonth"
                checked={selectedDefaultOptions.oneMonth}
                onCheckedChange={(checked) =>
                  setSelectedDefaultOptions({
                    ...selectedDefaultOptions,
                    oneMonth: checked as boolean,
                  })
                }
              />
              <Label htmlFor="oneMonth" className="cursor-pointer">
                1개월 옵션
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="twoMonths"
                checked={selectedDefaultOptions.twoMonths}
                onCheckedChange={(checked) =>
                  setSelectedDefaultOptions({
                    ...selectedDefaultOptions,
                    twoMonths: checked as boolean,
                  })
                }
              />
              <Label htmlFor="twoMonths" className="cursor-pointer">
                2개월 옵션
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="threeMonths"
                checked={selectedDefaultOptions.threeMonths}
                onCheckedChange={(checked) =>
                  setSelectedDefaultOptions({
                    ...selectedDefaultOptions,
                    threeMonths: checked as boolean,
                  })
                }
              />
              <Label htmlFor="threeMonths" className="cursor-pointer">
                3개월 옵션
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDefaultSetupDialog(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={applyDefaultOptions}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
