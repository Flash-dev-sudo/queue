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
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">
              <span className="bg-primary text-white px-2 py-1 rounded text-xs font-bold mr-2">{item.quantity}x</span>
              {item.name}
              {item.customizations?.isMeal && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold ml-2">MEAL</span>
              )}
            </p>
            
            {/* Display customizations */}
            {item.customizations && (
              <div className="mt-2 space-y-1">
                {item.customizations.chipType && (
                  <div className="flex items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {item.customizations.chipType === 'spicy' ? '🌶️ Spicy' : '😋 Normal'}
                    </span>
                  </div>
                )}
                {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600">Toppings:</span>
                    {item.customizations.toppings.map((topping, index) => (
                      <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {topping.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {item.notes && (
              <div className="flex items-center mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <StickyNote className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800 font-medium">{item.notes}</p>
              </div>
            )}
          </div>
          <p className="font-bold text-primary text-sm">{formatPrice(totalPrice)}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <button 
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-3 h-3 mr-1" /> Notes
            </button>
            <button 
              className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
              onClick={onRemove}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remove
            </button>
          </div>
          <p className="text-xs text-gray-500">Unit: {formatPrice(item.price)}</p>
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
