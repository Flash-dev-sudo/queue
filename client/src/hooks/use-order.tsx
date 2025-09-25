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
  const addToCart = (item: MenuItem, customizations?: any) => {
    // Make sure price is a valid number
    const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    
    setCart(prevCart => {
      // Create a unique key for items with customizations
      const customizationKey = customizations ? JSON.stringify(customizations) : '';
      const existingItem = prevCart.find(cartItem => 
        cartItem.menuItemId === item.id && 
        JSON.stringify(cartItem.customizations || {}) === customizationKey
      );
      
      if (existingItem) {
        // Increase quantity if item with same customizations already exists
        return prevCart.map(cartItem => 
          cartItem.menuItemId === item.id && 
          JSON.stringify(cartItem.customizations || {}) === customizationKey
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        // Add new item to cart with validated price and customizations
        return [...prevCart, {
          menuItemId: item.id,
          name: item.name,
          price: itemPrice,
          quantity: 1,
          customizations: customizations
        }];
      }
    });
  };
  
  // Remove item from cart (supports customizations)
  const removeFromCart = (menuItemId: number, customizations?: any) => {
    setCart(prevCart => {
      const customizationKey = customizations ? JSON.stringify(customizations) : '';
      const existingItem = prevCart.find(cartItem => 
        cartItem.menuItemId === menuItemId &&
        JSON.stringify(cartItem.customizations || {}) === customizationKey
      );
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity if more than 1
        return prevCart.map(cartItem => 
          cartItem.menuItemId === menuItemId && 
          JSON.stringify(cartItem.customizations || {}) === customizationKey
            ? { ...cartItem, quantity: cartItem.quantity - 1 } 
            : cartItem
        );
      } else {
        // Remove item completely if quantity is 1
        return prevCart.filter(cartItem => 
          !(cartItem.menuItemId === menuItemId && 
            JSON.stringify(cartItem.customizations || {}) === customizationKey)
        );
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
      // Format cart items with customizations as readable notes
      const formattedItems = cart.map(item => {
        let notes = "";
        const customizations = item.customizations;
        
        if (customizations) {
          const notesParts = [];
          
          // Add flavor
          if (customizations.flavor) {
            notesParts.push(`🌶️ Flavor: ${customizations.flavor}`);
          }
          
          // Add spicy indicator
          if (customizations.isSpicy) {
            notesParts.push(`🔥 SPICY`);
          }
          
          // Add meal option or drinks
          if (customizations.isMeal) {
            if (item.name.includes("Rice Platter")) {
              notesParts.push(`🥤 With drinks`);
            } else {
              notesParts.push(`🍟 Made as meal`);
            }
          }
          
          // Add toppings
          if (customizations.toppings && customizations.toppings.length > 0) {
            notesParts.push(`🥬 Toppings: ${customizations.toppings.join(", ")}`);
          }
          
          // Add chip type
          if (customizations.chipType && customizations.chipType !== "normal") {
            notesParts.push(`🍟 ${customizations.chipType} chips`);
          }
          
          notes = notesParts.join(" • ");
        }
        
        return {
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: notes || undefined
        };
      });
      
      const response = await apiRequest('POST', '/api/orders', {
        items: formattedItems
      });
      
      const data = await response.json();
      
      // Server already notifies kitchen via WebSocket on order creation
      
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
  
  // Upgrade item to meal or add drinks
  const upgradeToMeal = (menuItemId: number, customizations?: any) => {
    setCart(prevCart => {
      return prevCart.map(cartItem => {
        if (cartItem.menuItemId === menuItemId && 
            JSON.stringify(cartItem.customizations || {}) === JSON.stringify(customizations || {})) {
          
          // Different pricing for rice platters vs regular items
          const upgradePrice = cartItem.name.includes("Rice Platter") ? 50 : 150; // £0.50 for rice platters, £1.50 for others
          
          return {
            ...cartItem,
            price: cartItem.price + upgradePrice,
            customizations: {
              ...cartItem.customizations,
              isMeal: true
            }
          };
        }
        return cartItem;
      });
    });
  };

  // Edit existing cart item with new customizations
  const editItem = (menuItemId: number, oldCustomizations: any, newCustomizations: any, newPrice: number) => {
    setCart(prevCart => {
      return prevCart.map(cartItem => {
        if (cartItem.menuItemId === menuItemId && 
            JSON.stringify(cartItem.customizations || {}) === JSON.stringify(oldCustomizations || {})) {
          return {
            ...cartItem,
            price: newPrice,
            customizations: newCustomizations
          };
        }
        return cartItem;
      });
    });
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    sendOrder,
    isSubmitting,
    upgradeToMeal,
    editItem
  };
}
