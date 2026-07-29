'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ProtectedLayout } from '../../../components/protected-layout';
import { CustomerOrderStatus, getCustomerOrders, releaseExpiredCustomerOrders } from '../../../lib/api';

const statuses: Array<CustomerOrderStatus|''>=['','DRAFT','RESERVED','CONFIRMED','READY','COMPLETED','CANCELLED','EXPIRED'];
export default function OrdersPage(){
  const[status,setStatus]=useState<CustomerOrderStatus|''>('');const[search,setSearch]=useState('');const[data,setData]=useState<Awaited<ReturnType<typeof getCustomerOrders>>|null>(null);const[error,setError]=useState('');
  const load=useCallback(()=>getCustomerOrders({status:status||undefined,search:search||undefined,limit:100}).then(setData).catch(e=>setError(e.message)),[status,search]);
  useEffect(()=>{void load()},[load]);
  return <ProtectedLayout><div className="space-y-5"><header className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Заказы клиентов</h1><p className="text-slate-500">Резервирование и продажи по нескольким магазинам</p></div><Link href="/admin/orders/new" className="rounded-xl bg-blue-600 px-4 py-3 text-white">Новый заказ</Link></header>
  <div className="flex gap-3 rounded-xl bg-white p-4"><input className="rounded border p-2" placeholder="Номер, клиент, телефон" value={search} onChange={e=>setSearch(e.target.value)}/><select className="rounded border p-2" value={status} onChange={e=>setStatus(e.target.value as CustomerOrderStatus|'')}>{statuses.map(x=><option key={x} value={x}>{x||'Все статусы'}</option>)}</select><button className="rounded border px-3" onClick={async()=>{await releaseExpiredCustomerOrders();await load()}}>Освободить просроченные</button></div>
  {error&&<p className="text-red-700">{error}</p>}<div className="overflow-x-auto rounded-xl bg-white"><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-3">Номер</th><th>Клиент</th><th>Телефон</th><th>Позиций</th><th>Сумма</th><th>Статус</th><th>Оплата</th><th>Резерв до</th><th>Создан</th></tr></thead><tbody>{data?.data.map(o=><tr className="border-t" key={o.id}><td className="p-3"><Link className="text-blue-700" href={`/admin/orders/${o.id}`}>{o.number}</Link></td><td>{o.customerNameSnapshot}</td><td>{o.customerPhoneSnapshot||'—'}</td><td>{o._count.items}</td><td>{o.total}</td><td>{o.status}</td><td>{o.paymentStatus}</td><td>{o.reservationExpiresAt?new Date(o.reservationExpiresAt).toLocaleString():'—'}</td><td>{new Date(o.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div></div></ProtectedLayout>
}
