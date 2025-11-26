"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { format, subDays } from "date-fns"

interface DateRangeFilterProps {
  onFilterChange: (startDate?: string, endDate?: string) => void
}

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<string>("all")
  const [customStartDate, setCustomStartDate] = useState<string>("")
  const [customEndDate, setCustomEndDate] = useState<string>("")

  const presets = [
    {
      label: "전체 기간",
      value: "all",
      action: () => onFilterChange(undefined, undefined),
    },
    {
      label: "최근 7일",
      value: "7days",
      action: () => {
        const endDate = new Date()
        const startDate = subDays(endDate, 7)
        onFilterChange(startDate.toISOString(), endDate.toISOString())
      },
    },
    {
      label: "최근 30일",
      value: "30days",
      action: () => {
        const endDate = new Date()
        const startDate = subDays(endDate, 30)
        onFilterChange(startDate.toISOString(), endDate.toISOString())
      },
    },
    {
      label: "최근 90일",
      value: "90days",
      action: () => {
        const endDate = new Date()
        const startDate = subDays(endDate, 90)
        onFilterChange(startDate.toISOString(), endDate.toISOString())
      },
    },
  ]

  const handlePresetClick = (preset: typeof presets[0]) => {
    setActivePreset(preset.value)
    setCustomStartDate("")
    setCustomEndDate("")
    preset.action()
  }

  const handleCustomDateChange = () => {
    if (customStartDate || customEndDate) {
      setActivePreset("custom")
      const startISO = customStartDate
        ? new Date(customStartDate + "T00:00:00").toISOString()
        : undefined
      const endISO = customEndDate
        ? new Date(customEndDate + "T23:59:59").toISOString()
        : undefined
      onFilterChange(startISO, endISO)
    }
  }

  return (
    <div className="space-y-4">
      {/* 프리셋 버튼 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          기간 선택:
        </span>
        {presets.map((preset) => (
          <Button
            key={preset.value}
            onClick={() => handlePresetClick(preset)}
            variant={activePreset === preset.value ? "default" : "outline"}
            size="sm"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* 커스텀 날짜 선택 */}
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          커스텀 기간:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="start-date" className="text-xs text-gray-600">
              시작일
            </label>
            <input
              id="start-date"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-500 mt-5">~</span>
          <div className="flex flex-col gap-1">
            <label htmlFor="end-date" className="text-xs text-gray-600">
              종료일
            </label>
            <input
              id="end-date"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={handleCustomDateChange}
            size="sm"
            variant={activePreset === "custom" ? "default" : "outline"}
            className="mt-5"
          >
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}
