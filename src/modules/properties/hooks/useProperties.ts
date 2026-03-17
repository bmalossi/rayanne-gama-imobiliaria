import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as propertyService from "../services/property.service";
import type { PropertyFilters } from "../services/property.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import type { Property } from "@/types/domain";

export const useProperties = (filters?: PropertyFilters) => {
    return useQuery({
        queryKey: ["properties", filters],
        queryFn: () => propertyService.fetchProperties(filters),
    });
};

export const useFeaturedProperties = () => {
    return useQuery({
        queryKey: ["featured-properties"],
        queryFn: propertyService.fetchFeaturedProperties,
    });
};

export const useProperty = (id: string) => {
    return useQuery({
        queryKey: ["property", id],
        queryFn: () => propertyService.fetchPropertyById(id),
        enabled: Boolean(id),
    });
};

export const useDashboardProperties = (agentId: string, isAdmin: boolean, filters: PropertyFilters) => {
    return useQuery({
        queryKey: ["dashboard-properties", agentId, isAdmin, filters],
        queryFn: () => propertyService.fetchDashboardProperties(agentId, isAdmin, filters),
        enabled: !!agentId,
    });
};

export const useDeleteProperty = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (property: Partial<Property> & { id: string; images?: string[] }) => propertyService.deletePropertyHard(property.id, property.images || []),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            toast({ title: "Imóvel excluído com sucesso." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao excluir imóvel", description: error.message, variant: "destructive" });
        },
    });
};

export const useUpdatePropertyFeatured = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, isAdmin } = useAuth();

    return useMutation({
        mutationFn: ({ propertyId, featured }: { propertyId: string; featured: boolean }) =>
            propertyService.setPropertyFeatured(user!.id, isAdmin, propertyId, featured),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
            queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
            toast({ title: variables.featured ? "Imóvel em destaque ativado." : "Imóvel removido do destaque." });
        },
        onError: (error: Error) => {
            toast({
                title: "Não foi possível atualizar o destaque",
                description: error.message.includes("Limite de 3 imóveis") ? "Você já possui 3 imóveis em destaque." : error.message,
                variant: "destructive",
            });
        },
    });
};
