import { describe, it, expect, vi } from "vitest";
import { ChatbotService } from "../../supabase/functions/chatbot-ai/services/chatbotService";

describe("ChatbotService", () => {
    it("should format messages correctly for OpenAI", async () => {
        const service = new ChatbotService();
        const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: "Olá!" } }] }),
        } as unknown as Response);

        const result = await service.generateResponse([{ role: "user", content: "Oi" }], "System Prompt", "fake-key");

        expect(result).toBe("Olá!");
        expect(fetchSpy).toHaveBeenCalled();
    });

    it("should throw error if API fails", async () => {
        const service = new ChatbotService();
        vi.spyOn(global, "fetch").mockResolvedValue({
            ok: false,
            statusText: "Unauthorized",
            json: async () => ({ error: { message: "Invalid key" } }),
        } as unknown as Response);

        await expect(service.generateResponse([], "", "fake-key")).rejects.toThrow("OpenAI API failed: Invalid key");
    });
});
