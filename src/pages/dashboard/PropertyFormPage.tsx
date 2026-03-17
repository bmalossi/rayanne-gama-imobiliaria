import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProperty } from "@/modules/properties/hooks/useProperties";
import * as propertyService from "@/modules/properties/services/property.service";

const FEATURE_GROUPS: Array<{ group: string; items: string[] }> = [
  {
    group: "Bem estar e Comodidade",
    items: [
      "Adega",
      "Ambientes Integrados",
      "Aquário",
      "Aquecedor",
      "Ar condicionado",
      "Arandelas",
      "Armário de Cozinha",
      "Armário Embutido",
      "Armário no Banheiro",
      "Banheira",
      "Box Blindex",
      "Churrasqueira na Sacada",
      "Churrasqueira na Varanda",
      "Closet",
      "Copa",
      "Cozinha Americana",
      "Cozinha Gourmet",
      "Cozinha Grande",
      "Demi-suíte",
      "Escritório",
      "Fechadura Digital",
      "Frente para o mar",
      "Hidromassagem",
      "Home Office",
      "Janela Panorâmica",
      "Jardim de Inverno",
      "Lareira",
      "Lavabo",
      "Lavanderia",
      "Mobiliado",
      "Móveis Planejados",
      "Ofurô",
      "Pé Direito Duplo",
      "Quintal",
      "Sacada",
      "Sacada Fechada com Vidro",
      "Sacada Gourmet",
      "Sala de jantar",
      "Sala Grande",
      "Semimobiliado",
      "Smart Home",
      "Solarium",
      "Varanda",
      "Varanda Fechada com Vidro",
      "Varanda Gourmet",
      "Vista Panorâmica",
      "Vista para a Montanha",
      "Vista para o Lago",
      "Vista para o Mar",
    ],
  },
  {
    group: "Segurança",
    items: [
      "Alarme",
      "Câmera de Segurança",
      "Cerca",
      "Circuito de Segurança",
      "Guarita",
      "Guarita Blindada",
      "Interfone",
      "Muro de Vidro",
      "Muros e Grades",
      "Portão Eletrônico",
      "Portaria",
      "Portaria 24hs",
      "Ronda 24hs",
    ],
  },
  {
    group: "Lazer e Natureza",
    items: [
      "Academia",
      "Aceita Pet",
      "Área de Lazer",
      "Árvore Frutífera",
      "Arvorismo",
      "Bar",
      "Bar na Piscina",
      "Beauty Care",
      "Biblioteca",
      "Campo de Futebol",
      "Campo de Golfe",
      "Centro de Estética",
      "Children Care",
      "Churrasqueira",
      "Churrasqueira à Carvão",
      "Churrasqueira à Gás",
      "Churrasqueira Ecológica",
      "Cinema",
      "Deck",
      "Deck Molhado",
      "Espaço Crossfit",
      "Espaço Fitness",
      "Espaço Gourmet",
      "Espaço Pet",
      "Espaço Teen",
      "Espaço Verde/Parque",
      "Espaço Yoga",
      "Espaço Zen",
      "Horta",
      "Jacuzzi",
      "Jardim",
      "Lago",
      "Mini Quadra",
      "Minimercado",
      "Muro de Escalada",
      "Orquidário",
      "Piscina",
      "Piscina Climatizada",
      "Piscina Coberta",
      "Piscina Infantil",
      "Piscina Olímpica",
      "Piscina para Adulto",
      "Piscina Privativa",
      "Piscina Semiolímpica",
      "Pista de Cooper",
      "Pista de Skate",
      "Playground",
      "Pomar",
      "Praça",
      "Pub",
      "Quadra de Beach Tennis",
      "Quadra de Futebol",
      "Quadra de Futevôlei",
      "Quadra de Squash",
      "Quadra de Tênis",
      "Quadra de Vôlei de Praia",
      "Quadra Poliesportiva",
      "Sala de Massagem",
      "Salão de Festas",
      "Salão de Jogos",
      "Sauna",
      "Spa",
      "Surf Indoor",
    ],
  },
  {
    group: "Infraestrutura",
    items: [
      "Acessibilidade",
      "Área de Serviço",
      "Balaústre",
      "Bicicletário",
      "Canil",
      "Carregador de Carro Elétrico",
      "Chuveiro a Gás",
      "Coffee Shop",
      "Coleta Seletiva de Lixo",
      "Condomínio Inteligente",
      "Condomínio Sustentável",
      "Coworking",
      "Dependência Empregada",
      "Depósito",
      "Despensa",
      "Edícula",
      "Elevador",
      "Elevador de Emergência",
      "Energia Solar",
      "Esquina",
      "Estacionamento Visitantes",
      "Forno de Pizza",
      "Garagem",
      "Garagem Coberta",
      "Garagem Coletiva",
      "Garagem Demarcada",
      "Gás Encanado",
      "Gerador",
      "Guarda Volumes",
      "Hall de Entrada",
      "Heliponto",
      "Isolamento Acústico",
      "Isolamento Térmico",
      "Louceiro",
      "Manobrista",
      "Marina",
      "Mini Golf",
      "Pista de Atletismo",
      "Pista de Pouso",
      "Rampas",
      "Sala de Reunião",
      "Salão de Convenção",
      "TV a Cabo",
      "Vestiário",
      "Wi-Fi",
    ],
  },
  {
    group: "Acabamento",
    items: [
      "Carpete",
      "Cerâmica",
      "Cimento Queimado",
      "Drywall",
      "Gesso",
      "Granito",
      "Janela de Alumínio",
      "Laje",
      "Mármore",
      "Papel de Parede",
      "Piso de Madeira",
      "Piso Elevado",
      "Piso Laminado",
      "Piso Vinílico",
      "Platibanda",
      "Porcelanato",
      "Sanca",
      "Teto rebaixado",
    ],
  },
];

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().min(0).optional());

const requiredNumber = z.preprocess((value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().min(0, "Valor inválido"));

const ADDRESS_VISIBILITY_OPTIONS = ["endereco_completo", "bairro_cidade", "somente_cidade"] as const;
type AddressVisibilityOption = (typeof ADDRESS_VISIBILITY_OPTIONS)[number];

const schema = z.object({
  title: z.string().trim().min(3, "Informe o título"),
  type: z.string().min(1, "Selecione o tipo"),
  transaction: z.string().min(1, "Selecione a transação"),
  price: requiredNumber,
  bedrooms: requiredNumber,
  livingRooms: optionalNumber,
  suites: optionalNumber,
  bathrooms: requiredNumber,
  parking: optionalNumber,
  areaUseful: optionalNumber,
  areaTotal: optionalNumber,
  areaBuilt: optionalNumber,
  landWidth: optionalNumber,
  landLength: optionalNumber,
  street: z.string().trim().min(3, "Informe o endereço"),
  number: z.string().trim().min(1, "Informe o número/lote"),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro"),
  city: z.string().trim().min(2, "Informe a cidade"),
  state: z.string().trim().min(2, "Informe a UF"),
  cep: z.string().trim().min(8, "CEP inválido"),
  addressVisibility: z.enum(ADDRESS_VISIBILITY_OPTIONS).default("endereco_completo"),
  ownerKeys: z.string().trim().optional(),
  propertyCondition: z.string().trim().optional(),
  renovationStage: z.string().trim().optional(),
  constructionStage: z.string().trim().optional(),
  occupationStatus: z.string().trim().optional(),
  iptuMode: z.string().trim().optional(),
  iptuValue: optionalNumber,
  condominiumValue: optionalNumber,
  financingTypes: z.array(z.string()).default([]),
  mcmvEligible: z.boolean().default(false),
  acceptsExchange: z.boolean().default(false),
  exchangeVehicleValue: optionalNumber,
  exchangePropertyValue: optionalNumber,
  acceptsOtherAsset: z.boolean().default(false),
  otherAssetDescription: z.string().trim().optional(),
  otherAssetValue: optionalNumber,
  prospectors: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;
type NewImage = { file: File; preview: string };

const selectOptions = {
  propertyCondition: ["Novo", "Usado", "Reformado", "Em construção", "Necessita reforma"],
  renovationStage: ["Sem reforma", "Reforma inicial", "Reforma intermediária", "Reforma avançada", "Reforma concluída"],
  constructionStage: ["Não se aplica", "Projeto", "Fundação", "Estrutura", "Acabamento", "Concluída"],
  occupationStatus: ["Desocupado", "Ocupado pelo proprietário", "Ocupado por inquilino", "Temporada", "Em negociação"],
  iptuMode: ["Mensal", "Anual", "Não informado"],
};

function formatCurrency(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getAddressVisibilityLabel(value: AddressVisibilityOption) {
  if (value === "bairro_cidade") return "Somente bairro e cidade";
  if (value === "somente_cidade") return "Somente cidade";
  return "Endereço completo";
}

function mapAddressVisibilityLabelToValue(label?: string): AddressVisibilityOption {
  if (label === "Somente bairro e cidade") return "bairro_cidade";
  if (label === "Somente cidade") return "somente_cidade";
  return "endereco_completo";
}

function parseStoredDescription(description: string | null) {
  if (!description) return { summary: "", detailsMap: {} as Record<string, string> };

  const [summaryPart, detailsPart] = description.split("--- Informações detalhadas ---");
  const detailsMap = (detailsPart ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [label, ...rest] = line.split(":");
      if (!label?.trim()) return acc;
      acc[label.trim()] = rest.join(":").trim();
      return acc;
    }, {});

  return { summary: (summaryPart ?? "").trim(), detailsMap };
}

function buildDetailedDescription(values: FormValues) {
  const descriptionLines: string[] = [];

  if (values.notes) {
    descriptionLines.push(values.notes);
  }

  descriptionLines.push("", "--- Informações detalhadas ---");
  descriptionLines.push(`Salas: ${values.livingRooms ?? "Não informado"}`);
  descriptionLines.push(`Suítes: ${values.suites ?? "Não informado"}`);
  descriptionLines.push(`Área útil (m²): ${values.areaUseful ?? "Não informado"}`);
  descriptionLines.push(`Área total (m²): ${values.areaTotal ?? "Não informado"}`);
  descriptionLines.push(`Área construída (m²): ${values.areaBuilt ?? "Não informado"}`);
  descriptionLines.push(`Largura do terreno (m): ${values.landWidth ?? "Não informado"}`);
  descriptionLines.push(`Comprimento do terreno (m): ${values.landLength ?? "Não informado"}`);
  descriptionLines.push(`Complemento: ${values.complement || "Não informado"}`);
  descriptionLines.push(`Exibição pública do endereço: ${getAddressVisibilityLabel(values.addressVisibility)}`);
  descriptionLines.push(`Condição do imóvel: ${values.propertyCondition || "Não informado"}`);
  descriptionLines.push(`Estágio da reforma: ${values.renovationStage || "Não informado"}`);
  descriptionLines.push(`Estágio da obra: ${values.constructionStage || "Não informado"}`);
  descriptionLines.push(`Ocupação do imóvel: ${values.occupationStatus || "Não informado"}`);
  descriptionLines.push(`Modo do IPTU: ${values.iptuMode || "Não informado"}`);
  descriptionLines.push(`Valor IPTU/ITR: ${formatCurrency(values.iptuValue)}`);
  descriptionLines.push(`Valor condomínio: ${formatCurrency(values.condominiumValue)}`);
  descriptionLines.push(`Aceita financiamento: ${values.financingTypes.length ? values.financingTypes.join(", ") : "Não"}`);
  descriptionLines.push(`Minha Casa Minha Vida: ${values.mcmvEligible ? "Sim" : "Não"}`);
  descriptionLines.push(`Aceita permuta: ${values.acceptsExchange ? "Sim" : "Não"}`);
  descriptionLines.push(`Valor do veículo na troca: ${formatCurrency(values.exchangeVehicleValue)}`);
  descriptionLines.push(`Valor do imóvel na troca: ${formatCurrency(values.exchangePropertyValue)}`);
  descriptionLines.push(`Aceita outro bem: ${values.acceptsOtherAsset ? "Sim" : "Não"}`);
  descriptionLines.push(`Outro bem: ${values.otherAssetDescription || "Não informado"}`);
  descriptionLines.push(`Valor de outro bem: ${formatCurrency(values.otherAssetValue)}`);
  descriptionLines.push(`Captadores: ${values.prospectors || "Não informado"}`);

  return descriptionLines.join("\n").trim();
}

const PropertyFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      type: "",
      transaction: "",
      price: undefined,
      bedrooms: undefined,
      livingRooms: undefined,
      suites: undefined,
      bathrooms: undefined,
      parking: undefined,
      areaUseful: undefined,
      areaTotal: undefined,
      areaBuilt: undefined,
      landWidth: undefined,
      landLength: undefined,
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
      addressVisibility: "endereco_completo",
      ownerKeys: "",
      propertyCondition: "",
      renovationStage: "",
      constructionStage: "",
      occupationStatus: "",
      iptuMode: "",
      iptuValue: undefined,
      condominiumValue: undefined,
      financingTypes: [],
      mcmvEligible: false,
      acceptsExchange: false,
      exchangeVehicleValue: undefined,
      exchangePropertyValue: undefined,
      acceptsOtherAsset: false,
      otherAssetDescription: "",
      otherAssetValue: undefined,
      prospectors: "",
      notes: "",
      features: [],
      active: true,
    },
  });

  const { data: property, isLoading } = useProperty(id!);

  const { data: privateDetails, isLoading: isPrivateLoading } = useQuery({
    queryKey: ["dashboard-property-private", id],
    queryFn: () => propertyService.fetchPropertyPrivateDetails(id!),
    enabled: Boolean(id),
  });

  // State to track if the initial load for the current ID has happened
  const [lastResetId, setLastResetId] = useState<string | null>(null);

  useEffect(() => {
    if (!property) return;

    // Only reset form if it's the first time loading THIS property ID
    // This prevents form.reset from being called on every window focus/refetch
    if (lastResetId === property.id) return;

    const parsedDescription = parseStoredDescription(property.description ?? null);

    form.reset({
      title: property.title,
      type: property.type,
      transaction: property.transaction,
      price: Number(property.price),
      bedrooms: property.bedrooms,
      livingRooms: property.living_rooms || undefined,
      suites: property.suites || undefined,
      bathrooms: property.bathrooms,
      parking: property.parking || undefined,
      areaUseful: Number(property.area ?? 0) || undefined,
      areaTotal: Number(property.area_total ?? 0) || undefined,
      areaBuilt: Number(property.area_built ?? 0) || undefined,
      landWidth: Number(property.land_width ?? 0) || undefined,
      landLength: Number(property.land_length ?? 0) || undefined,
      street: property.street ?? "",
      number: property.number ?? "",
      complement: parsedDescription.detailsMap["Complemento"] === "Não informado" ? "" : (parsedDescription.detailsMap["Complemento"] ?? ""),
      neighborhood: property.neighborhood ?? "",
      city: property.city ?? "",
      state: property.state ?? "",
      cep: property.cep ?? "",
      addressVisibility: property.address_visibility as any || "endereco_completo",
      ownerKeys: privateDetails?.owner_keys ?? "",
      propertyCondition: property.property_condition || "",
      renovationStage: property.renovation_stage || "",
      constructionStage: property.construction_stage || "",
      occupationStatus: property.occupation_status || "",
      iptuMode: property.iptu_mode || "",
      iptuValue: property.iptu_value ? Number(property.iptu_value) : undefined,
      condominiumValue: property.condominium_value ? Number(property.condominium_value) : undefined,
      financingTypes: property.financing_types || [],
      mcmvEligible: property.mcmv_eligible || false,
      acceptsExchange: property.accepts_exchange || false,
      exchangeVehicleValue: property.exchange_vehicle_value ? Number(property.exchange_vehicle_value) : undefined,
      exchangePropertyValue: property.exchange_property_value ? Number(property.exchange_property_value) : undefined,
      acceptsOtherAsset: property.accepts_other_asset || false,
      otherAssetDescription: property.other_asset_description || "",
      otherAssetValue: property.other_asset_value ? Number(property.other_asset_value) : undefined,
      prospectors: property.prospectors || "",
      notes: property.notes || parsedDescription.summary,
      features: Array.isArray(property.features) ? property.features : [],
      active: property.active,
    });
    setExistingImages(property.images ?? []);
    setLastResetId(property.id);
  }, [property, privateDetails, form, lastResetId]);

  useEffect(
    () => () => {
      newImages.forEach((image) => URL.revokeObjectURL(image.preview));
    },
    [newImages],
  );

  const totalImages = useMemo(() => existingImages.length + newImages.length, [existingImages.length, newImages.length]);
  const selectedFeatures = form.watch("features");
  const financingTypes = form.watch("financingTypes");
  const acceptsExchange = form.watch("acceptsExchange");
  const acceptsOtherAsset = form.watch("acceptsOtherAsset");

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const parsedValues = schema.parse(values);
      const payload: propertyService.PropertyPayload = {
        title: parsedValues.title,
        description: buildDetailedDescription(parsedValues),
        type: parsedValues.type,
        transaction: parsedValues.transaction,
        price: parsedValues.price,
        area: parsedValues.areaUseful,
        areaTotal: parsedValues.areaTotal,
        areaBuilt: parsedValues.areaBuilt,
        landWidth: parsedValues.landWidth,
        landLength: parsedValues.landLength,
        bedrooms: parsedValues.bedrooms,
        livingRooms: parsedValues.livingRooms,
        suites: parsedValues.suites,
        bathrooms: parsedValues.bathrooms,
        parking: parsedValues.parking ?? 0,
        street: parsedValues.street,
        number: parsedValues.number,
        neighborhood: parsedValues.neighborhood,
        city: parsedValues.city,
        state: parsedValues.state,
        cep: parsedValues.cep,
        addressVisibility: parsedValues.addressVisibility,
        propertyCondition: parsedValues.propertyCondition,
        renovationStage: parsedValues.renovationStage,
        constructionStage: parsedValues.constructionStage,
        occupationStatus: parsedValues.occupationStatus,
        iptuMode: parsedValues.iptuMode,
        iptuValue: parsedValues.iptuValue,
        condominiumValue: parsedValues.condominiumValue,
        financingTypes: parsedValues.financingTypes,
        mcmvEligible: parsedValues.mcmvEligible,
        acceptsExchange: parsedValues.acceptsExchange,
        exchangeVehicleValue: parsedValues.exchangeVehicleValue,
        exchangePropertyValue: parsedValues.exchangePropertyValue,
        acceptsOtherAsset: parsedValues.acceptsOtherAsset,
        otherAssetDescription: parsedValues.otherAssetDescription,
        otherAssetValue: parsedValues.otherAssetValue,
        prospectors: parsedValues.prospectors,
        notes: parsedValues.notes,
        features: parsedValues.features,
        active: parsedValues.active,
        existingImages,
        newImages: newImages.map((item) => item.file),
      };

      const savedProperty = isEditing && id
        ? await propertyService.updateProperty(user!.id, id, payload, property?.images ?? [])
        : await propertyService.createProperty(user!.id, payload, profile?.display_name || profile?.full_name || null);

      await propertyService.upsertPropertyPrivateDetails(savedProperty.id, savedProperty.agent_id, parsedValues.ownerKeys || null);
      return isEditing ? "update" : "create";
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-property-private", id] });
      toast({ title: action === "create" ? "Imóvel cadastrado com sucesso!" : "Imóvel atualizado com sucesso!" });
      navigate("/dashboard/imoveis");
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar imóvel", description: error.message, variant: "destructive" });
    },
  });

  const handlePickImages = (files: FileList | null) => {
    if (!files) return;

    const chosen = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (totalImages + chosen.length > 10) {
      toast({ title: "Limite atingido", description: "Você pode enviar até 10 imagens por imóvel.", variant: "destructive" });
      return;
    }

    const mapped = chosen.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages((prev) => [...prev, ...mapped]);
  };

  if (isEditing && (isLoading || isPrivateLoading)) {
    return (
      <main className="p-6">
        <p className="gold-label">Carregando imóvel...</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <p className="gold-label">{isEditing ? "Atualização" : "Cadastro"}</p>
        <h1 className="mt-1 text-4xl">{isEditing ? "Editar imóvel" : "Novo imóvel"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Preencha cada seção com os dados completos do imóvel para um cadastro detalhado.</p>
      </section>

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Dados principais do imóvel</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="title">Título do anúncio *</Label>
              <Input id="title" placeholder="Ex.: Casa térrea com piscina no centro" {...form.register("title")} />
              <p className="text-xs text-muted-foreground">Descreva o imóvel de forma objetiva para facilitar a busca.</p>
              <p className="text-xs text-destructive">{form.formState.errors.title?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartamento">Apartamento</SelectItem>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Terreno">Terreno</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Cobertura">Cobertura</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-destructive">{form.formState.errors.type?.message}</p>
            </div>

            <div className="space-y-1">
              <Label>Transação *</Label>
              <Controller
                name="transaction"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a transação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Venda">Venda</SelectItem>
                      <SelectItem value="Aluguel">Aluguel</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-destructive">{form.formState.errors.transaction?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" placeholder="Ex.: 850000" {...form.register("price")} />
              <p className="text-xs text-destructive">{form.formState.errors.price?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bedrooms">Quartos *</Label>
              <Input id="bedrooms" type="number" placeholder="Ex.: 3" {...form.register("bedrooms")} />
              <p className="text-xs text-destructive">{form.formState.errors.bedrooms?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="livingRooms">Salas (opcional)</Label>
              <Input id="livingRooms" type="number" placeholder="Ex.: 2" {...form.register("livingRooms")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="suites">Suítes (opcional)</Label>
              <Input id="suites" type="number" placeholder="Ex.: 1" {...form.register("suites")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bathrooms">Banheiros *</Label>
              <Input id="bathrooms" type="number" placeholder="Ex.: 2" {...form.register("bathrooms")} />
              <p className="text-xs text-destructive">{form.formState.errors.bathrooms?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="parking">Vagas de Garagem (opcional)</Label>
              <Input id="parking" type="number" placeholder="Ex.: 2" {...form.register("parking")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="areaUseful">Área Útil (m²) (opcional)</Label>
              <Input id="areaUseful" type="number" step="0.01" placeholder="Ex.: 98" {...form.register("areaUseful")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="areaTotal">Área Total (m²) (opcional)</Label>
              <Input id="areaTotal" type="number" step="0.01" placeholder="Ex.: 150" {...form.register("areaTotal")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="areaBuilt">Área Construída (m²) (opcional)</Label>
              <Input id="areaBuilt" type="number" step="0.01" placeholder="Ex.: 120" {...form.register("areaBuilt")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="landWidth">Largura do Terreno (m) (opcional)</Label>
              <Input id="landWidth" type="number" step="0.01" placeholder="Ex.: 10" {...form.register("landWidth")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="landLength">Comprimento do Terreno (m) (opcional)</Label>
              <Input id="landLength" type="number" step="0.01" placeholder="Ex.: 25" {...form.register("landLength")} />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox checked={form.watch("active")} onCheckedChange={(checked) => form.setValue("active", checked === true)} />
              <span className="text-sm">Imóvel ativo para exibição pública</span>
            </div>
          </div>
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Onde fica o imóvel?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="street">Endereço *</Label>
              <Input id="street" placeholder="Digite o nome da rua e número" {...form.register("street")} />
              <p className="text-xs text-muted-foreground">Ex.: Rua das Flores, 980</p>
              <p className="text-xs text-destructive">{form.formState.errors.street?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="number">Número/Lote *</Label>
              <Input id="number" placeholder="Ex.: 980" {...form.register("number")} />
              <p className="text-xs text-destructive">{form.formState.errors.number?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="complement">Complemento (opcional)</Label>
              <Input id="complement" placeholder="Ex.: Apto 42" {...form.register("complement")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="state">UF *</Label>
              <Input id="state" placeholder="Ex.: SP" maxLength={2} {...form.register("state")} />
              <p className="text-xs text-destructive">{form.formState.errors.state?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="city">Cidade *</Label>
              <Input id="city" placeholder="Digite o nome da cidade" {...form.register("city")} />
              <p className="text-xs text-destructive">{form.formState.errors.city?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input id="neighborhood" placeholder="Digite o nome do bairro" {...form.register("neighborhood")} />
              <p className="text-xs text-destructive">{form.formState.errors.neighborhood?.message}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cep">CEP *</Label>
              <Input id="cep" placeholder="Ex.: 01001000" {...form.register("cep")} />
              <p className="text-xs text-destructive">{form.formState.errors.cep?.message}</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Como exibir o endereço publicamente?</Label>
              <Controller
                name="addressVisibility"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="endereco_completo">Mostrar endereço completo</SelectItem>
                      <SelectItem value="bairro_cidade">Mostrar somente bairro e cidade</SelectItem>
                      <SelectItem value="somente_cidade">Mostrar somente cidade</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">Essa configuração define o que aparece na página pública do imóvel.</p>
            </div>
          </div>
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Quais são as características?</h2>
          <p className="text-sm text-muted-foreground">Marque quantas opções forem necessárias.</p>

          {FEATURE_GROUPS.map((category) => (
            <div key={category.group} className="space-y-3">
              <h3 className="text-lg">{category.group}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((feature) => {
                  const selected = selectedFeatures.includes(feature);
                  return (
                    <label key={feature} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => {
                          const current = form.getValues("features");
                          form.setValue("features", checked ? [...current, feature] : current.filter((item) => item !== feature));
                        }}
                      />
                      {feature}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Informe o(s) dono(s) do imóvel e chaves</h2>
          <p className="text-sm text-muted-foreground">Campo privado: visível apenas para corretor/admin no painel.</p>
          <Textarea rows={4} placeholder="Ex.: Proprietário João Silva, chaves na portaria bloco B." {...form.register("ownerKeys")} />
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Informações detalhadas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Condição do imóvel (opcional)</Label>
              <Controller
                name="propertyCondition"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {selectOptions.propertyCondition.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label>Estágio da Reforma (opcional)</Label>
              <Controller
                name="renovationStage"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {selectOptions.renovationStage.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label>Estágio da Obra (opcional)</Label>
              <Controller
                name="constructionStage"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {selectOptions.constructionStage.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label>Ocupação do Imóvel (opcional)</Label>
              <Controller
                name="occupationStatus"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {selectOptions.occupationStatus.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label>Modo do IPTU</Label>
              <Controller
                name="iptuMode"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {selectOptions.iptuMode.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="iptuValue">Valor do IPTU/ITR (opcional)</Label>
              <Input id="iptuValue" type="number" step="0.01" placeholder="R$" {...form.register("iptuValue")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="condominiumValue">Valor do Condomínio (opcional)</Label>
              <Input id="condominiumValue" type="number" step="0.01" placeholder="R$" {...form.register("condominiumValue")} />
            </div>
          </div>
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Condições de negociação</h2>

          <div className="space-y-2">
            <Label>Aceita financiamento?</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {["Bancário", "Direto", "Construtora"].map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={financingTypes.includes(item)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("financingTypes");
                      form.setValue("financingTypes", checked ? [...current, item] : current.filter((type) => type !== item));
                    }}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.watch("mcmvEligible")} onCheckedChange={(checked) => form.setValue("mcmvEligible", checked === true)} />
            Enquadra-se no Minha Casa Minha Vida (de acordo com as regras da região)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={acceptsExchange} onCheckedChange={(checked) => form.setValue("acceptsExchange", checked === true)} />
            Aceita permuta
          </label>

          {acceptsExchange && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="exchangeVehicleValue">Valor do veículo na troca (opcional)</Label>
                <Input id="exchangeVehicleValue" type="number" step="0.01" placeholder="R$" {...form.register("exchangeVehicleValue")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="exchangePropertyValue">Valor do imóvel na troca (opcional)</Label>
                <Input id="exchangePropertyValue" type="number" step="0.01" placeholder="R$" {...form.register("exchangePropertyValue")} />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={acceptsOtherAsset} onCheckedChange={(checked) => form.setValue("acceptsOtherAsset", checked === true)} />
            Aceita outro bem
          </label>

          {acceptsOtherAsset && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="otherAssetDescription">Qual? (opcional)</Label>
                <Input id="otherAssetDescription" placeholder="Ex.: Lancha de 30 pés" {...form.register("otherAssetDescription")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="otherAssetValue">Valor (opcional)</Label>
                <Input id="otherAssetValue" type="number" step="0.01" placeholder="R$" {...form.register("otherAssetValue")} />
              </div>
            </div>
          )}
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Quem são os captadores desse imóvel?</h2>
          <Textarea rows={3} placeholder="Ex.: Maria Souza (captadora principal), João Lima (apoio)." {...form.register("prospectors")} />
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <h2 className="text-2xl">Descrição geral</h2>
          <Textarea rows={5} placeholder="Descreva os principais diferenciais do imóvel (acabamento, localização, contexto, etc)." {...form.register("notes")} />
        </section>

        <section className="luxury-surface space-y-4 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Imagens</h2>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/70">
              <ImagePlus className="h-4 w-4" />
              Adicionar
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePickImages(e.target.files)} />
            </label>
          </div>

          <p className="text-sm text-muted-foreground">Total: {totalImages}/10 imagens</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {existingImages.map((image) => (
              <div key={image} className="relative overflow-hidden rounded-md border border-border">
                <img src={image} alt="Imagem já cadastrada" className="h-32 w-full object-cover" loading="lazy" />
                <Button type="button" size="icon" variant="destructive" className="absolute right-2 top-2 h-7 w-7" onClick={() => setExistingImages((prev) => prev.filter((item) => item !== image))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {newImages.map((image) => (
              <div key={image.preview} className="relative overflow-hidden rounded-md border border-border">
                <img src={image.preview} alt="Nova imagem" className="h-32 w-full object-cover" loading="lazy" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={() => {
                    URL.revokeObjectURL(image.preview);
                    setNewImages((prev) => prev.filter((item) => item.preview !== image.preview));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="flex items-center gap-2 uppercase tracking-[0.16em]" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando e enviando fotos...
              </>
            ) : (
              isEditing ? "Salvar alterações" : "Cadastrar imóvel"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/imoveis")} disabled={mutation.isPending}>
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
};

export default PropertyFormPage;
