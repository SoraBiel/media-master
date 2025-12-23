import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bot,
  Send,
  User,
  Loader2,
  RotateCcw,
  Play,
  MessageSquare,
  Smartphone,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  buttons?: Array<{ id: string; label: string }>;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  timestamp: Date;
}

interface Funnel {
  id: string;
  name: string;
  telegram_integration_id: string | null;
  is_active: boolean;
}

interface FunnelNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface FunnelEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export const TelegramSandbox = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [nodes, setNodes] = useState<FunnelNode[]>([]);
  const [edges, setEdges] = useState<FunnelEdge[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch funnels on open
  useEffect(() => {
    if (isOpen && user) {
      fetchFunnels();
    }
  }, [isOpen, user]);

  const fetchFunnels = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("funnels")
      .select("id, name, telegram_integration_id, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching funnels:", error);
      return;
    }

    setFunnels(data || []);
  };

  const loadFunnel = async (funnelId: string) => {
    setSelectedFunnelId(funnelId);
    setMessages([]);
    setCurrentNodeId(null);
    setVariables({ nome: "Usuário Teste", user_id: "sandbox_user", chat_id: "sandbox_chat" });

    // Load nodes and edges
    const [nodesRes, edgesRes] = await Promise.all([
      supabase.from("funnel_nodes").select("*").eq("funnel_id", funnelId),
      supabase.from("funnel_edges").select("*").eq("funnel_id", funnelId),
    ]);

    if (nodesRes.error || edgesRes.error) {
      toast.error("Erro ao carregar funil");
      return;
    }

    const loadedNodes: FunnelNode[] = (nodesRes.data || []).map((n: any) => ({
      id: n.id,
      type: n.node_type,
      data: n.content || {},
    }));

    const loadedEdges: FunnelEdge[] = (edgesRes.data || []).map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      sourceHandle: e.source_handle,
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);

    toast.success("Funil carregado! Clique em Iniciar para simular.");
  };

  const findNextNode = (currentId: string, sourceHandle?: string): FunnelNode | undefined => {
    const edge = edges.find((e) => {
      if (e.source !== currentId) return false;
      if (sourceHandle && e.sourceHandle) return e.sourceHandle === sourceHandle;
      return true;
    });

    if (!edge) return undefined;
    return nodes.find((n) => n.id === edge.target);
  };

  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  };

  const addBotMessage = (content: string, buttons?: Array<{ id: string; label: string }>, mediaUrl?: string, mediaType?: "image" | "video") => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: "bot",
      content,
      buttons,
      mediaUrl,
      mediaType,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const processNode = async (node: FunnelNode): Promise<boolean> => {
    setIsSimulating(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    switch (node.type) {
      case "start":
        const nextFromStart = findNextNode(node.id);
        if (nextFromStart) {
          return await processNode(nextFromStart);
        }
        break;

      case "message":
      case "action_message": {
        const text = replaceVariables(node.data.text || "");
        const mediaUrl = node.data.mediaUrl;
        const mediaType = node.data.mediaType;

        addBotMessage(text, undefined, mediaUrl, mediaType);

        const nextNode = findNextNode(node.id);
        if (nextNode) {
          return await processNode(nextNode);
        }
        break;
      }

      case "question": {
        const text = replaceVariables(node.data.questionText || "");
        addBotMessage(text);
        setCurrentNodeId(node.id);
        setIsSimulating(false);
        return true; // Wait for user input
      }

      case "question_choice": {
        const text = replaceVariables(node.data.questionText || "");
        const choices = (node.data.choices || []).map((c: any) => ({
          id: c.id,
          label: c.label,
        }));
        addBotMessage(text, choices);
        setCurrentNodeId(node.id);
        setIsSimulating(false);
        return true; // Wait for user input
      }

      case "question_number": {
        const text = replaceVariables(node.data.questionText || "");
        addBotMessage(text);
        setCurrentNodeId(node.id);
        setIsSimulating(false);
        return true; // Wait for user input
      }

      case "condition": {
        const { variable, operator, value } = node.data;
        const actualValue = variables[variable];
        let result = false;

        switch (operator) {
          case "equals":
            result = String(actualValue) === String(value);
            break;
          case "not_equals":
            result = String(actualValue) !== String(value);
            break;
          case "contains":
            result = String(actualValue).includes(String(value));
            break;
          case "greater":
            result = Number(actualValue) > Number(value);
            break;
          case "less":
            result = Number(actualValue) < Number(value);
            break;
          case "exists":
            result = actualValue !== undefined && actualValue !== null && actualValue !== "";
            break;
          case "empty":
            result = actualValue === undefined || actualValue === null || actualValue === "";
            break;
        }

        const handle = result ? "true" : "false";
        const nextNode = findNextNode(node.id, handle);
        if (nextNode) {
          return await processNode(nextNode);
        }
        break;
      }

      case "delay": {
        const seconds = Math.min(node.data.seconds || 2, 5); // Max 5 seconds in sandbox
        addBotMessage(`⏳ Aguardando ${seconds}s...`);
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        const nextNode = findNextNode(node.id);
        if (nextNode) {
          return await processNode(nextNode);
        }
        break;
      }

      case "variable": {
        if (node.data.action === "set") {
          const varName = node.data.variableName;
          const varValue = replaceVariables(node.data.varValue || "");
          if (varName) {
            setVariables((prev) => ({ ...prev, [varName]: varValue }));
          }
        } else if (node.data.action === "clear") {
          const varName = node.data.variableName;
          if (varName) {
            setVariables((prev) => {
              const newVars = { ...prev };
              delete newVars[varName];
              return newVars;
            });
          }
        }
        const nextNode = findNextNode(node.id);
        if (nextNode) {
          return await processNode(nextNode);
        }
        break;
      }

      case "action_notify": {
        const text = replaceVariables(node.data.text || "");
        addBotMessage(`📢 [Notificação Admin]: ${text}`);
        const nextNode = findNextNode(node.id);
        if (nextNode) {
          return await processNode(nextNode);
        }
        break;
      }

      case "end": {
        addBotMessage("🏁 Funil finalizado!");
        setCurrentNodeId(null);
        setIsSimulating(false);
        return false;
      }

      default: {
        const nextNode = findNextNode(node.id);
        if (nextNode) {
          return await processNode(nextNode);
        }
      }
    }

    setIsSimulating(false);
    return false;
  };

  const startSimulation = async () => {
    if (!selectedFunnelId) {
      toast.error("Selecione um funil primeiro");
      return;
    }

    setMessages([]);
    setVariables({ nome: "Usuário Teste", user_id: "sandbox_user", chat_id: "sandbox_chat" });

    const startNode = nodes.find((n) => n.type === "start");
    if (!startNode) {
      toast.error("Funil não tem nó de início");
      return;
    }

    addUserMessage("/start");
    await processNode(startNode);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || !currentNodeId) return;

    setInputValue("");
    addUserMessage(messageText);

    const currentNode = nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) return;

    // Save variable if applicable
    const varName = currentNode.data.variableName;
    if (varName) {
      setVariables((prev) => ({ ...prev, [varName]: messageText }));
    }

    // Find next node based on response
    let sourceHandle: string | undefined;
    if (currentNode.type === "question_choice") {
      sourceHandle = messageText; // The button ID
    }

    const nextNode = findNextNode(currentNodeId, sourceHandle);
    if (nextNode) {
      await processNode(nextNode);
    } else {
      setCurrentNodeId(null);
      setIsSimulating(false);
      addBotMessage("🏁 Funil finalizado!");
    }
  };

  const handleButtonClick = (buttonId: string, buttonLabel: string) => {
    handleSendMessage(buttonId);
  };

  const resetSimulation = () => {
    setMessages([]);
    setCurrentNodeId(null);
    setVariables({ nome: "Usuário Teste", user_id: "sandbox_user", chat_id: "sandbox_chat" });
    setIsSimulating(false);
    toast.success("Simulação reiniciada");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Smartphone className="w-4 h-4" />
          Testar Bot
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b bg-card">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-telegram" />
            Sandbox Telegram
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 border-b bg-secondary/20">
          <div className="flex gap-2">
            <Select value={selectedFunnelId} onValueChange={loadFunnel}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um funil..." />
              </SelectTrigger>
              <SelectContent>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    <div className="flex items-center gap-2">
                      <span>{funnel.name}</span>
                      {funnel.is_active && (
                        <Badge variant="outline" className="text-xs">Ativo</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="gradient"
              size="icon"
              onClick={startSimulation}
              disabled={!selectedFunnelId || isSimulating}
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetSimulation}
              disabled={isSimulating}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Area - Telegram Style */}
        <ScrollArea className="flex-1 bg-[#0e1621]">
          <div className="p-4 space-y-3 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-center">
                  Selecione um funil e clique em{" "}
                  <Play className="w-4 h-4 inline" /> para iniciar a simulação
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-telegram text-white rounded-br-none"
                          : "bg-[#182533] text-white rounded-bl-none"
                      }`}
                    >
                      {msg.mediaUrl && (
                        <div className="mb-2 rounded overflow-hidden">
                          {msg.mediaType === "video" ? (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-w-full h-auto"
                            />
                          ) : (
                            <img
                              src={msg.mediaUrl}
                              alt="Media"
                              className="max-w-full h-auto"
                            />
                          )}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.buttons.map((btn) => (
                            <Button
                              key={btn.id}
                              variant="outline"
                              size="sm"
                              className="w-full bg-transparent border-telegram/50 text-telegram hover:bg-telegram/20"
                              onClick={() => handleButtonClick(btn.id, btn.label)}
                              disabled={isSimulating || currentNodeId === null}
                            >
                              {btn.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-white/50 mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {isSimulating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-[#182533] rounded-lg p-3 rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-telegram" />
                    <span className="text-sm text-white/70">Digitando...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                currentNodeId
                  ? "Digite sua resposta..."
                  : "Inicie a simulação primeiro"
              }
              disabled={!currentNodeId || isSimulating}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="gradient"
              size="icon"
              disabled={!currentNodeId || isSimulating || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Variables Debug */}
          {Object.keys(variables).length > 0 && (
            <div className="mt-3 p-2 bg-secondary/30 rounded text-xs">
              <p className="font-medium text-muted-foreground mb-1">Variáveis:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(variables).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value).slice(0, 20)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
