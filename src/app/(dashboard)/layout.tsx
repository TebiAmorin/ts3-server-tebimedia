"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/users", label: "Usuarios", icon: "◎" },
  { href: "/groups", label: "Grupos", icon: "◈" },
  { href: "/logs", label: "Logs", icon: "▤" },
  { href: "/bans", label: "Bans", icon: "⊘" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-bg-secondary">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-lg font-bold text-accent">TS3</span>
          <span className="ml-2 text-sm text-text-muted">Panel</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-bg-hover hover:text-danger"
          >
            <span className="text-base">⏻</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-bg-primary p-6">
        {children}
      </main>
    </div>
  );
}
