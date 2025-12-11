"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Coins,
  ArrowLeftRight,
  Ticket,
  Puzzle,
  User,
} from "lucide-react";
import { api } from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/tickets", label: "Tickets", icon: Ticket },
] as const;

const routeItems = [
  { href: "/routes/create", label: "Create route" },
  { href: "/routes", label: "List routes" },
] as const;

const currencyItems = [
  { href: "/currencies/create", label: "Create currency" },
  { href: "/currencies", label: "List currencies" },
] as const;

const pluginItems = [
  { href: "/plugins/parsers", label: "Parsers" },
  { href: "/plugins/payouts", label: "Payouts" },
  { href: "/plugins/merchants", label: "Merchants" },
  { href: "/plugins/amls", label: "AML" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useUser();
  const [showRoutesSheet, setShowRoutesSheet] = useState(false);
  const [showCurrenciesSheet, setShowCurrenciesSheet] = useState(false);
  const [showPluginsSheet, setShowPluginsSheet] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const isRoutesActive = pathname.startsWith("/routes");
  const isCurrenciesActive = pathname.startsWith("/currencies");
  const isPluginsActive = pathname.startsWith("/plugins");

  const handleLogout = async () => {
    try {
      await api.post("/auth/staff/logout");
      clearUser();
      setShowProfileSheet(false);
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      clearUser();
      router.push("/login");
    }
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-7 gap-1 px-1 py-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-[11px]",
                  active ? "text-slate-900" : "text-slate-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "mb-0.5 flex h-7 w-7 items-center justify-center rounded-full border",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-slate-50",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowRoutesSheet(true)}
            className={[
              "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-[11px]",
              isRoutesActive ? "text-slate-900" : "text-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "mb-0.5 flex h-7 w-7 items-center justify-center rounded-full border",
                isRoutesActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-slate-50",
              ].join(" ")}
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate">Routes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCurrenciesSheet(true)}
            className={[
              "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-[11px]",
              isCurrenciesActive ? "text-slate-900" : "text-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "mb-0.5 flex h-7 w-7 items-center justify-center rounded-full border",
                isCurrenciesActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-slate-50",
              ].join(" ")}
            >
              <Coins className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate">Currencies</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPluginsSheet(true)}
            className={[
              "flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-[11px]",
              isPluginsActive ? "text-slate-900" : "text-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "mb-0.5 flex h-7 w-7 items-center justify-center rounded-full border",
                isPluginsActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-slate-50",
              ].join(" ")}
            >
              <Puzzle className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate">Plugins</span>
          </button>

          <button
            type="button"
            onClick={() => setShowProfileSheet(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-[11px] text-slate-400"
          >
            <span className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-slate-50">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate">Profile</span>
          </button>
        </div>
      </nav>

      {showRoutesSheet && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowRoutesSheet(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Routes</h3>
              <button
                type="button"
                onClick={() => setShowRoutesSheet(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 p-3">
              {routeItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href === "/routes" &&
                    pathname.startsWith("/routes/") &&
                    !pathname.startsWith("/routes/create"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowRoutesSheet(false)}
                    className={[
                      "flex items-center rounded-lg px-3 py-2.5 text-sm",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showCurrenciesSheet && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowCurrenciesSheet(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Currencies
              </h3>
              <button
                type="button"
                onClick={() => setShowCurrenciesSheet(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 p-3">
              {currencyItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href === "/currencies" &&
                    pathname.startsWith("/currencies/") &&
                    !pathname.startsWith("/currencies/create"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowCurrenciesSheet(false)}
                    className={[
                      "flex items-center rounded-lg px-3 py-2.5 text-sm",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showPluginsSheet && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowPluginsSheet(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Plugins</h3>
              <button
                type="button"
                onClick={() => setShowPluginsSheet(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 p-3">
              {pluginItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowPluginsSheet(false)}
                    className={[
                      "flex items-center rounded-lg px-3 py-2.5 text-sm",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showProfileSheet && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowProfileSheet(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
              <button
                type="button"
                onClick={() => setShowProfileSheet(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white text-lg font-medium uppercase">
                  {user?.email?.[0] || "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">
                    {user?.email || "admin@example.com"}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {user?.role || "Staff"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
