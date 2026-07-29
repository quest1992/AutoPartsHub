'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useAuth } from './auth-provider';

type NavigationItem = {
  href: string;
  label: string;
  permissions?: string[];
  icon: string;
  roles?: string[];
};

const navigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Главная', icon: '🏠' },
  {
    href: '/search',
    label: 'Поиск запчастей',
    permissions: ['INVENTORY_VIEW'],
    icon: '🔍',
  },
  {
    href: '/inventory',
    label: 'Товары',
    permissions: ['INVENTORY_VIEW'],
    icon: '📦',
  },
  {
    href: '/sales',
    label: 'Продажи',
    permissions: ['SALES_VIEW', 'SALES_CREATE'],
    icon: '💰',
  },
  {
    href: '/purchases',
    label: 'Закупки',
    permissions: ['PURCHASES_VIEW', 'PURCHASES_CREATE'],
    icon: '🚚',
  },
  {
    href: '/shop/inventory/import',
    label: 'Импорт Excel',
    permissions: ['INVENTORY_IMPORT'],
    icon: '📥',
  },
  {
    href: '/employees',
    label: 'Сотрудники',
    permissions: ['EMPLOYEES_VIEW'],
    icon: '👥',
  },
  {
    href: '/shops',
    label: 'Магазины',
    permissions: ['SHOPS_VIEW'],
    icon: '🏪',
  },
  {
    href: '/part-categories',
    label: 'Категории',
    permissions: ['CATALOG_MANAGE'],
    icon: '🗂',
  },
  {
    href: '/part-catalog',
    label: 'Каталог',
    permissions: ['CATALOG_MANAGE'],
    icon: '📚',
  },
  {
    href: '/part-numbers',
    label: 'OEM Numbers',
    permissions: ['CATALOG_MANAGE'],
    icon: '#',
  },
  {
    href: '/admin/orders',
    label: 'Заказы клиентов',
    permissions: ['ORDER_MANAGE'],
    icon: '🧾',
  },
  { href: '/admin/shop-settlements', label: 'Расчёты с магазинами', roles: ['SUPER_ADMIN'], icon: '₽' },
  { href: '/shop/finance', label: 'Финансы магазина', permissions: ['FINANCE_VIEW'], icon: '¤' },
  { href: '/admin/finance-audit', label: 'Финансовый аудит', roles: ['SUPER_ADMIN'], icon: 'ƒ' },
  { href: '/shop/warehouses', label: 'Склады', permissions: ['INVENTORY_UPDATE'], icon: '🏭' },
  { href: '/shop/inventory/transfers', label: 'Перемещения', permissions: ['INVENTORY_QUANTITY_UPDATE'], icon: '⇄' },
  { href: '/shop/inventory/stocktakes', label: 'Инвентаризация', permissions: ['INVENTORY_QUANTITY_UPDATE'], icon: '✓' },
  { href: '/admin/inventory-audit', label: 'Аудит остатков', roles: ['SUPER_ADMIN'], icon: '∑' },
  { href: '/admin/catalog-bootstrap', label: 'Наполнение каталога', roles: ['SUPER_ADMIN'], icon: '🧰' },
  { href: '/admin/taxonomy-studio', label: 'Таксономия каталога', roles: ['SUPER_ADMIN'], icon: '🧭' },
  { href: '/catalog-suggestions', label: 'Мои предложения', permissions: ['CATALOG_VIEW'], icon: '💡' },
  { href: '/admin/catalog-suggestions', label: 'Предложения каталога', roles: ['SUPER_ADMIN'], icon: '✅' },
  { href: '/admin/vehicles', label: 'Автомобили', permissions: ['CATALOG_VIEW'], icon: '🚘' },
  {
    href: '/vin',
    label: 'VIN Decoder',
    permissions: ['CATALOG_VIEW'],
    icon: 'VIN',
  },
];

const roleLabels = {
  SUPER_ADMIN: 'Супер-администратор',
  SHOP_ADMIN: 'Администратор магазина',
  MANAGER: 'Менеджер',
  SELLER: 'Продавец',
  VIEWER: 'Наблюдатель',
};

const ProtectedLayoutContext = createContext(false);

export function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isNested = useContext(ProtectedLayoutContext);
  const pathname = usePathname();
  const router = useRouter();

  const {
    hasAnyPermission,
    isAuthenticated,
    isLoading,
    logout,
    user,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isNested) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        Загрузка...
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ');

  const visibleItems = navigationItems.filter(
    (item) =>
      !item.permissions ||
      hasAnyPermission(...item.permissions),
  ).filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <ProtectedLayoutContext.Provider value>
      <div className="min-h-screen bg-slate-100 md:flex">

      <aside className="w-72 bg-slate-950 text-white shadow-2xl">

        <div className="p-6">

          <Link href="/dashboard" className="block">
            <h1 className="text-3xl font-bold">
              AutoStock
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Система управления автозапчастями
            </p>
          </Link>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">

            <p className="text-xs uppercase tracking-widest text-slate-500">
              Пользователь
            </p>

            <p className="mt-3 text-lg font-semibold">
              {fullName || user.phone}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {roleLabels[user.role]}
            </p>

            {user.shop && (
              <div className="mt-3 rounded-lg bg-slate-800 px-3 py-2 text-sm">
                🏪 {user.shop.name}
              </div>
            )}
          </div>

          <div className="my-6 border-t border-slate-800"></div>

          <nav className="space-y-2">

            {visibleItems.map((item) => {

              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>

                  <span>{item.label}</span>

                </Link>
              );
            })}

          </nav>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
          >
            Выйти
          </button>

        </div>

      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>

      </div>
    </ProtectedLayoutContext.Provider>
  );
}
