"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Contact, LayoutDashboard, Megaphone, Radar, Sun, Zap } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facebook", label: "Facebook leads", icon: Megaphone },
  { href: "/leads", label: "Leads", icon: Zap },
  { href: "/discovery", label: "Discovery", icon: Radar },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Contact },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sun className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Solar Lead Engine</p>
          <p className="text-xs text-slate-500">UK Solar · Facebook inbound</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700">Owner email on qualify</p>
          <p className="mt-1 text-xs text-slate-500">
            You get the alert. Customer is not emailed. Live Twilio is opt-in.
          </p>
        </div>
      </div>
    </aside>
  );
}
