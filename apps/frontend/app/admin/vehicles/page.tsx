import Link from 'next/link';

const sections = [
  ['body-types', 'Кузова'],
  ['fuel-types', 'Типы топлива'],
  ['drive-types', 'Типы привода'],
  ['transmission-types', 'Коробки передач'],
  ['steering-positions', 'Расположение руля'],
  ['market-regions', 'Рынки'],
];

export default function VehiclesPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">Автомобили</h1>
      <p className="mt-2 text-slate-600">Нормализованные справочники базы автомобилей</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(([resource, label]) => (
          <Link key={resource} href={`/admin/vehicles/${resource}`} className="rounded-2xl bg-white p-6 shadow hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
            <p className="mt-2 text-sm text-slate-500">Поиск, редактирование и управление активностью</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
