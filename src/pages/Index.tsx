import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Zap, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/chat");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-block p-3 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            AI Chat Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of AI with real-time conversations powered by advanced language models
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-xl bg-card border border-border space-y-3">
            <MessageSquare className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-semibold text-lg">Natural Conversations</h3>
            <p className="text-sm text-muted-foreground">
              Chat naturally with AI that understands context and provides helpful responses
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border space-y-3">
            <Zap className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-semibold text-lg">Fast & Reliable</h3>
            <p className="text-sm text-muted-foreground">
              Get instant responses with streaming messages for a seamless experience
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border space-y-3">
            <Shield className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-semibold text-lg">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your conversations are protected with authentication and encryption
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
