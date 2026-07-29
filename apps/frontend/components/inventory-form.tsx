'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CatalogItem, getWarehouses, InventoryItem, ShopWarehouse } from '../lib/api';
import { CatalogPicker } from './catalog-picker';

export type InventoryValues = {
  partCatalogItemId: string; warehouseId:string; brand: string; sku: string; oemNumber: string;
  compatibility: string; condition: string; price: string; currency: string;
  quantity: string; minQuantity: string; location: string; notes: string; isActive: boolean;
};
export const emptyInventory: InventoryValues = { partCatalogItemId:'',warehouseId:'',brand:'',sku:'',oemNumber:'',compatibility:'',condition:'NEW',price:'',currency:'TJS',quantity:'0',minQuantity:'0',location:'',notes:'',isActive:true };
export const valuesFrom=(i:InventoryItem):InventoryValues=>({...emptyInventory,partCatalogItemId:i.partCatalogItemId,warehouseId:i.warehouseId??'',brand:i.brand??'',sku:i.sku??'',oemNumber:i.oemNumber??'',compatibility:i.compatibility??'',condition:i.condition,price:i.price,currency:i.currency,quantity:String(i.quantity),minQuantity:String(i.minQuantity),location:i.location??'',notes:i.notes??'',isActive:i.isActive});

export function InventoryForm({initial=emptyInventory,initialImageUrl=null,onSave,editing=false}:{initial?:InventoryValues;initialImageUrl?:string|null;editing?:boolean;onSave:(v:InventoryValues,image:File|null,removeCurrentImage:boolean)=>Promise<void>}) {
  const [v,setV]=useState(initial);
  const [selected,setSelected]=useState<CatalogItem|null>(initial.partCatalogItemId?{id:initial.partCatalogItemId,name:'Текущая позиция каталога',internalCode:initial.partCatalogItemId,slug:'',category:{name:'—'},compatibilities:[]}:null);
  const [image,setImage]=useState<File|null>(null);
  const [preview,setPreview]=useState<string|null>(initialImageUrl);
  const [removeCurrentImage,setRemoveCurrentImage]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const[warehouses,setWarehouses]=useState<ShopWarehouse[]>([]);
  useEffect(()=>{getWarehouses().then(list=>{setWarehouses(list.filter(w=>w.isActive));setV(current=>current.warehouseId?current:{...current,warehouseId:list.find(w=>w.isDefault&&w.isActive)?.id??''})}).catch(()=>setError('Не удалось загрузить склады'))},[]);

  useEffect(()=>{if(!image){setPreview(removeCurrentImage?null:initialImageUrl);return}const url=URL.createObjectURL(image);setPreview(url);return()=>URL.revokeObjectURL(url)},[image,initialImageUrl,removeCurrentImage]);
  const input=(key:keyof InventoryValues,label:string,type='text')=><label className="block text-sm">{label}<input type={type} value={String(v[key])} onChange={e=>setV({...v,[key]:e.target.value})} className="mt-1 w-full rounded border border-slate-300 p-2"/></label>;
  async function submit(e:FormEvent){e.preventDefault();if(!selected){setError('Выберите позицию центрального каталога');return}setBusy(true);setError('');try{await onSave({...v,partCatalogItemId:selected.id},image,removeCurrentImage)}catch(reason){setError(reason instanceof Error?reason.message:'Не удалось сохранить товар')}finally{setBusy(false)}}
  function chooseImage(file:File|null){setError('');if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){setError('Фото должно быть JPEG, PNG или WebP размером до 5 МБ');return}setImage(file);if(file)setRemoveCurrentImage(false)}

  return <form onSubmit={submit} className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
  <h2 className="mb-2 font-semibold text-slate-900">
    Позиция центрального каталога
    <span className="ml-1 text-red-600">*</span>
  </h2>

  <p className="mb-3 text-sm text-slate-600">
    Найдите существующую запчасть или введите название для поиска.
  </p>

  <CatalogPicker
    value={selected}
    onChange={(item) => {
      setSelected(item);
      setError('');

      if (item) {
        setV((current) => ({
          ...current,
          partCatalogItemId: item.id,
        }));
      }
    }}
    readOnly={editing}
  />

  {editing && (
    <p className="mt-2 text-xs text-slate-500">
      Замена позиции каталога недоступна при редактировании товара.
    </p>
  )}
</div>
    <fieldset disabled={busy} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:col-span-2">
      <legend className="px-2 text-sm font-semibold text-slate-800">Фотография товара</legend>
      {preview?<div role="img" aria-label="Предпросмотр фотографии товара" className="h-40 w-40 rounded-xl border border-slate-200 bg-cover bg-center" style={{backgroundImage:`url("${preview}")`}}/>:<div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">Фото не добавлено</div>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImage(e.target.files?.[0]??null)} className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"/>
      <p className="text-xs text-slate-500">JPEG, PNG или WebP, не более 5 МБ. Изображение будет уменьшено максимум до 1600×1600.</p>
      {(image||initialImageUrl&&!removeCurrentImage)&&<button type="button" onClick={()=>{setImage(null);setRemoveCurrentImage(Boolean(initialImageUrl))}} className="w-fit text-sm font-medium text-red-600 hover:text-red-700">{image?'Убрать выбранное фото':'Удалить текущее фото'}</button>}
    </fieldset>
    {input('brand','Бренд')}{input('sku','Артикул')}{input('oemNumber','OEM-номер')}{input('price','Цена','number')}{input('currency','Валюта')}{!editing&&input('quantity','Начальный остаток','number')}{input('minQuantity','Минимальный остаток','number')}
    <label className="block text-sm">Склад *<select required value={v.warehouseId} onChange={e=>setV({...v,warehouseId:e.target.value})} className="mt-1 w-full rounded border p-2"><option value="">Выберите склад</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}{w.isDefault?' — основной':''}</option>)}</select></label>
    <label className="block text-sm">Устаревшее место хранения<input value={v.location} readOnly className="mt-1 w-full rounded border border-slate-300 bg-slate-100 p-2"/></label>
    <label className="block text-sm md:col-span-2">Совместимость<textarea value={v.compatibility} onChange={e=>setV({...v,compatibility:e.target.value})} maxLength={500} className="mt-1 w-full rounded border border-slate-300 p-2"/></label>
    <label className="block text-sm md:col-span-2">Заметки<textarea value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} className="mt-1 w-full rounded border border-slate-300 p-2"/></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={v.isActive} onChange={e=>setV({...v,isActive:e.target.checked})}/>Активен</label>
    {error&&<p className="text-red-700 md:col-span-2">{error}</p>}
    <button disabled={busy} className="rounded bg-blue-600 px-4 py-3 text-white disabled:opacity-60 md:col-span-2">{busy?'Сохранение и загрузка…':editing?'Сохранить изменения':'Создать товар'}</button>
  </form>
}
