'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatMoney } from '../lib/format';
import {
  createPurchase,
  createSale,
  catalogSearch,
  CatalogItem,
  getCurrentUser,
  getShops,
  inventoryList,
  inventoryOne,
  InventoryItem,
  Shop,
} from '../lib/api';

type Line = {
  item?: InventoryItem;
  catalogItem?: CatalogItem;
  quantity: string;
  purchasePrice: string;
  salePrice: string;
};

type SearchResult =
  | { kind: 'inventory'; item: InventoryItem }
  | { kind: 'catalog'; item: CatalogItem };

const lineName = (line: Line) =>
  line.item?.partCatalogItem.name ?? line.catalogItem?.name ?? 'Товар';
const lineKey = (line: Line) =>
  line.item?.id ?? line.catalogItem?.id ?? '';

export function StockDocumentForm({
  kind,
  initialInventoryItemId,
}: {
  kind: 'purchase' | 'sale';
  initialInventoryItemId?: string | null;
}) {
  const router = useRouter();
  const purchase = kind === 'purchase';
  const [lines, setLines] = useState<Line[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState('');
  const [search, setSearch] = useState('');
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [discount, setDiscount] = useState('0');
  const [currency, setCurrency] = useState('TJS');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function initialize() {
      try {
        const { user } = await getCurrentUser();
        if (user.shopId) setShopId(user.shopId);
        if (user.role === 'SUPER_ADMIN') setShops(await getShops());
        if (initialInventoryItemId) {
          const item = await inventoryOne(initialInventoryItemId);
          setShopId(item.shop.id);
          setLines([
            {
              item,
              catalogItem: undefined,
              quantity: '1',
              purchasePrice: '',
              salePrice: item.price,
            },
          ]);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось подготовить форму',
        );
      } finally {
        setLoading(false);
      }
    }
    void initialize();
  }, [initialInventoryItemId]);

  useEffect(() => {
    if (!shopId) return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const [inventory, catalog] = await Promise.all([
          inventoryList({
            shopId,
            search: search.trim() || undefined,
            isActive: true,
            limit: 20,
          }),
          catalogSearch(search.trim()),
        ]);
        const inventoryCatalogIds = new Set(
          inventory.data.map((item) => item.partCatalogItemId),
        );
        setResults([
          ...inventory.data.map(
            (item): SearchResult => ({ kind: 'inventory', item }),
          ),
          ...(purchase
            ? catalog.data
                .filter((item) => !inventoryCatalogIds.has(item.id))
                .map((item): SearchResult => ({ kind: 'catalog', item }))
            : []),
        ]);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось найти товары',
        );
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [purchase, search, shopId]);

  const totals = useMemo(() => {
    const units = lines.reduce(
      (sum, line) => sum + (Number(line.quantity) || 0),
      0,
    );
    const subtotal = lines.reduce((sum, line) => {
      const price = purchase ? line.purchasePrice : line.item?.price ?? 0;
      return sum + (Number(line.quantity) || 0) * (Number(price) || 0);
    }, 0);
    return {
      units,
      subtotal,
      total: Math.max(0, subtotal - (Number(discount) || 0)),
    };
  }, [discount, lines, purchase]);

  function addItem(result: SearchResult) {
    const key = result.item.id;
    if (lines.some((line) => lineKey(line) === key)) {
      setError('Этот товар уже добавлен в документ');
      return;
    }
    setError('');
    setLines((current) => [
      ...current,
      {
        item: result.kind === 'inventory' ? result.item : undefined,
        catalogItem: result.kind === 'catalog' ? result.item : undefined,
        quantity: '1',
        purchasePrice: '',
        salePrice: result.kind === 'inventory' ? result.item.price : '',
      },
    ]);
    if (result.kind === 'inventory') setCurrency(result.item.currency);
  }

  function updateLine(index: number, values: Partial<Line>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...values } : line,
      ),
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!shopId) return setError('Выберите магазин');
    if (!lines.length) return setError('Добавьте хотя бы один товар');
    for (const line of lines) {
      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0)
        return setError(`Укажите корректное количество для “${lineName(line)}”`);
      if (!purchase && line.item && quantity > line.item.quantity)
        return setError(
          `Недостаточно товара “${lineName(line)}”. Доступно: ${line.item.quantity}, запрошено: ${quantity}`,
        );
      if (purchase && (!line.purchasePrice || Number(line.purchasePrice) < 0))
        return setError(`Укажите закупочную цену для “${lineName(line)}”`);
      if (purchase && Number(line.salePrice) < 0)
        return setError(`Цена продажи не может быть отрицательной`);
    }
    if (Number(discount) < 0 || Number(discount) > totals.subtotal)
      return setError('Скидка должна быть от нуля до суммы документа');

    setSubmitting(true);
    try {
      const common = {
        shopId,
        notes: notes.trim() || undefined,
        discount: Number(discount) || 0,
      };
      const result = purchase
        ? await createPurchase({
            ...common,
            supplierName: partyName.trim() || undefined,
            supplierPhone: phone.trim() || undefined,
            purchasedAt: `${documentDate}T12:00:00.000Z`,
            currency,
            items: lines.map((line) => ({
              inventoryItemId: line.item?.id,
              catalogItemId: line.catalogItem?.id,
              quantity: Number(line.quantity),
              purchasePrice: Number(line.purchasePrice),
              salePrice: line.salePrice ? Number(line.salePrice) : undefined,
            })),
          })
        : await createSale({
            ...common,
            customerName: partyName.trim() || undefined,
            customerPhone: phone.trim() || undefined,
            soldAt: `${documentDate}T12:00:00.000Z`,
            items: lines.map((line) => ({
              inventoryItemId: line.item!.id,
              quantity: Number(line.quantity),
            })),
          });
      router.replace(
        `/${purchase ? 'purchases' : 'sales'}/${result.id}?created=1`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `Не удалось сохранить ${purchase ? 'закупку' : 'продажу'}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return <p className="mt-6 text-slate-500">Подготовка формы…</p>;

  return (
    <form onSubmit={submit} className="mt-5 space-y-5">
      <section className="grid gap-4 rounded-xl bg-white p-5 md:grid-cols-2">
        {shops.length > 0 && (
          <label className="grid gap-1 text-sm">
            Магазин
            <select
              value={shopId}
              onChange={(event) => {
                setShopId(event.target.value);
                setLines([]);
              }}
              className="rounded border p-2"
              required
            >
              <option value="">Выберите магазин</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1 text-sm">
          {purchase ? 'Поставщик' : 'Клиент или автомастерская'}
          <input value={partyName} onChange={(event) => setPartyName(event.target.value)} className="rounded border p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Телефон
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded border p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          Дата
          <input type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} className="rounded border p-2" required />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          Комментарий
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="rounded border p-2" rows={2} />
        </label>
      </section>

      <section className="rounded-xl bg-white p-5">
        <h2 className="text-lg font-semibold">Товары</h2>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-3 w-full rounded border p-2"
          placeholder="Поиск по названию, OEM, SKU или артикулу"
          disabled={!shopId}
        />
        <div className="mt-2 max-h-56 overflow-y-auto rounded border">
          {searching ? (
            <p className="p-3 text-sm text-slate-500">Поиск…</p>
          ) : results.length ? (
            results.map((result) => {
              const name =
                result.kind === 'inventory'
                  ? result.item.partCatalogItem.name
                  : result.item.name;
              const item = result.item;
              return (
              <button
                type="button"
                key={`${result.kind}-${item.id}`}
                onClick={() => addItem(result)}
                className="flex w-full items-center justify-between border-b p-3 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  <strong>{name}</strong>
                  <br />
                  <span className="text-slate-500">
                    {result.kind === 'inventory'
                      ? `OEM: ${result.item.oemNumber ?? '—'} · SKU: ${result.item.sku ?? '—'}`
                      : `Код: ${result.item.internalCode}`}
                  </span>
                </span>
                <span>
                  {result.kind === 'inventory'
                    ? `На складе · ${result.item.quantity}`
                    : 'Будет добавлен на склад'}
                </span>
              </button>
              );
            })
          ) : (
            <p className="p-3 text-sm text-slate-500">Подходящие товары не найдены</p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((line, index) => {
            const quantity = Number(line.quantity) || 0;
            const unitPrice = purchase ? Number(line.purchasePrice) || 0 : Number(line.item?.price ?? 0);
            return (
              <div key={lineKey(line)} className="grid gap-3 rounded border p-3 md:grid-cols-6">
                <div className="md:col-span-2">
                  <strong>{lineName(line)}</strong>
                  <p className="text-sm text-slate-500">
                    {line.item
                      ? `На складе: ${line.item.quantity} · ${line.item.price} ${line.item.currency}`
                      : 'Будет добавлен на склад'}
                  </p>
                  {!purchase && line.item && quantity > line.item.quantity && (
                    <p className="text-sm text-red-700">Недостаточно товара</p>
                  )}
                </div>
                <label className="grid gap-1 text-sm">
                  Количество
                  <input type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} className="rounded border p-2" required />
                </label>
                {purchase && (
                  <>
                    <label className="grid gap-1 text-sm">
                      Закупочная цена
                      <input type="number" min="0" step="0.01" value={line.purchasePrice} onChange={(event) => updateLine(index, { purchasePrice: event.target.value })} className="rounded border p-2" required />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Новая цена продажи
                      <input type="number" min="0" step="0.01" value={line.salePrice} onChange={(event) => updateLine(index, { salePrice: event.target.value })} className="rounded border p-2" />
                    </label>
                  </>
                )}
                <div className="text-sm">
                  Сумма
                  <p className="mt-2 font-semibold">{formatMoney(quantity * unitPrice, currency)}</p>
                  {!purchase && line.item && <p className="text-slate-500">После: {line.item.quantity - quantity}</p>}
                </div>
                <button type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-left text-sm text-red-700">
                  Удалить
                </button>
              </div>
            );
          })}
          {!lines.length && <p className="rounded bg-slate-50 p-4 text-slate-500">Добавьте товары через поиск выше.</p>}
        </div>
      </section>

      <section className="rounded-xl bg-white p-5">
        <label className="grid max-w-xs gap-1 text-sm">
          Скидка
          <input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className="rounded border p-2" />
        </label>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
          <p>Позиций: <strong>{lines.length}</strong></p>
          <p>Единиц: <strong>{totals.units}</strong></p>
          <p>Общая сумма: <strong>{formatMoney(totals.subtotal, currency)}</strong></p>
          <p>К оплате: <strong>{formatMoney(totals.total, currency)}</strong></p>
        </div>
      </section>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
          {submitting ? 'Сохранение...' : purchase ? 'Сохранить закупку' : 'Сохранить продажу'}
        </button>
        <Link href={purchase ? '/purchases' : '/sales'} className="rounded border px-4 py-2">Отмена</Link>
      </div>
    </form>
  );
}
