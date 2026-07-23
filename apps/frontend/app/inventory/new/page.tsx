"use client";
import { useRouter } from "next/navigation";
import {
  InventoryForm,
  InventoryValues,
} from "../../../components/inventory-form";
import { ProtectedLayout } from "../../../components/protected-layout";
import { createInventory, uploadInventoryImage } from "../../../lib/api";
export default function NewInventoryPage() {
  const router = useRouter();
  async function save(v: InventoryValues, image: File | null) {
    const item = await createInventory({
      partCatalogItemId: v.partCatalogItemId,
      brand: v.brand || undefined,
      sku: v.sku || undefined,
      oemNumber: v.oemNumber || undefined,
      compatibility: v.compatibility.trim() || null,
      condition: v.condition,
      price: Number(v.price),
      currency: v.currency,
      quantity: Number(v.quantity),
      minQuantity: Number(v.minQuantity),
      location: v.location.trim() || null,
      notes: v.notes || undefined,
      isActive: v.isActive,
    });
    if (image)
      try {
        await uploadInventoryImage(item.id, image);
      } catch (reason) {
        throw new Error(
          `Товар создан, но фото не загружено. ${reason instanceof Error ? reason.message : ""}`,
        );
      }
    alert("Товар успешно создан");
    router.replace("/inventory");
  }
  return (
    <ProtectedLayout>
      <h1 className="mb-6 text-2xl font-bold">Добавить товар</h1>
      <InventoryForm onSave={save} />
    </ProtectedLayout>
  );
}
