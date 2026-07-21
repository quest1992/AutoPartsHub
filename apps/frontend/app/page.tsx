'use client';
import { useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { useAuth } from '../components/auth-provider';
export default function Home(){const{isLoading,isAuthenticated}=useAuth();const router=useRouter();useEffect(()=>{if(!isLoading)router.replace(isAuthenticated?'/dashboard':'/login')},[isLoading,isAuthenticated,router]);return <main className="p-6">Загрузка…</main>}
