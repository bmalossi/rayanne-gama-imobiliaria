import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as leadsService from "../services/leads.service";
import type { LeadFilters, LeadPayload } from "../services/leads.service";
import type { LeadStatus } from "@/types/domain";

export const useLeads = (userId: string, isAdmin: boolean, filters?: LeadFilters) => {
    return useQuery({
        queryKey: ["leads", userId, isAdmin, filters],
        queryFn: () => leadsService.fetchDashboardLeads(userId, isAdmin, filters),
        enabled: Boolean(userId),
    });
};

export const useCreateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: leadsService.createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });
};

export const useUpdateLeadStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) =>
            leadsService.updateLeadStatus(leadId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });
};

export const useDeleteLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: leadsService.deleteLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });
};
