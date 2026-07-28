'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import { useAuth } from '../../components/auth-provider';
import {
  deactivatePartCatalogItem,
  deletePartCatalogItem,
  getPartCatalog,
  getPartCategoryTree,
  PartCatalogResponse,
  PartCategoryTreeNode,
  updatePartCatalogItem,
} from '../../lib/api';

function CategoryBranch({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: PartCategoryTreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              selectedId === node.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {node.name}
          </button>
          {node.children.length > 0 && (
            <div className="ml-4 border-l border-slate-200 pl-2">
              <CategoryBranch
                nodes={node.children}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PartCatalogPage() {
  const { hasPermission, isLoading } = useAuth();
  const canManage = hasPermission('CATALOG_MANAGE');
  const [tree, setTree] = useState<PartCategoryTreeNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [data, setData] = useState<PartCatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCatalog = useCallback(
    async (page = 1) => {
      if (!canManage) return;
      setLoading(true);
      setError('');
      try {
        setData(
          await getPartCatalog({
            search: query.trim() || undefined,
            rootCategoryId: selectedCategoryId || undefined,
            isActive: showInactive ? undefined : true,
            page,
            limit: 30,
          }),
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Не удалось загрузить каталог',
        );
      } finally {
        setLoading(false);
      }
    },
    [canManage, query, selectedCategoryId, showInactive],
  );

  useEffect(() => {
    if (!canManage) return;
    void getPartCategoryTree(false)
      .then(setTree)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Не удалось загрузить категории',
        ),
      );
  }, [canManage]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(1), 250);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  async function toggleStatus(id: string, isActive: boolean) {
    setError('');
    try {
      if (isActive) {
        await deactivatePartCatalogItem(id);
      } else {
        await updatePartCatalogItem(id, { isActive: true });
      }
      await loadCatalog(data?.meta.page ?? 1);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Не удалось изменить статус',
      );
    }
  }

  async function removePermanently(id: string) {
    if (
      !window.confirm(
        'Удалить эту неиспользуемую запись навсегда? Действие необратимо.',
      )
    ) {
      return;
    }
    setError('');
    try {
      await deletePartCatalogItem(id);
      await loadCatalog(data?.meta.page ?? 1);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Не удалось удалить запись',
      );
    }
  }

  const page = data?.meta.page ?? 1;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <ProtectedLayout>
      {!isLoading && !canManage ? (
        <section className="rounded-xl bg-white p-6">
          Недостаточно прав для управления каталогом.
        </section>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Единый каталог запчастей</h1>
              <p className="text-slate-500">
                Общий справочник, на который ссылаются остатки всех магазинов
              </p>
            </div>
            <Link
              href="/part-catalog/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Добавить деталь
            </Link>
          </header>

          <div className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="self-start rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Категории</h2>
                {selectedCategoryId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('')}
                    className="text-xs text-blue-700"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <CategoryBranch
                nodes={tree}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
            </aside>

            <section className="min-w-0">
              <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-64 flex-1 rounded-lg border p-2"
                  placeholder="Название, синоним или внутренний код"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(event) => setShowInactive(event.target.checked)}
                  />
                  Показать отключённые
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-slate-100 text-left">
                    <tr>
                      <th className="p-3">Код</th>
                      <th className="p-3">Название</th>
                      <th className="p-3">Категория</th>
                      <th className="p-3">Статус</th>
                      <th className="p-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="p-5 text-slate-500" colSpan={5}>
                          Загрузка…
                        </td>
                      </tr>
                    ) : data?.data.length ? (
                      data.data.map((item) => (
                        <tr key={item.id} className="border-t align-top">
                          <td className="p-3 font-mono">{item.internalCode}</td>
                          <td className="p-3">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {item.normalizedName}
                            </p>
                          </td>
                          <td className="p-3">{item.category.name}</td>
                          <td className="p-3">
                            {item.isActive ? 'Активна' : 'Отключена'}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-3">
                              <Link
                                className="text-blue-700"
                                href={`/part-catalog/${item.id}/edit`}
                              >
                                Изменить
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleStatus(item.id, item.isActive)
                                }
                                className="text-amber-700"
                              >
                                {item.isActive ? 'Отключить' : 'Включить'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void removePermanently(item.id)}
                                className="text-red-700"
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-5 text-slate-500" colSpan={5}>
                          Детали не найдены.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => void loadCatalog(page - 1)}
                  className="rounded border px-4 py-2 disabled:opacity-50"
                >
                  Назад
                </button>
                <span>
                  Страница {page} из {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => void loadCatalog(page + 1)}
                  className="rounded border px-4 py-2 disabled:opacity-50"
                >
                  Далее
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
