'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { ProtectedLayout } from '../../components/protected-layout';
import { formatMoney } from '../../lib/format';
import { getPurchases, PurchaseListResponse, PurchaseStatus } from '../../lib/api';

const labels: Record<PurchaseStatus, string> = { COMPLETED: 'Проведена', CANCELLED: 'Отменена' };
const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export default function PurchasesPage() {
  const { hasPermission, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<PurchaseListResponse | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PurchaseStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      setData(await getPurchases({ page: targetPage, limit: 20, search: search.trim() || undefined, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }));
      setPage(targetPage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить закупки');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, page, search, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(1), 0); return () => window.clearTimeout(timer); }, [load]);

  return <ProtectedLayout>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Закупки</h1><p className="mt-1 text-slate-500">Приходы товара и отмены документов.</p></div>
      {!authLoading && hasPermission('PURCHASES_CREATE') && <Link href="/purchases/new" className="rounded bg-blue-600 px-4 py-2 text-white">Новая закупка</Link>}
    </div>
    <div className="mt-5 grid gap-3 rounded-xl bg-white p-4 md:grid-cols-4">
      <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded border p-2" placeholder="Номер или поставщик" />
      <select value={status} onChange={(event) => setStatus(event.target.value as PurchaseStatus | '')} className="rounded border p-2"><option value="">Все статусы</option><option value="COMPLETED">Проведена</option><option value="CANCELLED">Отменена</option></select>
      <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded border p-2" />
      <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded border p-2" />
      <button onClick={() => void load(1)} className="rounded border px-4 py-2">Применить</button>
    </div>
    {error && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
    {loading ? <p className="mt-6 text-slate-500">Загрузка…</p> : !data?.data.length ? <p className="mt-6 rounded bg-white p-5 text-slate-500">Закупок пока нет. Создайте первую закупку, чтобы добавить товар на склад.</p> :
      <><div className="mt-5 overflow-x-auto rounded-xl bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">Номер</th><th>Дата</th><th>Поставщик</th><th>Магазин</th><th>Автор</th><th>Статус</th><th>Позиций</th><th>Сумма</th><th /></tr></thead><tbody>{data.data.map((purchase) => <tr key={purchase.id} className="border-b"><td className="p-3 font-medium">{purchase.number}</td><td>{formatDate(purchase.purchasedAt)}</td><td>{purchase.supplierName ?? '—'}</td><td>{purchase.shop.name}</td><td>{purchase.user.firstName} {purchase.user.lastName ?? ''}</td><td>{labels[purchase.status]}</td><td>{purchase._count.items}</td><td>{formatMoney(purchase.totalAmount, purchase.currency)}</td><td><Link href={`/purchases/${purchase.id}`} className="text-blue-700">Открыть</Link></td></tr>)}</tbody></table></div><Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={(next) => void load(next)} /></>}
  </ProtectedLayout>;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <div className="mt-4 flex items-center gap-3"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Назад</button><span className="text-sm text-slate-600">Страница {page} из {totalPages || 1}</span><button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Далее</button></div>;
}
