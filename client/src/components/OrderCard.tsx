import React from "react";
import { Button } from "@/components/ui/button";
import { FullOrder, OrderStatus } from "@shared/schema";
import { formatPrice } from "@/lib/utils/order-utils";
import { formatDistanceToNow } from "date-fns";

interface OrderCardProps {
  order: FullOrder;
  isNew: boolean;
  onUpdateStatus: (orderId: number, status: string) => void;
}

export default function OrderCard({ order, isNew, onUpdateStatus }: OrderCardProps) {
  // Format time
  const formattedTime = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  const actualTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Status color and label
  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.NEW:
        return "bg-primary";
      case OrderStatus.PREPARING:
        return "bg-warning";
      case OrderStatus.READY:
        return "bg-success";
      case OrderStatus.SERVED:
        return "bg-secondary";
      default:
        return "bg-neutral-300";
    }
  };
  
  // Is button active
  const isButtonActive = (buttonStatus: string) => {
    return order.status === buttonStatus;
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isNew ? "pulse-animation" : ""}`}>
      <div className={`${getStatusColor(order.status)} text-white px-4 py-2 flex justify-between items-center`}>
        <div>
          <h3 className="font-bold">Order #{order.orderNumber}</h3>
          <p className="text-sm">{formattedTime} - {actualTime}</p>
        </div>
        <div className="bg-white text-secondary font-bold rounded px-2 py-1 text-sm">
          {order.status === OrderStatus.NEW && "NEW"}
          {order.status === OrderStatus.PREPARING && "PREPARING"}
          {order.status === OrderStatus.READY && "READY"}
          {order.status === OrderStatus.SERVED && "SERVED"}
          {order.status === OrderStatus.COMPLETED && "COMPLETED"}
          {order.status === OrderStatus.CANCELLED && "CANCELLED"}
        </div>
      </div>
      
      <div className="p-4">
        {order.items.map((item) => (
          <div className="mb-4" key={item.id}>
            <div className="flex justify-between mb-1">
              <span className="font-medium">{item.quantity}x {item.name}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
            <p className="text-sm text-neutral-300">{item.notes || "No special instructions"}</p>
          </div>
        ))}
        
        <div className="pt-3 border-t flex justify-end space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            className="text-sm"
          >
            <span className="material-icons text-sm align-text-top">receipt</span> Print
          </Button>
          
          {/* Status buttons */}
          {order.status !== OrderStatus.SERVED && order.status !== OrderStatus.COMPLETED && (
            <>
              <Button
                size="sm"
                variant="default"
                className={`text-sm ${!isButtonActive(OrderStatus.PREPARING) ? "bg-warning text-white" : "bg-warning text-white opacity-50"}`}
                disabled={isButtonActive(OrderStatus.PREPARING) || order.status === OrderStatus.READY || order.status === OrderStatus.SERVED}
                onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
              >
                <span className="material-icons text-sm align-text-top">sync</span> Preparing
              </Button>
              
              <Button
                size="sm"
                variant="default"
                className={`text-sm ${!isButtonActive(OrderStatus.READY) ? "bg-success text-white" : "bg-success text-white opacity-50"}`}
                disabled={isButtonActive(OrderStatus.READY) || order.status === OrderStatus.SERVED}
                onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
              >
                <span className="material-icons text-sm align-text-top">done</span> Ready
              </Button>
            </>
          )}
              
          {/* Always show Served button for all orders */}
          {order.status !== OrderStatus.SERVED && (
            <Button
              size="sm"
              variant="default"
              className="text-sm bg-secondary text-white"
              onClick={() => onUpdateStatus(order.id, OrderStatus.SERVED)}
            >
              <span className="material-icons text-sm align-text-top">fastfood</span> Served
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
