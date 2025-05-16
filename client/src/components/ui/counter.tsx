import React from "react";

interface CounterProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function Counter({ value, onIncrement, onDecrement }: CounterProps) {
  return (
    <div className="mt-1 flex items-center justify-end">
      <button 
        className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
      >
        <span className="material-icons text-sm">remove</span>
      </button>
      <span className="mx-2 w-6 text-center" data-quantity={value}>{value}</span>
      <button 
        className="w-8 h-8 rounded-full bg-primary text-white hover:bg-opacity-90 flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
      >
        <span className="material-icons text-sm">add</span>
      </button>
    </div>
  );
}
