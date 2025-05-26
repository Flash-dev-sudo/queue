import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Emparo Food</h1>
          <p className="text-gray-600">Restaurant Management System</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/order">
            <Button className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              <span className="mr-3 text-2xl">🍽️</span>
              Order Screen
              <span className="block text-sm mt-1 opacity-90">For Reception Staff</span>
            </Button>
          </Link>
          
          <Link href="/kitchen">
            <Button className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white">
              <span className="mr-3 text-2xl">👨‍🍳</span>
              Kitchen Display
              <span className="block text-sm mt-1 opacity-90">For Kitchen Staff</span>
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Choose your work station to get started</p>
        </div>
      </div>
    </div>
  );
}
