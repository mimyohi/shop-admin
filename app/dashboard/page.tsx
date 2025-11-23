"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react"
import { dashboardQueries } from "@/queries/dashboard.queries"

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery(dashboardQueries.summary())

  const stats = useMemo(
    () => ({
      totalProducts: summary?.totalProducts ?? 0,
      totalOrders: summary?.totalOrders ?? 0,
      totalRevenue: summary?.totalRevenue ?? 0,
      pendingOrders: summary?.pendingOrders ?? 0,
    }),
    [summary]
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-gray-500">쇼핑몰 운영 현황을 한눈에 확인하세요</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 상품
            </CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats.totalProducts}
            </div>
            <p className="text-xs text-gray-500">등록된 상품 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 주문
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats.totalOrders}
            </div>
            <p className="text-xs text-gray-500">총 주문 건수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 매출
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : `${stats.totalRevenue.toLocaleString()}원`}
            </div>
            <p className="text-xs text-gray-500">전체 매출액</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              대기중 주문
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats.pendingOrders}
            </div>
            <p className="text-xs text-gray-500">처리 대기중인 주문</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
