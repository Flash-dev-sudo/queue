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
      className={`border-b p-4 hover:bg-neutral-100 cursor-pointer transition-colors ${
        quantity > 0 ? "bg-neutral-100" : ""
      }`} 
      data-item-id={item.id}
    >
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium">{item.name}</h3>
          <p className="text-neutral-300 text-sm">{item.description || "No description available"}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatPrice(item.price)}</p>
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
