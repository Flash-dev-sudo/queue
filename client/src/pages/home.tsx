import { useState } from "react";
import AppContainer from "@/components/AppContainer";
import OrderScreen from "@/components/OrderScreen";
import KitchenScreen from "@/components/KitchenScreen";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<"order" | "kitchen">("order");

  return (
    <AppContainer 
      currentScreen={currentScreen} 
      onScreenChange={setCurrentScreen}
    >
      {currentScreen === "order" ? (
        <OrderScreen />
      ) : (
        <KitchenScreen />
      )}
    </AppContainer>
  );
}
