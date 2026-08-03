"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  CatalogCategoryMatch,
  CatalogItem,
  PartCategoryOption,
  catalogSearch,
  createCatalogSuggestion,
  getPartCategories,
} from "../lib/api";

const categoryMatchLabels = {
  prefix: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f",
  found:
    "\u043d\u0430\u0439\u0434\u0435\u043d\u043e \u043f\u043e\u0437\u0438\u0446\u0438\u0439 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430",
  empty:
    "\u043f\u043e\u0437\u0438\u0446\u0438\u0439 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442",
  suggest:
    "\u041f\u0440\u0435\u0434\u043b\u043e\u0436\u0438\u0442\u044c \u0434\u0435\u0442\u0430\u043b\u044c \u0432 \u044d\u0442\u043e\u0439 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438",
};
export function CatalogPicker({
  value,
  onChange,
  readOnly = false,
}: {
  value: CatalogItem | null;
  onChange: (item: CatalogItem | null) => void;
  readOnly?: boolean;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categoryMatches, setCategoryMatches] = useState<
    CatalogCategoryMatch[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categories, setCategories] = useState<PartCategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    suggestedCategoryId: "",
    oemNumber: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (q.trim().length < 2) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      catalogSearch(q.trim())
        .then((result) => {
          setItems(result.data);
          setCategoryMatches(result.categoryMatches ?? []);
        })
        .catch((cause) =>
          setError(cause instanceof ApiError ? cause.message : "Ошибка поиска"),
        )
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!showForm || selectedCategory || categorySearch.trim().length < 1)
      return;
    const timer = setTimeout(() => {
      setCategoriesLoading(true);
      getPartCategories({
        search: categorySearch.trim(),
        limit: 50,
        leafOnly: true,
        isActive: true,
      })
        .then((result) => setCategories(result.data))
        .catch(() => setError("Не удалось найти категории"))
        .finally(() => setCategoriesLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [categorySearch, selectedCategory, showForm]);

  const details = (item: CatalogItem) => {
    const generation = item.compatibilities[0]?.vehicleGeneration;
    return `${item.category.name}${generation ? ` · ${generation.vehicleModel.manufacturer.name} ${generation.vehicleModel.name} ${generation.name}` : ""}`;
  };
  const categoryPath = (category: PartCategoryOption) =>
    category.parent
      ? `${category.parent.name} → ${category.name}`
      : category.name;

  function openForm(match?: CatalogCategoryMatch) {
    setForm((current) => ({
      ...current,
      name: q.trim(),
      suggestedCategoryId: match?.categoryId ?? "",
    }));
    setShowForm(true);
    setCategorySearch(match?.path ?? "");
    setSelectedCategory(
      match ? { id: match.categoryId, label: match.path } : null,
    );
    setCategories([]);
  }

  function chooseCategory(category: PartCategoryOption) {
    const label = categoryPath(category);
    setSelectedCategory({ id: category.id, label });
    setCategorySearch(label);
    setCategories([]);
    setForm((current) => ({ ...current, suggestedCategoryId: category.id }));
  }

  function clearCategory() {
    setSelectedCategory(null);
    setCategorySearch("");
    setForm((current) => ({ ...current, suggestedCategoryId: "" }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createCatalogSuggestion({
        name: form.name,
        suggestedCategoryId: form.suggestedCategoryId || undefined,
        oemNumber: form.oemNumber || undefined,
        description: form.description || undefined,
      });
      setMessage("Предложение отправлено на модерацию");
      setShowForm(false);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Не удалось отправить предложение",
      );
    } finally {
      setSaving(false);
    }
  }

  if (value)
    return (
      <div className="rounded border border-blue-200 bg-blue-50 p-3">
        <b>{value.name}</b>
        <p className="text-sm">
          {value.internalCode} · {details(value)}
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 text-sm text-blue-700"
          >
            Изменить выбор
          </button>
        )}
      </div>
    );

  const ready = q.trim().length >= 2;
  const trueCategoryMatches = categoryMatches.filter(
    (match) => !match.isLegacyCatalogItemCategory,
  );
  return (
    <div className="relative">
      <label className="block text-sm">
        Найти запчасть в каталоге
        <input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setMessage("");
            if (event.target.value.trim().length < 2) {
              setItems([]);
              setCategoryMatches([]);
            }
          }}
          className="mt-1 w-full rounded border border-slate-300 p-2"
          placeholder="Название, код или OEM"
        />
      </label>
      {q && !ready && (
        <p className="mt-1 text-xs text-slate-500">Введите минимум 2 символа</p>
      )}
      {loading && <p className="mt-1 text-sm">Поиск…</p>}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      {message && (
        <p className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">
          {message}
        </p>
      )}
      {ready && items.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow">
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                onChange(item);
                setQ("");
              }}
              className="block w-full border-b p-3 text-left hover:bg-slate-50"
            >
              <b>{item.name}</b>
              <br />
              <span className="text-sm text-slate-500">
                {item.internalCode} · {details(item)}
              </span>
            </button>
          ))}
        </div>
      )}
      {ready && !loading && trueCategoryMatches.length > 0 && (
        <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
          {trueCategoryMatches.map((match) => (
            <div
              key={match.categoryId}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 py-2 last:border-b-0"
            >
              <p>
                {categoryMatchLabels.prefix} {match.path}:{" "}
                {match.catalogItemCount
                  ? `${categoryMatchLabels.found}: ${match.catalogItemCount}`
                  : categoryMatchLabels.empty}
                .
              </p>
              {match.catalogItemCount === 0 && (
                <button
                  type="button"
                  onClick={() => openForm(match)}
                  className="rounded bg-blue-600 px-3 py-2 text-white"
                >
                  {categoryMatchLabels.suggest}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {ready &&
        !loading &&
        !error &&
        items.length === 0 &&
        categoryMatches.length === 0 && (
          <div className="mt-2 rounded border border-dashed border-slate-300 p-3 text-sm">
            <p>Такой позиции нет в центральном каталоге.</p>
            <button
              type="button"
              onClick={() => openForm()}
              className="mt-2 rounded bg-blue-600 px-3 py-2 text-white"
            >
              Предложить новую позицию
            </button>
          </div>
        )}
      {showForm && (
        <form
          onSubmit={submit}
          className="mt-3 grid gap-3 rounded border bg-white p-4 shadow"
        >
          <h3 className="font-semibold">Новая позиция каталога</h3>
          <label className="text-sm">
            Название
            <input
              required
              minLength={2}
              maxLength={200}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <div className="relative">
            <label className="text-sm">Категория</label>
            {selectedCategory ? (
              <div className="mt-1 flex items-center justify-between rounded border border-blue-200 bg-blue-50 p-3">
                <span>{selectedCategory.label}</span>
                <button
                  type="button"
                  onClick={clearCategory}
                  className="text-sm text-blue-700"
                >
                  Изменить
                </button>
              </div>
            ) : (
              <input
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                className="mt-1 w-full rounded border p-2"
                placeholder="Начните вводить название категории"
              />
            )}
            {categoriesLoading && (
              <p className="mt-1 text-sm">Поиск категорий…</p>
            )}
            {!selectedCategory &&
              categorySearch.trim() &&
              !categoriesLoading && (
                <div className="mt-1 max-h-52 overflow-auto rounded border bg-white">
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => chooseCategory(category)}
                      className="block w-full border-b p-3 text-left hover:bg-slate-50"
                    >
                      <b>{category.name}</b>
                      {category.parent && (
                        <span className="block text-xs text-slate-500">
                          {category.parent.name} → {category.name}
                        </span>
                      )}
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="p-3 text-sm text-slate-500">
                      Категории не найдены. Попробуйте другое слово.
                    </p>
                  )}
                </div>
              )}
          </div>
          <label className="text-sm">
            OEM
            <input
              maxLength={100}
              value={form.oemNumber}
              onChange={(event) =>
                setForm({ ...form, oemNumber: event.target.value })
              }
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <label className="text-sm">
            Описание
            <textarea
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-2 text-white"
            >
              {saving ? "Отправка…" : "Отправить"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border px-3 py-2"
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
