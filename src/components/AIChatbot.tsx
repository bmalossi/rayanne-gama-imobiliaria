import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2, RefreshCcw, Minus, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/services/supabase";
import { useChatbot } from "@/hooks/useChatbot";

const URL_REGEX = /(https?:\/\/[^\s,;)"']+)/g;

function renderMessageContent(content: string) {
    const parts = content.split(URL_REGEX);
    return parts.map((part, i) =>
        URL_REGEX.test(part) ? (
            <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium break-all cursor-pointer text-blue-500 hover:text-blue-700"
                title={part}
            >
                {part}
            </a>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

export function AIChatbot() {
    const [isActive, setIsActive] = useState<boolean | null>(null);
    const [input, setInput] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // State to confirm phone retrieval
    const [phoneInput, setPhoneInput] = useState("");
    const [isConfirmingPhone, setIsConfirmingPhone] = useState(false);

    const {
        messages,
        isOpen,
        isTyping,
        isFinished,
        agentInfo,
        toggleChat: toggleChatHook,
        sendMessage,
        reactivateChat
    } = useChatbot();

    const checkStatus = async () => {
        try {
            const { data, error } = await supabase.rpc('is_chatbot_active' as any);
            if (error) throw error;
            setIsActive(data);
        } catch (err) {
            console.error("Error fetching chatbot status:", err);
            setIsActive(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    // Scroll to bottom
    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollRef.current) {
                const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
                }
            }
        };

        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim() || isTyping || isFinished) return;
        sendMessage(input);
        setInput("");
    };

    const toggleChat = useCallback(() => {
        setIsMinimized(false);
        toggleChatHook();
    }, [toggleChatHook]);

    const handleOpenWhatsApp = () => {
        setIsMenuOpen(false);
        window.open(
            "https://wa.me/5513997685529?text=Ol%C3%A1%2C%20quero%20conversar%20sobre%20im%C3%B3veis",
            "_blank",
            "noopener,noreferrer"
        );
    };

    const handleOpenChat = () => {
        setIsMenuOpen(false);
        setIsMinimized(false);
        toggleChatHook();
    };

    const handleReactivateClick = () => {
        setIsConfirmingPhone(true);
    };

    const handleConfirmPhone = (e: React.FormEvent) => {
        e.preventDefault();
        if (reactivateChat(phoneInput)) {
            setIsConfirmingPhone(false);
            setPhoneInput("");
        }
    };

    const handleCancelReactivate = () => {
        setIsConfirmingPhone(false);
        setPhoneInput("");
    };

    if (isActive === false || isActive === null) {
        return null;
    }

    return (
        <>
            {isMenuOpen && !isOpen && (
                <div
                    className="fixed inset-0 z-[99]"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
            <div className="fixed bottom-6 right-6 z-[100]">
                <AnimatePresence>
                    {!isOpen && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <div className="flex flex-col items-end gap-3">
                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <>
                                            {/* Botão WhatsApp */}
                                            <motion.div
                                                key="whatsapp"
                                                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 12, scale: 0.9 }}
                                                transition={{ duration: 0.15 }}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-border whitespace-nowrap">
                                                    WhatsApp
                                                </span>
                                                <button
                                                    onClick={handleOpenWhatsApp}
                                                    className="h-12 w-12 rounded-full bg-[#25D366] hover:bg-[#20b857] text-white shadow-lg flex items-center justify-center transition-colors cursor-pointer"
                                                    aria-label="Abrir WhatsApp"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                </button>
                                            </motion.div>

                                            {/* Botão Chat */}
                                            <motion.div
                                                key="chat"
                                                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 12, scale: 0.9 }}
                                                transition={{ duration: 0.15, delay: 0.05 }}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-border whitespace-nowrap">
                                                    {messages.length > 0 ? "Continuar conversa" : "Falar aqui mesmo"}
                                                </span>
                                                <Button
                                                    onClick={handleOpenChat}
                                                    className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center cursor-pointer"
                                                    aria-label="Abrir chat"
                                                >
                                                    <MessageSquare className="h-5 w-5" />
                                                </Button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Botão flutuante principal */}
                                <Button
                                    onClick={() => setIsMenuOpen((prev) => !prev)}
                                    className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground group relative cursor-pointer"
                                >
                                    <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background"></span>
                                    </span>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.95 }}
                            animate={{
                                y: 0,
                                opacity: 1,
                                scale: 1,
                                height: isMinimized ? "64px" : "520px"
                            }}
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="flex flex-col w-[90vw] sm:w-[380px] bg-card/95 border border-border shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Bot className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground leading-none">Rayanne AI</h3>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Especialista Digital</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMinimized(!isMinimized)}
                                        className="rounded-full h-8 w-8 hover:bg-secondary text-muted-foreground"
                                        title={isMinimized ? "Expandir" : "Minimizar"}
                                    >
                                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={toggleChat} className="rounded-full h-8 w-8 hover:bg-secondary text-muted-foreground">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {!isMinimized && (
                                    <motion.div
                                        className="flex flex-col flex-1 min-h-0"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {/* Chat Area */}
                                        <ScrollArea className="flex-1 p-4 overflow-y-auto bg-dot-pattern" ref={scrollRef}>
                                            <div className="space-y-4 pb-4">
                                                {messages.map((msg, i) => (
                                                    <motion.div
                                                        key={msg.id || i}
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div className={`flex gap-2 max-w-[80%] min-w-0 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border mt-auto ${msg.role === "user" ? "bg-secondary border-border" : "bg-primary/10 border-primary/20"}`}>
                                                                {msg.role === "user" ? <User className="h-4 w-4 text-muted-foreground" /> : <Bot className="h-4 w-4 text-primary" />}
                                                            </div>
                                                            <div className={`rounded-2xl p-3 text-sm leading-relaxed shadow-sm break-words overflow-hidden min-w-0 ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary/50 text-foreground rounded-bl-none border border-border/40"}`}>
                                                                {renderMessageContent(msg.content)}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}

                                                {/* Loading Indicator */}
                                                {isTyping && (
                                                    <div className="flex justify-start">
                                                        <div className="flex gap-2 items-center bg-secondary/50 rounded-2xl p-3 border border-border/40 min-w-[60px] justify-center rounded-bl-none ml-10">
                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>

                                        {/* Input Area container */}
                                        <div className="p-4 border-t border-border bg-background/50">
                                            {isFinished ? (
                                                <div className="space-y-3">
                                                    {isConfirmingPhone ? (
                                                        <form onSubmit={handleConfirmPhone} className="flex flex-col gap-2 animate-fade-in">
                                                            <p className="text-xs font-medium text-foreground mb-1 text-center">
                                                                Confirme seu telefone para reativar:
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="text"
                                                                    value={phoneInput}
                                                                    onChange={(e) => setPhoneInput(e.target.value)}
                                                                    placeholder="(13) 99999-9999"
                                                                    autoFocus
                                                                    className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                                />
                                                                <Button type="submit" size="default">
                                                                    Reabrir
                                                                </Button>
                                                            </div>
                                                            <Button type="button" variant="link" size="sm" onClick={handleCancelReactivate} className="text-[10px] h-4">
                                                                Cancelar
                                                            </Button>
                                                        </form>
                                                    ) : (
                                                        <div className="text-center p-3 bg-secondary/50 rounded-xl border border-border/50">
                                                            <p className="text-xs font-medium text-foreground mb-1">O atendimento via IA foi encerrado.</p>
                                                            <p className="text-[11px] text-muted-foreground mb-3">
                                                                Nossa equipe entrará em contato em breve.
                                                            </p>
                                                            <Button onClick={handleReactivateClick} variant="outline" size="sm" className="w-full gap-2 rounded-full border-primary/20 text-primary">
                                                                <RefreshCcw className="h-3 w-3" />
                                                                Reativar Chat (Já sou cliente)
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 relative">
                                                    <Input
                                                        value={input}
                                                        onChange={(e) => setInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                                        placeholder="Sua mensagem..."
                                                        disabled={isTyping}
                                                        className="rounded-full bg-secondary border-transparent focus-visible:ring-primary h-11 pr-12"
                                                    />
                                                    <Button
                                                        onClick={handleSend}
                                                        disabled={isTyping || !input.trim()}
                                                        className="absolute right-1 top-1 bottom-1 h-9 w-9 rounded-full p-0 flex items-center justify-center transition-all bg-primary hover:bg-primary/90"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-center mt-3 text-muted-foreground uppercase tracking-tighter">
                                                Powered by{" "}
                                                <a
                                                    href="https://automab.dev"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline"
                                                >
                                                    AUTOMAB.DEV
                                                </a>
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
