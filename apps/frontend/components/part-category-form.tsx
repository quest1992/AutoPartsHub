'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ApiError,
  createPartCategory,
  getPartCategoryTree,
  PartCategoryPayload,
  PartCategoryTreeNode,
  updatePartCategory,
} from '../lib/api';
import { createSlug } from '../lib/slug';

const empty: PartCategoryPayload = {
  name: '',
  slug: '',
  parentId: null,
  sortOrder: 0,
  isActive: true,
};

type InitialCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive: boolean;
  children?: unknown[];
};

function flatten(
  nodes: PartCategoryTreeNode[],
  level = 0,
  result: { node: PartCategoryTreeNode; level: number }[] = [],
) {
  nodes.forEach((node) => {
    result.push({ node, level });
    flatten(node.children, level + 1, result);
  });
  return result;
}

export function PartCategoryForm({
  initial,
  parentId,
  onSuccess,
}: {
  initial?: InitialCategory;
  parentId?: string;
  onSuccess: () => void;
}) {
  const [value, setValue] = useState<PartCategoryPayload>(
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? undefined,
          parentId: initial.parentId ?? null,
          sortOrder: initial.sortOrder ?? 0,
          isActive: initial.isActive,
        }
      : { ...empty, parentId: parentId ?? null },
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tree, setTree] = useState<PartCategoryTreeNode[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPartCategoryTree(false)
      .then(setTree)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить категории'),
      );
  }, []);

  const blocked = new Set<string>();
  function mark(nodes: PartCategoryTreeNode[]) {
    nodes.forEach((node) => {
      blocked.add(node.id);
      mark(node.children);
    });
  }

  if (initial) {
    const find = (nodes: PartCategoryTreeNode[]): PartCategoryTreeNode | undefined =>
      nodes.find((node) => node.id === initial.id) ??
      nodes.map((node) => find(node.children)).find(Boolean);
    const own = find(tree);
    if (own) mark([own]);
  }

  const options = flatten(tree).filter((entry) => !blocked.has(entry.node.id) && entry.level < 2);

  function updateName(name: string) {
    setValue((current) => ({
      ...current,
      name,
      slug: slugManuallyEdited ? current.slug : createSlug(name),
    }));
  }

  function regenerateSlug() {
    setSlugManuallyEdited(false);
    setValue((current) => ({ ...current, slug: createSlug(current.name) }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (initial) await updatePartCategory(initial.id, value);
      else await createPartCategory(value);
      onSuccess();
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.status === 409
          ? 'Категория с таким названием или slug уже существует на этом уровне.'
          : reason instanceof Error
            ? reason.message
            : 'Не удалось сохранить категорию',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 max-w-2xl rounded-xl bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Название *
          <input required value={value.name} onChange={(event) => updateName(event.target.value)} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="text-sm">
          Slug *
          <div className="mt-1 flex gap-2">
            <input required value={value.slug} onChange={(event) => { setSlugManuallyEdited(true); setValue((current) => ({ ...current, slug: event.target.value })); }} className="min-w-0 flex-1 rounded border p-2" />
            <button type="button" onClick={regenerateSlug} className="shrink-0 rounded border px-3 text-sm hover:bg-slate-50">↺ Сгенерировать</button>
          </div>
        </label>
        <label className="text-sm">
          Родитель
          <select value={value.parentId ?? ''} onChange={(event) => setValue((current) => ({ ...current, parentId: event.target.value || null }))} className="mt-1 w-full rounded border p-2">
            <option value="">Корневая категория</option>
            {options.map(({ node, level }) => <option key={node.id} value={node.id}>{'— '.repeat(level)}{node.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Порядок сортировки
          <input type="number" min="0" value={value.sortOrder ?? 0} onChange={(event) => setValue((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          Описание
          <textarea value={value.description ?? ''} onChange={(event) => setValue((current) => ({ ...current, description: event.target.value || undefined }))} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue((current) => ({ ...current, isActive: event.target.checked }))} />Активна</label>
      </div>
      {error && <p className="mt-4 text-red-700">{error}</p>}
      <button disabled={busy} className="mt-5 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Сохранение…' : 'Сохранить'}</button>
    </form>
  );
}
