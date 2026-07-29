'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../components/auth-provider';
import {
  VehicleRegistryItem,
  createVehicleRegistryItem,
  deactivateVehicleRegistryItem,
  getVehicleRegistry,
  restoreVehicleRegistryItem,
  updateVehicleRegistryItem,
} from '../../../../lib/api';

const labels:Record<string,string>={
  'body-types':'Кузова','fuel-types':'Типы топлива','drive-types':'Типы привода',
  'transmission-types':'Коробки передач','steering-positions':'Расположение руля','market-regions':'Рынки',
};

export default function VehicleRegistryPage(){
  const {resource}=useParams<{resource:string}>();
  const {hasPermission,hasRole}=useAuth();
  const canEdit=hasRole('SUPER_ADMIN')&&hasPermission('CATALOG_MANAGE');
  const [items,setItems]=useState<VehicleRegistryItem[]>([]);
  const [search,setSearch]=useState('');
  const [debouncedSearch,setDebouncedSearch]=useState('');
  const [active,setActive]=useState<'true'|'false'>('true');
  const [page,setPage]=useState(1);
  const [pages,setPages]=useState(1);
  const [name,setName]=useState('');const [slug,setSlug]=useState('');const [description,setDescription]=useState('');
  const [editing,setEditing]=useState<VehicleRegistryItem|null>(null);
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);

  const load=useCallback(async()=>{
    if(!labels[resource]){setError('Неизвестный справочник');setLoading(false);return;}
    setLoading(true);setError('');
    try{const response=await getVehicleRegistry(resource,{search:debouncedSearch||undefined,isActive:active==='true',page,limit:25});setItems(response.data);setPages(Math.max(1,response.meta.totalPages));}
    catch(reason){setError(reason instanceof Error?reason.message:'Не удалось загрузить данные');}
    finally{setLoading(false);}
  },[active,debouncedSearch,page,resource]);
  useEffect(()=>{
    const timer=window.setTimeout(()=>setDebouncedSearch(search.trim()),350);
    return()=>window.clearTimeout(timer);
  },[search]);
  useEffect(()=>{
    let cancelled=false;
    queueMicrotask(()=>{if(!cancelled)void load();});
    return()=>{cancelled=true};
  },[load]);

  async function submit(event:FormEvent){event.preventDefault();setError('');
    try{
      if(editing)await updateVehicleRegistryItem(resource,editing.id,{name,slug,description});
      else await createVehicleRegistryItem(resource,{name,slug,description:description||undefined});
      setName('');setSlug('');setDescription('');setEditing(null);await load();
    }catch(reason){setError(reason instanceof Error?reason.message:'Не удалось сохранить запись');}
  }
  function edit(item:VehicleRegistryItem){setEditing(item);setName(item.name);setSlug(item.slug);setDescription(item.description??'');}
  async function toggle(item:VehicleRegistryItem){setError('');try{if(item.isActive)await deactivateVehicleRegistryItem(resource,item.id);else await restoreVehicleRegistryItem(resource,item.id);await load();}catch(reason){setError(reason instanceof Error?reason.message:'Не удалось изменить статус');}}

  return <section>
    <Link href="/admin/vehicles" className="text-sm text-blue-600 hover:underline">← Автомобили</Link>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">{labels[resource]??'Справочник'}</h1><p className="mt-1 text-slate-600">Единый нормализованный справочник</p></div></div>
    <div className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow">
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Поиск по названию или slug" className="min-w-72 flex-1 rounded-xl border border-slate-300 px-4 py-2"/>
      <select value={active} onChange={e=>{setActive(e.target.value as typeof active);setPage(1)}} className="rounded-xl border border-slate-300 px-4 py-2"><option value="true">Активные</option><option value="false">Отключённые</option></select>
    </div>
    {canEdit&&<form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow md:grid-cols-4">
      <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Название" className="rounded-xl border border-slate-300 px-4 py-2"/>
      <input required value={slug} onChange={e=>setSlug(e.target.value)} placeholder="slug" className="rounded-xl border border-slate-300 px-4 py-2"/>
      <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Описание" className="rounded-xl border border-slate-300 px-4 py-2"/>
      <div className="flex gap-2"><button className="rounded-xl bg-blue-600 px-4 py-2 text-white">{editing?'Сохранить':'Добавить'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setName('');setSlug('');setDescription('')}} className="rounded-xl border px-4 py-2">Отмена</button>}</div>
    </form>}
    {error&&<p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow"><table className="w-full text-left"><thead className="bg-slate-100 text-sm text-slate-600"><tr><th className="p-4">Название</th><th className="p-4">Slug</th><th className="p-4">Статус</th>{canEdit&&<th className="p-4">Действия</th>}</tr></thead><tbody>
      {loading?<tr><td colSpan={4} className="p-8 text-center">Загрузка...</td></tr>:items.length===0?<tr><td colSpan={4} className="p-8 text-center text-slate-500">Записи не найдены</td></tr>:items.map(item=><tr key={item.id} className="border-t border-slate-100"><td className="p-4 font-medium">{item.name}</td><td className="p-4 text-slate-500">{item.slug}</td><td className="p-4">{item.isActive?'Активен':'Отключён'}</td>{canEdit&&<td className="p-4"><button onClick={()=>edit(item)} className="mr-3 text-blue-600">Изменить</button><button onClick={()=>void toggle(item)} className={item.isActive?'text-red-600':'text-green-700'}>{item.isActive?'Отключить':'Восстановить'}</button></td>}</tr>)}
    </tbody></table></div>
    <div className="mt-5 flex items-center justify-between"><button disabled={page<=1} onClick={()=>setPage(value=>value-1)} className="rounded-xl border px-4 py-2 disabled:opacity-40">Назад</button><span>{page} / {pages}</span><button disabled={page>=pages} onClick={()=>setPage(value=>value+1)} className="rounded-xl border px-4 py-2 disabled:opacity-40">Вперёд</button></div>
  </section>;
}
