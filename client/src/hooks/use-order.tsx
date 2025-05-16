import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MenuItem, CartItem } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";

export function useOrder() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { sendMessage } = useWebSocket({});
  
  // Add item to cart
  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItemId === item.id);
      
      if (existingItem) {
        // Increase quantity if item already exists
        return prevCart.map(cartItem => 
          cartItem.menuItemId === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        // Add new item to cart
        return [...prevCart, {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (menuItemId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItemId === menuItemId);
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity if more than 1
        return prevCart.map(cartItem => 
          cartItem.menuItemId === menuItemId 
            ? { ...cartItem, quantity: cartItem.quantity - 1 } 
            : cartItem
        );
      } else {
        // Remove item completely if quantity is 1
        return prevCart.filter(cartItem => cartItem.menuItemId !== menuItemId);
      }
    });
  };
  
  // Clear cart
  const clearCart = () => {
    setCart([]);
  };
  
  // Send order to the server
  const sendOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your order before sending.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/orders', {
        items: cart
      });
      
      const data = await response.json();
      
      // Notify all clients about the new order
      sendMessage({
        type: 'new_order',
        order: data
      });
      
      toast({
        title: "Order Sent",
        description: `Order #${data.orderNumber} has been sent to the kitchen.`,
        variant: "default",
      });
      
      // Clear the cart after successful order
      clearCart();
    } catch (error) {
      console.error('Error sending order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to send your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    sendOrder,
    isSubmitting
  };
}
