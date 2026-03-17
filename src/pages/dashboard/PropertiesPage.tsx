import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Grid3X3, List, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDashboardProperties, useDeleteProperty, useUpdatePropertyFeatured } from "@/modules/properties/hooks/useProperties";
import * as propertyService from "@/modules/properties/services/property.service";
import type { Property } from "@/types/domain";

const PropertiesPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("");
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [propertyToViewId, setPropertyToViewId] = useState<string | null>(null);

  const propertiesQueryKey = ["dashboard-properties", user?.id, isAdmin, search, typeFilter, transactionFilter];

  const { data: properties = [], isLoading } = useDashboardProperties(user!.id, isAdmin, {
    search,
    type: typeFilter || undefined,
    transaction: transactionFilter || undefined,
  });

  const { data: propertyDetails } = useQuery({
    queryKey: ["dashboard-property-details", propertyToViewId, user?.id, isAdmin],
    queryFn: () => propertyService.fetchPropertyDetailsWithLeads(propertyToViewId!, user!.id, isAdmin),
    enabled: Boolean(propertyToViewId && user?.id),
  });

  const deleteMutation = useDeleteProperty();

  const featuredMutation = useUpdatePropertyFeatured();

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="gold-label">Carregando imóveis...</p>;
    }

    if (!properties.length) {
      return (
        <div className="luxury-surface rounded-xl p-10 text-center">
          <p className="gold-label">Sem imóveis</p>
          <p className="mt-2 text-muted-foreground">Você ainda não cadastrou nenhum imóvel. Clique em “Novo Imóvel” para começar.</p>
          <Button asChild className="mt-6 uppercase tracking-[0.16em]">
            <Link to="/dashboard/imoveis/novo">Novo Imóvel</Link>
          </Button>
        </div>
      );
    }

    if (viewMode === "list") {
      return (
        <div className="luxury-surface overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Destaque</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-border/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{property.title}</p>
                      <p className="text-xs text-muted-foreground">{property.neighborhood ?? "-"}, {property.city ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3">R$ {Number(property.price).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={property.active ? "default" : "secondary"}>{property.active ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={property.featured}
                          disabled={featuredMutation.isPending}
                          onCheckedChange={(checked) => featuredMutation.mutate({ propertyId: property.id, featured: checked })}
                          aria-label={`Alternar destaque do imóvel ${property.title}`}
                        />
                        <span className="text-xs text-muted-foreground">{property.featured ? "Ligado" : "Desligado"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(property.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setPropertyToViewId(property.id)}><Eye className="h-4 w-4" />Ver</Button>
                        <Button size="sm" variant="outline" asChild><Link to={`/dashboard/imoveis/${property.id}/editar`}><Pencil className="h-4 w-4" />Editar</Link></Button>
                        <Button size="sm" variant="destructive" onClick={() => setPropertyToDelete(property)}><Trash2 className="h-4 w-4" />Excluir</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <article key={property.id} className="luxury-surface overflow-hidden rounded-xl">
            <img src={property.images?.[0] || "/placeholder.svg"} alt={`Imagem do imóvel ${property.title}`} className="h-48 w-full border-b border-border object-cover" loading="lazy" />
            <div className="space-y-4 p-4">
              <div>
                <h3 className="text-xl">{property.title}</h3>
                <p className="text-sm text-muted-foreground">{property.neighborhood ?? "-"}, {property.city ?? "-"}</p>
              </div>
              <p className="text-primary">R$ {Number(property.price).toLocaleString("pt-BR")}</p>
              <div className="flex items-center justify-between">
                <Badge variant={property.active ? "default" : "secondary"}>{property.active ? "Ativo" : "Inativo"}</Badge>
                <p className="text-xs text-muted-foreground">{format(new Date(property.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-2">
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Destaque</span>
                <Switch
                  checked={property.featured}
                  disabled={featuredMutation.isPending}
                  onCheckedChange={(checked) => featuredMutation.mutate({ propertyId: property.id, featured: checked })}
                  aria-label={`Alternar destaque do imóvel ${property.title}`}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPropertyToViewId(property.id)}><Eye className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" asChild><Link to={`/dashboard/imoveis/${property.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button>
                <Button size="sm" variant="destructive" onClick={() => setPropertyToDelete(property)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }, [isLoading, properties, viewMode, featuredMutation]);

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gold-label">CRUD</p>
          <h1 className="mt-1 text-4xl">Meus Imóveis</h1>
        </div>
        <Button asChild className="uppercase tracking-[0.16em]"><Link to="/dashboard/imoveis/novo"><Plus className="h-4 w-4" />Novo Imóvel</Link></Button>
      </section>

      <section className="luxury-surface grid gap-3 rounded-xl p-4 md:grid-cols-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, bairro ou cidade" className="md:col-span-2" />
        <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Apartamento">Apartamento</SelectItem>
            <SelectItem value="Casa">Casa</SelectItem>
            <SelectItem value="Terreno">Terreno</SelectItem>
            <SelectItem value="Comercial">Comercial</SelectItem>
            <SelectItem value="Cobertura">Cobertura</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={transactionFilter || "all"} onValueChange={(value) => setTransactionFilter(value === "all" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Transação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setViewMode("grid")} aria-label="Visualização em grade"><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setViewMode("list")} aria-label="Visualização em lista"><List className="h-4 w-4" /></Button>
        </div>
      </section>

      {content}

      <Dialog open={Boolean(propertyToViewId)} onOpenChange={(open) => !open && setPropertyToViewId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{propertyDetails?.property.title ?? "Detalhes do imóvel"}</DialogTitle>
            <DialogDescription>Visualização completa do imóvel e leads recebidos.</DialogDescription>
          </DialogHeader>
          {propertyDetails && (
            <div className="space-y-6">
              <div className="grid gap-2 sm:grid-cols-2">
                {(propertyDetails.property.images ?? []).map((image) => (
                  <img key={image} src={image} alt={`Imagem do imóvel ${propertyDetails.property.title}`} className="h-44 w-full rounded-md border border-border object-cover" loading="lazy" />
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <p><span className="text-muted-foreground">Tipo:</span> {propertyDetails.property.type}</p>
                <p><span className="text-muted-foreground">Transação:</span> {propertyDetails.property.transaction}</p>
                <p><span className="text-muted-foreground">Preço:</span> R$ {Number(propertyDetails.property.price).toLocaleString("pt-BR")}</p>
                <p><span className="text-muted-foreground">Endereço:</span> {propertyDetails.property.street ?? "-"}, {propertyDetails.property.number ?? "-"}</p>
              </div>
              <div>
                <h3 className="mb-2 text-lg">Leads do imóvel</h3>
                {propertyDetails.leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum lead recebido para este imóvel.</p>
                ) : (
                  <div className="space-y-2">
                    {propertyDetails.leads.map((lead) => (
                      <div key={lead.id} className="rounded-md border border-border p-3">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email} · {lead.phone}</p>
                        <p className="text-sm text-muted-foreground">{lead.message || "Sem mensagem"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(propertyToDelete)} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este imóvel?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => propertyToDelete && deleteMutation.mutate(propertyToDelete)}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default PropertiesPage;
