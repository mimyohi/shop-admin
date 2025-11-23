'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { productOptionsQueries } from '@/queries/product-options.queries'

interface ProductOption {
  id: string
  product_id: string
  name: string
  is_required: boolean
  display_order: number
  values?: ProductOptionValue[]
}

interface ProductOptionValue {
  id: string
  option_id: string
  value: string
  price_adjustment: number
  stock: number | null
  is_available: boolean
  display_order: number
}

interface ProductAddon {
  id: string
  product_id: string
  name: string
  description: string | null
  price: number
  stock: number | null
  is_available: boolean
  display_order: number
}

interface Props {
  productId?: string
  mode?: 'create' | 'edit'
  initialOptions?: ProductOption[]
  initialAddons?: ProductAddon[]
  onOptionsChange?: (options: ProductOption[]) => void
  onAddonsChange?: (addons: ProductAddon[]) => void
}

export default function ProductOptionsManager({
  productId,
  mode = 'edit',
  initialOptions = [],
  initialAddons = [],
  onOptionsChange,
  onAddonsChange
}: Props) {
  const [options, setOptions] = useState<ProductOption[]>(initialOptions)
  const [addons, setAddons] = useState<ProductAddon[]>(initialAddons)
  const [loading, setLoading] = useState(mode === 'edit')

  // New option form
  const [newOption, setNewOption] = useState({
    name: '',
    is_required: false,
  })

  // New addon form
  const [newAddon, setNewAddon] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    is_available: true,
  })

  const shouldFetchConfiguration = mode === 'edit' && !!productId
  const { data: configurationData } = useQuery({
    ...productOptionsQueries.configuration(productId || ''),
    enabled: shouldFetchConfiguration,
  })

  useEffect(() => {
    if (shouldFetchConfiguration && configurationData) {
      setOptions(configurationData.options as ProductOption[])
      setAddons(configurationData.addons as ProductAddon[])
      setLoading(false)
    } else if (!shouldFetchConfiguration) {
      setLoading(false)
    }
  }, [shouldFetchConfiguration, configurationData])

  // === Options Management ===
  const addOption = async () => {
    if (!newOption.name.trim()) return

    try {
      if (mode === 'create') {
        // Create mode: just update local state
        const newOptionData: ProductOption = {
          id: `temp-${Date.now()}`,
          product_id: '',
          name: newOption.name,
          is_required: newOption.is_required,
          display_order: options.length,
          values: []
        }
        const updatedOptions = [...options, newOptionData]
        setOptions(updatedOptions)
        onOptionsChange?.(updatedOptions)
        setNewOption({ name: '', is_required: false })
      } else {
        // Edit mode: save to database
        const { data, error } = await supabase
          .from('product_options')
          .insert([{
            product_id: productId,
            name: newOption.name,
            is_required: newOption.is_required,
            display_order: options.length,
          }])
          .select()
          .single()

        if (error) throw error

        setOptions([...options, { ...data, values: [] }])
        setNewOption({ name: '', is_required: false })
      }
    } catch (error) {
      console.error('Error adding option:', error)
      alert('옵션 추가에 실패했습니다.')
    }
  }

  const deleteOption = async (optionId: string) => {
    if (!confirm('이 옵션을 삭제하시겠습니까?')) return

    try {
      if (mode === 'create') {
        const updatedOptions = options.filter(o => o.id !== optionId)
        setOptions(updatedOptions)
        onOptionsChange?.(updatedOptions)
      } else {
        const { error } = await supabase
          .from('product_options')
          .delete()
          .eq('id', optionId)

        if (error) throw error
        setOptions(options.filter(o => o.id !== optionId))
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      alert('옵션 삭제에 실패했습니다.')
    }
  }

  // === Option Values Management ===
  const addOptionValue = async (optionId: string, value: string, priceAdjustment: number) => {
    if (!value.trim()) return

    try {
      const option = options.find(o => o.id === optionId)

      if (mode === 'create') {
        const newValue: ProductOptionValue = {
          id: `temp-value-${Date.now()}`,
          option_id: optionId,
          value,
          price_adjustment: priceAdjustment,
          stock: null,
          is_available: true,
          display_order: option?.values?.length || 0,
        }
        const updatedOptions = options.map(o =>
          o.id === optionId
            ? { ...o, values: [...(o.values || []), newValue] }
            : o
        )
        setOptions(updatedOptions)
        onOptionsChange?.(updatedOptions)
      } else {
        const { data, error } = await supabase
          .from('product_option_values')
          .insert([{
            option_id: optionId,
            value,
            price_adjustment: priceAdjustment,
            display_order: option?.values?.length || 0,
          }])
          .select()
          .single()

        if (error) throw error

        setOptions(options.map(o =>
          o.id === optionId
            ? { ...o, values: [...(o.values || []), data] }
            : o
        ))
      }
    } catch (error) {
      console.error('Error adding option value:', error)
      alert('옵션 값 추가에 실패했습니다.')
    }
  }

  const deleteOptionValue = async (optionId: string, valueId: string) => {
    try {
      if (mode === 'create') {
        const updatedOptions = options.map(o =>
          o.id === optionId
            ? { ...o, values: o.values?.filter(v => v.id !== valueId) }
            : o
        )
        setOptions(updatedOptions)
        onOptionsChange?.(updatedOptions)
      } else {
        const { error } = await supabase
          .from('product_option_values')
          .delete()
          .eq('id', valueId)

        if (error) throw error

        setOptions(options.map(o =>
          o.id === optionId
            ? { ...o, values: o.values?.filter(v => v.id !== valueId) }
            : o
        ))
      }
    } catch (error) {
      console.error('Error deleting option value:', error)
      alert('옵션 값 삭제에 실패했습니다.')
    }
  }

  // === Addons Management ===
  const addAddonItem = async () => {
    if (!newAddon.name.trim() || !newAddon.price) return

    try {
      if (mode === 'create') {
        const newAddonData: ProductAddon = {
          id: `temp-addon-${Date.now()}`,
          product_id: '',
          name: newAddon.name,
          description: newAddon.description || null,
          price: parseFloat(newAddon.price),
          stock: newAddon.stock ? parseInt(newAddon.stock) : null,
          is_available: newAddon.is_available,
          display_order: addons.length,
        }
        const updatedAddons = [...addons, newAddonData]
        setAddons(updatedAddons)
        onAddonsChange?.(updatedAddons)
        setNewAddon({
          name: '',
          description: '',
          price: '',
          stock: '',
          is_available: true,
        })
      } else {
        const { data, error } = await supabase
          .from('product_addons')
          .insert([{
            product_id: productId,
            name: newAddon.name,
            description: newAddon.description || null,
            price: parseFloat(newAddon.price),
            stock: newAddon.stock ? parseInt(newAddon.stock) : null,
            is_available: newAddon.is_available,
            display_order: addons.length,
          }])
          .select()
          .single()

        if (error) throw error

        setAddons([...addons, data])
        setNewAddon({
          name: '',
          description: '',
          price: '',
          stock: '',
          is_available: true,
        })
      }
    } catch (error) {
      console.error('Error adding addon:', error)
      alert('추가상품 등록에 실패했습니다.')
    }
  }

  const deleteAddon = async (addonId: string) => {
    if (!confirm('이 추가상품을 삭제하시겠습니까?')) return

    try {
      if (mode === 'create') {
        const updatedAddons = addons.filter(a => a.id !== addonId)
        setAddons(updatedAddons)
        onAddonsChange?.(updatedAddons)
      } else {
        const { error } = await supabase
          .from('product_addons')
          .delete()
          .eq('id', addonId)

        if (error) throw error
        setAddons(addons.filter(a => a.id !== addonId))
      }
    } catch (error) {
      console.error('Error deleting addon:', error)
      alert('추가상품 삭제에 실패했습니다.')
    }
  }

  const toggleAddonAvailability = async (addonId: string, isAvailable: boolean) => {
    try {
      if (mode === 'create') {
        const updatedAddons = addons.map(a =>
          a.id === addonId ? { ...a, is_available: isAvailable } : a
        )
        setAddons(updatedAddons)
        onAddonsChange?.(updatedAddons)
      } else {
        const { error } = await supabase
          .from('product_addons')
          .update({ is_available: isAvailable })
          .eq('id', addonId)

        if (error) throw error

        setAddons(addons.map(a =>
          a.id === addonId ? { ...a, is_available: isAvailable } : a
        ))
      }
    } catch (error) {
      console.error('Error updating addon:', error)
    }
  }

  if (loading) {
    return <div className="p-4">로딩 중...</div>
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
              onDelete={() => deleteOption(option.id)}
              onAddValue={addOptionValue}
              onDeleteValue={deleteOptionValue}
            />
          ))}

          {/* Add New Option */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">새 옵션 추가</h4>
            <div className="flex gap-2">
              <Input
                placeholder="옵션명 (예: 사이즈, 색상)"
                value={newOption.name}
                onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newOption.is_required}
                  onCheckedChange={(checked) =>
                    setNewOption({ ...newOption, is_required: checked as boolean })
                  }
                />
                <Label>필수</Label>
              </div>
              <Button onClick={addOption}>
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
            <div key={addon.id} className="flex items-center gap-2 p-3 border rounded">
              <div className="flex-1">
                <div className="font-semibold">{addon.name}</div>
                <div className="text-sm text-gray-500">{addon.description}</div>
                <div className="text-sm">
                  가격: {addon.price.toLocaleString()}원
                  {addon.stock && ` | 재고: ${addon.stock}개`}
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
                size="sm"
                variant="destructive"
                onClick={() => deleteAddon(addon.id)}
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
                  onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="가격"
                  value={newAddon.price}
                  onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                />
              </div>
              <Input
                placeholder="설명 (선택사항)"
                value={newAddon.description}
                onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="재고 (비워두면 무제한)"
                  value={newAddon.stock}
                  onChange={(e) => setNewAddon({ ...newAddon, stock: e.target.value })}
                />
                <Button onClick={addAddonItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  추가
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Option Editor Component
function OptionEditor({
  option,
  onDelete,
  onAddValue,
  onDeleteValue,
}: {
  option: ProductOption
  onDelete: () => void
  onAddValue: (optionId: string, value: string, priceAdjustment: number) => void
  onDeleteValue: (optionId: string, valueId: string) => void
}) {
  const [newValue, setNewValue] = useState({ value: '', priceAdjustment: '0' })

  const handleAddValue = () => {
    if (!newValue.value.trim()) return
    onAddValue(option.id, newValue.value, parseFloat(newValue.priceAdjustment) || 0)
    setNewValue({ value: '', priceAdjustment: '0' })
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{option.name}</h4>
          {option.is_required && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">필수</span>
          )}
        </div>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Option Values */}
      <div className="space-y-2 ml-4">
        {option.values?.map((val) => (
          <div key={val.id} className="flex items-center gap-2 text-sm">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="flex-1">{val.value}</span>
            {val.price_adjustment !== 0 && (
              <span className="text-blue-600">
                {val.price_adjustment > 0 ? '+' : ''}
                {val.price_adjustment.toLocaleString()}원
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteValue(option.id, val.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Add Value */}
        <div className="flex gap-2 pt-2">
          <Input
            size={1}
            placeholder="값 (예: Small, Red)"
            value={newValue.value}
            onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
          />
          <Input
            size={1}
            type="number"
            placeholder="추가금액"
            value={newValue.priceAdjustment}
            onChange={(e) => setNewValue({ ...newValue, priceAdjustment: e.target.value })}
            className="w-32"
          />
          <Button size="sm" onClick={handleAddValue}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
