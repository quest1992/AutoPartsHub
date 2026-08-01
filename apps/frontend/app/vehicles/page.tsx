"use client";

import DirectionsCarRounded from "@mui/icons-material/DirectionsCarRounded";
import PrecisionManufacturingRounded from "@mui/icons-material/PrecisionManufacturingRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProtectedLayout } from "../../components/protected-layout";
import { VehicleQuickSearch } from "../../components/vehicle-quick-search";
import {
  getVehicleCatalogModel,
  getVehicleCatalogModels,
  getVehicleManufacturers,
  VehicleCatalogManufacturer,
  VehicleCatalogModel,
  VehicleCatalogSpecification,
  VehicleQuickSearchResult,
} from "../../lib/api";

const years = (from: number | null, to: number | null) =>
  from ? `${from}–${to ?? "н.в."}` : "Годы не указаны";
const specName = (s: VehicleCatalogSpecification) =>
  [
    s.year,
    s.trim,
    s.variant,
    s.batteryGrossKwh && `${s.batteryGrossKwh} kWh`,
    s.driveType,
  ]
    .filter(Boolean)
    .join(" · ");
const panelSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  boxShadow: "0 3px 14px rgba(15,23,42,.04)",
  bgcolor: "background.paper",
};

export default function VehiclesPage() {
  const router = useRouter();
  const [manufacturerQuery, setManufacturerQuery] = useState("");
  const [manufacturers, setManufacturers] = useState<
    VehicleCatalogManufacturer[]
  >([]);
  const [manufacturerTotal, setManufacturerTotal] = useState<number | null>(
    null,
  );
  const [manufacturer, setManufacturer] =
    useState<VehicleCatalogManufacturer | null>(null);
  const [models, setModels] = useState<VehicleCatalogModel[]>([]);
  const [modelsTotal, setModelsTotal] = useState<number | null>(null);
  const [model, setModel] = useState<VehicleCatalogModel | null>(null);
  const [generationId, setGenerationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      getVehicleManufacturers(manufacturerQuery, 1, 100, controller.signal)
        .then((r) => {
          setManufacturers(r.data);
          setManufacturerTotal(r.meta.total);
        })
        .catch((e) => {
          if (e?.name !== "AbortError")
            setError(
              e instanceof Error
                ? e.message
                : "Не удалось загрузить производителей",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [manufacturerQuery]);
  useEffect(() => {
    if (!manufacturer) return;
    getVehicleCatalogModels(manufacturer.id)
      .then((r) => {
        setModels(r.data);
        setModelsTotal(r.meta.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setModelLoading(false));
  }, [manufacturer]);
  const specifications = useMemo(
    () =>
      model?.specifications.filter(
        (s) => !generationId || s.generationId === generationId,
      ) ?? [],
    [model, generationId],
  );
  async function chooseModel(value: VehicleCatalogModel | null) {
    setError("");
    if (!value) {
      setModel(null);
      setGenerationId("");
      return;
    }
    setModelLoading(true);
    try {
      const full = await getVehicleCatalogModel(value.id);
      setModel(full);
      setGenerationId(
        full.generations.length === 1 ? full.generations[0].id : "",
      );
      if (full.generations.length === 0 && full.specifications.length === 1)
        router.push(`/vehicles/${full.specifications[0].id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить модель");
    } finally {
      setModelLoading(false);
    }
  }
  async function chooseQuick(value: VehicleQuickSearchResult) {
    setError("");
    if (value.specificationId) {
      router.push(`/vehicles/${value.specificationId}`);
      return;
    }
    const full = await getVehicleCatalogModel(value.modelId);
    setModel(full);
    setGenerationId(
      full.generations.length === 1 ? full.generations[0].id : "",
    );
    if (full.specifications.length === 1)
      router.push(`/vehicles/${full.specifications[0].id}`);
    else if (full.specifications.length > 1)
      setError(
        "Для этой модели найдено несколько модификаций. Выберите нужную.",
      );
    else
      setError(
        "Для этой модели пока нет подтверждённых заводских спецификаций.",
      );
  }
  return (
    <ProtectedLayout>
      <Box
        sx={{
          minHeight: "100%",
          bgcolor: "#f5f6f8",
          mx: { xs: -2, md: -4 },
          my: { xs: -2, md: -4 },
          p: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Box
            component="header"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 3,
              flexDirection: { xs: "column", md: "row" },
              mb: 3,
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "center" }}
              >
                <DirectionsCarRounded color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Подбор автомобиля
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75 }}
              >
                Выберите автомобиль или воспользуйтесь быстрым поиском.
              </Typography>
            </Box>
            <Stack
              direction="row"
              divider={<Divider orientation="vertical" flexItem />}
              spacing={{ xs: 1.5, sm: 3 }}
              sx={{
                bgcolor: "white",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                px: 2.5,
                py: 1.5,
              }}
            >
              {[
                ["Производителей", manufacturerTotal],
                ["Моделей", modelsTotal],
                ["Спецификаций", model?.specifications.length ?? null],
              ].map(([label, value]) => (
                <Box key={String(label)}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {value ?? "—"}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          {error && (
            <Alert severity="info" onClose={() => setError("")} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0,1fr)" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Stack
              component="aside"
              spacing={2.5}
              sx={{
                ...panelSx,
                p: 2.5,
                position: { lg: "sticky" },
                top: { lg: 20 },
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Быстрый поиск
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Марка, модель или альтернативное название
                </Typography>
                <VehicleQuickSearch
                  onSelect={(value) => void chooseQuick(value)}
                />
              </Box>
              <Divider />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Выбор автомобиля
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Последовательно уточните автомобиль
                </Typography>
              </Box>
              {loading && !manufacturers.length ? (
                <Skeleton variant="rounded" height={56} />
              ) : (
                <Autocomplete
                  options={manufacturers}
                  filterOptions={(options) => options}
                  loading={loading}
                  loadingText="Загрузка производителей…"
                  noOptionsText="Производители не найдены"
                  value={manufacturer}
                  groupBy={(option) =>
                    option.priorityGroup === "POPULAR_EV"
                      ? "⭐ Популярные электромобили"
                      : "Другие производители"
                  }
                  getOptionLabel={(x) => x.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onInputChange={(_, v, reason) => {
                    if (reason !== "reset") setManufacturerQuery(v);
                  }}
                  onChange={(_, v) => {
                    setManufacturer(v);
                    setModel(null);
                    setModels([]);
                    setGenerationId("");
                  }}
                  renderInput={(p) => (
                    <TextField
                      {...p}
                      label="Производитель"
                      slotProps={{
                        ...p.slotProps,
                        input: {
                          ...p.slotProps.input,
                          endAdornment: (
                            <>
                              {loading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {p.slotProps.input.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              )}
              {modelLoading && manufacturer && !models.length ? (
                <Skeleton variant="rounded" height={56} />
              ) : (
                <Autocomplete
                  options={models}
                  disabled={!manufacturer}
                  value={model}
                  getOptionLabel={(x) => x.name}
                  onChange={(_, v) => void chooseModel(v)}
                  renderInput={(p) => <TextField {...p} label="Модель" />}
                />
              )}
              <Autocomplete
                options={model?.generations ?? []}
                disabled={!model || !model.generations.length}
                value={
                  model?.generations.find((g) => g.id === generationId) ?? null
                }
                getOptionLabel={(g) =>
                  `${g.name} · ${years(g.startYear, g.endYear)}`
                }
                onChange={(_, v) => setGenerationId(v?.id ?? "")}
                renderInput={(p) => <TextField {...p} label="Поколение" />}
              />
              <Autocomplete
                options={specifications}
                disabled={!model || !specifications.length}
                getOptionLabel={specName}
                onChange={(_, v) => v && router.push(`/vehicles/${v.id}`)}
                renderInput={(p) => <TextField {...p} label="Комплектация" />}
              />
            </Stack>
            <Box component="main">
              {!modelLoading && !model && (
                <Card
                  sx={{
                    ...panelSx,
                    minHeight: 420,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    p: 4,
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        bgcolor: "action.hover",
                        display: "grid",
                        placeItems: "center",
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <DirectionsCarRounded
                        sx={{ fontSize: 36, color: "text.secondary" }}
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Автомобиль не выбран
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 1, maxWidth: 420 }}
                    >
                      Выберите автомобиль слева
                      <br />
                      или воспользуйтесь быстрым поиском.
                    </Typography>
                  </Box>
                </Card>
              )}
              {modelLoading && (
                <Stack spacing={2}>
                  <Skeleton variant="rounded" height={180} />
                  <Skeleton variant="rounded" height={220} />
                </Stack>
              )}
              {!modelLoading && model && (
                <Stack spacing={2.5}>
                  <Breadcrumbs>
                    <Link href="/dashboard">Главная</Link>
                    <Typography color="text.secondary">Автомобили</Typography>
                    <Typography color="text.secondary">
                      {model.manufacturer?.name ?? manufacturer?.name}
                    </Typography>
                    <Typography>{model.name}</Typography>
                  </Breadcrumbs>
                  <Card sx={{ ...panelSx, p: { xs: 2.5, md: 3 } }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      sx={{ justifyContent: "space-between", gap: 2 }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          ВЫБРАННЫЙ АВТОМОБИЛЬ
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mt: 0.5 }}
                        >
                          {model.manufacturer?.name ?? manufacturer?.name}{" "}
                          {model.name}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                          {model.exportName && model.exportName !== model.name
                            ? `Экспортное название: ${model.exportName}`
                            : "Каталог модификаций и совместимых деталей"}
                        </Typography>
                      </Box>
                      <PrecisionManufacturingRounded
                        sx={{ fontSize: 42, color: "primary.main" }}
                      />
                    </Stack>
                    <Divider sx={{ my: 2.5 }} />
                    <Grid container spacing={2}>
                      {[
                        [
                          "Марка",
                          model.manufacturer?.name ?? manufacturer?.name,
                        ],
                        ["Модель", model.name],
                        [
                          "Поколение",
                          model.generations.find((g) => g.id === generationId)
                            ?.name ?? "Не выбрано",
                        ],
                        ["Тип двигателя", model.powertrainType ?? "Не указан"],
                        ["Годы выпуска", years(model.startYear, model.endYear)],
                      ].map(([l, v]) => (
                        <Grid key={l} size={{ xs: 6, md: 2.4 }}>
                          <Typography variant="caption" color="text.secondary">
                            {l}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {v}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Card>
                  <Card sx={{ ...panelSx, p: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Доступные комплектации
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Выберите точную модификацию для перехода к OEM-каталогу.
                    </Typography>
                    {specifications.length ? (
                      <Grid container spacing={1.5}>
                        {specifications.map((s) => (
                          <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                              variant="outlined"
                              sx={{ height: "100%", borderRadius: 2.5 }}
                            >
                              <CardActionArea
                                onClick={() => router.push(`/vehicles/${s.id}`)}
                                sx={{ height: "100%", p: 0.5 }}
                              >
                                <CardContent>
                                  <Typography sx={{ fontWeight: 700 }}>
                                    {specName(s)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.75 }}
                                  >
                                    {s.powertrainType}
                                  </Typography>
                                </CardContent>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Alert severity="info">
                        Для этой модели пока нет подтверждённых заводских
                        спецификаций.
                      </Alert>
                    )}
                  </Card>
                  {specifications.length === 1 && (
                    <Box>
                      <Button
                        variant="contained"
                        onClick={() =>
                          router.push(`/vehicles/${specifications[0].id}`)
                        }
                      >
                        Открыть EPC-каталог
                      </Button>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </ProtectedLayout>
  );
}
