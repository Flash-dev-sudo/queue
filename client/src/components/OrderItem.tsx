import React, { useState } from "react";
import { CartItem } from "@shared/schema";
import { formatPrice } from "@/lib/utils/order-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Trash2, StickyNote } from "lucide-react";

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
              <div className="flex items-center mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <StickyNote className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800 font-medium">{item.notes}</p>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 mt-1">No special instructions</p>
            )}
          </div>
          <p className="font-semibold text-primary">{formatPrice(totalPrice)}</p>
        </div>
        <div className="flex mt-2">
          <button 
            className="text-xs text-neutral-500 hover:text-secondary flex items-center mr-3 px-2 py-1 rounded hover:bg-blue-50"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-3 h-3 mr-1" /> Notes
          </button>
          <button 
            className="text-xs text-neutral-500 hover:text-red-500 flex items-center px-2 py-1 rounded hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="w-3 h-3 mr-1" /> Remove
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
