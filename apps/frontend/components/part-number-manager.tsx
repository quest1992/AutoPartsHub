'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createPartNumber,
  deletePartNumber,
  getPartNumberManufacturers,
  getPartNumbers,
  PartNumberEntry,
  PartNumberManufacturer,
  PartNumberType,
  updatePartNumber,
} from '../lib/api';
import { partNumberManufacturerValue } from '../lib/part-number-manager';

const types: PartNumberType[] = ['OEM', 'CROSS', 'AFTERMARKET', 'INTERNAL'];

export function PartNumberManager({ partId }: { partId: string }) {
  const [items, setItems] = useState<PartNumberEntry[]>([]);
  const [manufacturers, setManufacturers] = useState<PartNumberManufacturer[]>([]);
  const [manufacturerId, setManufacturerId] = useState('');
  const [number, setNumber] = useState('');
  const [type, setType] = useState<PartNumberType>('OEM');
  const [error, setError] = useState('');

  async function load() {
    const result = await getPartNumbers({ catalogItemId: partId, limit: 100 });
    setItems(result.data);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getPartNumbers({ catalogItemId: partId, limit: 100 }),
      getPartNumberManufacturers(),
    ])
      .then(([numbers, manufacturerList]) => {
        if (cancelled) return;
        setItems(numbers.data);
        setManufacturers(manufacturerList);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Не удалось загрузить номера');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [partId]);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await createPartNumber({ catalogItemId: partId, manufacturerId, number, type });
      setNumber('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось добавить номер');
    }
  }

  async function change(id: string, data: Parameters<typeof updatePartNumber>[1]) {
    setError('');
    try {
      await updatePartNumber(id, data);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось изменить номер');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Удалить номер?')) return;
    try {
      await deletePartNumber(id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось удалить номер');
    }
  }

  return (
    <section className="mt-6 max-w-4xl rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">OEM / Cross Numbers</h2>
      <form onSubmit={add} className="mt-4 grid gap-3 md:grid-cols-4">
        <select required value={manufacturerId} onChange={(e) => setManufacturerId(e.target.value)} className="rounded border p-2">
          <option value="">Выберите производителя</option>
          {manufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="90915-YZZE1" className="rounded border p-2" />
        <select value={type} onChange={(e) => setType(e.target.value as PartNumberType)} className="rounded border p-2">
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">+ Добавить номер</button>
      </form>
      {error && <p className="mt-3 text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="p-2">Производитель</th><th className="p-2">Номер</th><th className="p-2">Тип</th><th className="p-2">Основной</th><th /></tr></thead>
          <tbody>{items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2"><select value={partNumberManufacturerValue(item)} onChange={(e) => e.target.value && void change(item.id, { manufacturerId: e.target.value })} className="rounded border p-1"><option value="">Выберите производителя</option>{manufacturers.map((manufacturer) => <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>)}</select></td>
              <td className="p-2">{item.number}</td>
              <td className="p-2"><select value={item.type} onChange={(e) => void change(item.id, { type: e.target.value as PartNumberType })} className="rounded border p-1">{types.map((value) => <option key={value}>{value}</option>)}</select></td>
              <td className="p-2"><input type="checkbox" checked={item.isPrimary} onChange={(e) => void change(item.id, { isPrimary: e.target.checked })} /></td>
              <td className="p-2 text-right"><button type="button" onClick={() => void remove(item.id)} className="text-red-700">Удалить</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
