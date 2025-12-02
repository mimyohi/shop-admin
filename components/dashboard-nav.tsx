"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAdminStore } from "@/store/admin-store";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  UserPlus,
  Ticket,
  Coins,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Image,
  Home,
} from "lucide-react";

const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
    masterOnly: true,
  },
  {
    title: "상품 관리",
    href: "/dashboard/products",
    icon: Package,
    masterOnly: true,
  },
  {
    title: "배너 관리",
    href: "/dashboard/banners",
    icon: Image,
    masterOnly: true,
  },
  {
    title: "홈 상품 설정",
    href: "/dashboard/home-products",
    icon: Home,
    masterOnly: true,
  },
  {
    title: "주문 관리",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "매출 리포트",
    href: "/dashboard/reports/product-sales",
    icon: BarChart3,
    masterOnly: true,
  },
  {
    title: "유저 관리",
    href: "/dashboard/users",
    icon: Users,
    masterOnly: true,
  },
  {
    title: "쿠폰 관리",
    href: "/dashboard/coupons",
    icon: Ticket,
    masterOnly: true,
  },
  {
    title: "어드민 관리",
    href: "/dashboard/admins",
    icon: UserPlus,
    masterOnly: true,
  },
];

type DashboardNavProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export function DashboardNav({
  collapsed = false,
  onToggle,
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, logout } = useAdminStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-gray-900 text-white transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        <h1 className={cn("text-xl font-bold", collapsed && "sr-only")}>
          Shop Admin
        </h1>
        {onToggle && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggle}
            className="text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            </span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            if (item.masterOnly && adminUser?.role !== "master") {
              return null;
            }

            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                  collapsed ? "justify-center" : "gap-3"
                )}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-800 p-4">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-gray-800 p-3">
            <p className="text-sm font-medium">
              {adminUser?.full_name || adminUser?.username}
            </p>
            <p className="text-xs text-gray-400">
              {adminUser?.role === "master" ? "마스터 관리자" : "관리자"}
            </p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          className={cn(
            "w-full gap-2 border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "로그아웃"}
        </Button>
      </div>
    </div>
  );
}
