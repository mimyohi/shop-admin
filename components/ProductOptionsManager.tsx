"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { productOptionsQueries } from "@/queries/product-options.queries";
import {
  createProductOption,
  deleteProductOption,
  createOptionValue,
  deleteOptionValue as deleteOptionValueAction,
  createAddon,
  deleteAddon,
  updateAddon,
} from "@/lib/actions/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VisibilityCondition {
  parent_values: string[];
  action: "show" | "hide";
}

interface ChildOptionConfig {
  target_option_id: string;
  show_value_ids: string[];
}

interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  is_required: boolean;
  display_order: number;
  parent_option_id?: string | null;
  visibility_conditions?: VisibilityCondition | null;
  values?: ProductOptionValue[];
}

interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  price_adjustment: number;
  is_available: boolean;
  display_order: number;
  affects_child_options?: ChildOptionConfig[] | null;
}

interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
}

interface Props {
  productId?: string;
  mode?: "create" | "edit";
  initialOptions?: ProductOption[];
  initialAddons?: ProductAddon[];
  onOptionsChange?: (options: ProductOption[]) => void;
  onAddonsChange?: (addons: ProductAddon[]) => void;
}

export default function ProductOptionsManager({
  productId,
  mode = "edit",
  initialOptions = [],
  initialAddons = [],
  onOptionsChange,
  onAddonsChange,
}: Props) {
  const [options, setOptions] = useState<ProductOption[]>(initialOptions);
  const [addons, setAddons] = useState<ProductAddon[]>(initialAddons);
  const [loading, setLoading] = useState(mode === "edit");

  // New option form
  const [newOption, setNewOption] = useState({
    name: "",
    is_required: false,
  });

  // New addon form
  const [newAddon, setNewAddon] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
  });

  const shouldFetchConfiguration = mode === "edit" && !!productId;
  const { data: configurationData } = useQuery({
    ...productOptionsQueries.configuration(productId || ""),
    enabled: shouldFetchConfiguration,
  });

  useEffect(() => {
    if (shouldFetchConfiguration && configurationData) {
      setOptions(configurationData.options as ProductOption[]);
      setAddons(configurationData.addons as ProductAddon[]);
      setLoading(false);
    } else if (!shouldFetchConfiguration) {
      setLoading(false);
    }
  }, [shouldFetchConfiguration, configurationData]);

  // === Options Management ===
  const addOption = async () => {
    if (!newOption.name.trim()) return;

    try {
      if (mode === "create") {
        // Create mode: just update local state
        const newOptionData: ProductOption = {
          id: `temp-${Date.now()}`,
          product_id: "",
          name: newOption.name,
          is_required: newOption.is_required,
          display_order: options.length,
          values: [],
        };
        const updatedOptions = [...options, newOptionData];
        setOptions(updatedOptions);
        onOptionsChange?.(updatedOptions);
        setNewOption({ name: "", is_required: false });
      } else {
        // Edit mode: save to database using server action
        const result = await createProductOption(productId!, {
          name: newOption.name,
          is_required: newOption.is_required,
          display_order: options.length,
        });

        if (!result.success) throw new Error(result.error);

        setOptions([
          ...options,
          { ...result.data, values: [] } as ProductOption,
        ]);
        setNewOption({ name: "", is_required: false });
      }
    } catch (error: any) {
      console.error("Error adding option:", error);
      alert(error.message || "옵션 추가에 실패했습니다.");
    }
  };

  const deleteOption = async (optionId: string) => {
    if (!confirm("이 옵션을 삭제하시겠습니까?")) return;

    try {
      if (mode === "create") {
        const updatedOptions = options.filter((o) => o.id !== optionId);
        setOptions(updatedOptions);
        onOptionsChange?.(updatedOptions);
      } else {
        const result = await deleteProductOption(optionId);

        if (!result.success) throw new Error(result.error);
        setOptions(options.filter((o) => o.id !== optionId));
      }
    } catch (error: any) {
      console.error("Error deleting option:", error);
      alert(error.message || "옵션 삭제에 실패했습니다.");
    }
  };

  // === Option Values Management ===
  const addOptionValue = async (
    optionId: string,
    value: string,
    priceAdjustment: number
  ) => {
    if (!value.trim()) return;

    try {
      const option = options.find((o) => o.id === optionId);

      if (mode === "create") {
        const newValue: ProductOptionValue = {
          id: `temp-value-${Date.now()}`,
          option_id: optionId,
          value,
          price_adjustment: priceAdjustment,
          is_available: true,
          display_order: option?.values?.length || 0,
        };
        const updatedOptions = options.map((o) =>
          o.id === optionId
            ? { ...o, values: [...(o.values || []), newValue] }
            : o
        );
        setOptions(updatedOptions);
        onOptionsChange?.(updatedOptions);
      } else {
        const result = await createOptionValue(optionId, {
          value,
          price_adjustment: priceAdjustment,
          display_order: option?.values?.length || 0,
        });

        if (!result.success) throw new Error(result.error);

        setOptions(
          options.map((o) =>
            o.id === optionId
              ? {
                  ...o,
                  values: [
                    ...(o.values || []),
                    result.data,
                  ] as ProductOptionValue[],
                }
              : o
          )
        );
      }
    } catch (error: any) {
      console.error("Error adding option value:", error);
      alert(error.message || "옵션 값 추가에 실패했습니다.");
    }
  };

  const deleteOptionValue = async (optionId: string, valueId: string) => {
    try {
      if (mode === "create") {
        const updatedOptions = options.map((o) =>
          o.id === optionId
            ? { ...o, values: o.values?.filter((v) => v.id !== valueId) }
            : o
        );
        setOptions(updatedOptions);
        onOptionsChange?.(updatedOptions);
      } else {
        const result = await deleteOptionValueAction(valueId);

        if (!result.success) throw new Error(result.error);

        setOptions(
          options.map((o) =>
            o.id === optionId
              ? { ...o, values: o.values?.filter((v) => v.id !== valueId) }
              : o
          )
        );
      }
    } catch (error: any) {
      console.error("Error deleting option value:", error);
      alert(error.message || "옵션 값 삭제에 실패했습니다.");
    }
  };

  const updateOptionValueLocal = (
    optionId: string,
    valueId: string,
    updates: Partial<ProductOptionValue>
  ) => {
    const updatedOptions = options.map((o) =>
      o.id === optionId
        ? {
            ...o,
            values: o.values?.map((v) =>
              v.id === valueId ? { ...v, ...updates } : v
            ),
          }
        : o
    );
    setOptions(updatedOptions);
    onOptionsChange?.(updatedOptions);
  };

  const updateOptionLocal = (
    optionId: string,
    updates: Partial<ProductOption>
  ) => {
    const updatedOptions = options.map((o) =>
      o.id === optionId ? { ...o, ...updates } : o
    );
    setOptions(updatedOptions);
    onOptionsChange?.(updatedOptions);
  };

  // === Addons Management ===
  const addAddonItem = async () => {
    if (!newAddon.name.trim() || !newAddon.price) return;

    try {
      if (mode === "create") {
        const newAddonData: ProductAddon = {
          id: `temp-addon-${Date.now()}`,
          product_id: "",
          name: newAddon.name,
          description: newAddon.description || null,
          price: parseFloat(newAddon.price),
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
          is_available: true,
        });
      } else {
        const result = await createAddon(productId!, {
          name: newAddon.name,
          description: newAddon.description || null,
          price: parseFloat(newAddon.price),
          is_available: newAddon.is_available,
          display_order: addons.length,
        });

        if (!result.success) throw new Error(result.error);

        setAddons([...addons, result.data as ProductAddon]);
        setNewAddon({
          name: "",
          description: "",
          price: "",
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
    <div className="space-y-6">
      {/* Product Options Section */}
      <Card>
        <CardHeader>
          <CardTitle>상품 옵션 (예: 사이즈, 색상)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Options */}
          {options.map((option) => (
            <OptionEditor
              key={option.id}
              option={option}
              allOptions={options}
              onDelete={() => deleteOption(option.id)}
              onAddValue={addOptionValue}
              onDeleteValue={deleteOptionValue}
              onUpdateValue={updateOptionValueLocal}
              onUpdateOption={updateOptionLocal}
              mode={mode}
              productId={productId}
            />
          ))}

          {/* Add New Option */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">새 옵션 추가</h4>
            <div className="flex gap-2">
              <Input
                placeholder="옵션명 (예: 사이즈, 색상)"
                value={newOption.name}
                onChange={(e) =>
                  setNewOption({ ...newOption, name: e.target.value })
                }
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newOption.is_required}
                  onCheckedChange={(checked) =>
                    setNewOption({
                      ...newOption,
                      is_required: checked as boolean,
                    })
                  }
                />
                <Label>필수</Label>
              </div>
              <Button type="button" onClick={addOption}>
                <Plus className="h-4 w-4 mr-2" />
                추가
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Addons Section */}
      <Card>
        <CardHeader>
          <CardTitle>추가 상품 (선택 구매)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Addons */}
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center gap-2 p-3 border rounded"
            >
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
              <Button type="button" onClick={addAddonItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                추가
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Option Editor Component
function OptionEditor({
  option,
  allOptions,
  onDelete,
  onAddValue,
  onDeleteValue,
  onUpdateValue,
  onUpdateOption,
  mode,
  productId,
}: {
  option: ProductOption;
  allOptions: ProductOption[];
  onDelete: () => void;
  onAddValue: (
    optionId: string,
    value: string,
    priceAdjustment: number
  ) => void;
  onDeleteValue: (optionId: string, valueId: string) => void;
  onUpdateValue: (
    optionId: string,
    valueId: string,
    updates: Partial<ProductOptionValue>
  ) => void;
  onUpdateOption: (optionId: string, updates: Partial<ProductOption>) => void;
  mode?: "create" | "edit";
  productId?: string;
}) {
  const [newValue, setNewValue] = useState({ value: "", priceAdjustment: "0" });
  const [showConditionalSettings, setShowConditionalSettings] = useState(false);

  const handleAddValue = () => {
    if (!newValue.value.trim()) return;
    onAddValue(
      option.id,
      newValue.value,
      parseFloat(newValue.priceAdjustment) || 0
    );
    setNewValue({ value: "", priceAdjustment: "0" });
  };

  // Get potential parent options (options that come before this one)
  const parentOptions = allOptions.filter(
    (opt) => opt.display_order < option.display_order && opt.id !== option.id
  );

  // Get child options (options that come after this one)
  const childOptions = allOptions.filter(
    (opt) => opt.display_order > option.display_order && opt.id !== option.id
  );

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{option.name}</h4>
          {option.is_required && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              필수
            </span>
          )}
          {option.parent_option_id && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              조건부
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {parentOptions.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setShowConditionalSettings(!showConditionalSettings)
              }
              title={"조건부 표시 설정"}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conditional Settings Panel */}
      {showConditionalSettings && parentOptions.length > 0 && (
        <div className="bg-gray-50 p-3 rounded space-y-3">
          <h5 className="font-semibold text-sm">조건부 표시 설정</h5>
          <p className="text-xs text-gray-600">
            이 옵션을 특정 옵션의 값에 따라 표시하거나 숨길 수 있습니다.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">부모 옵션 선택</Label>
            <Select
              value={option.parent_option_id || "none"}
              onValueChange={(value) => {
                onUpdateOption(option.id, {
                  parent_option_id: value === "none" ? null : value,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="부모 옵션 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음 (항상 표시)</SelectItem>
                {parentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {option.parent_option_id && (
              <p className="text-xs text-amber-600">
                ⚠️ 부모 옵션의 값별 조건 설정은 부모 옵션에서 설정할 수
                있습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Option Values */}
      <div className="space-y-2 ml-4">
        {option.values?.map((val) => (
          <OptionValueEditor
            key={val.id}
            value={val}
            childOptions={childOptions}
            onDelete={() => onDeleteValue(option.id, val.id)}
            onUpdate={(updates) => onUpdateValue(option.id, val.id, updates)}
            mode={mode}
          />
        ))}

        {/* Add Value */}
        <div className="flex gap-2 pt-2">
          <Input
            size={1}
            placeholder="값 (예: Small, Red)"
            value={newValue.value}
            onChange={(e) =>
              setNewValue({ ...newValue, value: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
          />
          <Input
            size={1}
            type="number"
            placeholder="추가금액"
            value={newValue.priceAdjustment}
            onChange={(e) =>
              setNewValue({ ...newValue, priceAdjustment: e.target.value })
            }
            className="w-32"
          />
          <Button type="button" size="sm" onClick={handleAddValue}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Option Value Editor Component (with conditional child options support)
function OptionValueEditor({
  value,
  childOptions,
  onDelete,
  onUpdate,
  mode,
}: {
  value: ProductOptionValue;
  childOptions: ProductOption[];
  onDelete: () => void;
  onUpdate: (updates: Partial<ProductOptionValue>) => void;
  mode?: "create" | "edit";
}) {
  const [showChildConfig, setShowChildConfig] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChildOption, setEditingChildOption] =
    useState<ProductOption | null>(null);
  const [selectedValueIds, setSelectedValueIds] = useState<Set<string>>(
    new Set()
  );

  const handleOpenDialog = (childOpt: ProductOption) => {
    setEditingChildOption(childOpt);

    // Load existing configuration
    const existingConfig = value.affects_child_options?.find(
      (config) => config.target_option_id === childOpt.id
    );

    setSelectedValueIds(new Set(existingConfig?.show_value_ids || []));
    setDialogOpen(true);
  };

  const handleSaveConfiguration = () => {
    if (!editingChildOption) return;

    // Get existing configurations
    const existingConfigs = value.affects_child_options || [];

    // Remove old config for this child option
    const filteredConfigs = existingConfigs.filter(
      (config) => config.target_option_id !== editingChildOption.id
    );

    // Add new config if values are selected
    const newConfigs =
      selectedValueIds.size > 0
        ? [
            ...filteredConfigs,
            {
              target_option_id: editingChildOption.id,
              show_value_ids: Array.from(selectedValueIds),
            },
          ]
        : filteredConfigs;

    onUpdate({
      affects_child_options: newConfigs.length > 0 ? newConfigs : null,
    });

    setDialogOpen(false);
  };

  const toggleValueSelection = (valueId: string) => {
    const newSet = new Set(selectedValueIds);
    if (newSet.has(valueId)) {
      newSet.delete(valueId);
    } else {
      newSet.add(valueId);
    }
    setSelectedValueIds(newSet);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <span className="flex-1">{value.value}</span>
        {value.price_adjustment !== 0 && (
          <span className="text-blue-600">
            {value.price_adjustment > 0 ? "+" : ""}
            {value.price_adjustment.toLocaleString()}원
          </span>
        )}
        {value.affects_child_options &&
          value.affects_child_options.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {value.affects_child_options.length}개 영향
            </span>
          )}
        {childOptions.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowChildConfig(!showChildConfig)}
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Child Option Configuration */}
      {showChildConfig && childOptions.length > 0 && (
        <div className="ml-8 bg-purple-50 p-3 rounded space-y-2">
          <h6 className="text-xs font-semibold">자식 옵션 영향 설정</h6>
          <p className="text-xs text-gray-600">
            이 값이 선택되었을 때 다른 옵션에 어떤 값들을 표시할지 설정합니다.
          </p>
          <div className="space-y-2 text-xs">
            {childOptions.map((childOpt) => {
              const affectsThisChild = value.affects_child_options?.find(
                (config) => config.target_option_id === childOpt.id
              );
              return (
                <div key={childOpt.id} className="border rounded p-2 bg-white">
                  <div className="font-semibold mb-1">{childOpt.name}</div>
                  <div className="space-y-1">
                    {affectsThisChild ? (
                      <div className="text-green-700">
                        ✓ {affectsThisChild.show_value_ids.length}개 값 표시
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-6 text-xs"
                          onClick={() => handleOpenDialog(childOpt)}
                        >
                          수정
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => handleOpenDialog(childOpt)}
                      >
                        조건 추가
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>자식 옵션 값 선택</DialogTitle>
            <DialogDescription>
              "{value.value}" 선택 시 "{editingChildOption?.name}"에 표시할
              값들을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {editingChildOption?.values?.map((childValue) => (
              <div key={childValue.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedValueIds.has(childValue.id)}
                  onCheckedChange={() => toggleValueSelection(childValue.id)}
                />
                <Label className="flex-1 cursor-pointer">
                  {childValue.value}
                  {childValue.price_adjustment !== 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({childValue.price_adjustment > 0 ? "+" : ""}
                      {childValue.price_adjustment.toLocaleString()}원)
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSaveConfiguration}>
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
