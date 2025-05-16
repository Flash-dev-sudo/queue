import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import OrderItem from "@/components/OrderItem";
import { CartItem } from "@shared/schema";
import { formatPrice, calculateSubtotal, calculateTax, calculateTotal } from "@/lib/utils/order-utils";

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
  const [orderNumber, setOrderNumber] = useState<string>(() => {
    // Generate a random order number for display purposes
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`;
  });
  
  const subtotal = calculateSubtotal(cart);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);
  
  const handleSendOrder = async () => {
    await onSendOrder();
    
    // Generate a new order number for the next order
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setOrderNumber(`${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`);
  };
  
  return (
    <div className="w-1/4 bg-secondary text-white overflow-y-auto relative">
      <div className="sticky top-0 bg-secondary py-3 px-4 border-b border-neutral-300 border-opacity-20">
        <h2 className="font-heading font-semibold">Your Order</h2>
        <p className="text-sm text-neutral-200">Order #{orderNumber}</p>
      </div>
      
      {cart.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-icons text-3xl mb-2 text-neutral-300">shopping_cart</span>
          <p className="text-sm text-neutral-300">Your cart is empty</p>
          <p className="text-sm text-neutral-300 mt-1">Add items from the menu</p>
        </div>
      ) : (
        <>
          <div className="mb-16">
            {cart.map((item) => (
              <OrderItem
                key={item.menuItemId}
                item={item}
                onRemove={() => onRemoveItem(item.menuItemId)}
              />
            ))}
          </div>
          
          <div className="px-4 py-6 absolute bottom-0 w-full bg-secondary">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-200 mb-2">
              <span>Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-neutral-300 border-opacity-20">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            
            <Button
              className="w-full py-6 mt-4 bg-primary rounded-lg text-white font-bold hover:bg-opacity-90 flex items-center justify-center"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleSendOrder}
            >
              <span className="material-icons mr-2">send</span>
              {isSubmitting ? "Sending..." : "Send to Kitchen"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full py-5 mt-2 border border-neutral-200 rounded-lg text-neutral-200 hover:text-white hover:border-white"
              disabled={cart.length === 0 || isSubmitting}
              onClick={onClearCart}
            >
              Cancel Order
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
