import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/pages/Chat";
import { User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, isLoading, messagesEndRef }: ChatMessagesProps) => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <Bot className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Start a Conversation</h2>
            <p className="text-muted-foreground max-w-md">
              Ask me anything! I'm here to help with information, creative tasks, coding, and more.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 items-start",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-[80%] break-words",
                message.role === "user"
                  ? "bg-user-message text-user-message-foreground"
                  : "bg-assistant-message text-assistant-message-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-assistant-message">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;