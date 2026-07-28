'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createVehicleFitment,
  deleteVehicleFitment,
  getVehicleFitments,
  getVehicleTree,
  VehicleFitment,
  VehicleTreeBrand,
} from '../lib/api';

export function VehicleFitmentManager({ catalogItemId }: { catalogItemId: string }) {
  const [tree, setTree] = useState<VehicleTreeBrand[]>([]);
  const [items, setItems] = useState<VehicleFitment[]>([]);
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [generationId, setGenerationId] = useState('');
  const [engineId, setEngineId] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const brand = tree.find((entry) => entry.id === brandId);
  const model = brand?.vehicleModels.find((entry) => entry.id === modelId);
  const generation = model?.generations.find((entry) => entry.id === generationId);
  const engines = generation?.engines ?? [];

  const load = async () => {
    const [vehicleTree, fitments] = await Promise.all([
      getVehicleTree(),
      getVehicleFitments({ catalogItemId, limit: 100 }),
    ]);
    setTree(vehicleTree);
    setItems(fitments.data);
  };

  useEffect(() => {
    void Promise.all([
      getVehicleTree(),
      getVehicleFitments({ catalogItemId, limit: 100 }),
    ])
      .then(([vehicleTree, fitments]) => {
        setTree(vehicleTree);
        setItems(fitments.data);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить применяемость'),
      );
  }, [catalogItemId]);

  const canSubmit = Boolean(engineId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await createVehicleFitment({
        catalogItemId,
        engineId,
        yearFrom: yearFrom ? Number(yearFrom) : undefined,
        yearTo: yearTo ? Number(yearTo) : undefined,
        notes: notes.trim() || undefined,
      });
      setEngineId('');
      setYearFrom('');
      setYearTo('');
      setNotes('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось добавить применяемость');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Удалить эту запись применяемости?')) return;
    try {
      await deleteVehicleFitment(id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось удалить применяемость');
    }
  }

  return (
    <section className="mt-6 rounded-lg bg-white p-5 shadow">
      <h2 className="border-b pb-3 text-xl font-semibold">Применяемость</h2>
      {error && <p className="mt-3 text-red-700">{error}</p>}
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <select className="rounded border p-2" value={brandId} onChange={(event) => { setBrandId(event.target.value); setModelId(''); setGenerationId(''); setEngineId(''); }} required>
          <option value="">Марка</option>
          {tree.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
        <select className="rounded border p-2" value={modelId} onChange={(event) => { setModelId(event.target.value); setGenerationId(''); setEngineId(''); }} required>
          <option value="">Модель</option>
          {brand?.vehicleModels.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
        <select className="rounded border p-2" value={generationId} onChange={(event) => { setGenerationId(event.target.value); setEngineId(''); }} required>
          <option value="">Поколение</option>
          {model?.generations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
        <select className="rounded border p-2" value={engineId} onChange={(event) => setEngineId(event.target.value)} required>
          <option value="">Двигатель</option>
          {engines.map((entry) => <option key={entry.id} value={entry.id}>{entry.code} · {entry.name}</option>)}
        </select>
        <input className="rounded border p-2" type="number" min="1900" max="2100" placeholder="Год от" value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} />
        <input className="rounded border p-2" type="number" min="1900" max="2100" placeholder="Год до" value={yearTo} onChange={(event) => setYearTo(event.target.value)} />
        <input className="rounded border p-2 md:col-span-2" placeholder="Примечание" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50 md:col-span-2" disabled={!canSubmit}>+ Добавить автомобиль</button>
      </form>
      <div className="mt-5 space-y-2">
        {items.length === 0 && <p className="text-gray-600">Записей пока нет.</p>}
        {items.map((item) => {
          const generationEntry = item.engine.generation;
          const modelEntry = generationEntry.vehicleModel;
          return (
            <div className="flex items-center justify-between rounded border p-3" key={item.id}>
              <div>
                <p className="font-medium">{modelEntry.manufacturer.name} → {modelEntry.name} → {generationEntry.name} → {item.engine.code}</p>
                <p className="text-sm text-gray-600">{item.yearFrom ?? '…'}–{item.yearTo ?? '…'}{item.notes ? ` · ${item.notes}` : ''}</p>
              </div>
              <button className="text-red-700" type="button" onClick={() => void remove(item.id)}>Удалить</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
