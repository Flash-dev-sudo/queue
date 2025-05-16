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
      <div className="py-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-secondary">
              <span className="font-bold">{item.quantity}x</span> {item.name}
            </p>
            {item.notes ? (
              <p className="text-xs text-neutral-500 italic">{item.notes}</p>
            ) : (
              <p className="text-xs text-neutral-400">No special instructions</p>
            )}
          </div>
          <p className="font-semibold text-primary">{formatPrice(totalPrice)}</p>
        </div>
        <div className="flex mt-1">
          <button 
            className="text-xs text-neutral-500 hover:text-secondary flex items-center mr-3"
            onClick={() => setIsEditing(true)}
          >
            <span className="material-icons text-sm mr-1">edit</span> Notes
          </button>
          <button 
            className="text-xs text-neutral-500 hover:text-red-500 flex items-center"
            onClick={onRemove}
          >
            <span className="material-icons text-sm mr-1">delete</span> Remove
          </button>
        </div>
      </div>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Special Instructions</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2 text-neutral-600">{item.quantity}x {item.name}</p>
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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
