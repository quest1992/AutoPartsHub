'use client';

import { FormEvent, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import { decodeVin, VinDecodeResponse } from '../../lib/api';

const statusLabels = {
  FOUND: 'Найдено полное совпадение',
  PARTIAL: 'Найдено частичное совпадение',
  NOT_FOUND: 'Совпадений в справочнике нет',
};

export default function VinDecoderPage() {
  const [vin, setVin] = useState('');
  const [result, setResult] = useState<VinDecodeResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await decodeVin(vin.trim().toUpperCase()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось декодировать VIN');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedLayout>
      <h1 className="text-2xl font-bold">VIN Decoder</h1>
      <p className="mt-2 text-slate-600">Поиск автомобиля и совместимых деталей по VIN.</p>

      <form className="mt-6 flex max-w-3xl gap-3 rounded-xl bg-white p-5 shadow-sm" onSubmit={submit}>
        <input
          aria-label="VIN"
          className="min-w-0 flex-1 rounded border border-slate-300 p-3 font-mono uppercase"
          maxLength={17}
          minLength={17}
          pattern="[A-HJ-NPR-Za-hj-npr-z0-9]{17}"
          placeholder="17-значный VIN"
          required
          value={vin}
          onChange={(event) => setVin(event.target.value)}
        />
        <button className="rounded bg-blue-700 px-6 py-3 text-white disabled:opacity-50" disabled={loading}>
          {loading ? 'Decode…' : 'Decode'}
        </button>
      </form>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {result && (
        <div className="mt-6 max-w-4xl space-y-5">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  {[result.vehicle.manufacturer, result.vehicle.model, result.vehicle.generation].filter(Boolean).join(' · ')}
                </h2>
                <p className="mt-1 text-slate-600">
                  Двигатель: {result.vehicle.engineCode ?? '—'} · Год: {result.vehicle.year ?? '—'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                result.matchStatus === 'FOUND' ? 'bg-green-100 text-green-800' :
                result.matchStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {result.matchStatus}
              </span>
            </div>
            <p className="mt-4">{statusLabels[result.matchStatus]}</p>
            <p className="mt-2 text-sm text-slate-500">
              Источник: {result.vehicle.provider} · {result.cacheHit ? 'результат из кэша' : 'новое декодирование'}
            </p>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Найденные детали</h2>
            {result.catalogItems.length === 0 ? (
              <p className="mt-3 text-slate-600">Для найденного автомобиля применяемость деталей пока не добавлена.</p>
            ) : (
              <div className="mt-3 divide-y">
                {result.catalogItems.map((item) => (
                  <div className="py-3" key={item.id}>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.internalCode} · {item.category.name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </ProtectedLayout>
  );
}
