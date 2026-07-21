'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from './auth-provider';

type NavigationItem = {
  href: string;
  label: string;
  permissions?: string[];
};

const navigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Главная' },
  {
    href: '/search',
    label: 'Поиск запчастей',
    permissions: ['INVENTORY_VIEW'],
  },
  { href: '/inventory', label: 'Товары', permissions: ['INVENTORY_VIEW'] },
  { href: '/sales', label: 'Продажи', permissions: ['SALES_VIEW', 'SALES_CREATE'] },
  {
    href: '/purchases',
    label: 'Закупки',
    permissions: ['PURCHASES_VIEW', 'PURCHASES_CREATE'],
  },
  {
    href: '/dashboard/inventory/import',
    label: 'Импорт Excel',
    permissions: ['INVENTORY_IMPORT'],
  },
  {
    href: '/employees',
    label: 'Сотрудники',
    permissions: ['EMPLOYEES_VIEW'],
  },
  { href: '/shops', label: 'Магазины', permissions: ['SHOPS_VIEW'] },
  { href: '/part-categories', label: 'Категории запчастей', permissions: ['CATALOG_MANAGE'] },
  { href: '/part-catalog', label: 'Центральный каталог', permissions: ['CATALOG_MANAGE'] },
];

const roleLabels = {
  SUPER_ADMIN: 'Супер-администратор',
  SHOP_ADMIN: 'Администратор магазина',
  MANAGER: 'Менеджер',
  SELLER: 'Продавец',
  VIEWER: 'Наблюдатель',
};

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAnyPermission, isAuthenticated, isLoading, logout, user } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">
        Загрузка профиля…
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const visibleItems = navigationItems.filter(
    (item) => !item.permissions || hasAnyPermission(...item.permissions),
  );

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
      <aside className="border-b border-slate-200 bg-white p-4 md:min-h-screen md:w-64 md:border-r md:border-b-0">
        <Link href="/dashboard" className="text-xl font-bold text-blue-700">
          AutoStock
        </Link>

        <div className="mt-5 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-900">{fullName || user.phone}</p>
          <p className="mt-1 text-slate-500">{roleLabels[user.role]}</p>
          {user.shop && <p className="mt-1 text-slate-500">{user.shop.name}</p>}
        </div>

        <nav className="mt-6 flex gap-2 overflow-x-auto md:block">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block whitespace-nowrap rounded px-3 py-2 text-sm ${
                pathname === item.href
                  ? 'bg-blue-50 font-medium text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 rounded border border-slate-300 px-3 py-2 text-sm"
        >
          Выйти
        </button>
      </aside>

      <section className="flex-1 p-4 md:p-8">{children}</section>
    </div>
  );
}
