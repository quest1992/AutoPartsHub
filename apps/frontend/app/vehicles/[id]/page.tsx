"use client";

import BuildRounded from "@mui/icons-material/BuildRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import GarageRounded from "@mui/icons-material/GarageRounded";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import PrecisionManufacturingRounded from "@mui/icons-material/PrecisionManufacturingRounded";
import {
  Alert,
  Box,
  Breadcrumbs,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedLayout } from "../../../components/protected-layout";
import {
  getVehicleFitment,
  getVehicleFitmentCategory,
  VehicleFitmentCategory,
  VehicleFitmentOverview,
  VehicleFitmentPart,
} from "../../../lib/api";

export default function VehiclePage() {
  const { id } = useParams<{ id: string }>();
  const [overview, setOverview] = useState<VehicleFitmentOverview | null>(null);
  const [selected, setSelected] = useState<VehicleFitmentCategory | null>(null);
  const [parts, setParts] = useState<VehicleFitmentPart[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [sort, setSort] = useState<"price" | "availability" | "shops" | "brand">("price");
  const [error, setError] = useState("");

  useEffect(() => {
    getVehicleFitment(id).then(setOverview).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!selected) return;
    getVehicleFitmentCategory(id, selected.id, { sort, limit: 100 })
      .then((result) => {
        setParts(result.parts);
        setMessage(result.message);
      })
      .catch((e) => setError(e.message));
  }, [id, selected, sort]);

  const vehicle = overview?.vehicle;
  const oemCount = overview?.categories.reduce((sum, item) => sum + item.itemsCount, 0) ?? 0;
  const analogCount = parts.reduce((sum, item) => sum + item.analogsCount, 0);
  const offerCount = parts.reduce((sum, item) => sum + item.offersCount, 0);
  const shopCount = parts.reduce((sum, item) => sum + item.shopsCount, 0);
  return (
    <ProtectedLayout>
      <Box sx={{ minHeight: "100%", bgcolor: "#f5f6f8", mx: { xs: -2, md: -4 }, my: { xs: -2, md: -4 }, p: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl" disableGutters>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/dashboard">Главная</Link>
          <Link href="/vehicles">Автомобили</Link>
          <Typography>
            {vehicle
              ? `${vehicle.vehicleModel.manufacturer.name} ${vehicle.vehicleModel.name}`
              : "Загрузка…"}
          </Typography>
        </Breadcrumbs>
        {error && <Alert severity="error">{error}</Alert>}
        {vehicle && (
          <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 2.5, border: "1px solid", borderColor: "divider", boxShadow: "0 3px 14px rgba(15,23,42,.04)" }}>
            <Typography variant="caption" color="text.secondary">ВЫБРАННАЯ МОДИФИКАЦИЯ</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: .5 }}>
              {vehicle.vehicleModel.manufacturer.name} {vehicle.vehicleModel.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              <Chip label={vehicle.generation?.name ?? vehicle.year} />
              <Chip label={vehicle.powertrainType} />
              {vehicle.trim && <Chip label={vehicle.trim} />}
              {vehicle.variant && <Chip label={vehicle.variant} />}
              <Chip
                color="success" variant="outlined"
                icon={<CheckCircleRounded />}
                label="Совместимость проверяется по OEM"
              />
            </Box>
          </Card>
        )}

        {vehicle && <Card sx={{ mb: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none" }}><Grid container>{[
          ["OEM", oemCount, <PrecisionManufacturingRounded key="oem" />],
          ["Аналоги", analogCount, <Inventory2Rounded key="analogs" />],
          ["Предложения", offerCount, <BuildRounded key="offers" />],
          ["Магазины", shopCount, <GarageRounded key="shops" />],
        ].map(([label,value,icon])=><Grid key={String(label)} size={{ xs: 6, md: 3 }} sx={{ p: 2.25, borderColor: "divider" }}><Box sx={{ display: "flex", gap: 1.5, alignItems: "center", color: "text.secondary" }}>{icon}<Box><Typography variant="caption">{label}</Typography><Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>{value}</Typography></Box></Box></Grid>)}</Grid></Card>}

        {!overview?.hasConfirmedFitments ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>
              Нет подтверждённых данных совместимости
            </Typography>
            <Typography>
              Для данной модификации ещё не загружены OEM и Fitment. Можно воспользоваться поиском детали.
            </Typography>
          </Alert>
        ) : (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Совместимые категории
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {overview.categories.map((category) => (
                <Grid key={category.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Card
                    variant={selected?.id === category.id ? "elevation" : "outlined"}
                    sx={{ height: "100%" }}
                  >
                    <CardActionArea
                      sx={{ height: "100%" }}
                      onClick={() => setSelected(category)}
                    >
                      <CardContent>
                        <CategoryRounded color="primary" />
                        <Typography sx={{ mt: 1, fontWeight: 700 }}>
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          OEM-деталей: {category.itemsCount}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {selected && (
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="h5">{selected.name}</Typography>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>Сортировка</InputLabel>
                <Select
                  value={sort}
                  label="Сортировка"
                  onChange={(event) =>
                    setSort(event.target.value as typeof sort)
                  }
                >
                  <MenuItem value="price">По цене</MenuItem>
                  <MenuItem value="availability">По наличию</MenuItem>
                  <MenuItem value="shops">По магазинам</MenuItem>
                  <MenuItem value="brand">По бренду</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {message && <Alert severity="info">{message}</Alert>}
            <Grid container spacing={2}>
              {parts.map((part) => (
                <Grid key={part.id} size={{ xs: 12, lg: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip
                        size="small"
                        color="success"
                        label="Совместимо с выбранным автомобилем"
                      />
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                        {part.categories[0]?.catalogItem.name ??
                          part.description ??
                          "Оригинальная деталь"}
                      </Typography>
                      <Typography>
                        OEM: <b>{part.displayNumber}</b> ·{" "}
                        {part.manufacturer.name}
                      </Typography>
                      <Typography color="text.secondary">
                        Найдено: {part.analogsCount} аналогов ·{" "}
                        {part.offersCount} предложений · {part.shopsCount} магазинов
                      </Typography>
                      {part.outgoingCrossReferences.length > 0 && (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                          {part.outgoingCrossReferences.map((reference) => (
                            <Chip
                              key={reference.id}
                              variant="outlined"
                              label={`${reference.partBrand?.officialName ?? reference.toOemPart?.manufacturer.name ?? "Аналог"} ${reference.externalPartNumber ?? reference.toOemPart?.displayNumber ?? ""}`}
                            />
                          ))}
                        </Box>
                      )}
                      <Box sx={{ mt: 2 }}>
                        {part.offers.map((offer) => (
                          <Box
                            key={offer.id}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                              gap: 1,
                              borderTop: "1px solid #e2e8f0",
                              py: 1,
                            }}
                          >
                            <Typography>
                              {offer.shop.name}
                              <br />
                              <small>
                                {offer.partBrand?.officialName ?? "Бренд не указан"} ·{" "}
                                {offer.externalPartNumber ??
                                  offer.sku ??
                                  offer.oemNumber ??
                                  "без артикула"}
                              </small>
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {offer.price} {offer.currency}
                            </Typography>
                            <Typography
                              color={
                                offer.availableQuantity > 0
                                  ? "success.main"
                                  : "error"
                              }
                            >
                              {offer.availableQuantity > 0
                                ? `В наличии: ${offer.availableQuantity}`
                                : "Нет в наличии"}
                            </Typography>
                          </Box>
                        ))}
                        {part.offers.length === 0 && (
                          <Typography color="text.secondary">
                            Предложений магазинов пока нет.
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container></Box>
    </ProtectedLayout>
  );
}
