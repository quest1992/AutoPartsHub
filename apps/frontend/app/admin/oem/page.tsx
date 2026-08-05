"use client";

import { useCallback, useEffect, useState } from "react";
import { CatalogPicker } from "../../../components/catalog-picker";
import { VehicleQuickSearch } from "../../../components/vehicle-quick-search";
import { useAuth } from "../../../components/auth-provider";
import { CatalogItem, VehicleQuickSearchResult } from "../../../lib/api";
import {
  addOemAlias,
  addOemCategory,
  addOemCrossReference,
  addOemFitment,
  createOem,
  deactivateOem,
  deactivateOemCrossReference,
  deactivateOemFitment,
  getOem,
  getOemOptions,
  listOem,
  OemOptions,
  OemPart,
  updateOem,
} from "../../../lib/oem-api";

type Action =
  "create" | "edit" | "alias" | "category" | "fitment" | "cross" | null;
const blankMain = {
  manufacturerId: "",
  number: "",
  description: "",
  sourceId: "",
  sourceKey: "",
  status: "UNKNOWN",
};
const statusLabels: Record<string, string> = {
  ACTIVE: "Действующий",
  DISCONTINUED: "Снят с производства",
  SUPERSEDED: "Заменён новым номером",
  UNKNOWN: "Не проверен",
};
const relationLabels: Record<string, string> = {
  AFTERMARKET_ANALOG: "Аналог другого производителя",
  INTERCHANGE: "Взаимозаменяемая деталь",
  REPLACEMENT: "Замена",
  OES_EQUIVALENT: "Эквивалент OES",
  POSSIBLE_MATCH: "Возможное совпадение",
};

export default function OemAdminPage() {
  const { hasRole, isLoading: authLoading } = useAuth();
  const allowed = hasRole("SUPER_ADMIN");
  const [items, setItems] = useState<OemPart[]>([]);
  const [selected, setSelected] = useState<OemPart | null>(null);
  const [options, setOptions] = useState<OemOptions>({
    manufacturers: [],
    sources: [],
    partBrands: [],
  });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<Action>(null);
  const [main, setMain] = useState(blankMain);
  const [alias, setAlias] = useState({
    alias: "",
    aliasType: "FORMATTING",
    sourceId: "",
  });
  const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);
  const [vehicle, setVehicle] = useState<VehicleQuickSearchResult | null>(null);
  const [fitment, setFitment] = useState({
    confidence: "90",
    sourceId: "",
    position: "UNKNOWN",
    side: "NONE",
    notes: "",
  });
  const [cross, setCross] = useState({
    partBrandId: "",
    externalPartNumber: "",
    relationType: "AFTERMARKET_ANALOG",
    confidence: "80",
    sourceId: "",
    notes: "",
  });

  const loadList = useCallback(
    async (query = search) => {
      setBusy(true);
      setError("");
      try {
        const response = await listOem({ search: query, limit: 50 });
        setItems(response.data);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Не удалось загрузить OEM",
        );
      } finally {
        setBusy(false);
      }
    },
    [search],
  );
  async function loadDetail(id: string) {
    setBusy(true);
    setError("");
    try {
      setSelected(await getOem(id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось открыть OEM",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!allowed) return;
    getOemOptions()
      .then(setOptions)
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить справочники",
        ),
      );
  }, [allowed]);
  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(() => void loadList(search), 350);
    return () => clearTimeout(timer);
  }, [allowed, loadList, search]);

  function openCreate() {
    setMain(blankMain);
    setAction("create");
  }
  function openEdit() {
    if (!selected) return;
    setMain({
      manufacturerId: selected.manufacturerId,
      number: selected.number,
      description: selected.description ?? "",
      sourceId: selected.sourceId,
      sourceKey: selected.sourceKey,
      status: selected.status,
    });
    setAction("edit");
  }
  function closeAction() {
    setAction(null);
    setCatalogItem(null);
    setVehicle(null);
    setError("");
  }
  async function run(operation: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await operation();
      setMessage(success);
      closeAction();
      await loadList();
      if (selected) await loadDetail(selected.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Операция не выполнена",
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveMain() {
    if (
      !main.manufacturerId ||
      !main.number.trim() ||
      !main.sourceId ||
      !main.sourceKey.trim()
    ) {
      setError(
        "Заполните производителя, OEM-номер, источник и ключ источника.",
      );
      return;
    }
    const payload = {
      ...main,
      displayNumber: main.number.trim(),
      description: main.description.trim() || undefined,
    };
    if (
      !window.confirm(
        "Сохранить только проверенные реальные данные и указанный источник?",
      )
    )
      return;
    await run(
      () =>
        action === "edit" && selected
          ? updateOem(selected.id, payload)
          : createOem(payload),
      action === "edit" ? "OEM обновлён." : "OEM создан.",
    );
  }
  async function saveSecondary() {
    if (!selected) return;
    if (action === "alias")
      await run(
        () => addOemAlias(selected.id, alias),
        "Вариант номера добавлен.",
      );
    if (action === "category" && catalogItem)
      await run(
        () =>
          addOemCategory(selected.id, {
            catalogItemId: catalogItem.id,
            isPrimary: selected.categories.length === 0,
            confidence: 90,
            sourceId: options.sources[0]?.id,
          }),
        "Связь с каталогом сохранена.",
      );
    if (action === "fitment" && vehicle)
      await run(
        () =>
          addOemFitment(selected.id, {
            manufacturerId: vehicle.manufacturerId,
            vehicleModelId: vehicle.modelId,
            vehicleGenerationId: vehicle.generationId || undefined,
            vehicleSpecificationId: vehicle.specificationId || undefined,
            confidence: Number(fitment.confidence),
            sourceId: fitment.sourceId,
            position: fitment.position,
            side: fitment.side,
            notes: fitment.notes.trim() || undefined,
          }),
        "Совместимость с автомобилем добавлена.",
      );
    if (action === "cross")
      await run(
        () =>
          addOemCrossReference(selected.id, {
            ...cross,
            confidence: Number(cross.confidence),
            notes: cross.notes.trim() || undefined,
          }),
        "Номер аналога добавлен.",
      );
  }

  if (authLoading) return <p>Проверка доступа…</p>;
  if (!allowed)
    return (
      <p className="rounded-xl bg-red-50 p-4 text-red-700">
        Раздел доступен только SUPER_ADMIN.
      </p>
    );
  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-medium text-blue-700">
          Администрирование → OEM и совместимость
        </p>
        <h1 className="mt-1 text-3xl font-bold">База OEM-номеров</h1>
        <p className="mt-2 text-slate-600">
          Создавайте только реальные номера, связывайте их с центральным
          каталогом и подтверждёнными автомобилями.
        </p>
      </header>
      <div className="grid gap-3 rounded-xl bg-blue-50 p-4 md:grid-cols-3">
        <div>
          <b>1. Найдите OEM</b>
          <p className="text-sm text-slate-600">
            Проверьте, что номер ещё не существует.
          </p>
        </div>
        <div>
          <b>2. Свяжите с деталью</b>
          <p className="text-sm text-slate-600">
            Выберите позицию центрального каталога.
          </p>
        </div>
        <div>
          <b>3. Добавьте автомобили</b>
          <p className="text-sm text-slate-600">
            Укажите только подтверждённую применяемость.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="OEM, название детали, бренд или автомобиль"
          className="min-w-0 flex-1 rounded-lg border bg-white px-4 py-3"
        />
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Добавить OEM
        </button>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-green-50 p-3 text-green-700">{message}</p>
      )}
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto rounded-xl bg-white p-3 shadow-sm">
          {busy && !items.length && <p className="p-3">Загрузка…</p>}
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => void loadDetail(item.id)}
              className={`w-full rounded-lg border p-3 text-left ${selected?.id === item.id ? "border-blue-500 bg-blue-50" : "hover:bg-slate-50"}`}
            >
              <b>{item.displayNumber}</b>
              <p className="text-sm">{item.manufacturer.name}</p>
              <p className="truncate text-xs text-slate-500">
                {item.description || "Описание не указано"}
              </p>
            </button>
          ))}
          {!busy && !items.length && (
            <p className="p-3 text-slate-500">OEM не найдены.</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          {!selected ? (
            <div className="grid min-h-72 place-items-center text-center text-slate-500">
              <p>Выберите OEM слева или создайте новый.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {selected.manufacturer.name}
                  </p>
                  <h2 className="text-2xl font-bold">
                    {selected.displayNumber}
                  </h2>
                  <p>{selected.description || "Описание не указано"}</p>
                  <p className="mt-1 text-sm">
                    Статус: <b>{statusLabels[selected.status]}</b> · Источник:{" "}
                    <b>{selected.source.name}</b>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openEdit}
                    className="rounded border px-3 py-2"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Отключить OEM и все его связи без физического удаления?",
                        )
                      )
                        void run(
                          () => deactivateOem(selected.id),
                          "OEM деактивирован.",
                        );
                    }}
                    className="rounded border border-red-300 px-3 py-2 text-red-700"
                  >
                    Отключить
                  </button>
                </div>
              </div>
              <div>
                <SectionTitle
                  title="Позиции центрального каталога"
                  action="Связать с деталью"
                  onClick={() => setAction("category")}
                />
                <div className="space-y-2">
                  {selected.categories.map((entry) => (
                    <Row
                      key={entry.id}
                      title={entry.catalogItem.name}
                      detail={`${entry.catalogItem.category.name} · уверенность ${entry.confidence}%`}
                    />
                  ))}
                  {!selected.categories.length && (
                    <Empty text="Связь с центральным каталогом ещё не добавлена." />
                  )}
                </div>
              </div>
              <div>
                <SectionTitle
                  title="Совместимые автомобили"
                  action="Добавить автомобиль"
                  onClick={() => {
                    setFitment({ ...fitment, sourceId: selected.sourceId });
                    setAction("fitment");
                  }}
                />
                <div className="space-y-2">
                  {selected.fitments.map((entry) => (
                    <Row
                      key={entry.id}
                      title={`${entry.manufacturer.name} ${entry.vehicleModel?.name ?? ""} ${entry.vehicleGeneration?.name ?? ""}`.trim()}
                      detail={`Уверенность ${entry.confidence}% · ${entry.source.name}`}
                      onRemove={() => {
                        if (window.confirm("Отключить эту совместимость?"))
                          void run(
                            () => deactivateOemFitment(selected.id, entry.id),
                            "Совместимость отключена.",
                          );
                      }}
                    />
                  ))}
                  {!selected.fitments.length && (
                    <Empty text="Подтверждённые автомобили ещё не добавлены." />
                  )}
                </div>
              </div>
              <div>
                <SectionTitle
                  title="Номера аналогов"
                  action="Добавить аналог"
                  onClick={() => {
                    setCross({ ...cross, sourceId: selected.sourceId });
                    setAction("cross");
                  }}
                />
                <div className="space-y-2">
                  {selected.outgoingCrossReferences.map((entry) => (
                    <Row
                      key={entry.id}
                      title={`${entry.partBrand?.officialName ?? "OEM"} ${entry.externalPartNumber ?? entry.toOemPart?.displayNumber ?? ""}`}
                      detail={`${relationLabels[entry.relationType] ?? entry.relationType} · уверенность ${entry.confidence}%`}
                      onRemove={() => {
                        if (window.confirm("Отключить этот номер аналога?"))
                          void run(
                            () =>
                              deactivateOemCrossReference(
                                selected.id,
                                entry.id,
                              ),
                            "Аналог отключён.",
                          );
                      }}
                    />
                  ))}
                  {!selected.outgoingCrossReferences.length && (
                    <Empty text="Номера аналогов ещё не добавлены." />
                  )}
                </div>
              </div>
              <div>
                <SectionTitle
                  title="Другие написания номера"
                  action="Добавить вариант"
                  onClick={() => {
                    setAlias({
                      alias: "",
                      aliasType: "FORMATTING",
                      sourceId: selected.sourceId,
                    });
                    setAction("alias");
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {selected.aliases.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                    >
                      {entry.alias}
                    </span>
                  ))}
                  {!selected.aliases.length && (
                    <span className="text-sm text-slate-500">
                      Нет вариантов написания.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {action && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeAction()
          }
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="flex justify-between gap-3">
              <h2 className="text-xl font-bold">{actionTitle(action)}</h2>
              <button
                onClick={closeAction}
                className="rounded border px-3 py-1"
              >
                Закрыть
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {(action === "create" || action === "edit") && (
                <>
                  <Select
                    label="Производитель автомобиля"
                    value={main.manufacturerId}
                    onChange={(value) =>
                      setMain({ ...main, manufacturerId: value })
                    }
                    options={options.manufacturers.map((item) => [
                      item.id,
                      item.name,
                    ])}
                  />
                  <Input
                    label="OEM-номер"
                    value={main.number}
                    onChange={(value) => setMain({ ...main, number: value })}
                  />
                  <Input
                    label="Название или описание детали"
                    value={main.description}
                    onChange={(value) =>
                      setMain({ ...main, description: value })
                    }
                  />
                  <Select
                    label="Источник"
                    value={main.sourceId}
                    onChange={(value) => setMain({ ...main, sourceId: value })}
                    options={options.sources.map((item) => [
                      item.id,
                      `${item.name} · ${item.license ?? ""}`,
                    ])}
                  />
                  <Input
                    label="Номер страницы или записи в источнике"
                    value={main.sourceKey}
                    onChange={(value) => setMain({ ...main, sourceKey: value })}
                  />
                  <Select
                    label="Статус"
                    value={main.status}
                    onChange={(value) => setMain({ ...main, status: value })}
                    options={Object.entries(statusLabels)}
                  />
                  <button
                    disabled={busy}
                    onClick={() => void saveMain()}
                    className="w-full rounded bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                </>
              )}
              {action === "category" && (
                <>
                  <p className="text-sm text-slate-600">
                    Найдите точное название детали в центральном каталоге.
                  </p>
                  <CatalogPicker
                    value={catalogItem}
                    onChange={setCatalogItem}
                  />
                  <button
                    disabled={!catalogItem || busy}
                    onClick={() => void saveSecondary()}
                    className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
                  >
                    Связать с выбранной деталью
                  </button>
                </>
              )}
              {action === "fitment" && (
                <>
                  <VehicleQuickSearch onSelect={setVehicle} />
                  {vehicle && (
                    <p className="rounded bg-green-50 p-3">
                      Выбрано:{" "}
                      <b>
                        {vehicle.manufacturerName} {vehicle.modelName}
                      </b>
                      {vehicle.generationName
                        ? ` · ${vehicle.generationName}`
                        : ""}
                    </p>
                  )}
                  <Select
                    label="Источник совместимости"
                    value={fitment.sourceId}
                    onChange={(value) =>
                      setFitment({ ...fitment, sourceId: value })
                    }
                    options={options.sources.map((item) => [
                      item.id,
                      item.name,
                    ])}
                  />
                  <Input
                    label="Уверенность, %"
                    value={fitment.confidence}
                    onChange={(value) =>
                      setFitment({ ...fitment, confidence: value })
                    }
                    type="number"
                  />
                  <Input
                    label="Примечание"
                    value={fitment.notes}
                    onChange={(value) =>
                      setFitment({ ...fitment, notes: value })
                    }
                  />
                  <button
                    disabled={!vehicle || !fitment.sourceId || busy}
                    onClick={() => void saveSecondary()}
                    className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
                  >
                    Добавить совместимость
                  </button>
                </>
              )}
              {action === "cross" && (
                <>
                  <Select
                    label="Производитель аналога"
                    value={cross.partBrandId}
                    onChange={(value) =>
                      setCross({ ...cross, partBrandId: value })
                    }
                    options={options.partBrands.map((item) => [
                      item.id,
                      item.officialName,
                    ])}
                  />
                  <Input
                    label="Номер аналога"
                    value={cross.externalPartNumber}
                    onChange={(value) =>
                      setCross({ ...cross, externalPartNumber: value })
                    }
                  />
                  <Select
                    label="Тип связи"
                    value={cross.relationType}
                    onChange={(value) =>
                      setCross({ ...cross, relationType: value })
                    }
                    options={Object.entries(relationLabels)}
                  />
                  <Select
                    label="Источник"
                    value={cross.sourceId}
                    onChange={(value) =>
                      setCross({ ...cross, sourceId: value })
                    }
                    options={options.sources.map((item) => [
                      item.id,
                      item.name,
                    ])}
                  />
                  <Input
                    label="Уверенность, %"
                    value={cross.confidence}
                    onChange={(value) =>
                      setCross({ ...cross, confidence: value })
                    }
                    type="number"
                  />
                  <button
                    disabled={
                      !cross.partBrandId ||
                      !cross.externalPartNumber.trim() ||
                      !cross.sourceId ||
                      busy
                    }
                    onClick={() => void saveSecondary()}
                    className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
                  >
                    Добавить аналог
                  </button>
                </>
              )}
              {action === "alias" && (
                <>
                  <Input
                    label="Другой вариант написания OEM"
                    value={alias.alias}
                    onChange={(value) => setAlias({ ...alias, alias: value })}
                  />
                  <Select
                    label="Тип"
                    value={alias.aliasType}
                    onChange={(value) =>
                      setAlias({ ...alias, aliasType: value })
                    }
                    options={[
                      ["FORMATTING", "Другое форматирование"],
                      ["OLD_NUMBER", "Старый номер"],
                      ["REGIONAL", "Региональный номер"],
                      ["MANUAL", "Ручное уточнение"],
                    ]}
                  />
                  <Select
                    label="Источник"
                    value={alias.sourceId}
                    onChange={(value) =>
                      setAlias({ ...alias, sourceId: value })
                    }
                    options={options.sources.map((item) => [
                      item.id,
                      item.name,
                    ])}
                  />
                  <button
                    disabled={!alias.alias.trim() || !alias.sourceId || busy}
                    onClick={() => void saveSecondary()}
                    className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
                  >
                    Добавить вариант
                  </button>
                </>
              )}
            </div>
            {error && (
              <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SectionTitle({
  title,
  action,
  onClick,
}: {
  title: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button
        onClick={onClick}
        className="rounded border px-3 py-2 text-sm text-blue-700"
      >
        {action}
      </button>
    </div>
  );
}
function Row({
  title,
  detail,
  onRemove,
}: {
  title: string;
  detail: string;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <b>{title}</b>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="text-sm text-red-700">
          Отключить
        </button>
      )}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{text}</p>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border p-3"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border p-3"
      >
        <option value="">Выберите</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
function actionTitle(action: Action) {
  return (
    (
      {
        create: "Новый OEM",
        edit: "Редактирование OEM",
        alias: "Другой вариант номера",
        category: "Связь с центральным каталогом",
        fitment: "Совместимость с автомобилем",
        cross: "Номер аналога",
      } as Record<string, string>
    )[action ?? ""] ?? ""
  );
}
