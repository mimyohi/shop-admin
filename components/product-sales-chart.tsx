"use client";

import { ProductSalesData } from "@/types/product-sales.types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";

interface ProductSalesChartProps {
  data: ProductSalesData[];
  maxItems?: number;
}

// 옵션별 색상 정의 (차트와 툴팁에서 공통 사용)
const optionColors = [
  "#8b5cf6", // 보라
  "#ec4899", // 핑크
  "#f59e0b", // 주황
  "#10b981", // 초록
  "#3b82f6", // 파랑
  "#ef4444", // 빨강
];

// 애드온별 색상 정의 (옵션과 구분)
const addonColors = [
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
];

// Custom Tooltip Component
const CustomTooltip = ({
  active,
  payload,
  label,
  allOptions,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  allOptions: string[];
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ProductSalesData;

  // 디버깅: 비중 합계 확인
  const optionTotal =
    data.option_breakdown?.reduce((sum, opt) => sum + opt.sales, 0) || 0;
  const addonTotal =
    data.addon_breakdown?.reduce((sum, addon) => sum + addon.sales, 0) || 0;
  const combinedTotal = optionTotal + addonTotal;
  const totalPercent =
    data.total_sales > 0 ? (combinedTotal / data.total_sales) * 100 : 0;

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: "280px",
      }}
    >
      <p style={{ fontWeight: "bold", marginBottom: "12px", fontSize: "14px" }}>
        {label}
      </p>

      {/* Total Sales */}
      <div
        style={{
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #eee",
        }}
      >
        <p style={{ fontSize: "13px", color: "#666" }}>총 매출액</p>
        <p style={{ fontSize: "16px", fontWeight: "bold" }}>
          {data.total_sales.toLocaleString()}원
        </p>
      </div>

      {/* Option Breakdown with Ratio Bar */}
      {data.option_breakdown && data.option_breakdown.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "8px",
          }}
        >
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            옵션별 매출 비중
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.option_breakdown.map((option, idx) => {
              const optionPercent =
                data.total_sales > 0
                  ? (option.sales / data.total_sales) * 100
                  : 0;

              // 차트와 동일한 색상 매칭
              const optionIndex = allOptions.indexOf(option.option_name);
              const barColor = optionColors[optionIndex % optionColors.length];

              return (
                <div key={idx} style={{ fontSize: "11px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#666", fontWeight: "500" }}>
                      {option.option_name}
                    </span>
                    <span style={{ fontWeight: "600", color: "#333" }}>
                      {optionPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    <span>{option.sales.toLocaleString()}원</span>
                    <span>
                      {option.quantity}개 / {option.order_count}건
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${optionPercent}%`,
                        height: "100%",
                        backgroundColor: barColor,
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Addon Breakdown with Ratio Bar */}
      {data.addon_breakdown && data.addon_breakdown.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "8px",
            borderTop: "1px solid #eee",
          }}
        >
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            추가상품별 매출 비중
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.addon_breakdown.map((addon, idx) => {
              const addonPercent =
                data.total_sales > 0
                  ? (addon.sales / data.total_sales) * 100
                  : 0;

              const barColor = addonColors[idx % addonColors.length];

              return (
                <div key={idx} style={{ fontSize: "11px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#666", fontWeight: "500" }}>
                      {addon.addon_name}
                    </span>
                    <span style={{ fontWeight: "600", color: "#333" }}>
                      {addonPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    <span>{addon.sales.toLocaleString()}원</span>
                    <span>
                      {addon.quantity}개 / {addon.order_count}건
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${addonPercent}%`,
                        height: "100%",
                        backgroundColor: barColor,
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Stats */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "8px",
          borderTop: "1px solid #eee",
          fontSize: "11px",
          color: "#666",
        }}
      >
        <div>판매량: {data.total_quantity}개</div>
        <div>주문 건수: {data.order_count}건</div>
      </div>
    </div>
  );
};

export function ProductSalesChart({
  data,
  maxItems = 10,
}: ProductSalesChartProps) {
  // 상위 N개 상품만 표시 (성능 고려)
  const chartData = data.slice(0, maxItems);

  // 모든 상품의 옵션들을 수집하여 유니크한 옵션 목록 생성
  const allOptions = new Set<string>();
  chartData.forEach((item) => {
    item.option_breakdown?.forEach((option) => {
      allOptions.add(option.option_name);
    });
  });

  // 모든 상품의 애드온들을 수집하여 유니크한 애드온 목록 생성
  const allAddons = new Set<string>();
  chartData.forEach((item) => {
    item.addon_breakdown?.forEach((addon) => {
      allAddons.add(addon.addon_name);
    });
  });

  // 옵션 이름을 배열로 변환하여 순서 보장
  const optionNames = Array.from(allOptions);
  const addonNames = Array.from(allAddons);

  // 차트 데이터를 옵션별, 애드온별로 변환
  const transformedData = chartData.map((item) => {
    const row: any = {
      product_name: item.product_name,
      total_sales: item.total_sales,
      option_breakdown: item.option_breakdown,
      addon_breakdown: item.addon_breakdown,
      base_sales: item.base_sales,
      option_sales: item.option_sales,
      addon_sales: item.addon_sales,
      total_quantity: item.total_quantity,
      order_count: item.order_count,
    };

    // 각 옵션별 매출을 별도 키로 추가
    item.option_breakdown?.forEach((option) => {
      row[`option_${option.option_name}`] = option.sales;
    });

    // 각 애드온별 매출을 별도 키로 추가
    item.addon_breakdown?.forEach((addon) => {
      row[`addon_${addon.addon_name}`] = addon.sales;
    });

    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={transformedData}
        margin={{ top: 20, right: 30, left: 60, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="product_name"
          angle={-45}
          textAnchor="end"
          height={100}
          fontSize={12}
        />
        <YAxis tickFormatter={(value) => value.toLocaleString()} />
        <Tooltip content={<CustomTooltip allOptions={optionNames} />} />

        {/* 옵션별로 스택된 바 생성 */}
        {optionNames.map((optionName, idx) => (
          <Bar
            key={optionName}
            dataKey={`option_${optionName}`}
            stackId="sales"
            fill={optionColors[idx % optionColors.length]}
            name={`[옵션] ${optionName}`}
            radius={[0, 0, 0, 0]}
          />
        ))}

        {/* 애드온별로 스택된 바 생성 */}
        {addonNames.map((addonName, idx) => (
          <Bar
            key={addonName}
            dataKey={`addon_${addonName}`}
            stackId="sales"
            fill={addonColors[idx % addonColors.length]}
            name={`[추가] ${addonName}`}
            radius={idx === addonNames.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
