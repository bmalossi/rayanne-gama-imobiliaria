import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Mail, Shield, User as UserIcon, Trash2, Copy, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/modules/auth/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";

const inviteSchema = z.object({
    full_name: z.string().trim().min(2, "Informe o nome completo"),
    email: z.string().trim().email("E-mail inválido"),
    role: z.enum(["admin", "moderator", "user"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

const UsersPage = () => {
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const form = useForm<InviteValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { full_name: "", email: "", role: "user" },
    });

    // Fetch users with their roles
    const { data: users, isLoading } = useQuery({
        queryKey: ["users-management"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                  id,
                  full_name,
                  email,
                  created_at,
                  user_roles (role)
                `)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching users:", error);
                throw error;
            }
            return data;
        },
        enabled: Boolean(user?.id),
    });

    const inviteMutation = useMutation({
        mutationFn: async (values: InviteValues) => {
            const { data, error } = await supabase.functions.invoke("manage-users", {
                body: {
                    ...values,
                    redirectTo: `${window.location.origin}/login`,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({ title: "Convite enviado", description: "O usuário receberá um e-mail para ativar a conta." });
            queryClient.invalidateQueries({ queryKey: ["users-management"] });
            setIsInviteOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            toast({
                title: "Falha ao convidar",
                description: error.message || "Ocorreu um erro ao enviar o convite.",
                variant: "destructive",
            });
        },
    });

    const handleInvite = (values: InviteValues) => {
        inviteMutation.mutate(values);
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
                    <h1 className="text-3xl font-light tracking-tight">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground">Convide e gerencie as permissões dos corretores e administradores.</p>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Convidar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={form.handleSubmit(handleInvite)}>
                            <DialogHeader>
                                <DialogTitle>Novo Convite</DialogTitle>
                                <DialogDescription>
                                    Um e-mail será enviado para o endereço abaixo com as instruções de acesso.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome Completo</label>
                                    <Input placeholder="Ex: João Silva" {...form.register("full_name")} />
                                    {form.formState.errors.full_name && (
                                        <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">E-mail</label>
                                    <Input placeholder="email@exemplo.com" {...form.register("email")} />
                                    {form.formState.errors.email && (
                                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cargo / Permissão</label>
                                    <Select
                                        onValueChange={(val) => form.setValue("role", val as any)}
                                        defaultValue={form.getValues("role")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o cargo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Corretor (Padrão)</SelectItem>
                                            <SelectItem value="moderator">Moderador</SelectItem>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={inviteMutation.isPending}
                                    className="w-full"
                                >
                                    {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar Convite
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>ID / Token</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Data de Criação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(users as any[])?.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.full_name || "Sem nome"}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                            {u.id.substring(0, 8)}...
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                                navigator.clipboard.writeText(u.id);
                                                toast({ title: "ID Copiado!", description: "O UUID foi copiado para sua área de transferência." });
                                            }}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {u.user_roles?.map((r: any) => (
                                            <Badge key={r.role} variant={r.role === "admin" ? "default" : "secondary"}>
                                                {r.role === "admin" ? "Admin" : r.role === "moderator" ? "Moderador" : "Corretor"}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                                </TableCell>
                            </TableRow>
                        ))}
                        {users?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UsersPage;
