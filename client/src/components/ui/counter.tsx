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
        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700 font-bold"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
      >
        −
      </button>
      <span className="mx-3 w-8 text-center font-medium" data-quantity={value}>{value}</span>
      <button 
        className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center font-bold"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
      >
        +
      </button>
    </div>
  );
}
