'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  ApiError, createTaxonomyDecision, getPartCategories, getTaxonomyCategory, PartCategoryOption,
  TaxonomyCategoryDetail, TaxonomyClassification, TaxonomyDecision, taxonomyDecisionAction, updateTaxonomyDecision,
} from '../../../../lib/api';

export default function TaxonomyCategoryPage(){
  const {categoryId}=useParams<{categoryId:string}>();
  const [data,setData]=useState<TaxonomyCategoryDetail|null>(null);
  const [targets,setTargets]=useState<PartCategoryOption[]>([]);
  const [decision,setDecision]=useState<TaxonomyDecision|null>(null);
  const [form,setForm]=useState({classification:'REVIEW' as TaxonomyClassification,targetCategoryId:'',canonicalName:'',aliases:'',duplicateStrategy:'REQUIRE_REVIEW',notes:''});
  const [message,setMessage]=useState('');const [error,setError]=useState('');const [preview,setPreview]=useState<unknown>(null);const [confirmApply,setConfirmApply]=useState(false);
  async function load(){try{const category=await getTaxonomyCategory(categoryId);setData(category);const draft=category.taxonomySourceDecisions.find(x=>x.status==='DRAFT')??category.taxonomySourceDecisions[0]??null;setDecision(draft);if(draft)setForm({classification:draft.classification,targetCategoryId:draft.targetCategoryId??'',canonicalName:draft.canonicalName??'',aliases:Array.isArray(draft.aliases)?draft.aliases.join('\n'):'',duplicateStrategy:draft.duplicateStrategy??'REQUIRE_REVIEW',notes:draft.notes??''});const options=await getPartCategories({isActive:true,limit:100,page:1});setTargets(options.data.filter(x=>x.id!==categoryId));}catch(e){setError(e instanceof ApiError?e.message:'Ошибка загрузки');}}
  useEffect(()=>{
    let active=true;
    Promise.all([
      getTaxonomyCategory(categoryId),
      getPartCategories({isActive:true,limit:100,page:1}),
    ]).then(([category,options])=>{
      if(!active)return;
      setData(category);
      const draft=category.taxonomySourceDecisions.find(x=>x.status==='DRAFT')??category.taxonomySourceDecisions[0]??null;
      setDecision(draft);
      if(draft)setForm({classification:draft.classification,targetCategoryId:draft.targetCategoryId??'',canonicalName:draft.canonicalName??'',aliases:Array.isArray(draft.aliases)?draft.aliases.join('\n'):'',duplicateStrategy:draft.duplicateStrategy??'REQUIRE_REVIEW',notes:draft.notes??''});
      setTargets(options.data.filter(x=>x.id!==categoryId));
    }).catch(e=>{if(active)setError(e instanceof ApiError?e.message:'Ошибка загрузки');});
    return()=>{active=false;};
  },[categoryId]);
  async function save(e:FormEvent){e.preventDefault();setError('');const payload={sourceCategoryId:categoryId,classification:form.classification,targetCategoryId:form.targetCategoryId||undefined,canonicalName:form.canonicalName||undefined,aliases:form.aliases.split('\n').map(x=>x.trim()).filter(Boolean),duplicateStrategy:form.duplicateStrategy,notes:form.notes||undefined};try{const saved=decision?.status==='DRAFT'?await updateTaxonomyDecision(decision.id,payload):await createTaxonomyDecision(payload);setDecision(saved);setMessage('DRAFT сохранён');await load();}catch(e){setError(e instanceof ApiError?e.message:'Не удалось сохранить');}}
  async function action(name:'ready'|'approve'|'preview'|'apply'|'cancel'){if(!decision)return;setError('');try{const result=await taxonomyDecisionAction(decision.id,name);if(name==='preview')setPreview(result);else{setMessage(`Действие ${name} выполнено`);setConfirmApply(false);await load();}}catch(e){setError(e instanceof ApiError?e.message:'Операция не выполнена');}}
  if(!data)return <div className="rounded-xl bg-white p-8">{error||'Загрузка…'}</div>;
  return <section className="max-w-6xl">
    <Link href="/admin/taxonomy-studio" className="text-sm font-medium text-blue-600">← К таблице</Link>
    <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-bold">{data.name}</h1><div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><div><b>UUID:</b><br/><span className="font-mono text-xs">{data.id}</span></div><div><b>Slug:</b><br/>{data.slug}</div><div><b>Активна / review:</b><br/>{data.isActive?'Да':'Нет'} / {data.needsReview?'Да':'Нет'}</div></div></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Рекомендация: {data.recommendation.recommendation}</h2><div className="mt-1 text-sm text-slate-500">Уверенность {Math.round(data.recommendation.confidence*100)}% · риск {data.recommendation.riskLevel}</div><ul className="mt-4 list-disc space-y-1 pl-5 text-sm">{data.recommendation.reasons.map(x=><li key={x}>{x}</li>)}</ul>{data.recommendation.warnings.map(x=><div key={x} className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{x}</div>)}</div>
        <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-semibold">Зависимости</h2><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt>Дочерние категории</dt><dd>{data.children.length}</dd><dt>Прямые позиции</dt><dd>{data.partCatalogItems.length}</dd><dt>Mappings</dt><dd>{data.catalogItemMappings.length}</dd><dt>Дубли</dt><dd>{data.duplicates.length}</dd></dl>{data.partCatalogItems.map(x=><div key={x.id} className="mt-3 rounded-lg border p-3">{x.internalCode} · {x.name}</div>)}</div>
      </div>
      <form onSubmit={save} className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Решение</h2>
        <label className="mt-4 block text-sm font-medium">Классификация<select value={form.classification} onChange={e=>setForm(v=>({...v,classification:e.target.value as TaxonomyClassification}))} className="mt-1 w-full rounded-xl border p-3">{['CATEGORY','CATALOG_ITEM','INVALID','REVIEW'].map(x=><option key={x}>{x}</option>)}</select></label>
        {form.classification==='CATALOG_ITEM'&&<><label className="mt-4 block text-sm font-medium">Настоящая структурная категория<select value={form.targetCategoryId} onChange={e=>setForm(v=>({...v,targetCategoryId:e.target.value}))} className="mt-1 w-full rounded-xl border p-3"><option value="">Выберите…</option>{targets.map(x=><option key={x.id} value={x.id}>{x.parent?.name?`${x.parent.name} > `:''}{x.name}</option>)}</select></label><label className="mt-4 block text-sm font-medium">Каноническое имя<input value={form.canonicalName} onChange={e=>setForm(v=>({...v,canonicalName:e.target.value}))} className="mt-1 w-full rounded-xl border p-3"/></label><label className="mt-4 block text-sm font-medium">Aliases, по одному в строке<textarea value={form.aliases} onChange={e=>setForm(v=>({...v,aliases:e.target.value}))} rows={4} className="mt-1 w-full rounded-xl border p-3"/></label><label className="mt-4 block text-sm font-medium">Стратегия дублей<select value={form.duplicateStrategy} onChange={e=>setForm(v=>({...v,duplicateStrategy:e.target.value}))} className="mt-1 w-full rounded-xl border p-3">{['CREATE_NEW','USE_EXISTING','KEEP_SEPARATE','REQUIRE_REVIEW'].map(x=><option key={x}>{x}</option>)}</select></label></>}
        <label className="mt-4 block text-sm font-medium">Комментарий<textarea value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))} rows={3} className="mt-1 w-full rounded-xl border p-3"/></label>
        {error&&<div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message&&<div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
        <div className="mt-5 flex flex-wrap gap-2"><button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Сохранить DRAFT</button>{decision&&<button type="button" onClick={()=>action('preview')} className="rounded-xl border px-4 py-2">Preview</button>}{decision?.status==='DRAFT'&&<button type="button" onClick={()=>action('ready')} className="rounded-xl border px-4 py-2">В READY</button>}{decision?.status==='READY'&&<button type="button" onClick={()=>action('approve')} className="rounded-xl border px-4 py-2">Утвердить</button>}{decision?.status==='APPROVED'&&<button type="button" onClick={()=>setConfirmApply(true)} className="rounded-xl bg-red-600 px-4 py-2 text-white">Применить</button>}</div>
        {preview!==null&&<pre className="mt-5 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(preview,null,2)}</pre>}
      </form>
    </div>
    {confirmApply&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div role="dialog" aria-modal="true" className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold">Применить решение?</h2><p className="mt-3 text-slate-600">Операция изменит taxonomy-данные транзакционно. Остатки, движения, продажи, закупки и заказы не изменяются. Убедитесь, что preview проверен.</p><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setConfirmApply(false)} className="rounded-xl border px-4 py-2">Отмена</button><button onClick={()=>action('apply')} className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white">Да, применить</button></div></div></div>}
  </section>;
}
