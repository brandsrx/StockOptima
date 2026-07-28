"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Calculator,
  Settings,
  Boxes,
  TrendingUp,
  DollarSign,
  GitBranch,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventario", icon: Package },
  { href: "/simulator", label: "Simulador EOQ", icon: Calculator },
  { href: "/forecast", label: "Pronóstico", icon: TrendingUp },
  { href: "/currency", label: "Volatilidad", icon: DollarSign },
  { href: "/flow", label: "Mapa Inventario", icon: GitBranch },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-lg lg:hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
          color: "var(--text-secondary)",
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ${
          sidebarWidth
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo + Close mobile */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid var(--border-secondary)" }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shrink-0">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1
                className="text-base font-bold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                StockOptima
              </h1>
              <p
                className="text-[11px] leading-tight"
                style={{ color: "var(--text-tertiary)" }}
              >
                Investigación Operativa II
              </p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] lg:hidden"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "hover:bg-[var(--bg-tertiary)]"
                }`}
                style={{
                  color: isActive ? undefined : "var(--text-secondary)",
                }}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                  style={{
                    color: isActive ? undefined : "var(--text-tertiary)",
                  }}
                />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3 space-y-2"
          style={{ borderTop: "1px solid var(--border-secondary)" }}
        >
          <button
            onClick={toggleDark}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            {dark ? (
              <Sun className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            )}
            {!collapsed && (dark ? "Modo Claro" : "Modo Oscuro")}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Colapsar
              </>
            )}
          </button>

          {!collapsed && (
            <p
              className="text-[10px] text-center pt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              v2.0 — OPE II
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
