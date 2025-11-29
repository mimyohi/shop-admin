"use client";

import { useState, useEffect } from "react";
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
import {
  fetchOptionsByProductId,
  fetchOptionSettingsWithTypes,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  createProductOptionSetting,
  updateProductOptionSetting,
  deleteProductOptionSetting,
  createProductOptionSettingType,
  updateProductOptionSettingType,
  deleteProductOptionSettingType,
} from "@/lib/actions/product-options";
import { ProductOption, ProductOptionSetting } from "@/models";

interface Props {
  productId?: string;
  mode?: "create" | "edit";
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
  productId,
  mode = "edit",
}: Props) {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
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
    use_settings_on_first: false,
    use_settings_on_revisit_with_consult: false,
    use_settings_on_revisit_no_consult: false,
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

  useEffect(() => {
    if (mode === "edit" && productId) {
      loadOptions();
    }
  }, [mode, productId]);

  const loadOptions = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const result = await fetchOptionsByProductId(productId);
      if (result.success) {
        const optionsData = result.data || [];

        // Load settings and types for each option
        const optionsWithDetails = await Promise.all(
          optionsData.map(async (option) => {
            const settingsResult = await fetchOptionSettingsWithTypes(
              option.id
            );
            return {
              ...option,
              settings: settingsResult.success ? settingsResult.data : [],
            };
          })
        );

        setOptions(optionsWithDetails);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    } finally {
      setLoading(false);
    }
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

  // === Option Management ===
  const addOption = async () => {
    if (!newOption.name.trim() || !newOption.price) {
      alert("옵션명과 추가 가격은 필수 항목입니다.");
      return;
    }

    if (mode === "create") {
      alert("상품을 먼저 생성한 후에 옵션을 추가할 수 있습니다.");
      return;
    }

    try {
      const result = await createProductOption(productId!, {
        name: newOption.name,
        price: parseFloat(newOption.price),
        use_settings_on_first: newOption.use_settings_on_first,
        use_settings_on_revisit_with_consult:
          newOption.use_settings_on_revisit_with_consult,
        use_settings_on_revisit_no_consult:
          newOption.use_settings_on_revisit_no_consult,
        display_order: options.length,
      });

      if (!result.success) throw new Error(result.error);

      await loadOptions();
      setNewOption({
        name: "",
        price: "",
        use_settings_on_first: false,
        use_settings_on_revisit_with_consult: false,
        use_settings_on_revisit_no_consult: false,
      });
    } catch (error: any) {
      console.error("Error adding option:", error);
      alert(error.message || "옵션 등록에 실패했습니다.");
    }
  };

  const deleteOption = async (optionId: string) => {
    if (!confirm("이 옵션과 모든 하위 설정/타입을 삭제하시겠습니까?")) return;

    try {
      const result = await deleteProductOption(optionId);
      if (!result.success) throw new Error(result.error);

      await loadOptions();
    } catch (error: any) {
      console.error("Error deleting option:", error);
      alert(error.message || "옵션 삭제에 실패했습니다.");
    }
  };

  const updateOptionField = async (
    optionId: string,
    field: string,
    value: any
  ) => {
    try {
      const result = await updateProductOption(optionId, { [field]: value });
      if (!result.success) throw new Error(result.error);

      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId ? { ...opt, [field]: value } : opt
        )
      );
    } catch (error: any) {
      console.error("Error updating option:", error);
      alert(error.message || "옵션 업데이트에 실패했습니다.");
    }
  };

  // === Setting Management ===
  const initNewSetting = (optionId: string) => {
    if (!newSettings[optionId]) {
      setNewSettings((prev) => ({
        ...prev,
        [optionId]: {
          name: "",
        },
      }));
    }
  };

  const addSetting = async (optionId: string) => {
    const newSetting = newSettings[optionId];
    if (!newSetting?.name.trim()) {
      alert("설정명은 필수 항목입니다.");
      return;
    }

    try {
      const option = options.find((o) => o.id === optionId);
      const result = await createProductOptionSetting(optionId, {
        name: newSetting.name,
        display_order: option?.settings?.length || 0,
      });

      if (!result.success) throw new Error(result.error);

      await loadOptions();
      setNewSettings((prev) => ({
        ...prev,
        [optionId]: {
          name: "",
        },
      }));
    } catch (error: any) {
      console.error("Error adding setting:", error);
      alert(error.message || "설정 등록에 실패했습니다.");
    }
  };

  const deleteSetting = async (settingId: string) => {
    if (!confirm("이 설정과 모든 하위 타입을 삭제하시겠습니까?")) return;

    try {
      const result = await deleteProductOptionSetting(settingId);
      if (!result.success) throw new Error(result.error);

      await loadOptions();
    } catch (error: any) {
      console.error("Error deleting setting:", error);
      alert(error.message || "설정 삭제에 실패했습니다.");
    }
  };

  const updateSettingField = async (
    settingId: string,
    field: string,
    value: any
  ) => {
    try {
      const result = await updateProductOptionSetting(settingId, {
        [field]: value,
      });
      if (!result.success) throw new Error(result.error);

      setOptions((prev) =>
        prev.map((opt) => ({
          ...opt,
          settings: opt.settings?.map((setting) =>
            setting.id === settingId ? { ...setting, [field]: value } : setting
          ),
        }))
      );
    } catch (error: any) {
      console.error("Error updating setting:", error);
      alert(error.message || "설정 업데이트에 실패했습니다.");
    }
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

  const addType = async (settingId: string) => {
    const newType = newTypes[settingId];
    if (!newType?.name.trim()) {
      alert("타입명은 필수 항목입니다.");
      return;
    }

    try {
      let setting: ProductOptionSetting | undefined;
      for (const option of options) {
        setting = option.settings?.find((s) => s.id === settingId);
        if (setting) break;
      }

      const result = await createProductOptionSettingType(settingId, {
        name: newType.name,
        is_available: newType.is_available,
        display_order: setting?.types?.length || 0,
      });

      if (!result.success) throw new Error(result.error);

      await loadOptions();
      setNewTypes((prev) => ({
        ...prev,
        [settingId]: {
          name: "",
          is_available: true,
        },
      }));
    } catch (error: any) {
      console.error("Error adding type:", error);
      alert(error.message || "타입 등록에 실패했습니다.");
    }
  };

  const deleteType = async (typeId: string) => {
    if (!confirm("이 타입을 삭제하시겠습니까?")) return;

    try {
      const result = await deleteProductOptionSettingType(typeId);
      if (!result.success) throw new Error(result.error);

      await loadOptions();
    } catch (error: any) {
      console.error("Error deleting type:", error);
      alert(error.message || "타입 삭제에 실패했습니다.");
    }
  };

  const updateTypeField = async (typeId: string, field: string, value: any) => {
    try {
      const result = await updateProductOptionSettingType(typeId, {
        [field]: value,
      });
      if (!result.success) throw new Error(result.error);

      setOptions((prev) =>
        prev.map((opt) => ({
          ...opt,
          settings: opt.settings?.map((setting) => ({
            ...setting,
            types: setting.types?.map((type) =>
              type.id === typeId ? { ...type, [field]: value } : type
            ),
          })),
        }))
      );
    } catch (error: any) {
      console.error("Error updating type:", error);
      alert(error.message || "타입 업데이트에 실패했습니다.");
    }
  };

  // === Default Setup ===
  const openDefaultSetupDialog = () => {
    if (!productId) {
      alert("상품을 먼저 생성해주세요.");
      return;
    }
    setShowDefaultSetupDialog(true);
  };

  const applyDefaultOptions = async () => {
    try {
      setLoading(true);
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
        setLoading(false);
        return;
      }

      const defaultSettings = ["1개월", "2개월", "3개월"];
      const defaultTypes = ["1단계", "2단계", "3단계"];

      // Create options with settings and types
      for (let i = 0; i < defaultOptionsData.length; i++) {
        const optionData = defaultOptionsData[i];

        // Create option
        const optionResult = await createProductOption(productId!, {
          name: optionData.name,
          price: optionData.price,
          use_settings_on_first: true,
          use_settings_on_revisit_with_consult: true,
          use_settings_on_revisit_no_consult: true,
          display_order: options.length + i,
        });

        if (!optionResult.success || !optionResult.data) {
          throw new Error(`${optionData.name} 옵션 생성 실패: ${optionResult.error}`);
        }

        const optionId = optionResult.data.id;

        // Create settings for this option
        for (let j = 0; j < defaultSettings.length; j++) {
          const settingName = defaultSettings[j];

          const settingResult = await createProductOptionSetting(optionId, {
            name: settingName,
            display_order: j,
          });

          if (!settingResult.success || !settingResult.data) {
            throw new Error(`${settingName} 설정 생성 실패: ${settingResult.error}`);
          }

          const settingId = settingResult.data.id;

          // Create types for this setting
          for (let k = 0; k < defaultTypes.length; k++) {
            const typeName = defaultTypes[k];

            const typeResult = await createProductOptionSettingType(settingId, {
              name: typeName,
              is_available: true,
              display_order: k,
            });

            if (!typeResult.success) {
              throw new Error(`${typeName} 타입 생성 실패: ${typeResult.error}`);
            }
          }
        }
      }

      alert("기본 옵션이 성공적으로 생성되었습니다.");
      await loadOptions();

      // Reset selection
      setSelectedDefaultOptions({
        oneMonth: true,
        twoMonths: true,
        threeMonths: true,
      });
    } catch (error: any) {
      console.error("Error setting default options:", error);
      alert(error.message || "기본 옵션 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "create") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상품 옵션</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            상품을 먼저 생성한 후에 옵션을 추가할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-sm text-gray-500">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>상품 옵션 관리</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              옵션 → 설정 → 타입 구조로 관리됩니다(ex.3개월-1/2/3개월-1/2/3단계)
            </p>
          </div>
          <Button
            type="button"
            onClick={openDefaultSetupDialog}
            disabled={loading}
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
                  <div className="flex gap-1 mt-2">
                    {option.use_settings_on_first && (
                      <Badge variant="outline" className="text-xs">
                        초진 설정
                      </Badge>
                    )}
                    {option.use_settings_on_revisit_with_consult && (
                      <Badge variant="outline" className="text-xs">
                        재진(상담) 설정
                      </Badge>
                    )}
                    {option.use_settings_on_revisit_no_consult && (
                      <Badge variant="outline" className="text-xs">
                        재진(상담X) 설정
                      </Badge>
                    )}
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

                    <div className="space-y-2">
                      <Label className="text-xs">방문 유형별 설정 사용</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={option.use_settings_on_first}
                          onCheckedChange={(checked) =>
                            updateOptionField(
                              option.id,
                              "use_settings_on_first",
                              checked
                            )
                          }
                        />
                        <Label className="text-xs font-normal">초진 시 설정 사용</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={option.use_settings_on_revisit_with_consult}
                          onCheckedChange={(checked) =>
                            updateOptionField(
                              option.id,
                              "use_settings_on_revisit_with_consult",
                              checked
                            )
                          }
                        />
                        <Label className="text-xs font-normal">재진(상담O) 시 설정 사용</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={option.use_settings_on_revisit_no_consult}
                          onCheckedChange={(checked) =>
                            updateOptionField(
                              option.id,
                              "use_settings_on_revisit_no_consult",
                              checked
                            )
                          }
                        />
                        <Label className="text-xs font-normal">재진(상담X) 시 설정 사용</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">설정 목록</h4>
                  {option.settings && option.settings.length > 0 ? (
                    option.settings.map((setting) => (
                      <div key={setting.id} className="border rounded-lg ml-4">
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
              <Label className="text-sm font-semibold">
                방문 유형별 설정 사용
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newOption.use_settings_on_first}
                  onCheckedChange={(checked) =>
                    setNewOption({
                      ...newOption,
                      use_settings_on_first: checked as boolean,
                    })
                  }
                />
                <Label>초진 시 설정 사용</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newOption.use_settings_on_revisit_with_consult}
                  onCheckedChange={(checked) =>
                    setNewOption({
                      ...newOption,
                      use_settings_on_revisit_with_consult: checked as boolean,
                    })
                  }
                />
                <Label>재진(상담O) 시 설정 사용</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newOption.use_settings_on_revisit_no_consult}
                  onCheckedChange={(checked) =>
                    setNewOption({
                      ...newOption,
                      use_settings_on_revisit_no_consult: checked as boolean,
                    })
                  }
                />
                <Label>재진(상담X) 시 설정 사용</Label>
              </div>
            </div>
            <Button type="button" onClick={addOption} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              옵션 추가
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Default Setup Dialog */}
    <Dialog open={showDefaultSetupDialog} onOpenChange={setShowDefaultSetupDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>기본 옵션 세팅</DialogTitle>
          <DialogDescription>
            추가할 옵션을 선택해주세요. 각 옵션에는 1/2/3개월 설정과 1/2/3단계 타입이 자동으로 추가됩니다.
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
          <Button type="button" onClick={applyDefaultOptions} disabled={loading}>
            {loading ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
