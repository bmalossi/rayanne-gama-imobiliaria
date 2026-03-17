import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/services/supabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLeads, useUpdateLeadStatus, useDeleteLead } from "@/modules/leads/hooks/useLeads";
import * as leadsService from "@/modules/leads/services/leads.service";
import * as propertyService from "@/modules/properties/services/property.service";
import type { Lead, LeadStatus } from "@/types/domain";

const statusOptions = ["Novo", "Em Contato", "Qualificado", "Fechado", "Perdido"] as const;
const statuses: LeadStatus[] = [...statusOptions];

const leadSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  phone: z.string().trim().min(8, "Telefone inválido"),
  property_id: z.string().min(1, "Selecione o imóvel"),
  status: z.enum(statusOptions),
  agent_id: z.string().uuid("Selecione o corretor").optional(),
  message: z.string().trim().max(800).optional(),
  notes: z.string().trim().max(800).optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const LeadsPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [conversationLead, setConversationLead] = useState<Lead | null>(null);

  const leadQueryKey = ["dashboard-leads", user?.id, isAdmin, search, statusFilter, propertyFilter, agentFilter, dateStart, dateEnd];

  // Busca a conversa do chatbot para o lead selecionado
  const { data: conversationMessages = [], isLoading: isLoadingConversation } = useQuery({
    queryKey: ["chatbot-conversation", conversationLead?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_conversations")
        .select("role, content, created_at, historico_conversa")
        .eq("lead_id", conversationLead!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const allMessages: { role: string; content: string; created_at: string }[] = [];

      data?.forEach((row: any) => {
        if (row.historico_conversa && Array.isArray(row.historico_conversa)) {
          // Novo formato: historico_conversa é um array JSONB
          row.historico_conversa.forEach((msg: any) => {
            allMessages.push({
              role: msg.role === "bot" ? "assistant" : msg.role,
              content: msg.content,
              created_at: msg.timestamp || row.created_at,
            });
          });
        } else if (row.role && row.content) {
          // Formato legado: uma linha por mensagem
          allMessages.push({
            role: row.role === "bot" ? "assistant" : row.role,
            content: row.content,
            created_at: row.created_at,
          });
        }
      });

      // Ordenar por data caso existam múltiplas sessões
      return allMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    },
    enabled: Boolean(conversationLead?.id),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["dashboard-property-options", user?.id, isAdmin],
    queryFn: () => propertyService.fetchPropertyOptions(user!.id, isAdmin),
    enabled: Boolean(user?.id),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["all-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: leads = [], isLoading } = useLeads(user!.id, isAdmin, {
    search,
    status: statusFilter || undefined,
    propertyId: propertyFilter || undefined,
    agentId: agentFilter || undefined,
    dateStart: dateStart ? `${dateStart}T00:00:00` : undefined,
    dateEnd: dateEnd ? `${dateEnd}T23:59:59` : undefined,
  });

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      return String(a[sortBy as keyof Lead]).localeCompare(String(b[sortBy as keyof Lead])) * direction;
    });
  }, [leads, sortBy, sortDir]);

  const createForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "", property_id: "", status: "Novo", message: "", notes: "" },
  });

  const editForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => leadsService.createManualLead(user!.id, leadSchema.parse(values)),
    onSuccess: () => {
      toast({ title: "Lead criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      createForm.reset();
      setOpenCreate(false);
    },
    onError: (error: Error) => toast({ title: "Erro ao criar lead", description: error.message, variant: "destructive" }),
  });

  const deleteLeadMutation = useDeleteLead();
  const statusMutation = useUpdateLeadStatus();

  const agentMutation = useMutation({
    mutationFn: ({ leadId, agentId }: { leadId: string; agentId: string }) =>
      leadsService.updateLead(leadId, { agent_id: agentId }),
    onSuccess: () => {
      toast({ title: "Corretor alterado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: Error) => toast({ title: "Erro ao alterar corretor", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      if (!editingLead) throw new Error("Lead inválido");
      return leadsService.updateLead(editingLead.id, leadSchema.parse(values));
    },
    onSuccess: () => {
      toast({ title: "Lead atualizado." });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditingLead(null);
    },
    onError: (error: Error) => toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }),
  });

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gold-label">CRUD</p>
          <h1 className="mt-1 text-4xl">Leads</h1>
        </div>
        <Button className="uppercase tracking-[0.16em]" onClick={() => setOpenCreate(true)}><Plus className="h-4 w-4" />Novo Lead Manual</Button>
      </section>

      <section className="luxury-surface grid gap-3 rounded-xl p-4 md:grid-cols-5">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail" className="md:col-span-2" />
        <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={propertyFilter || "all"} onValueChange={(value) => setPropertyFilter(value === "all" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Imóvel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os imóveis</SelectItem>
            {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter || "all"} onValueChange={(value) => setAgentFilter(value === "all" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Corretor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os corretores</SelectItem>
            {agents.map((agent: any) => <SelectItem key={agent.id} value={agent.id}>{agent.full_name || agent.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
      </section>

      {isLoading ? (
        <p className="gold-label">Carregando leads...</p>
      ) : !sortedLeads.length ? (
        <div className="luxury-surface rounded-xl p-10 text-center">
          <p className="gold-label">Sem leads</p>
          <p className="mt-2 text-muted-foreground">Nenhum lead encontrado. Clique em “Novo Lead Manual” para cadastrar seu primeiro contato.</p>
        </div>
      ) : (
        <section className="luxury-surface overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-4 py-3"><button onClick={() => { setSortBy("name"); setSortDir((prev) => (prev === "asc" ? "desc" : "asc")); }}>Cliente</button></th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3"><button onClick={() => { setSortBy("created_at"); setSortDir((prev) => (prev === "asc" ? "desc" : "asc")); }}>Data</button></th>
                  <th className="px-4 py-3"><button onClick={() => { setSortBy("status"); setSortDir((prev) => (prev === "asc" ? "desc" : "asc")); }}>Status</button></th>
                  <th className="px-4 py-3">Corretor</th>
                  <th className="px-4 py-3">Mensagem</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/50 align-top">
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        {lead.name}
                        {lead.source === "chatbot" && (
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 border-primary/30 text-primary">
                            <Bot className="h-3 w-3" /> Chatbot
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.property?.title ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="px-4 py-3">
                      <Select value={lead.status} onValueChange={(value) => statusMutation.mutate({ leadId: lead.id, status: value as LeadStatus })}>
                        <SelectTrigger className="h-8 min-w-[130px] shadow-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={lead.agent_id}
                        onValueChange={(value) => agentMutation.mutate({ leadId: lead.id, agentId: value })}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger className="h-8 min-w-[130px] shadow-none">
                          <SelectValue placeholder="Sem corretor" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name || agent.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[240px] text-sm text-muted-foreground">{lead.message || "Sem mensagem"}</p>
                      {lead.notes && <Badge variant="secondary" className="mt-2">Com nota</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setConversationLead(lead)}>
                          <MessageSquare className="h-3.5 w-3.5" /> Conversa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingLead(lead);
                            editForm.reset({
                              name: lead.name,
                              email: lead.email ?? "",
                              phone: lead.phone,
                              property_id: lead.property_id ?? "",
                              status: lead.status,
                              agent_id: lead.agent_id,
                              message: lead.message ?? "",
                              notes: lead.notes ?? "",
                            });
                          }}
                        >
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingLead(lead)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lead manual</DialogTitle>
            <DialogDescription>Cadastre leads recebidos fora do formulário do site.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <Input placeholder="Nome" {...createForm.register("name")} />
            <Input placeholder="E-mail" {...createForm.register("email")} />
            <Input placeholder="Telefone" {...createForm.register("phone")} />
            <Controller
              name="property_id"
              control={createForm.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o imóvel" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              name="status"
              control={createForm.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            <Textarea placeholder="Mensagem (opcional)" rows={4} {...createForm.register("message")} />
            <Textarea placeholder="Notas internas" rows={3} {...createForm.register("notes")} />
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingLead)} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lead</DialogTitle>
            <DialogDescription>Atualize dados e observações.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <Input placeholder="Nome" {...editForm.register("name")} />
            <Input placeholder="E-mail" {...editForm.register("email")} />
            <Input placeholder="Telefone" {...editForm.register("phone")} />
            <Controller
              name="property_id"
              control={editForm.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o imóvel" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              name="status"
              control={editForm.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {isAdmin && (
              <Controller
                name="agent_id"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione o corretor" /></SelectTrigger>
                    <SelectContent>
                      {agents.map((agent: any) => <SelectItem key={agent.id} value={agent.id}>{agent.full_name || agent.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <Textarea placeholder="Mensagem" rows={4} {...editForm.register("message")} />
            <Textarea placeholder="Notas" rows={3} {...editForm.register("notes")} />
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Conversa do Chatbot */}
      <Dialog open={Boolean(conversationLead)} onOpenChange={(open) => !open && setConversationLead(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Conversa — {conversationLead?.name}
            </DialogTitle>
            <DialogDescription>Histórico da conversa via chatbot</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-2">
            {isLoadingConversation ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : conversationMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma mensagem registrada.</p>
            ) : (
              conversationMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-secondary text-foreground rounded-tl-none border border-border/40"
                    }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingLead)} onOpenChange={(open) => !open && setDeletingLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lead?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingLead && deleteLeadMutation.mutate(deletingLead.id)}>
              {deleteLeadMutation.isPending ? "Removendo..." : "Remover Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default LeadsPage;
