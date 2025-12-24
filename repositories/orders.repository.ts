import { supabaseServer as supabase } from "@/lib/supabase-server";
import { OrderFilters, OrderWithDetails } from "@/types/orders.types";

export const ordersRepository = {
  /**
   * 주문 목록 조회 (관리자용)
   */
  async findMany(filters: OrderFilters = {}) {
    const {
      consultationStatus,
      assignedAdminId,
      handlerAdminId,
      productId,
      search,
      startDate,
      endDate,
      sortBy,
      page = 1,
      limit = 20,
    } = filters;

    const shouldPaginate = limit !== "all";
    const numericLimit = typeof limit === "number" ? limit : undefined;
    const from = shouldPaginate
      ? (page - 1) * (numericLimit as number)
      : undefined;
    const to =
      shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined;

    let query = supabase.from("orders").select(
      `
        *,
        assigned_admin:admin_users!orders_assigned_admin_id_fkey(id, username, full_name),
        handler_admin:admin_users!orders_handler_admin_id_fkey(id, username, full_name),
        order_items(*),
        order_health_consultation(*)
      `,
      {
        count: "exact",
      }
    );

    if (consultationStatus) {
      query = query.eq("consultation_status", consultationStatus);
    }

    if (assignedAdminId) {
      query = query.eq("assigned_admin_id", assignedAdminId);
    }

    if (handlerAdminId) {
      query = query.eq("handler_admin_id", handlerAdminId);
    }

    if (productId) {
      query = query.eq("order_items.product_id", productId);
    }

    if (search) {
      query = query.or(
        `order_id.ilike.%${search}%,user_email.ilike.%${search}%,user_name.ilike.%${search}%,user_phone.ilike.%${search}%`
      );
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    switch (sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "amount_high":
        query = query.order("total_amount", { ascending: false });
        break;
      case "amount_low":
        query = query.order("total_amount", { ascending: true });
        break;
      case "latest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    if (shouldPaginate && typeof from === "number" && typeof to === "number") {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }

    const totalCount =
      shouldPaginate && typeof count === "number"
        ? count
        : count ?? data?.length ?? 0;

    // Transform order_health_consultation from array to single object
    const transformedData = (data || []).map((order: any) => {
      const consultations = order.order_health_consultation;
      const consultation =
        Array.isArray(consultations) && consultations.length > 0
          ? consultations[0]
          : consultations;

      return {
        ...order,
        order_health_consultation: consultation,
      };
    });

    return {
      orders: transformedData as OrderWithDetails[],
      totalCount,
      totalPages:
        shouldPaginate && numericLimit
          ? Math.ceil(totalCount / numericLimit)
          : 1,
      currentPage: shouldPaginate ? page : 1,
    };
  },

  async countByConsultationStatus(statuses: string[]) {
    const entries = await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("consultation_status", status)
          .neq("status", "payment_pending"); // 입금 대기 제외

        return [status, count ?? 0] as const;
      })
    );

    return Object.fromEntries(entries);
  },

  /**
   * 주문 상세 조회
   */
  async findById(id: string): Promise<OrderWithDetails | null> {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        assigned_admin:admin_users!orders_assigned_admin_id_fkey(id, username, full_name),
        handler_admin:admin_users!orders_handler_admin_id_fkey(id, username, full_name),
        order_items(*),
        order_health_consultation(*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return null;
    }

    const consultation = (order as any).order_health_consultation;

    if (!consultation) {
      console.warn(`Order ${id} has no health consultation data`);
    }

    return {
      ...order,
      order_health_consultation: consultation,
    } as OrderWithDetails;
  },

  /**
   * 주문 상태 업데이트
   */
  async updateStatus(
    orderId: string,
    status: string,
    paymentKey?: string
  ): Promise<OrderWithDetails> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (paymentKey) {
      updateData.payment_key = paymentKey;
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("order_id", orderId)
      .select()
      .single();

    if (error || !order) {
      console.error("Error updating order status:", error);
      throw new Error("Failed to update order status");
    }

    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch updated order");
    }

    return fullOrder;
  },

  /**
   * 상담 상태 업데이트
   */
  async updateConsultationStatus(
    orderId: string,
    consultationStatus: string
  ): Promise<OrderWithDetails> {
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        consultation_status: consultationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select()
      .single();

    if (error || !order) {
      console.error("Error updating consultation status:", error);
      throw new Error("Failed to update consultation status");
    }

    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch updated order");
    }

    return fullOrder;
  },

  /**
   * 배송 정보 업데이트
   */
  async updateShippingInfo(
    orderId: string,
    shippingData: {
      shipping_company?: string;
      tracking_number?: string;
      shipping_status?: string;
    }
  ): Promise<OrderWithDetails> {
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        ...shippingData,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select()
      .single();

    if (error || !order) {
      console.error("Error updating shipping info:", error);
      throw new Error("Failed to update shipping info");
    }

    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch updated order");
    }

    return fullOrder;
  },

  /**
   * 주문을 관리자에게 배정
   */
  async assignToAdmin(
    orderId: string,
    adminId: string
  ): Promise<OrderWithDetails> {
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        assigned_admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select()
      .single();

    if (error || !order) {
      console.error("Error assigning order to admin:", error);
      throw new Error("Failed to assign order to admin");
    }

    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch updated order");
    }

    return fullOrder;
  },

  /**
   * 관리자 메모 업데이트
   */
  async updateAdminMemo(
    orderId: string,
    adminMemo: string
  ): Promise<OrderWithDetails> {
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        admin_memo: adminMemo,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .select()
      .single();

    if (error || !order) {
      console.error("Error updating admin memo:", error);
      throw new Error("Failed to update admin memo");
    }

    const fullOrder = await this.findById(order.id);
    if (!fullOrder) {
      throw new Error("Failed to fetch updated order");
    }

    return fullOrder;
  },

  /**
   * 대시보드 통계
   */
  async getStats() {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    // 총 주문 수 (입금 대기 제외)
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .neq("status", "payment_pending");

    // 오늘 주문 수 (입금 대기 제외)
    const { count: todayOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .neq("status", "payment_pending")
      .gte("created_at", todayStart);

    // 총 매출
    const { data: allOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed");

    const totalRevenue = allOrders?.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );

    // 오늘 매출
    const { data: todayCompletedOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", todayStart);

    const todayRevenue = todayCompletedOrders?.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );

    // 대기중인 주문 수 (입금 대기가 아닌 pending)
    const { count: pendingOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return {
      totalOrders: totalOrders || 0,
      todayOrders: todayOrders || 0,
      totalRevenue: totalRevenue || 0,
      todayRevenue: todayRevenue || 0,
      pendingOrders: pendingOrders || 0,
    };
  },
};
