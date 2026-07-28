'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import { useAuth } from '../../components/auth-provider';
import {
  deactivatePartCategory,
  deletePartCategory,
  getPartCategoryTree,
  PartCategoryTreeNode,
  updatePartCategory,
} from '../../lib/api';

export default function PartCategoriesPage() {
  const { hasPermission, isLoading } = useAuth();
  const canManage = hasPermission('CATALOG_MANAGE');
  const [tree, setTree] = useState<PartCategoryTreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setError('');
    try {
      setTree(await getPartCategoryTree(showInactive));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Не удалось загрузить категории',
      );
    } finally {
      setLoading(false);
    }
  }, [canManage, showInactive]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function toggleStatus(node: PartCategoryTreeNode) {
    setError('');
    try {
      if (node.isActive) {
        await deactivatePartCategory(node.id);
      } else {
        await updatePartCategory(node.id, { isActive: true });
      }
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Не удалось изменить статус',
      );
    }
  }

  async function removePermanently(node: PartCategoryTreeNode) {
    if (
      !window.confirm(
        `Удалить пустую категорию «${node.name}» навсегда?`,
      )
    ) {
      return;
    }
    setError('');
    try {
      await deletePartCategory(node.id);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Не удалось удалить категорию',
      );
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const needle = query.trim().toLocaleLowerCase('ru-RU');
  const hasMatch = (node: PartCategoryTreeNode): boolean =>
    !needle ||
    node.name.toLocaleLowerCase('ru-RU').includes(needle) ||
    node.slug.toLocaleLowerCase('ru-RU').includes(needle) ||
    node.children.some(hasMatch);

  const rows = (
    nodes: PartCategoryTreeNode[],
    level = 0,
  ): React.ReactNode =>
    nodes.flatMap((node) => {
      if (!hasMatch(node)) return [];
      const open = Boolean(needle) || expanded.has(node.id);
      return [
        <Fragment key={node.id}>
          <tr className="border-t hover:bg-blue-50">
            <td
              className="p-3 font-medium"
              style={{ paddingLeft: `${12 + level * 24}px` }}
            >
              {node.children.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(node.id)}
                  className="mr-2 text-slate-500"
                >
                  {open ? '▾' : '▸'}
                </button>
              ) : (
                <span className="mr-6" />
              )}
              {node.name}
            </td>
            <td className="p-3 text-slate-600">{node.slug}</td>
            <td className="p-3">
              {node.isActive ? 'Активна' : 'Отключена'}
            </td>
            <td className="p-3 text-center">{node.children.length}</td>
            <td className="p-3">
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/part-categories/new?parentId=${node.id}`}
                  className="text-blue-700"
                >
                  Добавить дочернюю
                </Link>
                <Link
                  href={`/part-categories/${node.id}/edit`}
                  className="text-blue-700"
                >
                  Изменить
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleStatus(node)}
                  className="text-amber-700"
                >
                  {node.isActive ? 'Отключить' : 'Включить'}
                </button>
                <button
                  type="button"
                  onClick={() => void removePermanently(node)}
                  className="text-red-700"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          {open && rows(node.children, level + 1)}
        </Fragment>,
      ];
    });

  return (
    <ProtectedLayout>
      {!isLoading && !canManage ? (
        <p className="rounded bg-white p-5">
          Недостаточно прав для управления категориями.
        </p>
      ) : (
        <>
          <header className="flex flex-wrap justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Категории запчастей</h1>
              <p className="text-slate-500">
                Дерево поддерживает неограниченную вложенность
              </p>
            </div>
            <Link
              href="/part-categories/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Добавить корневую категорию
            </Link>
          </header>

          <div className="mt-5 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-64 flex-1 rounded border p-2"
              placeholder="Поиск по названию или slug"
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
            <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Название</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3">Дочерние</th>
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
                ) : (
                  rows(tree)
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
