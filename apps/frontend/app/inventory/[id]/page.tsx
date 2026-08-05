"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  InventoryForm,
  InventoryValues,
  valuesFrom,
} from "../../../components/inventory-form";
import { ProtectedLayout } from "../../../components/protected-layout";
import {
  inventoryMovements,
  inventoryOne,
  InventoryItem,
  Movement,
  updateInventory,
  uploadInventoryImage,
  deleteInventoryImage,
} from "../../../lib/api";
const labels: Record<string, string> = {
  INITIAL_BALANCE: "Начальный остаток",
  SALE: "Продажа",
  SALE_CANCEL: "Отмена продажи",
  PURCHASE: "Закупка",
  PURCHASE_CANCEL: "Отмена закупки",
  STOCK_IN: "Приход",
  CUSTOMER_RETURN: "Возврат клиента",
  SUPPLIER_RETURN: "Возврат поставщику",
  ADJUSTMENT: "Корректировка",
  WRITE_OFF: "Списание",
};
export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [moves, setMoves] = useState<Movement[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([inventoryOne(id), inventoryMovements(id)])
      .then(([i, m]) => {
        setItem(i);
        setMoves(m.data);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  async function save(
    v: InventoryValues,
    image: File | null,
    removeCurrentImage: boolean,
  ) {
    let updated = await updateInventory(id, {
      warehouseId: v.warehouseId,
      brand: v.brand || undefined,
      sku: v.sku || undefined,
      oemNumber: v.oemNumber || undefined,
      oemPartId: v.oemPartId || null,
      compatibility: v.compatibility.trim() || null,
      price: Number(v.price),
      currency: v.currency,
      minQuantity: Number(v.minQuantity),
      location: v.location.trim() || null,
      notes: v.notes || undefined,
      isActive: v.isActive,
    });
    if (image) updated = await uploadInventoryImage(id, image);
    else if (removeCurrentImage) updated = await deleteInventoryImage(id);
    setItem(updated);
  }
  if (!item)
    return (
      <ProtectedLayout>
        <p>{error || "Загрузка…"}</p>
      </ProtectedLayout>
    );
  const car = item.partCatalogItem.compatibilities[0]?.vehicleGeneration;
  return (
    <ProtectedLayout>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{item.partCatalogItem.name}</h1>
          <p className="text-slate-500">
            {item.partCatalogItem.internalCode} · OEM {item.oemNumber ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/purchases/new?inventoryItem=${id}`}
            className="rounded bg-emerald-600 px-3 py-2 text-white"
          >
            Создать закупку
          </Link>
          <Link
            href={`/sales/new?inventoryItem=${id}`}
            className="rounded bg-blue-600 px-3 py-2 text-white"
          >
            Создать продажу
          </Link>
        </div>
      </div>
      <div className="mt-5 grid gap-3 rounded bg-white p-4 md:grid-cols-3">
        <p>
          Цена:{" "}
          <b>
            {item.price} {item.currency}
          </b>
        </p>
        <p>
          Остаток: <b>{item.quantity}</b>
        </p>
        <p>
          Доступно: <b>{item.quantity}</b>
        </p>
        <p>Склад: {item.warehouse?.name ?? "—"}</p>
        <p>Статус: {item.isActive ? "Активен" : "Отключён"}</p>
        <p>Магазин: {item.shop.name}</p>
        <p>Категория: {item.partCatalogItem.category.name}</p>
        <p>
          Авто:{" "}
          {item.compatibility ??
            (car
              ? `${car.vehicleModel.manufacturer.name} ${car.vehicleModel.name} ${car.name}`
              : "—")}
        </p>
      </div>
      <h2 className="mt-8 text-xl font-bold">История движений</h2>
      <div className="mt-3 overflow-x-auto rounded bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Изменение</th>
              <th>Остаток</th>
              <th>Документ</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {moves.slice(0, 20).map((m) => (
              <tr key={m.id} className="border-t">
                <td>{new Date(m.createdAt).toLocaleString("ru-RU")}</td>
                <td>{labels[m.type] ?? m.type}</td>
                <td
                  className={
                    m.change >= 0 ? "text-emerald-700" : "text-red-700"
                  }
                >
                  {m.change >= 0 ? "+" : ""}
                  {m.change}
                </td>
                <td>{m.quantityAfter}</td>
                <td>{m.reference ?? "—"}</td>
                <td>{m.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {moves.length === 0 && (
          <p className="p-4 text-slate-500">Движений пока нет.</p>
        )}
      </div>
      <h2 className="mt-8 text-xl font-bold">Редактирование</h2>
      <div className="mt-3">
        <InventoryForm
          initial={valuesFrom(item)}
          initialOem={item.oemPart}
          initialImageUrl={item.imageUrl}
          editing
          onSave={save}
        />
      </div>
    </ProtectedLayout>
  );
}
