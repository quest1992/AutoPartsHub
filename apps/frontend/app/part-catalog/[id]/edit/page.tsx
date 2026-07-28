'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../components/auth-provider';
import { PartAliasManager } from '../../../../components/part-alias-manager';
import { PartCatalogForm } from '../../../../components/part-catalog-form';
import { PartNumberManager } from '../../../../components/part-number-manager';
import { ProtectedLayout } from '../../../../components/protected-layout';
import { VehicleFitmentManager } from '../../../../components/vehicle-fitment-manager';
import {
  getPartCatalogItem,
  PartCatalogEntry,
} from '../../../../lib/api';

export default function EditPartCatalogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission, hasRole, isLoading } = useAuth();
  const [item, setItem] = useState<PartCatalogEntry | null>(null);
  const [error, setError] = useState('');
  const canManage = hasPermission('CATALOG_MANAGE');

  useEffect(() => {
    if (!canManage) return;
    void getPartCatalogItem(id)
      .then(setItem)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Не удалось загрузить позицию каталога',
        ),
      );
  }, [canManage, id]);

  return (
    <ProtectedLayout>
      {!isLoading && !canManage ? (
        <p className="rounded bg-white p-5">
          Недостаточно прав для управления каталогом.
        </p>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Редактировать деталь</h1>
          {error && <p className="mt-4 text-red-700">{error}</p>}
          {!item && !error && <p className="mt-4">Загрузка…</p>}
          {item && (
            <>
              <PartCatalogForm
                initial={item}
                onSuccess={() => router.push('/part-catalog?updated=1')}
              />
              <PartAliasManager partId={item.id} />
              <PartNumberManager partId={item.id} />
              {hasRole('SUPER_ADMIN') && <VehicleFitmentManager catalogItemId={item.id} />}
            </>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}
