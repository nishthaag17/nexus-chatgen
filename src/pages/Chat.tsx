import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Chat = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

const Chat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentChatId || !user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.role === 'assistant') {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChatId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading chats:", error);
      toast.error("Failed to load chats");
      return;
    }

    setChats(data || []);
    
    if (data && data.length > 0 && !currentChatId) {
      setCurrentChatId(data[0].id);
    }
  };

  const loadMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
      return;
    }

    const typedMessages: Message[] = (data || []).map(m => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      created_at: m.created_at,
    }));

    setMessages(typedMessages);
  };

  const createNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();

    if (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create new chat");
      return;
    }

    setChats([data, ...chats]);
    setCurrentChatId(data.id);
    setMessages([]);
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId);

    if (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
      return;
    }

    const remainingChats = chats.filter(c => c.id !== chatId);
    setChats(remainingChats);
    
    if (currentChatId === chatId) {
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }

    toast.success("Chat deleted");
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentChatId || !content.trim()) return;

    setIsLoading(true);

    try {
      const userMessage = {
        chat_id: currentChatId,
        user_id: user.id,
        role: "user" as const,
        content: content.trim(),
      };

      const { data: savedMessage, error: saveError } = await supabase
        .from("messages")
        .insert(userMessage)
        .select()
        .single();

      if (saveError) throw saveError;

      const typedUserMessage: Message = {
        id: savedMessage.id,
        role: "user",
        content: savedMessage.content,
        created_at: savedMessage.created_at,
      };

      setMessages(prev => [...prev, typedUserMessage]);

      const allMessages = [...messages, typedUserMessage];
      const formattedMessages = allMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      let assistantContent = "";
      const tempMessageId = `temp-${Date.now()}`;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: formattedMessages,
            chatId: currentChatId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No response body");

      setMessages(prev => [...prev, {
        id: tempMessageId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === tempMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch (e) {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const { data: finalMessage, error: finalError } = await supabase
        .from("messages")
        .insert({
          chat_id: currentChatId,
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
        })
        .select()
        .single();

      if (finalError) throw finalError;

      const typedFinalMessage: Message = {
        id: finalMessage.id,
        role: "assistant",
        content: finalMessage.content,
        created_at: finalMessage.created_at,
      };

      setMessages(prev => prev.map(m => 
        m.id === tempMessageId ? typedFinalMessage : m
      ));

      const firstWords = content.trim().split(' ').slice(0, 5).join(' ');
      const newTitle = firstWords.length < content.length ? `${firstWords}...` : firstWords;
      
      await supabase
        .from("chats")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", currentChatId);

      loadChats();

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {chats.find(c => c.id === currentChatId)?.title || "AI Chat"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          onSendMessage={sendMessage}
          disabled={isLoading || !currentChatId}
        />
      </div>
    </div>
  );
};

export default Chat;