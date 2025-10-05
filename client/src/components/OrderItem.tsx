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
  onUpgradeToMeal?: () => void;
  onEdit?: () => void;
  onSaveNotes?: (notes: string) => void;
}

export default function OrderItem({ item, onRemove, onUpgradeToMeal, onEdit, onSaveNotes }: OrderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  
  const totalPrice = item.price * item.quantity;
  
  const handleSaveNotes = () => {
    if (onSaveNotes) {
      onSaveNotes(notes);
    }
    setIsEditing(false);
  };

  // Check if item can be upgraded to meal or drinks
  const canUpgradeToMeal = (itemName: string) => {
    const name = itemName.toLowerCase();
    // Rice platters can add drinks
    if (name.includes('rice platter')) {
      return true;
    }
    // Exclude other platters and feasts as they are already complete meals
    // But allow EFC Special, Quarter Pounder, and Half Pounder to be upgraded
    if (name.includes('platter') || name.includes('feast')) {
      return false;
    }
    if (name.includes('emparo special')) {
      return false; // Emparo Special platter should not be upgradeable
    }
    return name.includes('burger') || name.includes('wrap') || name.includes('wings') || 
           name.includes('strips') || name.includes('chicken') || name.includes('special') || 
           name.includes('pounder');
  };

  const showMealUpgrade = canUpgradeToMeal(item.name) && !item.customizations?.isMeal && onUpgradeToMeal;
  
  return (
    <>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">
              <span className="bg-primary text-white px-2 py-1 rounded text-xs font-bold mr-2">{item.quantity}x</span>
              {item.name}
            </p>
            
            {/* Display customizations */}
            {item.customizations && (
              <div className="mt-2 space-y-1">
                {item.customizations.isPeriPeriChipsMeal && (
                  <div className="flex items-center">
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                      🌶️ Peri Peri Chips Meal
                    </span>
                  </div>
                )}
                {item.customizations.isMeal && !item.customizations.isPeriPeriChipsMeal && (
                  <div className="flex items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      🍽️ Regular Meal
                    </span>
                  </div>
                )}
                {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600">Toppings:</span>
                    {item.customizations.toppings.map((topping, index) => (
                      <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {topping}
                      </span>
                    ))}
                  </div>
                )}
                {item.customizations.flavor && (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600 mr-1">Flavor:</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                      {item.customizations.flavor}
                    </span>
                  </div>
                )}
                {item.customizations.isSpicy && (
                  <div className="flex items-center">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                      🌶️ Spicy
                    </span>
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
        
        <div className="flex flex-col gap-2">
          {/* Upgrade Options */}
          {canUpgradeToMeal(item.name) && !item.customizations?.isMeal && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-800">
                    {item.name.includes("Rice Platter") ? "Add drinks +£0.50" : "Upgrade to meal +£1.50"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={onUpgradeToMeal}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1">
            {onEdit && (
              <button 
                className="text-xs text-orange-600 hover:text-orange-800 flex items-center px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                onClick={onEdit}
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </button>
            )}
            <button 
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <StickyNote className="w-3 h-3 mr-1" /> Notes
            </button>

            <button 
              className="text-xs text-red-600 hover:text-red-800 flex items-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
              onClick={onRemove}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remove
            </button>
          </div>
          <div className="flex justify-end">
            <p className="text-xs text-gray-500">Unit: {formatPrice(item.price)}</p>
          </div>
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
