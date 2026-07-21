'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedLayout } from '../../components/protected-layout';
import { useAuth } from '../../components/auth-provider';
import {
  ApiError,
  createEmployee,
  Employee,
  EmployeeRole,
  EmployeesList,
  getEmployee,
  getEmployees,
  resetEmployeePassword,
  Shop,
  shops,
  updateEmployee,
} from '../../lib/api';

type FormMode = 'create' | 'edit' | 'reset' | null;

type EmployeeForm = {
  firstName: string;
  lastName: string;
  phone: string;
  role: EmployeeRole;
  temporaryPassword: string;
  confirmPassword: string;
  shopId: string;
  isActive: boolean;
};

const roleLabels: Record<EmployeeRole, string> = {
  SHOP_ADMIN: 'Администратор магазина',
  MANAGER: 'Менеджер',
  SELLER: 'Продавец',
  VIEWER: 'Наблюдатель',
};

const emptyForm: EmployeeForm = {
  firstName: '',
  lastName: '',
  phone: '',
  role: 'SELLER',
  temporaryPassword: '',
  confirmPassword: '',
  shopId: '',
  isActive: true,
};

function formFromEmployee(employee: Employee): EmployeeForm {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName ?? '',
    phone: employee.phone,
    role: employee.role,
    temporaryPassword: '',
    confirmPassword: '',
    shopId: employee.shopId,
    isActive: employee.isActive,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Недостаточно прав для выполнения действия';
    if (error.status === 404) return 'Сотрудник не найден';
    if (error.status === 409 && /телефон/i.test(error.message)) {
      return 'Сотрудник с таким телефоном уже существует';
    }
    return error.message;
  }

  return error instanceof Error ? error.message : 'Не удалось выполнить запрос';
}

export default function EmployeesPage() {
  const { hasPermission, isLoading: authLoading, user } = useAuth();
  const [employees, setEmployees] = useState<EmployeesList | null>(null);
  const [shopList, setShopList] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<FormMode>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canView = hasPermission('EMPLOYEES_VIEW');
  const canCreate = hasPermission('EMPLOYEES_CREATE');
  const canUpdate = hasPermission('EMPLOYEES_UPDATE');
  const canResetPassword = hasPermission('EMPLOYEES_RESET_PASSWORD');
  const activeShopId = isSuperAdmin ? selectedShopId : user?.shopId ?? '';
  const allowedRoles = useMemo<EmployeeRole[]>(
    () =>
      isSuperAdmin
        ? ['SHOP_ADMIN', 'MANAGER', 'SELLER', 'VIEWER']
        : ['MANAGER', 'SELLER', 'VIEWER'],
    [isSuperAdmin],
  );

  const loadEmployees = useCallback(async () => {
    if (!user || !canView || (isSuperAdmin && !selectedShopId)) return;

    setLoading(true);
    setError('');

    try {
      setEmployees(await getEmployees({ shopId: isSuperAdmin ? selectedShopId : undefined }));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [canView, isSuperAdmin, selectedShopId, user]);

  useEffect(() => {
    if (!user || !isSuperAdmin || !canView) return;

    void shops()
      .then((result) => setShopList(result))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [canView, isSuperAdmin, user]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadEmployees();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadEmployees]);

  function closeForm() {
    setMode(null);
    setSelectedEmployee(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setNotice('');
    setSelectedEmployee(null);
    setForm({ ...emptyForm, shopId: isSuperAdmin ? selectedShopId : user?.shopId ?? '' });
    setMode('create');
  }

  async function openEdit(employee: Employee) {
    setNotice('');
    setError('');
    setSubmitting(true);

    try {
      const current = await getEmployee(employee.id, isSuperAdmin ? activeShopId : undefined);
      setSelectedEmployee(current);
      setForm(formFromEmployee(current));
      setMode('edit');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function openReset(employee: Employee) {
    setNotice('');
    setSelectedEmployee(employee);
    setForm({ ...formFromEmployee(employee), temporaryPassword: '', confirmPassword: '' });
    setMode('reset');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (mode === 'reset') {
      if (!selectedEmployee) return;
      if (form.temporaryPassword.length < 8) {
        setError('Пароль должен содержать не менее 8 символов');
        return;
      }
      if (form.temporaryPassword !== form.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
    }

    if (mode === 'create') {
      if (form.temporaryPassword.length < 8) {
        setError('Пароль должен содержать не менее 8 символов');
        return;
      }
      if (form.temporaryPassword !== form.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
      if (isSuperAdmin && !form.shopId) {
        setError('Выберите магазин для сотрудника');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      if (mode === 'create') {
        await createEmployee({
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          phone: form.phone,
          role: form.role,
          temporaryPassword: form.temporaryPassword,
          shopId: isSuperAdmin ? form.shopId : undefined,
        });
        setNotice('Сотрудник успешно создан');
      }

      if (mode === 'edit' && selectedEmployee) {
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          phone: form.phone,
          isActive: form.isActive,
          ...(selectedEmployee.id === user?.id ? {} : { role: form.role }),
        };
        await updateEmployee(
          selectedEmployee.id,
          payload,
          isSuperAdmin ? activeShopId : undefined,
        );
        setNotice('Данные сотрудника обновлены');
      }

      if (mode === 'reset' && selectedEmployee) {
        await resetEmployeePassword(
          selectedEmployee.id,
          { temporaryPassword: form.temporaryPassword },
          isSuperAdmin ? activeShopId : undefined,
        );
        setNotice('Пароль успешно изменён');
      }

      closeForm();
      await loadEmployees();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(employee: Employee) {
    if (!employee.isActive) {
      await runToggle(employee, true);
      return;
    }

    if (!window.confirm('Сотрудник больше не сможет войти в систему. Продолжить?')) return;
    await runToggle(employee, false);
  }

  async function runToggle(employee: Employee, isActive: boolean) {
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      await updateEmployee(
        employee.id,
        { isActive },
        isSuperAdmin ? activeShopId : undefined,
      );
      setNotice(isActive ? 'Сотрудник активирован' : 'Сотрудник деактивирован');
      await loadEmployees();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  const isOwnEmployee = selectedEmployee?.id === user?.id;
  const roleLocked = isOwnEmployee || (!isSuperAdmin && selectedEmployee?.role === 'SHOP_ADMIN');
  const canManageEmployee = (employee: Employee) =>
    isSuperAdmin || employee.role !== 'SHOP_ADMIN';

  return (
    <ProtectedLayout>
      {!authLoading && !canView ? (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Сотрудники</h1>
          <p className="mt-3 text-slate-600">Недостаточно прав для просмотра сотрудников.</p>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Сотрудники</h1>
              <p className="mt-1 text-slate-500">Управление доступом сотрудников магазина.</p>
            </div>
            {canCreate && (!isSuperAdmin || selectedShopId) && (
              <button onClick={openCreate} className="rounded bg-blue-600 px-4 py-2 text-white">
                Добавить сотрудника
              </button>
            )}
          </div>

          {isSuperAdmin && (
            <label className="mt-5 block max-w-md rounded-xl bg-white p-4 text-sm shadow-sm">
              Магазин
              <select
                value={selectedShopId}
                onChange={(event) => setSelectedShopId(event.target.value)}
                className="mt-2 w-full rounded border border-slate-300 p-2"
              >
                <option value="">Выберите магазин</option>
                {shopList.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </label>
          )}

          {notice && <p className="mt-4 rounded bg-emerald-50 p-3 text-emerald-700">{notice}</p>}
          {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

          {isSuperAdmin && !selectedShopId ? (
            <p className="mt-5 rounded-xl bg-white p-5 text-slate-500">Выберите магазин, чтобы увидеть сотрудников.</p>
          ) : loading ? (
            <p className="mt-5 text-slate-500">Загрузка сотрудников…</p>
          ) : !employees?.items.length ? (
            <p className="mt-5 rounded-xl bg-white p-5 text-slate-500">Сотрудников пока нет.</p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="p-3">Имя</th><th>Телефон</th><th>Роль</th><th>Магазин</th><th>Статус</th><th className="p-3">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.items.map((employee) => (
                    <tr key={employee.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{[employee.firstName, employee.lastName].filter(Boolean).join(' ')}</td>
                      <td>{employee.phone}</td>
                      <td>{roleLabels[employee.role]}</td>
                      <td>{employee.shop?.name ?? '—'}</td>
                      <td><span className={employee.isActive ? 'text-emerald-700' : 'text-slate-500'}>{employee.isActive ? 'Активен' : 'Неактивен'}</span></td>
                      <td className="p-3">
                        {canUpdate && canManageEmployee(employee) && (
                          <>
                            <button disabled={submitting} onClick={() => void openEdit(employee)} className="mr-3 text-blue-700 disabled:opacity-50">Редактировать</button>
                            <button
                              disabled={submitting || (employee.id === user?.id && employee.isActive)}
                              onClick={() => void toggleActive(employee)}
                              title={employee.id === user?.id && employee.isActive ? 'Нельзя деактивировать себя' : undefined}
                              className="mr-3 text-amber-700 disabled:opacity-50"
                            >
                              {employee.isActive ? 'Деактивировать' : 'Активировать'}
                            </button>
                          </>
                        )}
                        {canResetPassword && canManageEmployee(employee) && (
                          <button disabled={submitting} onClick={() => openReset(employee)} className="text-slate-700 disabled:opacity-50">Сбросить пароль</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mode && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
              <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{mode === 'create' ? 'Добавить сотрудника' : mode === 'edit' ? 'Редактировать сотрудника' : 'Сбросить пароль'}</h2>
                    {mode === 'reset' && <p className="mt-1 text-sm text-slate-500">Новый пароль не будет показан после сохранения.</p>}
                  </div>
                  <button type="button" onClick={closeForm} className="text-slate-500">Закрыть</button>
                </div>

                {mode !== 'reset' && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Имя" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} required />
                    <Field label="Фамилия" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
                    <Field label="Телефон" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required />
                    <label className="block text-sm">Роль
                      <select value={form.role} disabled={roleLocked} onChange={(event) => setForm({ ...form, role: event.target.value as EmployeeRole })} className="mt-1 w-full rounded border border-slate-300 p-2 disabled:bg-slate-100">
                        {allowedRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                      </select>
                      {roleLocked && <span className="mt-1 block text-xs text-slate-500">Нельзя изменять эту роль.</span>}
                    </label>
                    {mode === 'create' && isSuperAdmin && (
                      <label className="block text-sm sm:col-span-2">Магазин
                        <select value={form.shopId} onChange={(event) => setForm({ ...form, shopId: event.target.value })} required className="mt-1 w-full rounded border border-slate-300 p-2">
                          <option value="">Выберите магазин</option>
                          {shopList.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                        </select>
                      </label>
                    )}
                    {mode === 'edit' && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.isActive} disabled={isOwnEmployee && form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Активен</label>}
                  </div>
                )}

                {mode !== 'edit' && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Новый пароль" type="password" value={form.temporaryPassword} onChange={(value) => setForm({ ...form, temporaryPassword: value })} required />
                    <Field label="Подтвердите пароль" type="password" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} required />
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{submitting ? 'Сохранение…' : 'Сохранить'}</button>
                  <button type="button" onClick={closeForm} className="rounded border px-4 py-2">Отмена</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1 w-full rounded border border-slate-300 p-2" />
    </label>
  );
}
