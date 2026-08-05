"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CatalogItem,
  getWarehouses,
  InventoryItem,
  ShopWarehouse,
} from "../lib/api";
import { CatalogPicker } from "./catalog-picker";
import { OemChoice, OemPicker } from "./oem-picker";

export type InventoryValues = {
  partCatalogItemId: string;
  warehouseId: string;
  brand: string;
  sku: string;
  oemNumber: string;
  oemPartId: string;
  compatibility: string;
  condition: string;
  price: string;
  currency: string;
  quantity: string;
  minQuantity: string;
  location: string;
  notes: string;
  isActive: boolean;
};

export const emptyInventory: InventoryValues = {
  partCatalogItemId: "",
  warehouseId: "",
  brand: "",
  sku: "",
  oemNumber: "",
  oemPartId: "",
  compatibility: "",
  condition: "NEW",
  price: "",
  currency: "TJS",
  quantity: "0",
  minQuantity: "0",
  location: "",
  notes: "",
  isActive: true,
};

export const valuesFrom = (item: InventoryItem): InventoryValues => ({
  ...emptyInventory,
  partCatalogItemId: item.partCatalogItemId,
  warehouseId: item.warehouseId ?? "",
  brand: item.brand ?? "",
  sku: item.sku ?? "",
  oemNumber: item.oemNumber ?? "",
  oemPartId: item.oemPartId ?? "",
  compatibility: item.compatibility ?? "",
  condition: item.condition,
  price: item.price,
  currency: item.currency,
  quantity: String(item.quantity),
  minQuantity: String(item.minQuantity),
  location: item.location ?? "",
  notes: item.notes ?? "",
  isActive: item.isActive,
});

export function InventoryForm({
  initial = emptyInventory,
  initialImageUrl = null,
  initialOem = null,
  onSave,
  editing = false,
}: {
  initial?: InventoryValues;
  initialImageUrl?: string | null;
  initialOem?: OemChoice | null;
  editing?: boolean;
  onSave: (
    values: InventoryValues,
    image: File | null,
    removeCurrentImage: boolean,
  ) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [selected, setSelected] = useState<CatalogItem | null>(
    initial.partCatalogItemId
      ? {
          id: initial.partCatalogItemId,
          name: "Текущая позиция каталога",
          internalCode: initial.partCatalogItemId,
          slug: "",
          category: { name: "—" },
          compatibilities: [],
        }
      : null,
  );
  const [selectedOem, setSelectedOem] = useState<OemChoice | null>(initialOem);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [warehouses, setWarehouses] = useState<ShopWarehouse[]>([]);

  useEffect(() => {
    getWarehouses()
      .then((list) => {
        const active = list.filter((warehouse) => warehouse.isActive);
        setWarehouses(active);
        setValues((current) =>
          current.warehouseId
            ? current
            : {
                ...current,
                warehouseId:
                  active.find((warehouse) => warehouse.isDefault)?.id ?? "",
              },
        );
      })
      .catch(() => setError("Не удалось загрузить склады"));
  }, []);

  useEffect(() => {
    if (!image) {
      setPreview(removeCurrentImage ? null : initialImageUrl);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image, initialImageUrl, removeCurrentImage]);

  const input = (key: keyof InventoryValues, label: string, type = "text") => (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        value={String(values[key])}
        onChange={(event) =>
          setValues({ ...values, [key]: event.target.value })
        }
        className="mt-1 w-full rounded border border-slate-300 p-2"
      />
    </label>
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      setError("Выберите позицию центрального каталога");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(
        { ...values, partCatalogItemId: selected.id },
        image,
        removeCurrentImage,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Не удалось сохранить товар",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseImage(file: File | null) {
    setError("");
    if (
      file &&
      (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024)
    ) {
      setError("Фото должно быть JPEG, PNG или WebP размером до 5 МБ");
      return;
    }
    setImage(file);
    if (file) setRemoveCurrentImage(false);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-2"
    >
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
        <h2 className="mb-2 font-semibold text-slate-900">
          1. Что вы продаёте? <span className="text-red-600">*</span>
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Введите простое название, например «передние колодки», и выберите
          подходящую позицию.
        </p>
        <CatalogPicker
          value={selected}
          onChange={(item) => {
            setSelected(item);
            setError("");
            if (item)
              setValues((current) => ({
                ...current,
                partCatalogItemId: item.id,
              }));
            if (!editing) {
              setSelectedOem(null);
              setValues((current) => ({ ...current, oemPartId: "" }));
            }
          }}
          readOnly={editing}
        />
        {editing && (
          <p className="mt-2 text-xs text-slate-500">
            Категорию товара нельзя заменить после создания.
          </p>
        )}
      </section>

      <fieldset
        disabled={busy}
        className="grid gap-3 rounded-xl border border-slate-200 p-4 md:col-span-2"
      >
        <legend className="px-2 text-sm font-semibold text-slate-800">
          2. Фото товара
        </legend>
        {preview ? (
          <div
            role="img"
            aria-label="Предпросмотр фотографии товара"
            className="h-40 w-40 rounded-xl border border-slate-200 bg-cover bg-center"
            style={{ backgroundImage: `url("${preview}")` }}
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
            Фото не добавлено
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"
        />
        <p className="text-xs text-slate-500">
          JPEG, PNG или WebP, не более 5 МБ.
        </p>
        {(image || (initialImageUrl && !removeCurrentImage)) && (
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setRemoveCurrentImage(Boolean(initialImageUrl));
            }}
            className="w-fit text-sm font-medium text-red-600"
          >
            {image ? "Убрать выбранное фото" : "Удалить текущее фото"}
          </button>
        )}
      </fieldset>

      <section className="grid gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-semibold text-slate-900">3. OEM и автомобили</h2>
          <p className="mt-1 text-sm text-slate-600">
            Начните вводить OEM и выберите подтверждённую запись. Тогда товар
            автоматически получит совместимость с автомобилями из базы.
          </p>
        </div>
        <div className="md:col-span-2">
          <OemPicker
            catalogItemId={selected?.id ?? ""}
            value={selectedOem}
            onChange={(oem) => {
              setSelectedOem(oem);
              setValues((current) => ({
                ...current,
                oemPartId: oem?.id ?? "",
                oemNumber: oem?.displayNumber ?? current.oemNumber,
              }));
            }}
          />
        </div>
        {input("oemNumber", "OEM-номер на упаковке (можно ввести вручную)")}
        {input("compatibility", "Дополнительная заметка о совместимости")}
      </section>

      {input("brand", "Бренд")}
      {input("sku", "Артикул")}
      {input("price", "Цена", "number")}
      {input("currency", "Валюта")}
      {!editing && input("quantity", "Начальный остаток", "number")}
      {input("minQuantity", "Минимальный остаток", "number")}
      <label className="block text-sm">
        Склад *
        <select
          required
          value={values.warehouseId}
          onChange={(event) =>
            setValues({ ...values, warehouseId: event.target.value })
          }
          className="mt-1 w-full rounded border p-2"
        >
          <option value="">Выберите склад</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
              {warehouse.isDefault ? " — основной" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm md:col-span-2">
        Заметки
        <textarea
          value={values.notes}
          onChange={(event) =>
            setValues({ ...values, notes: event.target.value })
          }
          className="mt-1 w-full rounded border border-slate-300 p-2"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) =>
            setValues({ ...values, isActive: event.target.checked })
          }
        />
        Товар активен
      </label>
      {error && <p className="text-red-700 md:col-span-2">{error}</p>}
      <button
        disabled={busy}
        className="rounded bg-blue-600 px-4 py-3 text-white disabled:opacity-60 md:col-span-2"
      >
        {busy
          ? "Сохранение…"
          : editing
            ? "Сохранить изменения"
            : "Создать товар"}
      </button>
    </form>
  );
}
