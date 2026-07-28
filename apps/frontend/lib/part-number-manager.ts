export function partNumberManufacturerValue(item: {
  manufacturer: { id: string } | null;
}) {
  return item.manufacturer?.id ?? '';
}
