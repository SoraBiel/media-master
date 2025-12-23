import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  RotateCcw,
  Play,
  MessageSquare,
  Smartphone,
} from "lucide-react";
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

interface FunnelSandboxProps {
  funnelName: string;
  nodes: FunnelNode[];
  edges: FunnelEdge[];
}

export const FunnelSandbox = ({ funnelName, nodes, edges }: FunnelSandboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        return true;
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
        return true;
      }

      case "question_number": {
        const text = replaceVariables(node.data.questionText || "");
        addBotMessage(text);
        setCurrentNodeId(node.id);
        setIsSimulating(false);
        return true;
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
        const seconds = Math.min(node.data.seconds || 2, 5);
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

      case "remarketing": {
        const type = node.data.remarketingType || 'inactivity';
        const delay = node.data.remarketingDelay || 24;
        const message = replaceVariables(node.data.remarketingMessage || '');
        const maxAttempts = node.data.remarketingMaxAttempts || 3;
        
        addBotMessage(`🔄 [Remarketing Configurado]\nTipo: ${type}\nAtraso: ${delay}h\nTentativas: ${maxAttempts}\nMensagem: "${message}"`);
        
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
    if (nodes.length === 0) {
      toast.error("Adicione blocos ao funil primeiro");
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

    const varName = currentNode.data.variableName;
    if (varName) {
      setVariables((prev) => ({ ...prev, [varName]: messageText }));
    }

    let sourceHandle: string | undefined;
    if (currentNode.type === "question_choice") {
      sourceHandle = messageText;
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

  const handleButtonClick = (buttonId: string) => {
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
        <Button variant="outline" size="sm" className="gap-2">
          <Smartphone className="w-4 h-4" />
          Testar
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b bg-card">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Testar: {funnelName}
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 border-b bg-secondary/20">
          <div className="flex gap-2">
            <Button
              variant="gradient"
              className="flex-1"
              onClick={startSimulation}
              disabled={isSimulating}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Simulação
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

        {/* Chat Area */}
        <ScrollArea className="flex-1 bg-[#0e1621]">
          <div className="p-4 space-y-3 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-center">
                  Clique em <Play className="w-4 h-4 inline" /> Iniciar Simulação para testar
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
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.mediaUrl && (
                        <div className="mb-2 rounded overflow-hidden">
                          {msg.mediaType === "video" ? (
                            <video src={msg.mediaUrl} controls className="max-w-full" />
                          ) : (
                            <img src={msg.mediaUrl} alt="" className="max-w-full" />
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.buttons.map((btn) => (
                            <Button
                              key={btn.id}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => handleButtonClick(btn.id)}
                              disabled={isSimulating || currentNodeId === null}
                            >
                              {btn.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={!currentNodeId || isSimulating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              onClick={() => handleSendMessage()}
              disabled={!currentNodeId || isSimulating || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Variables Debug */}
          {Object.keys(variables).length > 0 && (
            <div className="mt-3 p-2 bg-secondary/50 rounded text-xs">
              <p className="font-medium mb-1 text-muted-foreground">Variáveis:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(variables).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {String(value)}
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
