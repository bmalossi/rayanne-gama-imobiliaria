import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ShieldAlert, Save, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const settingSchema = z.object({
    agent_id: z.string().uuid("Selecione um corretor"),
    percentage: z.coerce.number().min(1, "Mínimo 1%").max(100, "Máximo 100%"),
});

type SettingValues = z.infer<typeof settingSchema>;

interface DistributionItem {
    agent_id: string;
    percentage: number;
    full_name?: string;
    email?: string;
}

const LeadDistributionPage = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [localSettings, setLocalSettings] = useState<DistributionItem[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    const form = useForm<SettingValues>({
        resolver: zodResolver(settingSchema),
        defaultValues: { agent_id: "", percentage: 10 },
    });

    const { data: users } = useQuery({
        queryKey: ["all-agents"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email, user_roles(role)")
                .order("full_name");
            if (error) throw error;
            return data;
        },
    });

    const { data: remoteSettings, isLoading } = useQuery({
        queryKey: ["distribution-settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("lead_distribution_settings" as any)
                .select("*, profiles!inner(full_name, email)")
                .order("percentage", { ascending: false });
            if (error) throw error;
            return (data as any[]).map(item => ({
                agent_id: item.agent_id,
                percentage: item.percentage,
                full_name: item.profiles?.full_name,
                email: item.profiles?.email
            })) as DistributionItem[];
        },
    });

    // Initialize local state from remote data
    useEffect(() => {
        if (remoteSettings) {
            setLocalSettings(remoteSettings);
            setHasChanges(false);
        }
    }, [remoteSettings]);

    const totalPercentage = localSettings.reduce((acc, curr) => acc + curr.percentage, 0);

    const syncMutation = useMutation({
        mutationFn: async (items: DistributionItem[]) => {
            console.log("Iniciando salvamento da roleta...", items);

            if (items.reduce((acc, curr) => acc + curr.percentage, 0) !== 100) {
                throw new Error("A soma total deve ser exatamente 100% para salvar.");
            }

            const payload = items.map(i => ({
                agent_id: i.agent_id,
                percentage: i.percentage
            }));

            console.log("Chamando RPC save_lead_distribution_settings com payload:", payload);

            const { error } = await supabase.rpc("save_lead_distribution_settings" as any, {
                settings_json: payload
            });

            if (error) {
                console.error("Erro no RPC save_lead_distribution_settings:", error);
                throw error;
            }

            console.log("Salvamento concluído com sucesso.");
        },
        onSuccess: async () => {
            toast({ title: "Configuração da roleta salva com sucesso!" });
            await queryClient.invalidateQueries({ queryKey: ["distribution-settings"] });
            setHasChanges(false);
        },
        onError: (error: any) => {
            console.error("Erro capturado na mutation syncMutation:", error);
            toast({
                title: "Falha ao salvar",
                description: error.message || "Erro desconhecido.",
                variant: "destructive",
            });
        },
    });

    const handleAddItem = (values: SettingValues) => {
        const user = users?.find(u => u.id === values.agent_id);
        const existingIndex = localSettings.findIndex(s => s.agent_id === values.agent_id);

        if (existingIndex > -1) {
            const newList = [...localSettings];
            newList[existingIndex].percentage = values.percentage;
            setLocalSettings(newList);
        } else {
            setLocalSettings([...localSettings, {
                agent_id: values.agent_id,
                percentage: values.percentage,
                full_name: user?.full_name,
                email: user?.email
            }]);
        }

        setHasChanges(true);
        setIsAddOpen(false);
        form.reset();
    };

    const handleRemoveItem = (agentId: string) => {
        setLocalSettings(localSettings.filter(s => s.agent_id !== agentId));
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light tracking-tight">Distribuição de Leads (Roleta)</h1>
                    <p className="text-muted-foreground">Configure as porcentagens para distribuição automática de leads.</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar/Editar Corretor
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={form.handleSubmit(handleAddItem)}>
                                <DialogHeader>
                                    <DialogTitle>Configurar Corretor na Roleta</DialogTitle>
                                    <DialogDescription>
                                        Adicione ou atualize a porcentagem de um corretor na distribuição.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Corretor</label>
                                        <Select
                                            onValueChange={(val) => form.setValue("agent_id", val)}
                                            defaultValue={form.getValues("agent_id")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um corretor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users?.map(u => {
                                                    const roles = (u as any).user_roles?.map((r: any) =>
                                                        r.role === 'admin' ? 'Admin' :
                                                            r.role === 'moderator' ? 'Moderador' : 'Corretor'
                                                    ).join(' / ');
                                                    return (
                                                        <SelectItem key={u.id} value={u.id}>
                                                            {u.full_name || u.email} {roles ? `(${roles})` : ''}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.agent_id && (
                                            <p className="text-xs text-destructive">{form.formState.errors.agent_id.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Porcentagem (%)</label>
                                        <Input type="number" min={1} max={100} {...form.register("percentage")} />
                                        {form.formState.errors.percentage && (
                                            <p className="text-xs text-destructive">{form.formState.errors.percentage.message}</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full">Confirmar</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button
                        className="gap-2"
                        disabled={totalPercentage !== 100 || !hasChanges || syncMutation.isPending}
                        onClick={() => syncMutation.mutate(localSettings)}
                    >
                        {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar Configuração (100%)
                    </Button>
                </div>
            </div>

            {totalPercentage !== 100 && (
                <Alert variant={totalPercentage > 100 ? "destructive" : "default"} className={totalPercentage > 100 ? "border-red-500" : "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950"}>
                    {totalPercentage > 100 ? <AlertCircle className="h-4 w-4 text-destructive" /> : <ShieldAlert className="h-4 w-4" />}
                    <AlertTitle>{totalPercentage > 100 ? "Excesso de porcentagem" : "Roleta incompleta"}</AlertTitle>
                    <AlertDescription>
                        {totalPercentage > 100
                            ? `A soma das porcentagens é ${totalPercentage}%, ultrapassando o limite de 100%. Por favor, ajuste.`
                            : `A soma atual é ${totalPercentage}%. Você precisa distribuir exatamente 100% para poder salvar e ativar a roleta.`}
                    </AlertDescription>
                </Alert>
            )}

            {hasChanges && totalPercentage === 100 && (
                <Alert className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950">
                    <Save className="h-4 w-4" />
                    <AlertTitle>Alterações pendentes</AlertTitle>
                    <AlertDescription>
                        Você preencheu os 100%! Clique no botão <strong>Salvar Configuração</strong> acima para aplicar as mudanças.
                    </AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Corretor</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Porcentagem</TableHead>
                            <TableHead className="text-right">Remover</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localSettings.map((s) => (
                            <TableRow key={s.agent_id}>
                                <TableCell className="font-medium">
                                    {s.full_name || "Sem nome"}
                                    {users?.find((u: any) => u.id === s.agent_id) && (
                                        <span className="ml-2 text-[10px] text-muted-foreground uppercase bg-muted px-1 rounded">
                                            ({(users.find((u: any) => u.id === s.agent_id) as any).user_roles?.map((r: any) =>
                                                r.role === 'admin' ? 'Admin' :
                                                    r.role === 'moderator' ? 'Moderador' : 'Corretor'
                                            ).join(' / ')})
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="px-2 py-1 text-sm font-mono">{s.percentage}%</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveItem(s.agent_id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {localSettings.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhum corretor na lista. Use o botão acima para adicionar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end p-4 border-t bg-muted/30 rounded-b-md">
                <div className="text-right">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Total Distribuído:</span>
                    <span className={`text-2xl font-bold ${totalPercentage === 100 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                        {totalPercentage}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LeadDistributionPage;
