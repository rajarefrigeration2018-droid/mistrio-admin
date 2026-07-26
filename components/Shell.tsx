// components/Shell.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BadgeIndianRupee, Bell, Boxes, CalendarClock, ChartNoAxesColumn, LayoutGrid,
  LogOut, Menu, MessageSquare, Package, Settings, Star, Tag, Ticket, Users,
  Wrench, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Item = { href: string; label: string; icon: any; perm: string };

/** Grouped the way an operator thinks about the day, not by data model. */
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Today',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutGrid, perm: 'dashboard' },
      { href: '/bookings', label: 'Bookings', icon: CalendarClock, perm: 'bookings' },
      { href: '/technicians', label: 'Technicians', icon: Wrench, perm: 'partners' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/services', label: 'Services', icon: Boxes, perm: 'catalog' },
      { href: '/parts', label: 'Spare parts', icon: Package, perm: 'parts' },
      { href: '/coupons', label: 'Offers', icon: Tag, perm: 'coupons' },
    ],
  },
  {
    title: 'People & money',
    items: [
      { href: '/customers', label: 'Customers', icon: Users, perm: 'users' },
      { href: '/payouts', label: 'Payouts', icon: BadgeIndianRupee, perm: 'payouts' },
      { href: '/reports', label: 'Reports', icon: ChartNoAxesColumn, perm: 'reports' },
    ],
  },
  {
    title: 'Care',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell, perm: 'notifications' },
      { href: '/reviews', label: 'Reviews', icon: Star, perm: 'reviews' },
      { href: '/tickets', label: 'Support', icon: MessageSquare, perm: 'support' },
      { href: '/settings', label: 'Settings', icon: Settings, perm: 'config' },
    ],
  },
];

/** The four an owner taps most on a phone. */
const BOTTOM: Item[] = [
  { href: '/dashboard', label: 'Today', icon: LayoutGrid, perm: 'dashboard' },
  { href: '/bookings', label: 'Bookings', icon: CalendarClock, perm: 'bookings' },
  { href: '/technicians', label: 'Techs', icon: Wrench, perm: 'partners' },
  { href: '/parts', label: 'Parts', icon: Package, perm: 'parts' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { admin, logout, can } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-dvh lg:flex">
      {/* ---------------- desktop sidebar ---------------- */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo">
              <span className="font-mono text-sm font-bold text-amber">M</span>
            </div>
            <span className="font-semibold tracking-tight">Mistrio</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            {GROUPS.map((group) => {
              const visible = group.items.filter((i) => can(i.perm));
              if (!visible.length) return null;
              return (
                <div key={group.title} className="mb-5">
                  <p className="eyebrow px-2 pb-1.5">{group.title}</p>
                  {visible.map((item) => (
                    <NavLink key={item.href} item={item} active={active(item.href)} />
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-line p-3">
            <AdminBadge name={admin?.name} role={admin?.role} />
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-paper"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- mobile top bar ---------------- */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo">
            <span className="font-mono text-xs font-bold text-amber">M</span>
          </div>
          <span className="font-semibold tracking-tight">Mistrio</span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="press -mr-2 p-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ---------------- mobile drawer ---------------- */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <AdminBadge name={admin?.name} role={admin?.role} />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1.5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {GROUPS.map((group) => {
                const visible = group.items.filter((i) => can(i.perm));
                if (!visible.length) return null;
                return (
                  <div key={group.title} className="mb-5">
                    <p className="eyebrow px-2 pb-1.5">{group.title}</p>
                    {visible.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={active(item.href)}
                        onClick={() => setMenuOpen(false)}
                      />
                    ))}
                  </div>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="flex items-center gap-2.5 border-t border-line px-5 py-4 text-sm text-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ---------------- page ---------------- */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* ---------------- mobile bottom bar ---------------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {BOTTOM.filter((i) => can(i.perm)).map((item) => {
          const on = active(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-2xs font-medium ${
                on ? 'text-indigo' : 'text-muted'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={on ? 2.4 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavLink({
  item, active, onClick,
}: { item: Item; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
        active
          ? 'bg-indigo-wash font-semibold text-indigo'
          : 'text-ink/70 hover:bg-paper'
      }`}
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.3 : 1.8} />
      {item.label}
    </Link>
  );
}

function AdminBadge({ name, role }: { name?: string; role?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-wash text-sm font-semibold text-indigo">
        {(name || 'A').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name || 'Admin'}</p>
        <p className="text-2xs capitalize text-muted">
          {(role || '').replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}
