import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";
import * as authService from "@/modules/auth/services/auth.service";

const schema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type Values = z.infer<typeof schema>;

const Register = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="luxury-surface w-full max-w-md space-y-5 rounded-xl p-8 text-center">
        <div>
          <p className="gold-label">Área do Corretor</p>
          <h1 className="mt-2 text-3xl">Acesso Restrito</h1>
        </div>

        <p className="text-muted-foreground">
          A criação de novas contas é realizada apenas por administradores do sistema.
        </p>

        <div className="pt-4">
          <Button asChild className="w-full uppercase tracking-[0.2em]">
            <Link to="/login">Voltar para o Login</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Register;
