import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("emparo_logged_in");
    window.location.reload(); // Refresh to show login screen
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center relative">
        {/* Logout button */}
        <Button 
          onClick={handleLogout}
          variant="outline" 
          size="sm"
          className="absolute top-4 right-4 text-gray-600 hover:text-red-600"
        >
          🚪 Logout
        </Button>

        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Emparo Food</h1>
          <p className="text-gray-600">Restaurant Management System</p>
          <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
            ✅ System Ready
          </div>
        </div>
        
        <div className="space-y-4">
          <Link href="/order">
            <Button className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              <div className="flex items-center justify-center w-full">
                <span className="mr-3 text-2xl">🍽️</span>
                <div>
                  <div>Order Screen</div>
                  <div className="text-sm mt-1 opacity-90">For Reception Staff</div>
                </div>
              </div>
            </Button>
          </Link>
          
          <Link href="/kitchen">
            <Button className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white">
              <div className="flex items-center justify-center w-full">
                <span className="mr-3 text-2xl">👨‍🍳</span>
                <div>
                  <div>Kitchen Display</div>
                  <div className="text-sm mt-1 opacity-90">For Kitchen Staff</div>
                </div>
              </div>
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Choose your work station to get started</p>
          <p className="mt-1 text-xs">Staff logged in successfully</p>
        </div>
      </div>
    </div>
  );
}
