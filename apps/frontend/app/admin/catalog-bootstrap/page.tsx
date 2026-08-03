'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedLayout } from '../../../components/protected-layout';
import { useAuth } from '../../../components/auth-provider';
import {
  CatalogBootstrapCreateResponse,
  CatalogBootstrapAutoCreateResponse,
  CatalogBootstrapRow,
  autoCreateSafeCatalog,
  createCatalogBootstrapItems,
  getCatalogBootstrap,
} from '../../../lib/api';

const PAGE_SIZE = 50;
const sideLabels = { NONE: 'Не указана', LEFT: 'Левая', RIGHT: 'Правая' };
const positionLabels = { NONE: 'Не указана', FRONT: 'Передняя', REAR: 'Задняя' };

export default function CatalogBootstrapPage() {
  const { hasRole, isLoading: authLoading } = useAuth();
  const allowed = hasRole('SUPER_ADMIN');
  const [rows, setRows] = useState<CatalogBootstrapRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'NEW'|'EXISTING'|'ALL'>('NEW');
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [rootCategory, setRootCategory] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<CatalogBootstrapCreateResponse['summary']|null>(null);
  const [autoReport,setAutoReport]=useState<CatalogBootstrapAutoCreateResponse|null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(()=>{
    if(!allowed)return;
    let cancelled=false;
    queueMicrotask(async()=>{
      if(cancelled)return;
      setLoading(true);setError('');
      try{const response=await getCatalogBootstrap();if(!cancelled)setRows(response.items);}
      catch(reason){if(!cancelled)setError(reason instanceof Error?reason.message:'Не удалось загрузить мастер');}
      finally{if(!cancelled)setLoading(false);}
    });
    return()=>{cancelled=true};
  },[allowed]);

  const categories=useMemo(()=>[...new Set(rows.map(row=>row.rootCategory))].sort((a,b)=>a.localeCompare(b,'ru')),[rows]);
  const filtered=useMemo(()=>rows.filter(row=>{
    const query=search.trim().toLocaleLowerCase('ru-RU');
    if(query&&!`${row.path} ${row.suggestedName}`.toLocaleLowerCase('ru-RU').includes(query))return false;
    if(status==='NEW'&&row.existsInCatalog)return false;
    if(status==='EXISTING'&&!row.existsInCatalog)return false;
    if(warningsOnly&&!row.warning)return false;
    if(rootCategory&&row.rootCategory!==rootCategory)return false;
    return true;
  }),[rows,search,status,warningsOnly,rootCategory]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const selectedRows=rows.filter(row=>selected.has(row.categoryId)&&!row.existsInCatalog);

  function updateRow(id:string,patch:Partial<CatalogBootstrapRow>){setRows(current=>current.map(row=>row.categoryId===id?{...row,...patch}:row));}
  function toggle(id:string){setSelected(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  function selectPage(){setSelected(current=>{const next=new Set(current);visible.filter(row=>!row.existsInCatalog).forEach(row=>next.add(row.categoryId));return next;});}
  function clearPage(){setSelected(current=>{const next=new Set(current);visible.forEach(row=>next.delete(row.categoryId));return next;});}
  function resetPage(){setPage(1);}

  async function createSelected(){
    setCreating(true);setError('');
    try{
      const payload=selectedRows.map(row=>({categoryId:row.categoryId,name:row.suggestedName,side:row.suggestedSide,position:row.suggestedPosition}));
      const responses:CatalogBootstrapCreateResponse[]=[];
      for(let offset=0;offset<payload.length;offset+=100)responses.push(await createCatalogBootstrapItems(payload.slice(offset,offset+100)));
      const results=responses.flatMap(response=>response.results);
      const summary=responses.reduce((total,response)=>({
        requested:total.requested+response.summary.requested,
        created:total.created+response.summary.created,
        alreadyExisted:total.alreadyExisted+response.summary.alreadyExisted,
        skipped:total.skipped+response.summary.skipped,
      }),{requested:0,created:0,alreadyExisted:0,skipped:0});
      setReport(summary);setPreviewOpen(false);
      const handled=new Map(results.map(result=>[result.categoryId,result]));
      setRows(current=>current.map(row=>{
        const result=handled.get(row.categoryId);
        return result&&result.status!=='SKIPPED'?{...row,existsInCatalog:true,existingCatalogItemId:result.catalogItemId}:row;
      }));
      setSelected(current=>{const next=new Set(current);results.filter(result=>result.status!=='SKIPPED').forEach(result=>next.delete(result.categoryId));return next;});
    }catch(reason){setError(reason instanceof Error?reason.message:'Не удалось создать позиции');}
    finally{setCreating(false);}
  }

  async function autoCreateSafe(){
    if(!window.confirm('Создать по одной базовой позиции во всех пустых конечных категориях? Повторный запуск не создаст дубликаты.'))return;
    setCreating(true);setError('');
    try{
      const response=await autoCreateSafeCatalog();
      setAutoReport(response);
      const refreshed=await getCatalogBootstrap();
      setRows(refreshed.items);
      setSelected(new Set());
    }catch(reason){setError(reason instanceof Error?reason.message:'Не удалось выполнить безопасное автозаполнение');}
    finally{setCreating(false);}
  }

  return <ProtectedLayout>
    {!authLoading&&!allowed?<section className="rounded-xl bg-white p-6">Доступно только SUPER_ADMIN.</section>:
    <section>
      <header><p className="text-sm text-blue-700">Администрирование → Центральный каталог</p><h1 className="mt-1 text-2xl font-bold">Мастер наполнения</h1><p className="mt-1 text-slate-500">Проверьте предложения и создавайте только выбранные позиции.</p></header>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm"><b>{rows.length}</b><p className="text-sm text-slate-500">Листовых категорий</p></div>
        <div className="rounded-xl bg-white p-4 shadow-sm"><b>{rows.filter(r=>r.existsInCatalog).length}</b><p className="text-sm text-slate-500">Уже создано</p></div>
        <div className="rounded-xl bg-white p-4 shadow-sm"><b>{rows.filter(r=>!r.existsInCatalog).length}</b><p className="text-sm text-slate-500">Новых кандидатов</p></div>
        <div className="rounded-xl bg-white p-4 shadow-sm"><b>{selectedRows.length}</b><p className="text-sm text-slate-500">Выбрано</p></div>
      </div>
      <div className="mt-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
        <input value={search} onChange={e=>{setSearch(e.target.value);resetPage()}} className="rounded border p-2" placeholder="Поиск"/>
        <select value={status} onChange={e=>{setStatus(e.target.value as typeof status);resetPage()}} className="rounded border p-2"><option value="NEW">Только новые</option><option value="EXISTING">Уже созданные</option><option value="ALL">Все</option></select>
        <select value={rootCategory} onChange={e=>{setRootCategory(e.target.value);resetPage()}} className="rounded border p-2"><option value="">Все категории</option>{categories.map(name=><option key={name}>{name}</option>)}</select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={warningsOnly} onChange={e=>{setWarningsOnly(e.target.checked);resetPage()}}/>Есть предупреждения</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button onClick={selectPage} className="rounded border px-3 py-2">Выделить все на странице</button><button onClick={clearPage} className="rounded border px-3 py-2">Снять выделение</button><button disabled={!selectedRows.length||creating} onClick={()=>setPreviewOpen(true)} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">Создать выбранные ({selectedRows.length})</button><button disabled={creating} onClick={()=>void autoCreateSafe()} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Заполнить все пустые категории</button></div>
      {report&&<p className="mt-4 rounded bg-green-50 p-3 text-green-800">Создано: {report.created}. Уже существовало: {report.alreadyExisted}. Пропущено: {report.skipped}.</p>}
      {autoReport&&<p className="mt-4 rounded bg-emerald-50 p-3 text-emerald-900">Готово: создано {autoReport.created}, уже были заполнены {autoReport.skippedExisting}, ошибок {autoReport.failed}. Всего конечных категорий: {autoReport.categoriesFound}.</p>}
      {error&&<p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-3">✓</th><th className="p-3">Категория</th><th className="p-3">Предлагаемое название</th><th className="p-3">Сторона</th><th className="p-3">Позиция</th><th className="p-3">Создано?</th><th className="p-3">Предупреждение</th></tr></thead><tbody>
        {loading?<tr><td colSpan={7} className="p-6">Загрузка…</td></tr>:visible.map(row=><tr key={row.categoryId} className="border-t align-top"><td className="p-3"><input type="checkbox" disabled={row.existsInCatalog} checked={selected.has(row.categoryId)} onChange={()=>toggle(row.categoryId)}/></td><td className="p-3"><p className="font-medium">{row.categoryName}</p><p className="text-xs text-slate-500">{row.path}</p></td><td className="p-3"><input disabled={row.existsInCatalog} value={row.suggestedName} onChange={e=>updateRow(row.categoryId,{suggestedName:e.target.value})} className="w-full min-w-52 rounded border p-2 disabled:bg-slate-50"/></td><td className="p-3"><select disabled={row.existsInCatalog} value={row.suggestedSide} onChange={e=>updateRow(row.categoryId,{suggestedSide:e.target.value as CatalogBootstrapRow['suggestedSide']})} className="rounded border p-2">{Object.entries(sideLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td><td className="p-3"><select disabled={row.existsInCatalog} value={row.suggestedPosition} onChange={e=>updateRow(row.categoryId,{suggestedPosition:e.target.value as CatalogBootstrapRow['suggestedPosition']})} className="rounded border p-2">{Object.entries(positionLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td><td className="p-3">{row.existsInCatalog?<span className="text-green-700">✓ Уже создано</span>:'Нет'}</td><td className="max-w-72 p-3 text-amber-700">{row.warning||'—'}</td></tr>)}
        {!loading&&!visible.length&&<tr><td colSpan={7} className="p-6 text-slate-500">Строки не найдены.</td></tr>}
      </tbody></table></div>
      <div className="mt-4 flex items-center gap-3"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded border px-4 py-2 disabled:opacity-50">Назад</button><span>Страница {page} из {totalPages} · найдено {filtered.length}</span><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="rounded border px-4 py-2 disabled:opacity-50">Далее</button></div>
      {previewOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Будет создано: {selectedRows.length}</h2><ul className="mt-4 list-disc space-y-1 pl-6">{selectedRows.map(row=><li key={row.categoryId}>{row.suggestedName} <span className="text-slate-500">· {sideLabels[row.suggestedSide]}, {positionLabels[row.suggestedPosition]}</span></li>)}</ul><p className="mt-5 font-medium">Продолжить?</p><div className="mt-4 flex gap-3"><button disabled={creating} onClick={()=>void createSelected()} className="rounded bg-blue-600 px-4 py-2 text-white">{creating?'Создание…':'Продолжить'}</button><button disabled={creating} onClick={()=>setPreviewOpen(false)} className="rounded border px-4 py-2">Отмена</button></div></div></div>}
    </section>}
  </ProtectedLayout>;
}
