'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { ProtectedLayout } from '../../components/protected-layout';
import { useAuth } from '../../components/auth-provider';
import {
  ApiError,
  createShop,
  deactivateShop,
  getShop,
  getShops,
  Shop,
  ShopPayload,
  updateShop,
} from '../../lib/api';

const emptyShop: ShopPayload = { name: '' };

const fields: [keyof ShopPayload, string, string?][] = [
  ['name', 'Название', 'text'],
  ['ownerName', 'Владелец'],
  ['phone', 'Телефон'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'Email', 'email'],
  ['country', 'Страна'],
  ['city', 'Город'],
  ['address', 'Адрес'],
  ['latitude', 'Широта', 'number'],
  ['longitude', 'Долгота', 'number'],
];

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Недостаточно прав';
    if (error.status === 404) return 'Магазин не найден';
    return error.message;
  }

  return error instanceof Error ? error.message : 'Ошибка запроса';
}

export default function ShopsPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<Shop[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState<ShopPayload | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canView = hasPermission('SHOPS_VIEW');
  const canManage = hasPermission('SHOPS_MANAGE');

  const load = useCallback(async () => {
    if (!canView) return;

    setLoading(true);
    setError('');
    try {
      setItems(await getShops(includeInactive));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [canView, includeInactive]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) void load();
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  async function openEditForm(id: string) {
    setBusy(true);
    setError('');
    try {
      setForm(await getShop(id));
      setEditId(id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form || busy) return;

    if (!form.name.trim()) {
      setError('Название обязательно');
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (editId) {
        await updateShop(editId, form);
      } else {
        await createShop(form);
      }

      setNotice(editId ? 'Магазин обновлён' : 'Магазин создан');
      setForm(null);
      setEditId(null);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActivity(shop: Shop) {
    if (
      shop.isActive &&
      !confirm(
        'После деактивации сотрудники этого магазина больше не смогут пользоваться системой. Продолжить?',
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (shop.isActive) {
        await deactivateShop(shop.id);
      } else {
        await updateShop(shop.id, { isActive: true });
      }

      setNotice(
        shop.isActive ? 'Магазин деактивирован' : 'Магазин активирован',
      );
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProtectedLayout>
      {!canView ? (
        <p className="rounded bg-white p-5">
          Недостаточно прав для просмотра магазинов.
        </p>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h1 className="text-2xl font-bold">Магазины</h1>
              <p className="text-slate-500">
                Управление магазинами и их доступом к системе.
              </p>
            </div>
            {canManage && (
              <div className="flex gap-2"><Link href="/shops/onboarding" className="rounded border border-blue-600 px-4 py-2 text-blue-700">Подключить магазин</Link><button
                  type="button"
                  onClick={() => {
                    setForm(emptyShop);
                    setEditId(null);
                    setError('');
                  }}
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                  Добавить магазин
                </button></div>
            )}
          </div>

          <label className="mt-5 flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Показывать неактивные
          </label>

          {error && <p className="mt-3 text-red-700">{error}</p>}
          {notice && <p className="mt-3 text-emerald-700">{notice}</p>}

          {loading ? (
            <p className="mt-5">Загрузка…</p>
          ) : !items.length ? (
            <p className="mt-5 rounded bg-white p-5">Магазинов нет.</p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded bg-white">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left">Название</th>
                    <th className="text-left">Город</th>
                    <th className="text-left">Телефон</th>
                    <th className="text-left">Статус</th>
                    <th className="text-left">Дата регистрации</th>
                    <th className="text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((shop) => (
                    <tr key={shop.id} className="border-t">
                      <td className="p-3 font-medium">{shop.name}</td>
                      <td>{shop.city ?? '—'}</td>
                      <td>{shop.phone ?? '—'}</td>
                      <td>{shop.isActive ? 'Активен' : 'Неактивен'}</td>
                      <td>
                        {new Date(shop.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void openEditForm(shop.id)}
                              className="mr-3 text-blue-700 disabled:opacity-50"
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void toggleActivity(shop)}
                              className="text-amber-700 disabled:opacity-50"
                            >
                              {shop.isActive
                                ? 'Деактивировать'
                                : 'Активировать'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {form && (
            <div className="fixed inset-0 grid place-items-center bg-slate-900/40 p-4">
              <form
                onSubmit={save}
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded bg-white p-6"
              >
                <h2 className="text-xl font-bold">
                  {editId ? 'Редактировать магазин' : 'Добавить магазин'}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {fields.map(([key, label, type]) => (
                    <label key={key} className="text-sm">
                      {label}
                      {key === 'name' && ' *'}
                      <input
                        required={key === 'name'}
                        type={type ?? 'text'}
                        value={String(form[key] ?? '')}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [key]:
                              type === 'number'
                                ? event.target.value === ''
                                  ? undefined
                                  : Number(event.target.value)
                                : event.target.value || undefined,
                          })
                        }
                        className="mt-1 w-full rounded border p-2"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    disabled={busy}
                    className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {busy ? 'Сохранение…' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    className="rounded border px-4 py-2"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}
