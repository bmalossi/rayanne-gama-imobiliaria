import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
    password: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo de 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type Values = z.infer<typeof schema>;

const SetPassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = async (values: Values) => {
        const { error } = await supabase.auth.updateUser({
            password: values.password,
        });

        if (error) {
            toast({
                title: "Erro ao definir senha",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Senha definida com sucesso!",
            description: "Agora você já pode acessar o painel.",
        });

        navigate("/dashboard");
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="luxury-surface w-full max-w-md space-y-6 rounded-xl p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <p className="gold-label">Configuração de conta</p>
                    <h1 className="mt-2 text-3xl font-light">Defina sua senha</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Para sua segurança, escolha uma senha forte para acessar o sistema.
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <Input
                            type="password"
                            placeholder="Sua senha"
                            {...form.register("password")}
                            className="border-border bg-secondary"
                        />
                        {form.formState.errors.password && (
                            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Input
                            type="password"
                            placeholder="Confirme sua senha"
                            {...form.register("confirmPassword")}
                            className="border-border bg-secondary"
                        />
                        {form.formState.errors.confirmPassword && (
                            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full uppercase tracking-[0.2em]"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Senha
                    </Button>
                </form>
            </div>
        </main>
    );
};

export default SetPassword;
