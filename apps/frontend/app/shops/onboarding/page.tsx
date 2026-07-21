'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '../../../components/protected-layout';
import { useAuth } from '../../../components/auth-provider';
import { ApiError, createEmployee, createShop, Shop, ShopPayload } from '../../../lib/api';

type AdminDetails = { firstName: string; lastName: string; phone: string; temporaryPassword: string };
const emptyShop: ShopPayload = { name: '' };
const emptyAdmin: AdminDetails = { firstName: '', lastName: '', phone: '', temporaryPassword: '' };

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const pick = (source: string) => source[Math.floor(Math.random() * source.length)];
  const characters = [pick(upper), pick(lower), pick(digits)];
  const pool = upper + lower + digits;
  while (characters.length < 12) characters.push(pick(pool));
  return characters.sort(() => Math.random() - 0.5).join('');
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Недостаточно прав для подключения магазина';
    if (error.status === 404) return 'Созданный магазин не найден';
    if (error.status === 409) return 'Пользователь с таким телефоном уже существует';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос';
}

export default function ShopOnboardingPage() {
  const router = useRouter();
  const { hasPermission, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState<ShopPayload>(emptyShop);
  const [admin, setAdmin] = useState<AdminDetails>(emptyAdmin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const allowed = hasPermission('SHOPS_MANAGE') && hasPermission('EMPLOYEES_CREATE');

  async function submitShop(event: FormEvent) {
    event.preventDefault();
    if (busy || shop) return;
    setBusy(true); setError('');
    try { setShop(await createShop(shopForm)); setStep(2); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }

  async function submitAdmin(event: FormEvent) {
    event.preventDefault();
    if (busy || !shop) return;
    if (admin.temporaryPassword.length < 10) { setError('Временный пароль должен содержать минимум 10 символов'); return; }
    setBusy(true); setError('');
    try {
      await createEmployee({ firstName: admin.firstName, lastName: admin.lastName || undefined, phone: admin.phone, temporaryPassword: admin.temporaryPassword, role: 'SHOP_ADMIN', shopId: shop.id });
      setStep(3);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }

  async function copyDetails() {
    if (!shop) return;
    const text = `Добро пожаловать в AutoStock.\n\nМагазин: ${shop.name}\nЛогин: ${admin.phone}\nВременный пароль: ${admin.temporaryPassword}\n\nПосле первого входа не передавайте пароль другим сотрудникам.`;
    try { await navigator.clipboard.writeText(text); }
    catch { setError('Не удалось скопировать данные. Скопируйте их вручную.'); }
  }

  function startAgain() {
    setStep(1); setShop(null); setShopForm(emptyShop); setAdmin(emptyAdmin); setError('');
  }

  const field = (label: string, value: string | null | undefined, onChange: (value: string) => void, required = false, type = 'text') => (
    <label className="block text-sm">{label}{required && ' *'}<input required={required} type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
  );

  return <ProtectedLayout>
    {!isLoading && !allowed ? <section className="rounded-xl bg-white p-6"><h1 className="text-2xl font-bold">Подключение магазина</h1><p className="mt-3 text-slate-600">Недостаточно прав для подключения магазина.</p></section> : <>
      <h1 className="text-2xl font-bold">Подключить магазин</h1><p className="mt-1 text-slate-500">Последовательно создайте магазин и его первого администратора.</p>
      <ol className="mt-5 flex gap-2 text-sm">{['Магазин', 'Администратор', 'Готово'].map((label, index) => <li key={label} className={step === index + 1 ? 'font-semibold text-blue-700' : 'text-slate-500'}>{index + 1}. {label}</li>)}</ol>
      {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {step === 1 && <form onSubmit={submitShop} className="mt-5 grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
        {field('Название', shopForm.name, (value) => setShopForm({ ...shopForm, name: value }), true)}
        {field('Владелец', shopForm.ownerName, (value) => setShopForm({ ...shopForm, ownerName: value || undefined }))}
        {field('Телефон', shopForm.phone, (value) => setShopForm({ ...shopForm, phone: value || undefined }))}
        {field('WhatsApp', shopForm.whatsapp, (value) => setShopForm({ ...shopForm, whatsapp: value || undefined }))}
        {field('Email', shopForm.email, (value) => setShopForm({ ...shopForm, email: value || undefined }), false, 'email')}
        {field('Страна', shopForm.country, (value) => setShopForm({ ...shopForm, country: value || undefined }))}
        {field('Город', shopForm.city, (value) => setShopForm({ ...shopForm, city: value || undefined }))}
        <div className="sm:col-span-2">{field('Адрес', shopForm.address, (value) => setShopForm({ ...shopForm, address: value || undefined }))}</div>
        <button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 sm:col-span-2">{busy ? 'Создание…' : 'Создать магазин и продолжить'}</button>
      </form>}
      {step === 2 && shop && <form onSubmit={submitAdmin} className="mt-5 max-w-xl rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Магазин создан: <b>{shop.name}</b>. При ошибке ниже повторится только создание администратора.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
        {field('Имя', admin.firstName, (value) => setAdmin({ ...admin, firstName: value }), true)}
        {field('Фамилия', admin.lastName, (value) => setAdmin({ ...admin, lastName: value }))}
        {field('Телефон', admin.phone, (value) => setAdmin({ ...admin, phone: value }), true)}
        <label className="block text-sm">Роль<input value="Администратор магазина" disabled className="mt-1 w-full rounded border border-slate-200 bg-slate-100 p-2" /></label>
        <div className="sm:col-span-2">{field('Временный пароль', admin.temporaryPassword, (value) => setAdmin({ ...admin, temporaryPassword: value }), true, 'text')}<button type="button" onClick={() => setAdmin({ ...admin, temporaryPassword: generatePassword() })} className="mt-2 text-sm text-blue-700">Сгенерировать пароль</button></div>
      </div><div className="mt-5 flex gap-3"><button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Создание…' : 'Создать администратора'}</button><button type="button" disabled={busy} onClick={() => setStep(1)} className="rounded border px-4 py-2">Назад</button></div><button type="button" onClick={() => router.push('/shops')} className="mt-4 text-sm text-blue-700">Открыть созданный магазин</button></form>}
      {step === 3 && shop && <section className="mt-5 max-w-xl rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Магазин подключён</h2><p className="mt-3">Магазин: <b>{shop.name}</b></p><p>Администратор: <b>{[admin.firstName, admin.lastName].filter(Boolean).join(' ')}</b></p><p>Логин: <b>{admin.phone}</b></p><p>Временный пароль: <b>{admin.temporaryPassword}</b></p><p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">Попросите администратора сменить пароль после первого входа. После обновления этой страницы пароль будет потерян.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void copyDetails()} className="rounded bg-blue-600 px-4 py-2 text-white">Скопировать данные</button><button type="button" onClick={() => router.push('/inventory/import')} className="rounded border px-4 py-2">Перейти к импорту остатков</button><button type="button" onClick={() => router.push('/shops')} className="rounded border px-4 py-2">Открыть магазин</button><button type="button" onClick={startAgain} className="rounded border px-4 py-2">Подключить следующий магазин</button></div><p className="mt-5 text-sm text-slate-500">Начните с 10–20 строк, проверьте preview, исправьте NEEDS_CATALOG_MATCH и только затем загружайте весь файл. CSV-шаблон доступен на странице импорта.</p></section>}
    </>}
  </ProtectedLayout>;
}
