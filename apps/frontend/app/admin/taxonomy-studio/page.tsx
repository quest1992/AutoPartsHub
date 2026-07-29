'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError, getTaxonomyCategories, TaxonomyCategoryList } from '../../../lib/api';

const riskStyle: Record<string,string>={LOW:'bg-emerald-100 text-emerald-800',MEDIUM:'bg-amber-100 text-amber-800',HIGH:'bg-orange-100 text-orange-800',CRITICAL:'bg-red-100 text-red-800'};

export default function TaxonomyStudioPage(){
  const [result,setResult]=useState<TaxonomyCategoryList|null>(null);
  const [search,setSearch]=useState('');
  const [filters,setFilters]=useState({includeProcessed:false,duplicates:false,suspicious:false});
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  async function load(nextPage=page){
    setLoading(true);setError('');
    try{setResult(await getTaxonomyCategories({search:search||undefined,page:nextPage,limit:25,...filters}));}
    catch(e){setError(e instanceof ApiError?e.message:'Не удалось загрузить таксономию');}
    finally{setLoading(false);}
  }
  useEffect(()=>{
    let active=true;
    const timer=setTimeout(()=>{
      setLoading(true);
      getTaxonomyCategories({search:search||undefined,page,limit:25,...filters})
        .then(value=>{if(active){setResult(value);setError('');}})
        .catch(e=>{if(active)setError(e instanceof ApiError?e.message:'Не удалось загрузить таксономию');})
        .finally(()=>{if(active)setLoading(false);});
    },300);
    return()=>{active=false;clearTimeout(timer);};
  },[page,search,filters]);
  function submit(e:FormEvent){e.preventDefault();setPage(1);void load(1);}
  const stats=result?.stats;
  return <section className="min-w-0">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold text-slate-900">Taxonomy Studio</h1><p className="mt-2 text-slate-600">Безопасная очистка центрального каталога через draft → review → apply</p></div>
      <a href={`${process.env.NEXT_PUBLIC_API_URL}/admin/part-taxonomy/decisions/export.csv`} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium">Экспорт CSV</a>
    </div>
    {stats&&<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {[['Всего',stats.total],['Требуют решения',stats.requiresDecision],['Обработано',stats.processed],['CATALOG_ITEM',stats.catalogItems],['Группы дублей',stats.duplicateGroups],['Высокий риск',stats.highRisk]].map(([label,value])=>
        <div key={label} className="rounded-2xl bg-white p-4 shadow-sm"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></div>)}
    </div>}
    <form onSubmit={submit} className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Название или часть названия" className="min-w-64 flex-1 rounded-xl border border-slate-300 px-4 py-2"/>
        <button className="rounded-xl bg-blue-600 px-5 py-2 font-medium text-white">Найти</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-sm">
        {[['includeProcessed','Показать обработанные'],['duplicates','Только дубли'],['suspicious','Только подозрительные']].map(([key,label])=>
          <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={filters[key as keyof typeof filters]} onChange={e=>{setPage(1);setFilters(v=>({...v,[key]:e.target.checked}));}}/>{label}</label>)}
      </div>
    </form>
    {error&&<div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Название / путь','UUID','Уровень','Дети','Позиции','Review','Классификация','Mapping','Дубли','Рекомендация','Статус',''].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{result?.data.map(row=><tr key={row.id} className="align-top hover:bg-slate-50">
          <td className="max-w-sm px-4 py-4"><div className="font-semibold text-slate-900">{row.name}</div><div title={row.path} className="mt-1 truncate text-xs text-slate-500">{row.path}</div></td>
          <td className="px-4 py-4 font-mono text-xs">{row.id}</td><td className="px-4 py-4">{row.level}</td><td className="px-4 py-4">{row.childrenCount}</td>
          <td className="px-4 py-4">{row.directItemsCount} / {row.subtreeItemsCount}</td><td className="px-4 py-4">{row.needsReview?'Да':'Нет'}</td>
          <td className="px-4 py-4">{row.currentClassification??'—'}</td><td className="px-4 py-4">{row.mappingCount}</td><td className="px-4 py-4">{row.duplicateCount}</td>
          <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskStyle[row.recommendation.riskLevel]}`}>{row.recommendation.recommendation}</span><div className="mt-2 text-xs text-slate-500">{Math.round(row.recommendation.confidence*100)}%</div></td>
          <td className="px-4 py-4">{row.decision?.status??'Нет решения'}</td><td className="px-4 py-4"><Link href={`/admin/taxonomy-studio/${row.id}`} className="font-medium text-blue-600">Открыть</Link></td>
        </tr>)}</tbody>
      </table>
      {loading&&<div className="p-8 text-center text-slate-500">Загрузка…</div>}
      {!loading&&!result?.data.length&&<div className="p-8 text-center text-slate-500">Категории не найдены</div>}
    </div>
    {result&&<div className="mt-4 flex items-center justify-between"><span className="text-sm text-slate-600">Страница {result.meta.page} из {Math.max(result.meta.totalPages,1)}</span><div className="flex gap-2"><button disabled={page<=1} onClick={()=>setPage(v=>v-1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Назад</button><button disabled={page>=result.meta.totalPages} onClick={()=>setPage(v=>v+1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Далее</button></div></div>}
  </section>;
}
