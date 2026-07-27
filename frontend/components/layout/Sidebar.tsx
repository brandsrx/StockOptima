"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Calculator,
  Settings,
  Boxes,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/inventory",
    label: "Inventario",
    icon: Package,
  },
  {
    href: "/simulator",
    label: "Simulador EOQ",
    icon: Calculator,
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">
            StockOptima
          </h1>
          <p className="text-[11px] text-gray-400 leading-tight">
            Optimización de Inventario
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 text-center">
          v0.1.0 — Modo Demo
        </p>
      </div>
    </aside>
  );
}
