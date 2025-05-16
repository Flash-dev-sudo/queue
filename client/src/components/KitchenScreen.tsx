import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/ui/hero-section";
import OrderCard from "@/components/OrderCard";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { FullOrder, OrderStatus } from "@shared/schema";

export default function KitchenScreen() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [newOrderId, setNewOrderId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Fetch active orders
  const { 
    data: activeOrders, 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: ['/api/orders/active'],
  });
  
  // Setup WebSocket listener
  const { sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "order_update") {
        // Update order in the list
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(order => order.id === data.order.id);
          if (index === -1) {
            return [data.order, ...prevOrders];
          }
          
          const updatedOrders = [...prevOrders];
          updatedOrders[index] = data.order;
          return updatedOrders;
        });
      } else if (data.type === "new_order") {
        // Add new order to the list and highlight it
        setOrders(prevOrders => [data.order, ...prevOrders]);
        setNewOrderId(data.order.id);
        
        // Remove highlight after 5 seconds
        setTimeout(() => {
          setNewOrderId(null);
        }, 5000);
      } else if (data.type === "active_orders" && Array.isArray(data.orders)) {
        // Update all active orders
        setOrders(data.orders);
      }
    },
    isKitchen: true,
  });
  
  // Initialize orders from API data
  useEffect(() => {
    if (activeOrders && Array.isArray(activeOrders)) {
      setOrders(activeOrders);
    }
  }, [activeOrders]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load active orders. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Handle order status update
  const handleUpdateStatus = (orderId: number, status: string) => {
    // Send status update via WebSocket
    sendMessage({
      type: 'update_status',
      orderId,
      status
    });
  };
  
  // Filter orders based on showHistory setting
  const filteredOrders = showHistory 
    ? orders 
    : orders.filter(order => 
        order.status === OrderStatus.NEW || 
        order.status === OrderStatus.PREPARING || 
        order.status === OrderStatus.READY || 
        order.status === OrderStatus.SERVED
      );
  
  // Alert staff (play notification sound)
  const alertStaff = () => {
    const audio = new Audio("https://cdn.freesound.org/previews/234/234524_4019029-lq.mp3");
    audio.volume = 0.7;
    audio.play();
    
    toast({
      title: "Staff Alert",
      description: "Staff has been notified",
      variant: "default",
    });
  };
  
  return (
    <div className="screen-container w-full overflow-hidden">
      {/* Kitchen header */}
      <HeroSection 
        title="Kitchen Display"
        backgroundUrl="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=400"
        height="h-28"
      />

      {/* Orders grid */}
      <div className="bg-neutral-200 p-4 kitchen-container">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold">
            {showHistory ? "Order History" : "Active Orders"}
          </h2>
          <div>
            <Button
              variant={showHistory ? "default" : "outline"}
              className="mr-2"
              onClick={() => setShowHistory(!showHistory)}
            >
              <span className="material-icons text-sm align-middle mr-1">
                {showHistory ? "view_list" : "history"}
              </span>
              {showHistory ? "Active Orders" : "History"}
            </Button>
            <Button
              variant="destructive"
              onClick={alertStaff}
            >
              <span className="material-icons text-sm align-middle mr-1">notifications</span>
              Alert Staff
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow p-6">
            <span className="material-icons text-4xl text-neutral-300 mb-2">receipt_long</span>
            <h3 className="text-xl font-medium mb-2">No Orders</h3>
            <p className="text-neutral-500">
              {showHistory 
                ? "No order history available" 
                : "No active orders at the moment"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isNew={order.id === newOrderId}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
