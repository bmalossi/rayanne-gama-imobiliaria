import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateLead } from "@/modules/leads/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  message: z.string().trim().max(800).optional(),
});

type FormValues = z.infer<typeof schema>;

export function LeadForm({ propertyId, agentId }: { propertyId: string; agentId: string }) {
  const { toast } = useToast();
  const { mutate: createLead, isPending } = useCreateLead();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const onSubmit = (values: FormValues) => {
    createLead(
      {
        property_id: propertyId,
        agent_id: agentId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message ?? "",
      },
      {
        onSuccess: () => {
          toast({ title: "Mensagem enviada!", description: "O corretor entrará em contato em breve." });
          form.reset();
        },
        onError: (error: Error) => {
          toast({
            title: "Erro ao enviar",
            description: error.message || "Tente novamente mais tarde.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="luxury-surface space-y-4 rounded-xl p-6">
      <div>
        <p className="gold-label">Interesse neste imóvel</p>
        <h3 className="mt-2 text-xl md:text-3xl text-foreground font-medium">Entre em contato</h3>
      </div>

      <div className="space-y-1">
        <Input placeholder="Nome completo" {...form.register("name")} className="border-border bg-secondary" />
        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Input placeholder="E-mail" {...form.register("email")} className="border-border bg-secondary" />
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Input placeholder="Telefone" {...form.register("phone")} className="border-border bg-secondary" />
        {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
      </div>

      <div className="space-y-1">
        <Textarea placeholder="Mensagem (opcional)" rows={4} {...form.register("message")} className="border-border bg-secondary" />
        {form.formState.errors.message && <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>}
      </div>

      <Button type="submit" className="w-full uppercase tracking-[0.2em]" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar mensagem
      </Button>
    </form>
  );
}
