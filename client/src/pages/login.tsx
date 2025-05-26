import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [_, setLocation] = useLocation();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Simple PIN authentication (you can enhance this later)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple PIN check (you can make this more secure)
    if (pin === "1234" || pin === "admin") {
      localStorage.setItem("isAuthenticated", "true");
      toast({
        title: "Login Successful",
        description: "Welcome to Emparo Food System!",
      });
      setLocation("/");
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please enter the correct PIN to access the system.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ Emparo Food</h1>
          <p className="text-gray-600">Restaurant Management System</p>
          <div className="mt-4 text-sm text-gray-500">
            Please enter your PIN to continue
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              Staff PIN
            </label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || pin.length < 3}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Default PIN: 1234</p>
          <p className="mt-2">Contact administrator if you need access</p>
        </div>
      </div>
    </div>
  );
}