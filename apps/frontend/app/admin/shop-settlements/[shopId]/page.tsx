'use client';
import { use,useCallback,useEffect,useState } from 'react';
import { ProtectedLayout } from '../../../../components/protected-layout';
import { completeShopPayout,createShopPayout,getShopFinancialBalance,getShopPayables,getShopPayouts,ShopFinancialBalance,ShopPayable,ShopPayout } from '../../../../lib/api';
export default function ShopSettlementPage({params}:{params:Promise<{shopId:string}>}){
 const{shopId}=use(params);
 const[balance,setBalance]=useState<ShopFinancialBalance|null>(null);
 const[payables,setPayables]=useState<ShopPayable[]>([]);
 const[payouts,setPayouts]=useState<ShopPayout[]>([]);
 const[selected,setSelected]=useState<string[]>([]);
 const load=useCallback(async()=>{setBalance(await getShopFinancialBalance(shopId));setPayables((await getShopPayables({shopId,onlyOutstanding:true,limit:100})).data);setPayouts(await getShopPayouts(shopId))},[shopId]);
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
 async function create(){const allocations=payables.filter(x=>selected.includes(x.id)).map(x=>({payableId:x.id,amount:Number(x.outstandingAmount)}));if(!allocations.length)return;const payout=await createShopPayout({shopId,method:'BANK_TRANSFER',allocations});if(confirm(`Выплата ${payout.number} создана. Завершить?`))await completeShopPayout(payout.id);await load()}
 return <ProtectedLayout><div className="space-y-5"><h1 className="text-3xl font-bold">Финансы магазина</h1>{balance&&<div className="grid gap-3 md:grid-cols-4">{Object.entries(balance).slice(0,4).map(([k,v])=><div className="rounded bg-white p-4" key={k}><small>{k}</small><b className="block text-xl">{v}</b></div>)}</div>}<section className="rounded bg-white p-4"><h2 className="font-bold">Обязательства</h2>{payables.map(x=><label className="flex gap-3 border-t py-2" key={x.id}><input type="checkbox" checked={selected.includes(x.id)} onChange={e=>setSelected(e.target.checked?[...selected,x.id]:selected.filter(id=>id!==x.id))}/><span>{x.customerOrder.number} / {x.sale.number} — остаток {x.outstandingAmount}</span></label>)}<button className="mt-3 rounded bg-blue-600 px-4 py-2 text-white" onClick={()=>void create()}>Создать выплату по выбранным</button></section><section><h2 className="font-bold">История выплат</h2>{payouts.map(x=><p key={x.id}>{x.number} · {x.amount} · {x.status}</p>)}</section></div></ProtectedLayout>
}
