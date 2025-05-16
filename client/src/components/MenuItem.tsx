import React from "react";
import { MenuItem as MenuItemType } from "@shared/schema";
import Counter from "@/components/ui/counter";
import { formatPrice } from "@/lib/utils/order-utils";

interface MenuItemProps {
  item: MenuItemType;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MenuItem({ item, quantity, onAdd, onRemove }: MenuItemProps) {
  return (
    <div 
      className={`rounded-lg border shadow-sm p-3 ${
        quantity > 0 ? "bg-primary/5 border-primary" : "hover:border-neutral-300"
      }`} 
      data-item-id={item.id}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-bold text-secondary">{item.name}</h3>
          {item.description && (
            <p className="text-neutral-500 text-sm line-clamp-1">{item.description}</p>
          )}
          <p className="font-semibold text-primary mt-1">{formatPrice(item.price)}</p>
        </div>
        <div className="ml-4">
          <Counter 
            value={quantity} 
            onIncrement={onAdd} 
            onDecrement={onRemove} 
          />
        </div>
      </div>
    </div>
  );
}
