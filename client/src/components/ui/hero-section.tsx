import React from "react";

interface HeroSectionProps {
  title: string;
  backgroundUrl: string;
  height?: string;
}

export default function HeroSection({ 
  title, 
  backgroundUrl,
  height = "h-40"
}: HeroSectionProps) {
  return (
    <div 
      className={`bg-cover bg-center ${height}`} 
      style={{ backgroundImage: `url('${backgroundUrl}')`, backgroundPosition: "center 25%" }}
    >
      <div className="h-full w-full bg-black bg-opacity-50 flex items-center justify-center">
        <h1 className="text-white text-4xl font-heading font-bold">{title}</h1>
      </div>
    </div>
  );
}
