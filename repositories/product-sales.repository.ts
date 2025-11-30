import { supabaseServer as supabase } from "@/lib/supabase-server";
import {
  ProductSalesData,
  ProductSalesFilters,
  OptionSalesBreakdown,
  AddonSalesBreakdown,
} from "@/types/product-sales.types";

export const productSalesRepository = {
  /**
   * 상품별 매출 집계 조회 (옵션 + 애드온 포함)
   */
  async getProductSales(
    filters: ProductSalesFilters = {}
  ): Promise<ProductSalesData[]> {
    const { startDate, endDate } = filters;

    let query = supabase.from("order_items").select(`
        product_id,
        product_name,
        product_price,
        quantity,
        option_id,
        option_name,
        selected_addons,
        orders!inner(
          id,
          status,
          created_at
        )
      `);
    // 임시: 모든 주문 포함 (테스트용)
    // .eq("orders.status", "completed")

    if (startDate) {
      query = query.gte("orders.created_at", startDate);
    }

    if (endDate) {
      query = query.lte("orders.created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching product sales:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new Error("Failed to fetch product sales");
    }

    console.log("📊 Product sales raw data count:", data?.length || 0);
    console.log("📊 First item:", data?.[0]);

    // 1단계: 상품별로 그룹화 (옵션별, 애드온별 매출 포함)
    const productMap = new Map<string, {
      product_id: string;
      product_name: string;
      base_sales: number;
      option_sales: number;
      addon_sales: number;
      total_quantity: number;
      order_count: number;
      // 옵션별 상세 데이터
      options: Map<string, {
        option_id: string | null;
        option_name: string;
        sales: number;
        quantity: number;
        order_count: number;
      }>;
      // 애드온별 상세 데이터
      addons: Map<string, {
        addon_id: string;
        addon_name: string;
        sales: number;
        quantity: number;
        order_count: number;
      }>;
    }>();

    data?.forEach((item: any) => {
      const productId = item.product_id;
      const productName = item.product_name;
      const optionId = item.option_id || null;
      const optionName = item.option_name || "옵션 없음";
      const optionKey = optionId || "no_option";

      // Calculate sales components
      const baseSales = item.product_price * item.quantity;
      const optionSales = (item.option_price || 0) * item.quantity;

      // Calculate addon sales from JSONB
      let addonSales = 0;
      if (item.selected_addons && Array.isArray(item.selected_addons)) {
        addonSales =
          item.selected_addons.reduce((sum: number, addon: any) => {
            const addonPrice = addon.price || 0;
            const addonQuantity = addon.quantity || 1;
            return sum + addonPrice * addonQuantity;
          }, 0) * item.quantity;
      }

      const totalItemSales = baseSales + optionSales + addonSales;

      // 상품이 없으면 생성
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: productName,
          base_sales: 0,
          option_sales: 0,
          addon_sales: 0,
          total_quantity: 0,
          order_count: 0,
          options: new Map(),
          addons: new Map(),
        });
      }

      const product = productMap.get(productId)!;

      // 상품 레벨 집계
      product.base_sales += baseSales;
      product.option_sales += optionSales;
      product.addon_sales += addonSales;
      product.total_quantity += item.quantity;
      product.order_count += 1;

      // 옵션별 집계 (기본가 + 옵션가만, 애드온 제외)
      if (!product.options.has(optionKey)) {
        product.options.set(optionKey, {
          option_id: optionId,
          option_name: optionName,
          sales: 0,
          quantity: 0,
          order_count: 0,
        });
      }

      const optionData = product.options.get(optionKey)!;
      optionData.sales += baseSales + optionSales; // 애드온 제외
      optionData.quantity += item.quantity;
      optionData.order_count += 1;

      // 애드온별 집계
      if (item.selected_addons && Array.isArray(item.selected_addons)) {
        item.selected_addons.forEach((addon: any) => {
          const addonId = addon.id || addon.addon_id;
          const addonName = addon.name || addon.addon_name || "알 수 없음";
          const addonPrice = addon.price || 0;
          const addonQuantity = addon.quantity || 1;
          const addonTotalSales = addonPrice * addonQuantity * item.quantity;

          if (!product.addons.has(addonId)) {
            product.addons.set(addonId, {
              addon_id: addonId,
              addon_name: addonName,
              sales: 0,
              quantity: 0,
              order_count: 0,
            });
          }

          const addonData = product.addons.get(addonId)!;
          addonData.sales += addonTotalSales;
          addonData.quantity += addonQuantity * item.quantity;
          addonData.order_count += 1;
        });
      }
    });

    // Convert to final format
    const result: ProductSalesData[] = Array.from(productMap.values()).map(
      (product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        total_sales: product.base_sales + product.option_sales + product.addon_sales,
        base_sales: product.base_sales,
        option_sales: product.option_sales,
        addon_sales: product.addon_sales,
        total_quantity: product.total_quantity,
        order_count: product.order_count,
        option_breakdown: Array.from(product.options.values())
          .sort((a, b) => b.sales - a.sales), // 매출 높은 순으로 정렬
        addon_breakdown: Array.from(product.addons.values())
          .sort((a, b) => b.sales - a.sales), // 매출 높은 순으로 정렬
      })
    );

    // Sort by total sales descending
    const sorted = result.sort((a, b) => b.total_sales - a.total_sales);

    console.log("📊 Final result count:", sorted.length);
    console.log("📊 First result:", sorted[0]);

    return sorted;
  },
};
