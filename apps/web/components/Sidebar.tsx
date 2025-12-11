"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";

type GroupKey = "currencies" | "routes" | "plugins";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useUser();
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    currencies: true,
    routes: true,
    plugins: true,
  });

  const toggleGroup = (key: GroupKey) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";

    if (href.endsWith("/create")) {
      return pathname === href;
    }

    if (pathname.startsWith(href + "/")) {
      return !pathname.startsWith(href + "/create");
    }

    return pathname === href;
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/staff/logout");
      clearUser();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      clearUser();
      router.push("/login");
    }
  };

  return (
    <aside
      className="
        hidden md:flex md:flex-col md:w-64 lg:w-72
        border-r border-slate-200 bg-white/90 backdrop-blur
        h-full overflow-y-auto
        "
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-medium uppercase">
          {user?.email?.[0] || "A"}
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <span className="text-sm font-medium text-slate-900 truncate">
            {user?.email || "admin@example.com"}
          </span>
          <span className="text-xs text-slate-400 capitalize">
            {user?.role || "Staff"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-7 items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          Logout
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-sm">
        <SidebarLink href="/" active={isActive("/")}>
          Dashboard
        </SidebarLink>

        <SidebarLink href="/orders" active={isActive("/orders")}>
          Orders
        </SidebarLink>

        <SidebarGroup
          label="Currencies"
          open={openGroups.currencies}
          onToggle={() => toggleGroup("currencies")}
        >
          <SidebarSubLink
            href="/currencies/create"
            active={isActive("/currencies/create")}
          >
            Create currency
          </SidebarSubLink>
          <SidebarSubLink href="/currencies" active={isActive("/currencies")}>
            List currencies
          </SidebarSubLink>
        </SidebarGroup>

        <SidebarGroup
          label="Routes"
          open={openGroups.routes}
          onToggle={() => toggleGroup("routes")}
        >
          <SidebarSubLink
            href="/routes/create"
            active={isActive("/routes/create")}
          >
            Create route
          </SidebarSubLink>
          <SidebarSubLink href="/routes" active={isActive("/routes")}>
            List routes
          </SidebarSubLink>
        </SidebarGroup>

        <SidebarGroup
          label="Plugins"
          open={openGroups.plugins}
          onToggle={() => toggleGroup("plugins")}
        >
          <SidebarSubLink
            href="/plugins/parsers"
            active={isActive("/plugins/parsers")}
          >
            Parsers
          </SidebarSubLink>
          <SidebarSubLink
            href="/plugins/payouts"
            active={isActive("/plugins/payouts")}
          >
            Payouts
          </SidebarSubLink>
          <SidebarSubLink
            href="/plugins/merchants"
            active={isActive("/plugins/merchants")}
          >
            Merchants
          </SidebarSubLink>
          <SidebarSubLink
            href="/plugins/amls"
            active={isActive("/plugins/amls")}
          >
            AML
          </SidebarSubLink>
        </SidebarGroup>

        <SidebarLink href="/tickets" active={isActive("/tickets")}>
          Tickets
        </SidebarLink>
      </nav>
    </aside>
  );
}

type SidebarLinkProps = {
  href: string;
  active: boolean;
  children: React.ReactNode;
};

function SidebarLink({ href, active, children }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-slate-900 text-slate-50"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <span>{children}</span>
    </Link>
  );
}

function SidebarSubLink({ href, active, children }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-md pl-6 pr-2.5 py-1.5 text-xs transition-colors",
        active
          ? "bg-slate-900/5 text-slate-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <span>{children}</span>
    </Link>
  );
}

type SidebarGroupProps = {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function SidebarGroup({ label, open, onToggle, children }: SidebarGroupProps) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      >
        <span>{label}</span>
        <span
          className={[
            "text-xs text-slate-400 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
        >
          ›
        </span>
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}
