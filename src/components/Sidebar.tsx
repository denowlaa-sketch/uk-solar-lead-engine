"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, Sun, Users } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/facebook", label: "Inbox", icon: Inbox },
  { href: "/leads", label: "All leads", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/10 bg-[#2c3228]/95 text-[#e8eadf] backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c4d4a8] text-[#2c3228]">
          <Sun className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Solar leads</p>
          <p className="text-xs text-[#c5cbb8]">Facebook · calls · quotes</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#c4d4a8] text-[#24301c]"
                  : "text-[#d5d9cc] hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
