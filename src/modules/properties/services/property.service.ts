import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { Property } from "@/types/domain";

export type PropertyFilters = {
    city?: string;
    transaction?: string;
    type?: string;
    bedrooms?: number;
    search?: string;
};

export type PropertyPayload = {
    title?: string;
    description?: string;
    type?: string;
    transaction?: string;
    price?: number;
    area?: number;
    bedrooms?: number;
    bathrooms?: number;
    parking?: number;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
    features?: string[];
    areaTotal?: number;
    areaBuilt?: number;
    landWidth?: number;
    landLength?: number;
    livingRooms?: number;
    suites?: number;
    propertyCondition?: string;
    renovationStage?: string;
    constructionStage?: string;
    occupationStatus?: string;
    iptuMode?: string;
    iptuValue?: number;
    condominiumValue?: number;
    financingTypes?: string[];
    mcmvEligible?: boolean;
    acceptsExchange?: boolean;
    exchangeVehicleValue?: number;
    exchangePropertyValue?: number;
    acceptsOtherAsset?: boolean;
    otherAssetDescription?: string;
    otherAssetValue?: number;
    prospectors?: string;
    notes?: string;
    addressVisibility?: string;
    existingImages?: string[];
    newImages?: File[];
    active?: boolean;
    featured?: boolean;
};

function getStoragePathFromPublicUrl(bucket: string, publicUrl: string) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = publicUrl.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(publicUrl.slice(index + marker.length));
}

async function deletePublicUrlsFromBucket(bucket: string, urls: string[]) {
    const paths = urls.map((url) => getStoragePathFromPublicUrl(bucket, url)).filter((item): item is string => Boolean(item));
    if (!paths.length) return;

    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
}

async function uploadFilesToBucket(bucket: string, userId: string, files: File[], folder: string) {
    if (!files.length) return [] as string[];

    const uploaded = await Promise.all(
        files.map(async (file) => {
            const extension = file.name.split(".").pop() || "jpg";
            const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
            const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
            if (error) throw error;

            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            return data.publicUrl;
        }),
    );

    return uploaded;
}

export async function fetchFeaturedProperties() {
    if (!isSupabaseConfigured) return [] as Property[];

    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("active", true)
        .eq("featured", true)
        .order("updated_at", { ascending: false })
        .limit(3);

    if (error) throw error;
    return (data ?? []) as Property[];
}

export async function fetchProperties(filters?: PropertyFilters) {
    if (!isSupabaseConfigured) return [] as Property[];

    let query = supabase.from("properties").select("*").eq("active", true).order("created_at", { ascending: false });

    if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
    if (filters?.transaction) query = query.eq("transaction", filters.transaction);
    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,city.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`);
    if (typeof filters?.bedrooms === "number" && Number.isFinite(filters.bedrooms) && filters.bedrooms > 0) {
        query = query.eq("bedrooms", filters.bedrooms);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Property[];
}

export async function fetchPropertyById(id: string) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Property;
}

export async function fetchPropertyPrivateDetails(id: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from("property_private_details").select("*").eq("property_id", id).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
}

export async function upsertPropertyPrivateDetails(id: string, agentId: string, ownerKeys: string | null) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from("property_private_details").upsert({
        property_id: id,
        agent_id: agentId,
        owner_keys: ownerKeys,
        updated_at: new Date().toISOString(),
    });
    if (error) throw error;
}

export async function deletePropertyHard(id: string, images: string[]) {
    if (!isSupabaseConfigured) return;

    if (images && images.length) {
        await deletePublicUrlsFromBucket("property-images", images);
    }

    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw error;
}

export async function setPropertyFeatured(agentId: string, isAdmin: boolean, propertyId: string, featured: boolean) {
    if (!isSupabaseConfigured) return;

    if (featured) {
        const { count } = await supabase
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("agent_id", agentId)
            .eq("featured", true);

        if ((count || 0) >= 3 && !isAdmin) {
            throw new Error("Limite de 3 imóveis em destaque atingido.");
        }
    }

    const { error } = await supabase.from("properties").update({ featured }).eq("id", propertyId);
    if (error) throw error;
}

export async function fetchPropertyOptions(agentId: string, isAdmin: boolean) {
    if (!isSupabaseConfigured) return [];
    let query = supabase.from("properties").select("id, title, active").order("title");
    if (!isAdmin) query = query.eq("agent_id", agentId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}

export async function fetchDashboardProperties(agentId: string, isAdmin: boolean, filters: PropertyFilters) {
    if (!isSupabaseConfigured) return [] as Property[];

    let query = supabase.from("properties").select("*");

    if (!isAdmin) {
        query = query.eq("agent_id", agentId);
    }

    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,city.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`);
    }
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.transaction) query = query.eq("transaction", filters.transaction);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Property[];
}

export async function fetchPropertyDetailsWithLeads(propertyId: string, agentId: string, isAdmin: boolean) {
    if (!isSupabaseConfigured) return null;

    const { data: property, error: pError } = await supabase.from("properties").select("*").eq("id", propertyId).single();
    if (pError) throw pError;

    let leadsQuery = supabase.from("leads").select("*").eq("property_id", propertyId);
    if (!isAdmin) {
        leadsQuery = leadsQuery.eq("agent_id", agentId);
    }

    const { data: leads, error: lError } = await leadsQuery.order("created_at", { ascending: false });
    if (lError) throw lError;

    return { property: property as Property, leads };
}

export async function createProperty(agentId: string, payload: PropertyPayload, agentName: string | null) {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    const newImages = payload.newImages ?? [];

    // Upload images before creating the property record
    const uploaded = await uploadFilesToBucket("property-images", agentId, newImages, "properties");

    const { data, error } = await supabase.from("properties").insert({
        agent_id: agentId,
        agent_name: agentName,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        transaction: payload.transaction,
        price: payload.price,
        area: payload.area,
        area_total: payload.areaTotal,
        area_built: payload.areaBuilt,
        land_width: payload.landWidth,
        land_length: payload.landLength,
        bedrooms: payload.bedrooms,
        living_rooms: payload.livingRooms,
        suites: payload.suites,
        bathrooms: payload.bathrooms,
        parking: payload.parking,
        street: payload.street,
        number: payload.number,
        neighborhood: payload.neighborhood,
        city: payload.city,
        state: payload.state,
        cep: payload.cep,
        address_visibility: payload.addressVisibility,
        property_condition: payload.propertyCondition,
        renovation_stage: payload.renovationStage,
        construction_stage: payload.constructionStage,
        occupation_status: payload.occupationStatus,
        iptu_mode: payload.iptuMode,
        iptu_value: payload.iptuValue,
        condominium_value: payload.condominiumValue,
        financing_types: payload.financingTypes,
        mcmv_eligible: payload.mcmvEligible,
        accepts_exchange: payload.acceptsExchange,
        exchange_vehicle_value: payload.exchangeVehicleValue,
        exchange_property_value: payload.exchangePropertyValue,
        accepts_other_asset: payload.acceptsOtherAsset,
        other_asset_description: payload.otherAssetDescription,
        other_asset_value: payload.otherAssetValue,
        prospectors: payload.prospectors,
        notes: payload.notes,
        features: payload.features,
        active: payload.active,
        images: uploaded, // Include the uploaded image URLs
    }).select().single();

    if (error) throw error;
    return data;
}

export async function updateProperty(userId: string, propertyId: string, payload: PropertyPayload, originalImages: string[]) {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    const existingImages = payload.existingImages ?? [];
    const newImages = payload.newImages ?? [];

    const uploaded = await uploadFilesToBucket("property-images", userId, newImages, "properties");
    const images = [...existingImages, ...uploaded];

    const removedImages = originalImages.filter((image) => !existingImages.includes(image));
    if (removedImages.length) {
        await deletePublicUrlsFromBucket("property-images", removedImages);
    }

    const { data, error } = await supabase.from("properties").update({
        title: payload.title,
        description: payload.description,
        type: payload.type,
        transaction: payload.transaction,
        price: payload.price,
        area: payload.area,
        area_total: payload.areaTotal,
        area_built: payload.areaBuilt,
        land_width: payload.landWidth,
        land_length: payload.landLength,
        bedrooms: payload.bedrooms,
        living_rooms: payload.livingRooms,
        suites: payload.suites,
        bathrooms: payload.bathrooms,
        parking: payload.parking,
        street: payload.street,
        number: payload.number,
        neighborhood: payload.neighborhood,
        city: payload.city,
        state: payload.state,
        cep: payload.cep,
        address_visibility: payload.addressVisibility,
        property_condition: payload.propertyCondition,
        renovation_stage: payload.renovationStage,
        construction_stage: payload.constructionStage,
        occupation_status: payload.occupationStatus,
        iptu_mode: payload.iptuMode,
        iptu_value: payload.iptuValue,
        condominium_value: payload.condominiumValue,
        financing_types: payload.financingTypes,
        mcmv_eligible: payload.mcmvEligible,
        accepts_exchange: payload.acceptsExchange,
        exchange_vehicle_value: payload.exchangeVehicleValue,
        exchange_property_value: payload.exchangePropertyValue,
        accepts_other_asset: payload.acceptsOtherAsset,
        other_asset_description: payload.otherAssetDescription,
        other_asset_value: payload.otherAssetValue,
        prospectors: payload.prospectors,
        notes: payload.notes,
        features: payload.features,
        active: payload.active,
        images,
    }).eq("id", propertyId).select().single();

    if (error) throw error;
    return data;
}
