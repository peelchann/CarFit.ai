import { Car, ShoppingBag, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-600 p-2">
            <Car className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CarFit Studio</span>
        </div>
        
        <nav className="hidden md:flex gap-6">
          <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Studio</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Garage</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Shop</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
            <ShoppingBag className="h-5 w-5" />
          </button>
          <button className="rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-all md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

