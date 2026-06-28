import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Leaf, X, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "coupon-chat-history";
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://vbnbacowuoeeojjdrzzp.supabase.co";

const SUGGESTIONS = [
  "Show me active campaigns",
  "Where does my money go?",
  "Top donors this week",
  "How does CouponDonation work?",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function loadHistory(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AITreeChat({ open, onClose }: Props) {
  const [initialMessages] = useState<UIMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const transportRef = useRef(
    new DefaultChatTransport({ api: `${SUPABASE_URL}/functions/v1/coupon-chat` }),
  );

  const { messages, sendMessage, status, setMessages, stop, error } = useChat({
    id: "coupon-chat",
    messages: initialMessages,
    transport: transportRef.current,
  });

  // Persist to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (message: { text?: string; files?: any[] }) => {
    const text = (message.text ?? input).trim();
    if (!text || isLoading) return;
    void sendMessage({ text });
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    void sendMessage({ text });
  };

  const handleClear = () => {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-br from-emerald-500/10 to-emerald-700/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground leading-tight">Coupon</div>
              <div className="text-[10px] text-muted-foreground">
                Your AI guide to giving 🌿
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Clear chat"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Conversation */}
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="gap-4 p-4">
            {messages.length === 0 && (
              <ConversationEmptyState
                title="Hi! I'm Coupon 🌿"
                description="Ask me about active campaigns, transparency, or pick a cause to support."
                icon={<Leaf className="w-6 h-6 text-emerald-500" />}
              />
            )}

            {messages.map((message) => {
              const text = message.parts
                .map((p: any) => (p.type === "text" ? p.text : ""))
                .join("");
              const toolParts = message.parts.filter((p: any) =>
                String(p.type).startsWith("tool-"),
              );

              if (message.role === "user") {
                return (
                  <Message key={message.id} from="user">
                    <MessageContent className="bg-primary text-primary-foreground rounded-2xl px-3 py-2 text-sm">
                      {text}
                    </MessageContent>
                  </Message>
                );
              }

              return (
                <Message key={message.id} from="assistant">
                  <div className="space-y-2">
                    {toolParts.length > 0 && (
                      <ToolResults toolParts={toolParts} />
                    )}
                    {text && (
                      <MessageResponse className="text-sm text-foreground prose-sm max-w-none">
                        {text}
                      </MessageResponse>
                    )}
                  </div>
                </Message>
              );
            })}

            {status === "submitted" && (
              <Message from="assistant">
                <Shimmer>Thinking</Shimmer>
              </Message>
            )}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2">
                Something went wrong. Try again.
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <PromptInput onSubmit={handleSubmit} className="border-t border-border rounded-none">
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Coupon anything…"
            autoFocus
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() && !isLoading}
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  stop();
                }
              }}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function ToolResults({ toolParts }: { toolParts: any[] }) {
  return (
    <div className="space-y-2">
      {toolParts.map((part, i) => {
        const toolName = String(part.type).replace(/^tool-/, "");
        const output = part.output;
        const state = part.state;

        if (state !== "output-available" || !output) {
          return (
            <div
              key={i}
              className="text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2 py-1"
            >
              <Shimmer>{`Looking up ${toolName}`}</Shimmer>
            </div>
          );
        }

        if (toolName === "searchFundraisers" && Array.isArray(output.results)) {
          return (
            <div key={i} className="space-y-1.5">
              {output.results.map((r: any, j: number) => (
                <div
                  key={j}
                  className="rounded-lg border border-border bg-card p-2.5 hover:border-emerald-300 transition-colors"
                >
                  <div className="text-xs font-semibold text-foreground line-clamp-1">
                    {r.title}
                  </div>
                  {r.snippet && (
                    <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {r.snippet}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[10px] text-muted-foreground">
                      ${Math.round(r.raised)} raised
                      {r.goal ? ` of $${Math.round(r.goal)}` : ""}
                    </div>
                    <div className="flex gap-1">
                      {r.slug && (
                        <Button asChild size="sm" variant="outline" className="h-6 text-[10px] px-2">
                          <Link to={r.url}>View</Link>
                        </Button>
                      )}
                      <Button asChild size="sm" className="h-6 text-[10px] px-2">
                        <Link to={r.donateUrl}>Donate</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (toolName === "getImpactStats" && output) {
          return (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-2.5"
            >
              <Stat label="Lifetime raised" value={`$${Math.round(output.total_raised ?? 0)}`} />
              <Stat label="Coupons created" value={String(output.total_coupons ?? 0)} />
              <Stat label="Active campaigns" value={String(output.active_fundraisers ?? 0)} />
              <Stat label="Raised today" value={`$${Math.round(output.raised_today ?? 0)}`} />
            </div>
          );
        }

        if (toolName === "getTopDonors" && Array.isArray(output.donors)) {
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-2 space-y-1">
              {output.donors.slice(0, 5).map((d: any, j: number) => (
                <div key={j} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate">
                    {j + 1}. {d.display_name}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    ${Math.round(Number(d.total))}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        if (toolName === "explainTransparency" && Array.isArray(output.breakdown)) {
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-2.5 space-y-1.5">
              {output.breakdown.map((row: any, j: number) => (
                <div key={j} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{row.label}</span>
                  <span className="font-bold text-emerald-700">{row.percent}%</span>
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-emerald-700">{value}</div>
    </div>
  );
}
