import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import OrderScreen from "@/components/OrderScreen";
import KitchenScreen from "@/components/KitchenScreen";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const isLoggedIn = localStorage.getItem("emparo_logged_in") === "true";

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/admin" component={Admin} />
      <Route path="/login" component={Login} />

      {/* Staff routes (require local staff login) */}
      <Route path="/" component={() => (isLoggedIn ? <Home /> : <Login />)} />
      <Route path="/order" component={() => (isLoggedIn ? <OrderScreen /> : <Login />)} />
      <Route path="/kitchen" component={() => (isLoggedIn ? <KitchenScreen /> : <Login />)} />

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
