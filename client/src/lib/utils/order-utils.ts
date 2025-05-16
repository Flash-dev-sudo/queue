import { CartItem } from "@shared/schema";

// Format price from pennies to pounds with £ symbol
export const formatPrice = (price: number): string => {
  return `£${(price / 100).toFixed(2)}`;
};

// Calculate subtotal from cart items
export const calculateSubtotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Calculate tax (20% VAT) from subtotal
export const calculateTax = (subtotal: number): number => {
  return Math.round(subtotal * 0.2);
};

// Calculate total with tax
export const calculateTotal = (subtotal: number, tax: number): number => {
  return subtotal + tax;
};

// Generate a unique order number
export const generateOrderNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp.toString().substring(timestamp.toString().length - 5)}${random}`;
};

// Format timestamp to relative time
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};
