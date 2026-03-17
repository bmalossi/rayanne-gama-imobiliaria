export type AppRole = "admin" | "moderator" | "user";

export type PropertyType = "Apartamento" | "Casa" | "Terreno" | "Comercial" | "Cobertura";
export type TransactionType = "Venda" | "Aluguel";
export type LeadStatus = "Novo" | "Em Contato" | "Qualificado" | "Fechado" | "Perdido";

export interface Profile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  creci: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  transaction: TransactionType;
  price: number;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  features: string[];
  images: string[];
  agent_name: string | null;
  active: boolean;
  featured: boolean;
  living_rooms: number | null;
  suites: number | null;
  area_total: number | null;
  area_built: number | null;
  land_width: number | null;
  land_length: number | null;
  property_condition: string | null;
  renovation_stage: string | null;
  construction_stage: string | null;
  occupation_status: string | null;
  iptu_mode: string | null;
  iptu_value: number | null;
  condominium_value: number | null;
  financing_types: string[];
  mcmv_eligible: boolean;
  accepts_exchange: boolean;
  exchange_vehicle_value: number | null;
  exchange_property_value: number | null;
  accepts_other_asset: boolean;
  other_asset_description: string | null;
  other_asset_value: number | null;
  prospectors: string | null;
  notes: string | null;
  address_visibility: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  property_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  message: string | null;
  notes: string | null;
  status: LeadStatus;
  source?: string;
  created_at: string;
  property?: Pick<Property, "id" | "title" | "city" | "transaction">;
  properties?: Pick<Property, "id" | "title" | "city" | "transaction">;
  agent?: { full_name: string | null };
}

