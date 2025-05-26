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
    });
    
    // Generate a new order number for the next order
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setOrderNumber(`${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`);
  };
  
  return (
    <div className="w-full bg-white text-secondary border-l overflow-y-auto relative shadow-md">
      <div className="sticky top-0 bg-secondary text-white py-3 px-4 border-b">
        <h2 className="font-heading font-semibold flex items-center">
          <span className="material-icons mr-2">receipt</span>
          Order Summary
        </h2>
        <p className="text-sm">Order #{orderNumber}</p>
      </div>
      
      {cart.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-icons text-5xl mb-3 text-neutral-300">shopping_cart</span>
          <p className="text-neutral-500">Your cart is empty</p>
          <p className="text-neutral-400 mt-1 text-sm">Add items from the menu</p>
        </div>
      ) : (
        <>
          <div className="px-4 pt-4 pb-32 divide-y">
            {cart.map((item) => (
              <OrderItem
                key={item.menuItemId}
                item={item}
                onRemove={() => onRemoveItem(item.menuItemId)}
              />
            ))}
          </div>
          
          <div className="px-4 py-4 absolute bottom-0 w-full bg-white border-t">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">Tax (20%)</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t border-neutral-200">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                variant="outline" 
                className="border-secondary py-3 text-secondary hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleClearCart}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cart
              </Button>
              
              <Button
                className="bg-primary text-white py-3 font-semibold hover:bg-opacity-90 transition-colors"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleSendOrder}
              >
                <span className="material-icons text-sm mr-1">send</span>
                {isSubmitting ? "Sending..." : "Send Order"}
              </Button>
            </div>
            
            <Button
              className="w-full py-3 mt-2 bg-secondary text-white font-bold hover:bg-opacity-90 transition-colors"
              disabled={cart.length === 0 || isSubmitting}
            >
              <span className="material-icons text-sm mr-1">payment</span>
              Pay Now
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
