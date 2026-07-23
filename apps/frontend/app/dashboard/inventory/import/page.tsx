'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ProtectedLayout } from '../../../../components/protected-layout';
import {
  ApiError,
  confirmInventoryImport,
  importPreview,
  InventoryImportConfirmResponse,
  InventoryImportMapping,
  InventoryImportPreviewResponse,
  shops,
  Shop,
} from '../../../../lib/api';
import { getUser } from '../../../../lib/auth';

type Step = 'upload' | 'mapping' | 'result';

const statusLabels: Record<string, string> = {
  valid: 'Готово',
  invalid: 'Ошибка',
  requires_review: 'Требует проверки',
};

const emptyMapping = (): InventoryImportMapping => ({
  partNumberColumn: '',
  nameColumn: '',
  compatibilityColumn: '',
  storageLocationColumn: '',
  priceColumn: '',
  quantityColumn: '',
});

export default function InventoryImportPage() {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InventoryImportPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<InventoryImportMapping>(emptyMapping());
  const [shopId, setShopId] = useState('');
  const [shopList, setShopList] = useState<Shop[]>([]);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InventoryImportConfirmResponse | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getUser());
      setAuthLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!authLoaded || user?.role !== 'SUPER_ADMIN') return;
    shops()
      .then(setShopList)
      .catch((requestError: Error) => setError(requestError.message));
  }, [authLoaded, user?.role]);

  const mappingWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!mapping.nameColumn) warnings.push('Не выбрана колонка с наименованием.');
    if (!mapping.priceColumn) warnings.push('Не выбрана колонка с ценой.');
    if (!mapping.quantityColumn) warnings.push('Не выбрана колонка с количеством.');
    if (!mapping.partNumberColumn && !mapping.nameColumn) {
      warnings.push('Укажите колонку с артикулом или наименованием.');
    }
    return warnings;
  }, [mapping]);

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    if (!/\.(xlsx|xls)$/i.test(nextFile.name)) {
      setError('Поддерживаются только файлы .xlsx и .xls');
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой.');
      return;
    }
    setFile(nextFile);
    setPreview(null);
    setResult(null);
    setStep('upload');
    setError('');
  }

  async function runPreview(nextMapping?: InventoryImportMapping) {
    if (!file) return;
    if (user?.role === 'SUPER_ADMIN' && !shopId) {
      setError('Выберите магазин');
      return;
    }

  const mappingToUse = nextMapping;
    

    setBusy(true);
    setError('');
    setLoadingMessage('Читаем Excel-файл...');

    try {
      setLoadingMessage('Проверяем данные...');
    const response = await importPreview(file, {
  shopId: shopId || undefined,
  ...(mappingToUse ? { mapping: mappingToUse } : {}),
});
      setPreview(response);
      setMapping({
        partNumberColumn: response.appliedMapping.partNumberColumn ?? '',
        nameColumn: response.appliedMapping.nameColumn,
        compatibilityColumn:
          response.appliedMapping.compatibilityColumn ?? '',
        storageLocationColumn:
          response.appliedMapping.storageLocationColumn ?? '',
        priceColumn: response.appliedMapping.priceColumn,
        quantityColumn: response.appliedMapping.quantityColumn,
      });
      setStep('mapping');
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setBusy(false);
      setLoadingMessage('');
    }
  }

  async function runImport() {
    if (!file || !preview || mappingWarnings.length) return;
    if (
      !window.confirm(
        `Будет обработано ${preview.totalRows} строк. Существующие товары магазина будут обновлены, новые — добавлены. Продолжить?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');
    setLoadingMessage('Импортируем товары...');

    try {
      const response = await confirmInventoryImport(file, {
        shopId: shopId || undefined,
        mapping,
      });
      setResult(response);
      setPreview(null);
      setStep('result');
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setBusy(false);
      setLoadingMessage('');
    }
  }

  function resetFlow() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setMapping(emptyMapping());
    setStep('upload');
    setError('');
  }

  return (
    <ProtectedLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Импорт товаров из Excel</h1>
        <p className="mt-1 text-slate-500">
          Загрузите Excel-файл с товарами магазина. Перед сохранением вы сможете проверить данные.
        </p>
      </div>

      {(step === 'upload' || !preview) && !result && (
        <section
          onDrop={(event: DragEvent) => {
            event.preventDefault();
            chooseFile(event.dataTransfer.files[0]);
          }}
          onDragOver={(event) => event.preventDefault()}
          className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6"
        >
          <p className="text-sm text-slate-600">
            Перетащите файл сюда или выберите его на компьютере. Форматы: .xlsx, .xls. Максимум 10 МБ.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              chooseFile(event.target.files?.[0])
            }
            className="mt-4 block w-full text-sm"
          />
          {file && (
            <p className="mt-2 text-sm text-slate-600">
              {file.name} · {(file.size / 1024).toFixed(1)} КБ
            </p>
          )}
          {authLoaded && user?.role === 'SUPER_ADMIN' && (
            <select
              value={shopId}
              onChange={(event) => setShopId(event.target.value)}
              className="mt-4 block rounded border border-slate-300 p-2"
            >
              <option value="">Выберите магазин</option>
              {shopList
                .filter((shop) => shop.isActive)
                .map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
            </select>
          )}
          <button
            disabled={!file || busy}
            onClick={() => void runPreview()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:bg-slate-300"
          >
            {busy ? loadingMessage || 'Проверяем...' : 'Проверить файл'}
          </button>
        </section>
      )}

      {error && (
        <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {preview && step === 'mapping' && !result && (
        <section className="mt-6 space-y-6">
          <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold">Сопоставление колонок</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MappingSelect
                label="Артикул / OEM"
                value={mapping.partNumberColumn ?? ''}
                columns={preview.columns}
                onChange={(value) =>
                  setMapping((current) => ({ ...current, partNumberColumn: value }))
                }
              />
              <MappingSelect
                label="Наименование"
                value={mapping.nameColumn}
                columns={preview.columns}
                required
                onChange={(value) =>
                  setMapping((current) => ({ ...current, nameColumn: value }))
                }
              />
              <MappingSelect
                label="Совместимость"
                value={mapping.compatibilityColumn ?? ''}
                columns={preview.columns}
                onChange={(value) =>
                  setMapping((current) => ({
                    ...current,
                    compatibilityColumn: value,
                  }))
                }
              />
              <MappingSelect
                label="Место хранения"
                value={mapping.storageLocationColumn ?? ''}
                columns={preview.columns}
                onChange={(value) =>
                  setMapping((current) => ({
                    ...current,
                    storageLocationColumn: value,
                  }))
                }
              />
              <MappingSelect
                label="Цена"
                value={mapping.priceColumn}
                columns={preview.columns}
                required
                onChange={(value) =>
                  setMapping((current) => ({ ...current, priceColumn: value }))
                }
              />
              <MappingSelect
                label="Количество"
                value={mapping.quantityColumn}
                columns={preview.columns}
                required
                onChange={(value) =>
                  setMapping((current) => ({ ...current, quantityColumn: value }))
                }
              />
            </div>
            {mappingWarnings.length > 0 && (
              <div className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
                {mappingWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}
            <button
              disabled={busy || mappingWarnings.length > 0}
              onClick={() => void runPreview(mapping)}
              className="mt-4 rounded border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Обновить предпросмотр
            </button>
          </div>

          <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>Всего строк: {preview.totalRows}</span>
              <span>Корректных: {preview.summary.validRows}</span>
              <span>С ошибками: {preview.summary.invalidRows}</span>
              <span>Требуют проверки: {preview.summary.requiresReviewRows}</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2">№ строки</th>
                    <th>Артикул</th>
                    <th>Наименование</th>
                    <th>Совместимость</th>
                    <th>Место хранения</th>
                    <th>Цена</th>
                    <th>Количество</th>
                    <th>Статус</th>
                    <th>Ошибки</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map((row) => (
                    <tr key={row.rowNumber} className="border-t align-top">
                      <td className="py-3">{row.rowNumber}</td>
                      <td className="py-3">{row.normalized.partNumber ?? '—'}</td>
                      <td className="py-3">{row.normalized.name ?? '—'}</td>
                      <td className="py-3">
                        {row.normalized.compatibility ?? '—'}
                      </td>
                      <td className="py-3">
                        {row.normalized.storageLocation ?? '—'}
                      </td>
                      <td className="py-3">{row.normalized.price ?? '—'}</td>
                      <td className="py-3">{row.normalized.quantity}</td>
                      <td className="py-3">{statusLabels[row.status] ?? row.status}</td>
                      <td className="py-3 text-red-700">
                        {row.errors.join('; ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                disabled={busy}
                onClick={() => {
                  setPreview(null);
                  setStep('upload');
                }}
                className="rounded border px-4 py-2"
              >
                Назад
              </button>
              <button
                disabled={busy || mappingWarnings.length > 0}
                onClick={() => void runImport()}
                className="rounded bg-emerald-600 px-4 py-2 text-white disabled:bg-slate-300"
              >
                {busy ? loadingMessage || 'Импорт...' : 'Импортировать товары'}
              </button>
            </div>
          </div>
        </section>
      )}

      {result && (
        <section className="mt-6 rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Импорт завершён</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Добавлено" value={result.imported} />
            <Stat label="Обновлено" value={result.updated} />
            <Stat label="Пропущено" value={result.skipped} />
            <Stat label="Требует проверки" value={result.requiresReview} />
            <Stat label="Ошибок" value={result.failed} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/inventory" className="rounded bg-blue-600 px-4 py-2 text-white">
              Перейти к товарам
            </Link>
            <button onClick={resetFlow} className="rounded border px-4 py-2">
              Загрузить другой файл
            </button>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <h3 className="font-medium">Ошибки по строкам</h3>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 text-left">Строка</th>
                    <th className="py-2 text-left">Сообщение</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((item) => (
                    <tr key={`${item.rowNumber}-${item.message}`} className="border-t">
                      <td className="py-2">{item.rowNumber}</td>
                      <td className="py-2">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </ProtectedLayout>
  );
}

function MappingSelect({
  label,
  value,
  columns,
  required,
  onChange,
}: {
  label: string;
  value: string;
  columns: string[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? ' *' : ''}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 p-2"
      >
        <option value="">Не выбрано</option>
        {columns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function formatError(error: unknown) {
  if (!(error instanceof ApiError) && !(error instanceof Error)) {
    return 'Не удалось выполнить операцию';
  }
  const message = error.message;
  if (message.includes('10')) return 'Файл слишком большой.';
  if (message.includes('прочитать')) return 'Не удалось прочитать Excel-файл.';
  if (message.includes('найдены товары')) return 'В файле не найдены товары.';
  return message;
}
