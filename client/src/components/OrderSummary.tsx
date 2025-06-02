import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import OrderItem from "@/components/OrderItem";
import { CartItem } from "@shared/schema";
import { formatPrice, calculateSubtotal } from "@/lib/utils/order-utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface OrderSummaryProps {
  cart: CartItem[];
  onRemoveItem: (menuItemId: number, customizations?: any) => void;
  onClearCart: () => void;
  onSendOrder: () => Promise<void>;
  isSubmitting: boolean;
}

export default function OrderSummary({ 
  cart, 
  onRemoveItem, 
  onClearCart, 
  onSendOrder,
  isSubmitting
}: OrderSummaryProps) {
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState<string>(() => {
    // Generate a random order number for display purposes
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`;
  });
  
  const subtotal = calculateSubtotal(cart);
  const total = subtotal; // No tax calculation needed

  const handleClearCart = () => {
    onClearCart();
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart ✅",
    });
  };
  
  const handleSendOrder = async () => {
    await onSendOrder();
    toast({
      title: "Order Sent",
      description: "Order sent to kitchen successfully ✅",
      duration: 1500, // Show for 1.5 seconds instead of default 5 seconds
    });
    
    // Generate a new order number for the next order
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setOrderNumber(`${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`);
  };
  
  return (
    <div className="w-full bg-white text-secondary border-l shadow-md flex flex-col h-full">
      <div className="bg-secondary text-white py-3 px-4 border-b flex-shrink-0">
        <h2 className="font-semibold flex items-center">
          🧾 Order Summary
        </h2>
        <p className="text-sm opacity-90">Order #{orderNumber}</p>
      </div>
      
      {cart.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-neutral-500 font-medium">Your cart is empty</p>
            <p className="text-neutral-400 mt-1 text-sm">Add items from the menu</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {cart.map((item, index) => (
                <OrderItem
                  key={`${item.menuItemId}-${index}-${JSON.stringify(item.customizations || {})}`}
                  item={item}
                  onRemove={() => onRemoveItem(item.menuItemId, item.customizations)}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-white border-t px-4 py-4 flex-shrink-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline" 
                className="border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 font-medium py-3"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleClearCart}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cart
              </Button>
              
              <Button
                className="bg-primary text-white font-semibold hover:bg-opacity-90 transition-colors py-3"
                disabled={cart.length === 0 || isSubmitting}
                onClick={async () => {
                  await handleSendOrder();
                  onClearCart();
                }}
              >
                {isSubmitting ? "Sending..." : "Send & Next"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
