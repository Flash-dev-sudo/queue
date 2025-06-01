import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import OrderItem from "@/components/OrderItem";
import { CartItem } from "@shared/schema";
import { formatPrice, calculateSubtotal, calculateTax, calculateTotal } from "@/lib/utils/order-utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface OrderSummaryProps {
  cart: CartItem[];
  onRemoveItem: (menuItemId: number) => void;
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
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

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
              {cart.map((item) => (
                <OrderItem
                  key={item.menuItemId}
                  item={item}
                  onRemove={() => onRemoveItem(item.menuItemId)}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-white border-t px-4 py-4 flex-shrink-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Tax (20%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline" 
                className="border-secondary text-secondary hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleClearCart}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cart
              </Button>
              
              <Button
                className="bg-primary text-white font-semibold hover:bg-opacity-90 transition-colors"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleSendOrder}
              >
                📤 {isSubmitting ? "Sending..." : "Send Order"}
              </Button>
              
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                disabled={isSubmitting}
                onClick={() => {
                  handleSendOrder();
                  // Clear cart after sending for next order
                  setTimeout(() => {
                    if (!isSubmitting) {
                      onClearCart();
                    }
                  }, 1000);
                }}
              >
                ➡️ Next Order
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
