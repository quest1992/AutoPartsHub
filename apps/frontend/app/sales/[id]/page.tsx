'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { Notice } from '../../../components/notice';
import { ProtectedLayout } from '../../../components/protected-layout';
import { cancelSale, getSaleById, SaleDetails } from '../../../lib/api';
import { formatMoney, formatPerson } from '../../../lib/format';

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function SaleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, isLoading: authLoading } = useAuth();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('created') === '1' ? 'Продажа успешно создана' : '');
  const load = useCallback(async () => { setLoading(true); try { setSale(await getSaleById(id)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить продажу'); } finally { setLoading(false); } }, [id]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  async function cancel() {
    if (!sale || !reason.trim()) return setError('Укажите причину отмены');
    if (!window.confirm(`Отменить продажу ${sale.number}?`)) return;
    setBusy(true); setError('');
    try { await cancelSale(sale.id, reason.trim()); setNotice('Продажа отменена. Товар возвращён на склад'); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Не удалось отменить продажу'); }
    finally { setBusy(false); }
  }
  return <ProtectedLayout>
    <Link href="/sales" className="text-sm text-blue-700">← Все продажи</Link>
    {notice && <Notice>{notice}</Notice>}{error && <Notice tone="error">{error}</Notice>}
    {loading ? <p className="mt-5 text-slate-500">Загрузка…</p> : sale && <>
      <div className="mt-4 flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{sale.number}</h1><p className="text-slate-500">{formatDate(sale.createdAt)} · {sale.shop.name}</p></div><span>{sale.status === 'COMPLETED' ? 'Проведена' : 'Отменена'}</span></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Клиент / автомастерская" value={sale.customerName ?? '—'} /><Info label="Телефон" value={sale.customerPhone ?? '—'} /><Info label="Автор" value={formatPerson(sale.user)} /><Info label="Subtotal" value={formatMoney(sale.subtotal, sale.currency)} /><Info label="Скидка" value={formatMoney(sale.discount, sale.currency)} /><Info label="Итог" value={formatMoney(sale.totalAmount, sale.currency)} /></div>
      <p className="mt-4 rounded bg-white p-3">Комментарий: {sale.notes ?? '—'}</p>
      <div className="mt-5 overflow-x-auto rounded-xl bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr><th className="p-3">Товар</th><th>OEM / SKU</th><th>Количество</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>{sale.items.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.itemName}</td><td>{item.oemNumber ?? '—'} / {item.sku ?? '—'}</td><td>{item.quantity}</td><td>{formatMoney(item.unitPrice, sale.currency)}</td><td>{formatMoney(item.lineTotal, sale.currency)}</td></tr>)}</tbody></table></div>
      {sale.status === 'CANCELLED' && <div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Автор отмены" value={formatPerson(sale.cancelledBy)} /><Info label="Дата отмены" value={formatDate(sale.cancelledAt)} /><Info label="Причина отмены" value={sale.cancelReason ?? '—'} /></div>}
      {!authLoading && hasPermission('SALES_CANCEL') && sale.status === 'COMPLETED' && <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold">Отмена продажи</h2><input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-3 w-full rounded border p-2" placeholder="Причина отмены" /><button disabled={busy} onClick={() => void cancel()} className="mt-3 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Отмена…' : 'Отменить продажу'}</button></section>}
    </>}
  </ProtectedLayout>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded bg-white p-3"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }
