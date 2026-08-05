"use client";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { listOem, OemPart } from "../lib/oem-api";
export type OemChoice = Pick<OemPart, "id" | "displayNumber" | "manufacturer">;
export function OemPicker({
  catalogItemId,
  value,
  onChange,
  disabled = false,
}: {
  catalogItemId: string;
  value: OemChoice | null;
  onChange: (value: OemChoice | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(value?.displayNumber ?? "");
  const [options, setOptions] = useState<OemChoice[]>(value ? [value] : []);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const search = query.trim();
    if (!catalogItemId || search.length < 2) return;
    const timer = setTimeout(() => {
      setLoading(true);
      listOem({ search, catalogItemId, limit: 20 })
        .then((response) => setOptions(response.data))
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [catalogItemId, query]);
  return (
    <Autocomplete
      options={options}
      value={value}
      loading={loading}
      disabled={disabled || !catalogItemId}
      filterOptions={(items) => items}
      getOptionLabel={(item) =>
        `${item.displayNumber} · ${item.manufacturer.name}`
      }
      isOptionEqualToValue={(left, right) => left.id === right.id}
      onInputChange={(_, next, reason) => {
        if (reason !== "reset") setQuery(next);
      }}
      onChange={(_, next) => onChange(next)}
      noOptionsText="Проверенный OEM не найден"
      renderInput={(params) => (
        <TextField
          {...params}
          label="Проверенный OEM из базы (необязательно)"
          helperText={
            catalogItemId
              ? "Выберите запись, чтобы товар появился в подтверждённом подборе по автомобилю."
              : "Сначала выберите позицию центрального каталога."
          }
        />
      )}
    />
  );
}
