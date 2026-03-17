import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as profileService from "@/modules/profile/services/profile.service";
import * as authService from "@/modules/auth/services/auth.service";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  full_name: z.string().trim().min(2, "Nome obrigatório"),
  phone: z.string().trim().min(8, "Telefone inválido"),
  creci: z.string().trim().min(2, "CRECI inválido"),
  bio: z.string().trim().max(500, "Máximo de 500 caracteres"),
});

type FormValues = z.infer<typeof schema>;

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [emailConfirm, setEmailConfirm] = useState("");
  const [openDelete, setOpenDelete] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: () => profileService.fetchDashboardProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      creci: profile?.creci ?? "",
      bio: profile?.bio ?? "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const parsedValues = schema.parse(values);
      return profileService.updateDashboardProfile(user!.id, {
        ...parsedValues,
        avatar_url: profile?.avatar_url || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile"] });
    },
    onError: (error: Error) => toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => authService.deleteMyAccount(),
    onSuccess: async () => {
      toast({ title: "Conta excluída com sucesso." });
      await signOut();
      navigate("/");
    },
    onError: (error: Error) => toast({ title: "Erro ao excluir conta", description: error.message, variant: "destructive" }),
  });

  const canDelete = emailConfirm.trim().toLowerCase() === (profile?.email ?? "").toLowerCase();

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <p className="gold-label">Conta</p>
        <h1 className="mt-1 text-4xl">Meu Perfil</h1>
      </section>

      <form className="space-y-6" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
        <section className="luxury-surface grid gap-4 rounded-xl p-5 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm text-muted-foreground">E-mail</p>
            <Input value={profile?.email ?? ""} disabled />
          </div>
          <div className="space-y-1">
            <Input placeholder="Nome completo" {...form.register("full_name")} />
            <p className="text-xs text-destructive">{form.formState.errors.full_name?.message}</p>
          </div>
          <div className="space-y-1">
            <Input placeholder="Telefone" {...form.register("phone")} />
            <p className="text-xs text-destructive">{form.formState.errors.phone?.message}</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Input placeholder="CRECI" {...form.register("creci")} />
            <p className="text-xs text-destructive">{form.formState.errors.creci?.message}</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Textarea placeholder="Bio" rows={5} {...form.register("bio")} />
            <p className="text-xs text-destructive">{form.formState.errors.bio?.message}</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-sm text-muted-foreground">Avatar</p>
            <div className="flex flex-wrap items-center gap-4">
              <img src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url || "/placeholder.svg"} alt="Avatar do corretor" className="h-20 w-20 rounded-full border border-border object-cover" />
              <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="max-w-xs" />
            </div>
          </div>

          <Button type="submit" className="md:col-span-2 w-fit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        </section>
      </form>

      <section className="luxury-surface rounded-xl border-destructive/30 p-5">
        <p className="gold-label text-destructive">Danger Zone</p>
        <h2 className="mt-2 text-2xl">Excluir minha conta</h2>
        <p className="mt-2 text-sm text-muted-foreground">Isso apagará seus dados de perfil, imóveis, leads e acesso.</p>
        <Button variant="destructive" className="mt-4" onClick={() => setOpenDelete(true)}>Excluir minha conta</Button>
      </section>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão da conta</AlertDialogTitle>
            <AlertDialogDescription>Digite seu e-mail para confirmar esta ação irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} placeholder={profile?.email ?? "seu@email.com"} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!canDelete || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default ProfilePage;
