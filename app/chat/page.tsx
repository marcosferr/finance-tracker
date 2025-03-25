"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FinancialInsights } from "@/components/financial-insights";
import { ChatSuggestions } from "@/components/chat-suggestions";
import { processChatQuery } from "@/lib/chat-processor";
import type { ChatMessage as ChatMessageType } from "@/types/finance";
import { apiService } from "@/lib/api-service";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your financial assistant. Ask me anything about your finances, spending habits, or budget management.",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isProcessing) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      content: <MessageSkeleton />,
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Process the query using our chat processor
      const response = await processChatQuery(input);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                id: msg.id,
                content: response.content,
                role: "assistant",
                timestamp: new Date(),
                category: response.category,
              }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                id: msg.id,
                content:
                  "I'm sorry, I encountered an error processing your request. Please try again.",
                role: "assistant",
                timestamp: new Date(),
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="flex-1 p-4 pt-6 md:p-8">
      <div className="grid h-[calc(100vh-8rem)] gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="flex h-full flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-14">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>Financial Assistant</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="chat"
                className="flex-1 flex flex-col p-0 m-0"
              >
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      ref={inputRef}
                      placeholder="Ask about your finances..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1"
                      disabled={isProcessing}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isProcessing || input.trim() === ""}
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="hidden md:flex flex-col gap-4">
          <FinancialInsights />
          <ChatSuggestions onSelectQuestion={handleSuggestedQuestion} />
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: ChatMessageType }) {
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        message.role === "user" ? "ml-auto" : "mr-auto"
      )}
    >
      {message.role === "assistant" && (
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "rounded-lg p-3",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <div className="space-y-2">
            {message.category && (
              <Badge variant="outline" className="mb-1">
                {message.category}
              </Badge>
            )}
            <div className="prose prose-sm dark:prose-invert">
              {message.content}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {message.role === "user" && (
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  );
}
