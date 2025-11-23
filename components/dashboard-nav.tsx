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
} from "lucide-react";

const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "상품 관리",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "주문 관리",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "유저 관리",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "쿠폰 관리",
    href: "/dashboard/coupons",
    icon: Ticket,
  },
  {
    title: "어드민 관리",
    href: "/dashboard/admins",
    icon: UserPlus,
    masterOnly: true,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, logout } = useAdminStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Shop Admin</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            if (item.masterOnly && adminUser?.role !== "master") {
              return null;
            }

            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="mb-3 rounded-lg bg-gray-800 p-3">
          <p className="text-sm font-medium">
            {adminUser?.full_name || adminUser?.username}
          </p>
          <p className="text-xs text-gray-400">
            {adminUser?.role === "master" ? "마스터 관리자" : "관리자"}
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2 border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
