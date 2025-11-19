import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MessageSquare, Trash2, X, Sparkles } from "lucide-react";
import { Chat } from "@/pages/Chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatSidebar = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onClose,
}: ChatSidebarProps) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">AI Chat</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2"
            variant="default"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                  currentChatId === chat.id
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">{chat.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default ChatSidebar;