"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSalesChart } from "@/components/product-sales-chart";
import { DateRangeFilter } from "@/components/date-range-filter";
import { productSalesQueries } from "@/queries/product-sales.queries";
import { ProductSalesFilters } from "@/types/product-sales.types";
import { ExternalLink } from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

export default function ProductSalesPage() {
  const [filters, setFilters] = useState<ProductSalesFilters>({});

  const {
    data: salesData,
    isLoading,
    error,
  } = useQuery(productSalesQueries.list(filters));

  const handleFilterChange = (startDate?: string, endDate?: string) => {
    setFilters({ startDate, endDate });
  };

  const totalRevenue =
    salesData?.reduce((sum, item) => sum + item.total_sales, 0) || 0;
  const totalQuantity =
    salesData?.reduce((sum, item) => sum + item.total_quantity, 0) || 0;

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">상품별 매출 분석</h1>
          <p className="text-gray-500">상품별 매출액과 판매량을 확인하세요</p>
        </div>

        {/* 날짜 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <DateRangeFilter onFilterChange={handleFilterChange} />
          </CardContent>
        </Card>

        {/* 요약 통계 */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 매출액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : `${totalRevenue.toLocaleString()}원`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 판매량
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : `${totalQuantity.toLocaleString()}개`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                상품 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : `${salesData?.length || 0}개`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 차트 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>상품별 매출액 차트</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                로딩 중...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[400px] text-red-500">
                데이터를 불러오는데 실패했습니다.
              </div>
            ) : salesData && salesData.length > 0 ? (
              <ProductSalesChart data={salesData} />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                매출 데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
