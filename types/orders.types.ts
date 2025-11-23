import { AdminUser } from "@/models/admin.model";
import {
  Order,
  OrderItem,
  OrderHealthConsultation,
  ConsultationStatus,
} from "@/models";

export type OrderSortOption =
  | "latest"
  | "oldest"
  | "amount_high"
  | "amount_low";

export interface OrderFilters {
  consultationStatus?: string;
  paymentStatus?: string;
  assignedAdminId?: string;
  productId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: OrderSortOption;
  page?: number;
  limit?: number | "all";
}

export interface OrderWithDetails extends Order {
  consultation_status: ConsultationStatus;
  assigned_admin_id?: string | null;
  handler_admin_id?: string | null;
  assigned_admin?: AdminUser | null;
  handler_admin?: AdminUser | null;
  order_items?: OrderItem[];
  order_health_consultations?: OrderHealthConsultation[];
}
