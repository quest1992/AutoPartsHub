'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import {
  getPartNumberManufacturers,
  getPartNumbers,
  PartNumberEntry,
  PartNumberManufacturer,
  PartNumberType,
} from '../../lib/api';

export default function PartNumbersPage() {
  const [items, setItems] = useState<PartNumberEntry[]>([]);
  const [manufacturers, setManufacturers] = useState<PartNumberManufacturer[]>([]);
  const [search, setSearch] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [type, setType] = useState<PartNumberType | ''>('');
  const [error, setError] = useState('');

  useEffect(() => {
    void getPartNumberManufacturers().then(setManufacturers).catch(() => setError('Не удалось загрузить производителей'));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void getPartNumbers({ search: search || undefined, manufacturerId: manufacturerId || undefined, type: type || undefined })
        .then((result) => setItems(result.data))
        .catch((reason) => setError(reason instanceof Error ? reason.message : 'Не удалось загрузить номера'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, manufacturerId, type]);

  return (
    <ProtectedLayout>
      <h1 className="text-2xl font-bold">OEM Numbers</h1>
      <div className="mt-5 grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск номера" className="rounded border p-2" />
        <select value={manufacturerId} onChange={(e) => setManufacturerId(e.target.value)} className="rounded border p-2"><option value="">Все производители</option>{manufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value as PartNumberType | '')} className="rounded border p-2"><option value="">Все типы</option>{['OEM', 'CROSS', 'AFTERMARKET', 'INTERNAL'].map((value) => <option key={value}>{value}</option>)}</select>
      </div>
      {error && <p className="mt-4 text-red-700">{error}</p>}
      <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3">Номер</th><th className="p-3">Производитель</th><th className="p-3">Тип</th><th className="p-3">Деталь</th><th className="p-3">Основной</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id} className="border-b"><td className="p-3 font-medium">{item.number}</td><td className="p-3">{item.manufacturer?.name}</td><td className="p-3">{item.type}</td><td className="p-3"><Link className="text-blue-700" href={`/part-catalog/${item.catalogItemId}/edit`}>{item.catalogItem.name} · {item.catalogItem.internalCode}</Link></td><td className="p-3">{item.isPrimary ? 'Да' : '—'}</td></tr>)}</tbody>
        </table>
      </div>
    </ProtectedLayout>
  );
}
