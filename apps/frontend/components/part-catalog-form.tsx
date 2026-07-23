'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ApiError,
  createPartCatalogItem,
  getPartCategories,
  getPartCatalogCandidates,
  PartCatalogEntry,
  PartCatalogPayload,
  updatePartCatalogItem,
} from '../lib/api';
import { createSlug } from '../lib/slug';

const empty: PartCatalogPayload = {
  name: '',
  slug: '',
  categoryId: '',
  side: 'NONE',
  position: 'NONE',
  isUniversal: false,
  isActive: true,
};

type CategorySearchResult = {
  id: string;
  name: string;
  parent: { id: string; name: string } | null;
  _count: { children: number };
};

export function PartCatalogForm({
  initial,
  onSuccess,
}: {
  initial?: PartCatalogEntry;
  onSuccess: () => void;
}) {
  const [value, setValue] = useState<PartCatalogPayload>(
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? undefined,
          categoryId: initial.categoryId,
          side: initial.side,
          position: initial.position,
          isUniversal: initial.isUniversal,
          isActive: initial.isActive,
        }
      : empty,
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [categories, setCategories] = useState<CategorySearchResult[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState(
    initial?.category.name ?? '',
  );
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<
    { name: string; internalCode: string; matchType: string }[]
  >([]);

  useEffect(() => {
    const search = categorySearch.trim();

    if (!categorySearchOpen || search.length < 1) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setCategoriesLoading(true);

      const requestParams = {
        search,
        limit: 20,
        page: 1,
        isActive: true,
      };

      void getPartCategories(requestParams)
        .then((result) => {
          if (cancelled) return;
          setCategories(result.data);
        })
        .catch((reason) => {
          if (cancelled) return;
          setError(
            reason instanceof Error
              ? reason.message
              : 'Не удалось загрузить категории',
          );
          setCategories([]);
        })
        .finally(() => {
          if (!cancelled) setCategoriesLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [categorySearch, categorySearchOpen]);

  useEffect(() => {
    if (value.name.trim().length < 3 || !value.categoryId) {
      return;
    }

    const timer = window.setTimeout(
      () =>
        void getPartCatalogCandidates({
          q: value.name,
          categoryId: value.categoryId,
          side: value.side,
          position: value.position,
        })
          .then((result) => setCandidates(result.items))
          .catch(() => setCandidates([])),
      400,
    );

    return () => window.clearTimeout(timer);
  }, [value.name, value.categoryId, value.side, value.position]);

  function updateName(name: string) {
    if (name.trim().length < 3) {
      setCandidates([]);
    }
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

  function handleCategorySelect(category: CategorySearchResult) {
    setValue((current) => ({
      ...current,
      categoryId: category.id,
    }));
    setSelectedCategoryName(category.name);
    setCategorySearch(category.name);
    setCategorySearchOpen(false);
    setCategories([]);
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!value.categoryId) {
      setError('Выберите конечную категорию');
      setCategorySearchOpen(true);
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (initial) await updatePartCatalogItem(initial.id, value);
      else await createPartCatalogItem(value);
      onSuccess();
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.status === 409
          ? 'Похожая позиция уже существует. Проверьте предупреждения ниже.'
          : reason instanceof Error
            ? reason.message
            : 'Не удалось сохранить позицию',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 max-w-2xl rounded-xl bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Название *
          <input
            required
            value={value.name}
            onChange={(event) => updateName(event.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="block text-sm">
          Slug *
          <div className="mt-1 flex gap-2">
            <input
              required
              value={value.slug}
              onChange={(event) => {
                setSlugManuallyEdited(true);
                setValue((current) => ({
                  ...current,
                  slug: event.target.value,
                }));
              }}
              className="min-w-0 flex-1 rounded border p-2"
            />
            <button
              type="button"
              onClick={regenerateSlug}
              className="shrink-0 rounded border px-3 text-sm hover:bg-slate-50"
            >
              ↺ Сгенерировать
            </button>
          </div>
        </label>

        <div className="relative text-sm">
          <label htmlFor="category-search">Категория *</label>

          {value.categoryId && selectedCategoryName ? (
            <div className="mt-1 flex items-center justify-between rounded border bg-slate-50 p-2">
              <span>{selectedCategoryName}</span>
              <button
                type="button"
                onClick={() => {
                  setValue((current) => ({ ...current, categoryId: '' }));
                  setSelectedCategoryName('');
                  setCategorySearch('');
                  setCategories([]);
                  setCandidates([]);
                  setCategorySearchOpen(true);
                }}
                className="ml-2 rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Изменить
              </button>
            </div>
          ) : (
            <>
              <input
                id="category-search"
                type="text"
                value={categorySearch}
                onChange={(event) => {
                  const search = event.target.value;
                  setCategorySearch(search);
                  if (!search.trim()) {
                    setCategories([]);
                    setCategoriesLoading(false);
                  }
                  setCategorySearchOpen(true);
                  setError('');
                }}
                onFocus={() => setCategorySearchOpen(true)}
                placeholder="Введите минимум 1 букву, например: ф"
                autoComplete="off"
                className="mt-1 w-full rounded border p-2"
              />

              {categorySearchOpen && categorySearch.trim().length >= 1 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border bg-white shadow-lg">
                  {categoriesLoading && (
                    <div className="p-3 text-slate-500">
                      Поиск категорий…
                    </div>
                  )}

                  {!categoriesLoading && categories.length === 0 && (
                    <div className="p-3 text-slate-500">
                      Категории не найдены
                    </div>
                  )}

                  {!categoriesLoading &&
                    categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-blue-50"
                      >
                        <span className="block font-medium">
                          {category.name}
                        </span>
                        {category.parent && (
                          <span className="block text-xs text-slate-500">
                            {category.parent.name} → {category.name}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}

              {categorySearch.trim().length < 1 && (
                <p className="mt-1 text-xs text-slate-500">
                  Введите минимум 1 букву
                </p>
              )}
            </>
          )}
        </div>

        <label className="text-sm">
          Сторона
          <select
            value={value.side}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                side: event.target.value as PartCatalogPayload['side'],
              }))
            }
            className="mt-1 w-full rounded border p-2"
          >
            <option value="NONE">Не указана</option>
            <option value="LEFT">Левая</option>
            <option value="RIGHT">Правая</option>
          </select>
        </label>

        <label className="text-sm">
          Положение
          <select
            value={value.position}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                position: event.target.value as PartCatalogPayload['position'],
              }))
            }
            className="mt-1 w-full rounded border p-2"
          >
            <option value="NONE">Не указано</option>
            <option value="FRONT">Переднее</option>
            <option value="REAR">Заднее</option>
          </select>
        </label>

        <label className="block text-sm">
          Описание
          <input
            value={value.description ?? ''}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                description: event.target.value || undefined,
              }))
            }
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.isUniversal}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                isUniversal: event.target.checked,
              }))
            }
          />
          Универсальная деталь
        </label>

        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.isActive}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                isActive: event.target.checked,
              }))
            }
          />
          Активна
        </label>
      </div>

      {candidates.length > 0 && (
        <div className="mt-4 rounded bg-amber-50 p-3 text-sm">
          <b>Возможные совпадения</b>
          {candidates.map((candidate) => (
            <p key={candidate.internalCode}>
              {candidate.name} · {candidate.internalCode} ({candidate.matchType})
            </p>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-red-700">{error}</p>}

      <button
        disabled={busy}
        className="mt-5 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? 'Сохранение…' : 'Сохранить'}
      </button>
    </form>
  );
}
