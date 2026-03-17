import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/services/supabase";

export interface Message {
    id: string;
    role: "user" | "bot";
    content: string;
    timestamp: Date;
}

interface CollectedData {
    nome?: string;
    telefone?: string;
}

interface UseChatbotReturn {
    messages: Message[];
    isOpen: boolean;
    isTyping: boolean;
    isFinished: boolean;
    sessionId: string;
    agentInfo: { name?: string, phone?: string } | null;
    toggleChat: () => void;
    sendMessage: (content: string) => void;
    reactivateChat: (phone: string) => boolean;
}

// Extração e validação do backend movida para cá
export function extractPhone(text: string): string | null {
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g;
    const matches = text.match(phoneRegex);
    if (matches) {
        const digitsOnly = matches.map(m => m.replace(/\D/g, "")).filter(d => d.length >= 8 && d.length <= 13);
        if (digitsOnly.length > 0) {
            return digitsOnly[digitsOnly.length - 1];
        }
    }
    return null;
}

export function extractName(text: string): string | null {
    const withoutPhone = text.replace(/[\d()+\-]{4,}/g, " ").trim();
    const cleaned = withoutPhone.replace(/[^\p{L}\s]/gu, " ").trim();
    const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2);
    if (tokens.length >= 1 && tokens.length <= 3 && cleaned.length >= 3) {
        return tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(" ");
    }
    return null;
}

export const useChatbot = (): UseChatbotReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [sessionId, setSessionId] = useState<string>(() => {
        const saved = localStorage.getItem("imobiliaria_chat_session_id");
        return saved || crypto.randomUUID();
    });
    const [collectedData, setCollectedData] = useState<CollectedData>({});
    const [conversationStep, setConversationStep] = useState(0);
    const [agentInfo, setAgentInfo] = useState<{ name?: string, phone?: string } | null>(null);

    useEffect(() => {
        localStorage.setItem("imobiliaria_chat_session_id", sessionId);
    }, [sessionId]);

    useEffect(() => {
        const recoverExistingSession = async () => {
            if (!sessionId) return;
            try {
                const { data, error } = await supabase.rpc("get_conversation_by_session_id" as any, {
                    sid: sessionId
                });

                if (data && (data as any[]).length > 0 && !error) {
                    const sessionData = (data as any[])[0];
                    if (sessionData.historico_conversa && Array.isArray(sessionData.historico_conversa) && sessionData.historico_conversa.length > 0) {
                        const recoveredMessages = (sessionData.historico_conversa as any[]).map(m => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        }));
                        setMessages(recoveredMessages);
                        setCollectedData(sessionData.dados_coletados || {});

                        if (sessionData.agent_name || sessionData.agent_phone) {
                            setAgentInfo({ name: sessionData.agent_name, phone: sessionData.agent_phone });
                        }

                        if (sessionData.status === "Vendido" || sessionData.status === "arquivado" || sessionData.status === "finalizado") {
                            setIsFinished(true);
                        }

                        if (sessionData.telefone) setConversationStep(3);
                        else if (sessionData.nome) setConversationStep(2);
                        else setConversationStep(1);
                    }
                }
            } catch (err) {
                console.error("Erro ao recuperar sessão:", err);
            }
        };

        recoverExistingSession();
    }, [sessionId]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                id: crypto.randomUUID(),
                role: "bot",
                content: "Olá! Sou o assistente da Rayanne Gama Imóveis. Qual o seu nome por favor?",
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            setConversationStep(1);
        }
    }, [isOpen, messages.length]);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const getAIResponse = useCallback(
        async (history: Message[]): Promise<string> => {
            try {
                const { data, error } = await supabase.functions.invoke("chatbot-ai", {
                    body: {
                        messages: history.map(m => ({
                            role: m.role === "bot" ? "assistant" : m.role,
                            content: m.content
                        }))
                    },
                });

                if (error) throw error;
                return data.reply || "Desculpe, ocorreu um erro ao processar sua mensagem.";
            } catch (error) {
                console.error("Error calling AI function:", error);
                return "Ops! Tive um problema técnico. Você pode tentar de novo ou nos chamar no WhatsApp.";
            }
        },
        []
    );

    const saveToSupabase = useCallback(async (
        dataToSave: CollectedData,
        status: string = "em_andamento",
        finalMessages?: Message[]
    ) => {
        const messagesToSave = finalMessages || messages;
        try {
            const { data, error } = await supabase.rpc("save_chatbot_conversation" as any, {
                payload: {
                    session_id: sessionId,
                    nome: dataToSave.nome,
                    telefone: dataToSave.telefone,
                    historico_conversa: messagesToSave.map((m) => ({
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp.toISOString(),
                    })),
                    dados_coletados: dataToSave,
                    status: status,
                    dispositivo: navigator.userAgent
                }
            });

            if (data && !error) {
                const res = data as any;
                if (res.agent_name || res.agent_phone) {
                    setAgentInfo({ name: res.agent_name, phone: res.agent_phone });
                }
            }
        } catch (error) {
            console.error("Error saving to Supabase:", error);
        }
    }, [sessionId, messages]);

    const reactivateChat = useCallback((phone: string): boolean => {
        const cleanInput = phone.replace(/\D/g, '');
        const cleanSaved = (collectedData.telefone || '').replace(/\D/g, '');

        if (cleanInput === cleanSaved && cleanSaved.length > 0) {
            setIsFinished(false);
            return true;
        }
        return false;
    }, [collectedData.telefone]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (isFinished) return;

            const userMessage: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content,
                timestamp: new Date(),
            };

            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setIsTyping(true);

            let updatedData = { ...collectedData };
            let botResponseContent = "";
            let nextStep = conversationStep + 1;

            if (conversationStep === 1) {
                const extractedName = extractName(content);
                if (extractedName) {
                    updatedData.nome = extractedName;
                    botResponseContent = `Entendido, ${extractedName}. Assim que você me informar seu WhatsApp, eu libero todos os detalhes técnicos para você. Qual é o seu número?`;
                } else {
                    botResponseContent = "Para eu começar a te ajudar, primeiro me diga qual o seu nome por favor?";
                    nextStep = 1; // Stay on name step
                }
                setCollectedData(updatedData);
            } else if (conversationStep === 2) {
                const extractedPhone = extractPhone(content);
                if (extractedPhone) {
                    updatedData.telefone = extractedPhone;
                    setCollectedData(updatedData);

                    // Recovery por telefone
                    try {
                        const { data, error } = await supabase.rpc('get_conversation_by_phone' as any, {
                            phone_number: extractedPhone
                        });

                        if (data && (data as any[]).length > 0 && !error) {
                            const existingConv = (data as any[])[0];
                            if (existingConv.session_id !== sessionId) {
                                const recoveredMessages = (existingConv.historico_conversa as any[]).map(m => ({
                                    ...m,
                                    timestamp: new Date(m.timestamp)
                                }));
                                setMessages(recoveredMessages);
                                setCollectedData(existingConv.dados_coletados || {});
                                setSessionId(existingConv.session_id);
                                if (existingConv.agent_name || existingConv.agent_phone) {
                                    setAgentInfo({ name: existingConv.agent_name, phone: existingConv.agent_phone });
                                }
                                setIsFinished(existingConv.status === "Vendido" || existingConv.status === "arquivado" || existingConv.status === "finalizado");
                                setConversationStep(3);
                                setIsTyping(false);
                                return;
                            }
                        }
                    } catch (err) {
                        console.error("Error recovering by phone:", err);
                    }

                    // Se passou, manda pra IA
                    botResponseContent = await getAIResponse(updatedMessages);
                    saveToSupabase(updatedData, "Novo");
                } else {
                    botResponseContent = "Por favor, me informe um número de telefone/WhatsApp válido (com DDD) para prosseguirmos.";
                    nextStep = 2; // Stay on phone step
                }
            } else {
                botResponseContent = await getAIResponse(updatedMessages);

                const botMessage: Message = {
                    id: crypto.randomUUID(),
                    role: "bot",
                    content: botResponseContent,
                    timestamp: new Date(),
                };

                const completeHistory = [...updatedMessages, botMessage];
                saveToSupabase(updatedData, "em_andamento", completeHistory);

                setMessages(completeHistory);
                setIsTyping(false);
                setConversationStep(nextStep);
                return;
            }

            const botMessage: Message = {
                id: crypto.randomUUID(),
                role: "bot",
                content: botResponseContent,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
            setIsTyping(false);
            setConversationStep(nextStep);
        },
        [conversationStep, getAIResponse, saveToSupabase, collectedData, messages, sessionId, isFinished]
    );

    return {
        messages,
        isOpen,
        isTyping,
        isFinished,
        sessionId,
        agentInfo,
        toggleChat,
        sendMessage,
        reactivateChat
    };
};
