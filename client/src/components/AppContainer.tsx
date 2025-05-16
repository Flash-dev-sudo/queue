import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";

interface AppContainerProps {
  children: React.ReactNode;
  currentScreen: "order" | "kitchen";
  onScreenChange: (screen: "order" | "kitchen") => void;
}

export default function AppContainer({ 
  children, 
  currentScreen, 
  onScreenChange 
}: AppContainerProps) {
  const { toast } = useToast();
  
  // Initialize WebSocket connection
  useWebSocket({
    onOpen: () => {
      console.log("WebSocket connection established");
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Some features may be unavailable.",
        variant: "destructive",
      });
    },
    onMessage: (data) => {
      // Handle incoming WebSocket messages
      if (data.type === "new_order" && currentScreen === "kitchen") {
        // Play notification sound for new orders in kitchen view
        const audio = new Audio("https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3");
        audio.volume = 0.5;
        audio.play();
        
        toast({
          title: "New Order!",
          description: `Order #${data.order.orderNumber} has arrived`,
          variant: "default",
        });
      }
    },
    isKitchen: currentScreen === "kitchen",
  });

  return (
    <div className="bg-neutral-100 min-h-screen">
      {/* Navigation for demo purposes */}
      <nav className="bg-secondary text-white p-2 flex justify-between items-center">
        <h1 className="font-heading font-bold text-xl">Emparo Food</h1>
        <div className="space-x-4">
          <button 
            onClick={() => onScreenChange("order")}
            className={`px-3 py-1 rounded font-medium ${
              currentScreen === "order" 
                ? "bg-primary text-white" 
                : "bg-neutral-200 text-secondary"
            }`}
          >
            Order Screen
          </button>
          <button 
            onClick={() => onScreenChange("kitchen")}
            className={`px-3 py-1 rounded font-medium ${
              currentScreen === "kitchen" 
                ? "bg-primary text-white" 
                : "bg-neutral-200 text-secondary"
            }`}
          >
            Kitchen Screen
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex w-full">
        {children}
      </div>
    </div>
  );
}
