import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type Values = z.infer<typeof schema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: Values) => {
    if (!isSupabaseConfigured) {
      toast({ title: "Erro de acesso", description: "Login ou senha incorreto", variant: "destructive" });
      return;
    }

    const credentials = schema.parse(values) as Required<Values>;
    const { error } = await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password });

    if (error) {
      toast({ title: "Erro de acesso", description: "Login ou senha incorreto", variant: "destructive" });
      return;
    }

    navigate("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="luxury-surface w-full max-w-md space-y-5 rounded-xl p-8">
        <div>
          <p className="gold-label">Área do corretor</p>
          <h1 className="mt-2 text-4xl">Entrar no painel</h1>
        </div>

        <div>
          <Input placeholder="E-mail" {...form.register("email")} className="border-border bg-secondary" />
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.email?.message}</p>
        </div>

        <div>
          <Input type="password" placeholder="Senha" {...form.register("password")} className="border-border bg-secondary" />
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.password?.message}</p>
        </div>

        <Button type="submit" className="w-full uppercase tracking-[0.2em]" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>

        <p className="text-sm text-muted-foreground">
          Não tem conta? <Link to="/cadastro" className="text-primary">Cadastre-se</Link>
        </p>
      </form>
    </main>
  );
};

export default Login;
