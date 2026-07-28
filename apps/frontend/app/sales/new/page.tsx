'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedLayout } from '../../../components/protected-layout';
import { StockDocumentForm } from '../../../components/stock-document-form';
import { useAuth } from '../../../components/auth-provider';
function Content(){const params=useSearchParams();const{hasPermission,isLoading}=useAuth();const allowed=hasPermission('SALES_CREATE');return <ProtectedLayout>{!isLoading&&!allowed?<p className="rounded bg-white p-5">Недостаточно прав для создания продажи.</p>:allowed&&<><h1 className="text-2xl font-bold">Новая продажа</h1><p className="mt-1 text-slate-500">Выберите товары со склада и укажите данные клиента.</p><StockDocumentForm kind="sale" initialInventoryItemId={params.get('inventoryItem')}/></>}</ProtectedLayout>}
export default function Page(){return <Suspense fallback={<p>Загрузка…</p>}><Content/></Suspense>}
