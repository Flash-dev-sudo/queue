import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/ui/hero-section";
import OrderCard from "@/components/OrderCard";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { FullOrder, OrderStatus } from "@shared/schema";
import { Link } from "wouter";

export default function KitchenScreen() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [newOrderId, setNewOrderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'analytics'>('active');
  
  // Fetch active orders
  const { 
    data: activeOrders, 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: ['/api/orders/active'],
  });

  // Fetch all orders for analytics/history view
  const { 
    data: allOrders, 
    isLoading: isLoadingAllOrders 
  } = useQuery({ 
    queryKey: ['/api/orders'],
    enabled: viewMode === 'analytics',
  });

  // Fetch popular items
  const { 
    data: popularItems, 
    isLoading: isLoadingPopular 
  } = useQuery({ 
    queryKey: ['/api/popular-items'],
    enabled: viewMode === 'analytics',
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
  
  // Initialize orders from API data based on view mode
  useEffect(() => {
    if (viewMode === 'analytics' && allOrders && Array.isArray(allOrders)) {
      setOrders(allOrders);
    } else if (viewMode === 'active' && activeOrders && Array.isArray(activeOrders)) {
      setOrders(activeOrders);
    }
  }, [activeOrders, allOrders, viewMode]);
  
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
  
  // Filter orders based on view mode
  const filteredOrders = viewMode === 'analytics'
    ? orders.filter(order => order.status === OrderStatus.SERVED)
    : orders.filter(order => 
        order.status === OrderStatus.NEW || 
        order.status === OrderStatus.PREPARING || 
        order.status === OrderStatus.READY
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
    <div className="min-h-screen flex flex-col">
      {/* Kitchen header */}
      <HeroSection 
        title="Kitchen Display"
        backgroundUrl="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=400"
        height="h-28"
      />

      {/* Orders grid */}
      <div className="bg-neutral-200 p-4 flex-1 overflow-y-auto">
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-heading font-bold text-gray-800">
              {viewMode === 'analytics' ? "Analytics & History" : "Active Orders"}
            </h2>
            
            {/* Navigation */}
            <Link href="/">
              <Button variant="outline" size="sm" className="ml-auto">
                🏠 Home
              </Button>
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'active' ? 'default' : 'outline'}
              className={viewMode === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setViewMode('active')}
            >
              📋 Active Orders
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'outline'}
              className={viewMode === 'analytics' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              onClick={() => setViewMode('analytics')}
            >
              📊 Analytics & History
            </Button>
            <Button
              variant="default"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                // Mark all active orders as served to clear them
                filteredOrders.forEach(order => {
                  handleUpdateStatus(order.id, OrderStatus.SERVED);
                });
                toast({
                  title: "Kitchen Screen Cleared",
                  description: "All orders have been cleared from the kitchen display",
                });
              }}
            >
              📝 Clear Screen
            </Button>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                window.location.reload();
              }}
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {viewMode === 'analytics' ? (
          <div className="space-y-6">
            {/* Popular Items Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-800">
                Most Popular Items (Last 30 Days)
              </h3>
              {isLoadingPopular ? (
                <div className="text-center py-4">
                  <p className="text-neutral-500">Loading popular items...</p>
                </div>
              ) : popularItems && Array.isArray(popularItems) && popularItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularItems.map((item: any, index: number) => (
                    <div 
                      key={item.itemName}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded border"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-neutral-800">{item.itemName}</p>
                          <p className="text-sm text-neutral-500">
                            {item.totalOrdered} orders • £{(item.totalRevenue / 100).toFixed(2)} revenue
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-neutral-500">No popular items data available</p>
                </div>
              )}
            </div>

            {/* Order History Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-800">
                Order History
              </h3>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-neutral-500">Loading order history...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-neutral-500">No completed orders found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isNew={false}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Orders Display */
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow p-6">
                <span className="material-icons text-4xl text-neutral-300 mb-2">receipt_long</span>
                <h3 className="text-xl font-medium mb-2">No Orders</h3>
                <p className="text-neutral-500">No active orders at the moment</p>
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
          </>
        )}
      </div>
    </div>
  );
}
