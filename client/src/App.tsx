import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import OrderScreen from "@/components/OrderScreen";
import KitchenScreen from "@/components/KitchenScreen";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  // For now, let's make it work first - we'll add authentication back later
  const isLoggedIn = localStorage.getItem("emparo_logged_in") === "true";

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/order" component={OrderScreen} />
      <Route path="/kitchen" component={KitchenScreen} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
