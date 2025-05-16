import React, { useState } from "react";
import { CartItem } from "@shared/schema";
import { formatPrice } from "@/lib/utils/order-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface OrderItemProps {
  item: CartItem;
  onRemove: () => void;
}

export default function OrderItem({ item, onRemove }: OrderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  
  const totalPrice = item.price * item.quantity;
  
  const handleSaveNotes = () => {
    item.notes = notes;
    setIsEditing(false);
  };
  
  return (
    <>
      <div className="px-4 py-3 border-b border-neutral-300 border-opacity-20">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium">{item.quantity}x {item.name}</p>
            {item.notes && <p className="text-xs text-neutral-200">{item.notes}</p>}
            {!item.notes && <p className="text-xs text-neutral-200">No special instructions</p>}
          </div>
          <p className="font-medium">{formatPrice(totalPrice)}</p>
        </div>
        <div className="flex justify-end">
          <button 
            className="text-xs text-neutral-200 hover:text-white mr-3"
            onClick={() => setIsEditing(true)}
          >
            <span className="material-icons text-sm align-text-top">edit</span> Edit
          </button>
          <button 
            className="text-xs text-neutral-200 hover:text-white"
            onClick={onRemove}
          >
            <span className="material-icons text-sm align-text-top">delete</span> Remove
          </button>
        </div>
      </div>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {item.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Special Instructions
            </label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
