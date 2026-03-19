import { useState, useCallback, useRef } from "react";
import { chatService } from "../services/chatService";
import toast from "react-hot-toast";

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const abortRef = useRef(null);

  const addMessage = (role, content, extra = {}) => {
    const msg = {
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date(),
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const sendMessage = useCallback(
    async (text, clearHistory = false) => {
      if (!text?.trim() || isLoading) return;

      // Add user message immediately
      addMessage("user", text.trim());
      setIsLoading(true);
      setIsEmergency(false);

      if (clearHistory) setMessages([]);

      try {
        const { data } = await chatService.sendMessage(
          text.trim(),
          clearHistory,
        );
        const { message, isEmergency: emergency } = data.data;

        addMessage("assistant", message, { isEmergency: emergency });
        if (emergency) setIsEmergency(true);

        return { success: true, isEmergency: emergency };
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "AI is temporarily unavailable. Please try again.";
        addMessage("assistant", msg, { isError: true });
        toast.error("AI response failed");
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const clearChat = useCallback(async () => {
    setMessages([]);
    setIsEmergency(false);
    try {
      await chatService.clearHistory();
    } catch {}
  }, []);

  const addWelcomeMessage = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hi! I'm **HealthBot**, your AI health assistant.\n\nI can help you with:\n- **Symptom assessment** — describe how you're feeling\n- **Health education** — understand conditions and medications\n- **Vitals interpretation** — explain your BP, glucose, BMI\n- **Preventive tips** — personalised health advice\n\n⚠️ *I'm not a substitute for professional medical care. Always consult your doctor for diagnosis and treatment.*\n\nHow can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    isEmergency,
    sendMessage,
    clearChat,
    addWelcomeMessage,
  };
};
