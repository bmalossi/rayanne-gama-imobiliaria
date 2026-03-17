import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bot, Save, Loader2 } from "lucide-react";
import { supabase } from "@/services/supabase";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingsSchema = z.object({
    id: z.string().optional(),
    is_active: z.boolean(),
    openai_key: z.string().optional(),
    model: z.string().min(1, "Selecione um modelo"),
    system_prompt: z.string().min(10, "O prompt deve ter pelo menos 10 caracteres"),
    default_agent_id: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultValues: SettingsFormValues = {
    is_active: false,
    openai_key: "",
    model: "gpt-4o-mini",
    system_prompt: "Você é Ray, assistente virtual da Rayanne Gama Imóveis. Seja cordial, elegante e objetiva. Entenda o que o cliente busca e sugira os imóveis mais compatíveis com base na lista fornecida. Nunca invente imóveis, nunca mencione dados de leads ou corretores, nunca prometa condições não descritas. Responda sempre em português brasileiro de forma concisa.",
    default_agent_id: "",
};

export default function ChatbotSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [agents, setAgents] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                // Busca agentes
                const { data: agentData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email');
                if (agentData) setAgents(agentData);

                const { data, error } = await supabase
                    .from('chatbot_settings' as any)
                    .select('*')
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (data) {
                    form.reset({
                        id: data.id,
                        is_active: data.is_active,
                        openai_key: data.openai_key ? "••••••••••••••••••••••••••••••••••••" : "", // masked
                        model: data.model,
                        system_prompt: data.system_prompt,
                        default_agent_id: data.default_agent_id ?? "",
                    });
                }
            } catch (error) {
                console.error("Error fetching chatbot settings:", error);
                toast.error("Erro ao carregar configurações");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [form]);

    const onSubmit = async (values: SettingsFormValues) => {
        setIsSaving(true);
        try {
            const payload: any = {
                is_active: values.is_active,
                model: values.model,
                system_prompt: values.system_prompt,
                default_agent_id: values.default_agent_id || null,
            };

            // Only update API key if it's changed (not masked)
            if (values.openai_key && !values.openai_key.includes("••••")) {
                payload.openai_key = values.openai_key;
            }

            if (values.id) {
                const { error } = await supabase
                    .from('chatbot_settings' as any)
                    .update(payload)
                    .eq('id', values.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('chatbot_settings' as any)
                    .insert([payload]);

                if (error) throw error;
            }

            toast.success("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Error saving chatbot settings:", error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-serif text-primary">Configurações do Chatbot</h1>
                <p className="text-muted-foreground mt-2">
                    Gerencie o comportamento, modelo e chave de API do seu assistente virtual.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                Status e Integração
                            </CardTitle>
                            <CardDescription>
                                Ative ou desative o chatbot público e gerencie suas credenciais.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Chatbot Ativo</FormLabel>
                                            <FormDescription>
                                                Exibir o widget do chatbot no site público
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="openai_key"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chave da API da OpenAI</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="sk-..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Sua chave não será exposta no frontend. Ela é criptografada e enviada via servidor.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo de IA</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um modelo..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido e econômico)</SelectItem>
                                                <SelectItem value="gpt-4o">GPT-4o (Avançado)</SelectItem>
                                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Legado)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            O GPT-4o Mini é recomendado para a maioria dos casos de uso.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Atribuição de Leads</CardTitle>
                            <CardDescription>
                                Escolha qual corretor receberá automaticamente os leads capturados pelo chatbot.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="default_agent_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Corretor Padrão</FormLabel>
                                        <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sem atribuição automática" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum (sem atribuição)</SelectItem>
                                                {agents.map((agent) => (
                                                    <SelectItem key={agent.id} value={agent.id}>
                                                        {agent.full_name || agent.email || agent.id}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Leads capturados pelo chatbot serão atribuídos a este corretor.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Comportamento do Assistente</CardTitle>
                            <CardDescription>
                                Defina como a inteligência artificial deve responder aos clientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="system_prompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prompt do Sistema</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                rows={6}
                                                placeholder="Escreva como o assistente deve se comportar..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            As instruções base para a personalidade e limites da IA.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full sm:w-auto"
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? "Salvando..." : "Salvar Configurações"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
