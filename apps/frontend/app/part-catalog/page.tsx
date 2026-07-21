'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import { useAuth } from '../../components/auth-provider';
import {
  ApiError,
  getPartCatalog,
  getPartCategories,
  PartCatalogResponse,
  PartCategoryOption,
  updatePartCatalogItem,
} from '../../lib/api';

const UNASSIGNED_CATEGORY_NAME = 'Не распределено';

export default function PartCatalogPage() {
  const { hasPermission, isLoading } = useAuth();

  const [query, setQuery] = useState('');
  const [data, setData] = useState<PartCatalogResponse | null>(null);
  const [categories, setCategories] = useState<PartCategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});

  const [categorySearch, setCategorySearch] = useState<
  Record<string, string>
>({});

const [openedSearch, setOpenedSearch] = useState<string | null>(null);

const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const canManage = hasPermission('CATALOG_MANAGE');

  const getCategoryLabel = useCallback(
  (category: PartCategoryOption) =>
    category.parent
      ? `${category.parent.name} → ${category.name}`
      : category.name,
  [],
);

const getFilteredCategories = useCallback(
  (itemId: string) => {
    const search = (categorySearch[itemId] ?? '')
      .trim()
      .toLocaleLowerCase('ru');

    return [...categories]
      .filter((category) => {
        if (!search) {
          return true;
        }

        return getCategoryLabel(category)
          .toLocaleLowerCase('ru')
          .includes(search);
      })
      .sort((a, b) =>
        getCategoryLabel(a).localeCompare(
          getCategoryLabel(b),
          'ru',
          { sensitivity: 'base' },
        ),
      )
      .slice(0, 12);
  },
  [categories, categorySearch, getCategoryLabel],
);

  const load = useCallback(
    async (page = 1) => {
      if (!canManage) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [catalogResponse, categoriesResponse] = await Promise.all([
          getPartCatalog({
            search: query.trim() || undefined,
            page,
            limit: 20,
            isActive: true,
          }),
          getPartCategories(),
        ]);

        setData(catalogResponse);
        setCategories(categoriesResponse.data);
      } catch (e) {
        setError(
          e instanceof ApiError && e.status === 403
            ? 'Недостаточно прав'
            : e instanceof Error
              ? e.message
              : 'Ошибка загрузки',
        );
      } finally {
        setLoading(false);
      }
    },
    [canManage, query],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [load]);

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.isActive &&
          category.name !== UNASSIGNED_CATEGORY_NAME &&
          category.slug !== 'unassigned',
      ),
    [categories],
  );

  const visibleItems = useMemo(() => {
    const items = data?.data ?? [];

    if (!onlyUnassigned) {
      return items;
    }

    return items.filter(
      (item) => item.category.name === UNASSIGNED_CATEGORY_NAME,
    );
  }, [data, onlyUnassigned]);

  function selectCategory(itemId: string, categoryId: string) {
    setSelectedCategories((current) => ({
      ...current,
      [itemId]: categoryId,
    }));
  }

  async function saveCategory(itemId: string) {
    const categoryId = selectedCategories[itemId];

    if (!categoryId) {
      setError('Сначала выберите категорию.');
      return;
    }

    setSavingId(itemId);
    setError('');
    setSuccess('');

    try {
      const updatedItem = await updatePartCatalogItem(itemId, {
        categoryId,
      });

      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          data: current.data.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  categoryId: updatedItem.categoryId,
                  category: updatedItem.category,
                }
              : item,
          ),
        };
      });

      setSelectedCategories((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });

      setSuccess(`Категория для «${updatedItem.name}» сохранена.`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Не удалось сохранить категорию.',
      );
    } finally {
      setSavingId(null);
    }
  }

  const currentPage = data?.meta.page ?? 1;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <ProtectedLayout>
      {!isLoading && !canManage ? (
        <section className="rounded-xl bg-white p-6">
          <h1 className="text-2xl font-bold">Центральный каталог</h1>
          <p className="mt-3">
            Недостаточно прав для управления каталогом.
          </p>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Центральный каталог</h1>
              <p className="text-slate-500">
                Единый справочник запчастей для всех магазинов
              </p>
            </div>

            <Link
              href="/part-catalog/new"
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Добавить позицию
            </Link>
          </div>

          <div className="mt-5 rounded-xl bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
  value={query}
  onChange={(event) => setQuery(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === 'Enter') {
      void load(1);
    }
  }}
  className="w-full max-w-lg rounded border p-2"
  placeholder="Название, slug или внутренний код"
/>

              <button
                onClick={() => void load(1)}
                className="rounded border px-4 py-2 hover:bg-slate-50"
              >
                Найти
              </button>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={onlyUnassigned}
                  onChange={(event) =>
                    setOnlyUnassigned(event.target.checked)
                  }
                />
                <span>Только «Не распределено»</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded bg-green-50 p-3 text-green-700">
              {success}
            </p>
          )}

          {loading ? (
            <p className="mt-5">Загрузка…</p>
          ) : visibleItems.length === 0 ? (
            <p className="mt-5 rounded bg-white p-5">
              {onlyUnassigned
                ? 'На этой странице нет нераспределённых деталей.'
                : 'Позиций каталога пока нет.'}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl bg-white">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left">Название</th>
                    <th className="p-3 text-left">Код</th>
                    <th className="p-3 text-left">Категория</th>
                    <th className="p-3 text-left">Сторона</th>
                    <th className="p-3 text-left">Положение</th>
                    <th className="p-3 text-left">Статус</th>
                    <th className="p-3 text-left">Действие</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.map((item) => {
                    const isUnassigned =
                      item.category.name === UNASSIGNED_CATEGORY_NAME;

                    return (
                      <tr key={item.id} className="border-t align-middle">
                        <td className="p-3 font-medium">{item.name}</td>

                        <td className="p-3">{item.internalCode}</td>

                        <td className="p-3">
                          {isUnassigned ? (
                            <div className="flex min-w-[280px] gap-2">
                              <div className="relative w-full">
  <input
    type="text"
    value={categorySearch[item.id] ?? ''}
    onFocus={() => setOpenedSearch(item.id)}
    onBlur={() => {
  setTimeout(() => {
    setOpenedSearch(null);
  }, 150);
}}
    onChange={(event) => {
      setCategorySearch((current) => ({
        ...current,
        [item.id]: event.target.value,
      }));

      setOpenedSearch(item.id);

      setSelectedCategories((current) => ({
        ...current,
        [item.id]: '',
      }));
    }}
    placeholder="Начните вводить категорию..."
    autoComplete="off"
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />

  {openedSearch === item.id && (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
      {getFilteredCategories(item.id).length > 0 ? (
        getFilteredCategories(item.id).map((category) => (
          <button
            key={category.id}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();

              selectCategory(item.id, category.id);

              setCategorySearch((current) => ({
                ...current,
                [item.id]: getCategoryLabel(category),
              }));

              setOpenedSearch(null);
            }}
            className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 last:border-b-0 hover:bg-blue-50 hover:text-blue-700"
          >
           {(() => {
  const label = getCategoryLabel(category);
  const search = (categorySearch[item.id] ?? '').trim();

  if (!search) {
    return label;
  }

  const index = label
    .toLocaleLowerCase('ru')
    .indexOf(search.toLocaleLowerCase('ru'));

  if (index === -1) {
    return label;
  }

  return (
    <>
      {label.slice(0, index)}

      <span className="rounded bg-yellow-100 px-0.5 font-semibold text-slate-900">
        {label.slice(index, index + search.length)}
      </span>

      {label.slice(index + search.length)}
    </>
  );
})()}
          </button>
        ))
      ) : (
        <p className="px-3 py-3 text-sm text-slate-500">
          Категория не найдена
        </p>
      )}
    </div>
  )}
</div>

                              <button
                                onClick={() => void saveCategory(item.id)}
                                disabled={
                                  savingId === item.id ||
                                  !selectedCategories[item.id]
                                }
                                className="rounded bg-green-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {savingId === item.id
                                  ? 'Сохраняю…'
                                  : 'Сохранить'}
                              </button>
                            </div>
                          ) : (
                            item.category.name
                          )}
                        </td>

                        <td className="p-3">{item.side}</td>
                        <td className="p-3">{item.position}</td>

                        <td className="p-3">
                          {item.isActive ? 'Активна' : 'Отключена'}
                        </td>

                        <td className="p-3">
                          <Link
                            className="text-blue-700"
                            href={`/part-catalog/${item.id}/edit`}
                          >
                            Редактировать
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => void load(currentPage - 1)}
                className="rounded border px-4 py-2 disabled:opacity-50"
              >
                Назад
              </button>

              <span>
                Страница {currentPage} из {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => void load(currentPage + 1)}
                className="rounded border px-4 py-2 disabled:opacity-50"
              >
                Далее
              </button>
            </div>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}