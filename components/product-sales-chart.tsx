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
} from "recharts";

interface ProductSalesChartProps {
  data: ProductSalesData[];
  maxItems?: number;
}

export function ProductSalesChart({
  data,
  maxItems = 10,
}: ProductSalesChartProps) {
  // 상위 N개 상품만 표시 (성능 고려)
  const chartData = data.slice(0, maxItems);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
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
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "total_sales") {
              return [value.toLocaleString() + "원", "매출액"];
            }
            if (name === "total_quantity") {
              return [value.toLocaleString() + "개", "판매량"];
            }
            return [value, name];
          }}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <Legend />
        <Bar
          dataKey="total_sales"
          fill="#3b82f6"
          name="매출액"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
