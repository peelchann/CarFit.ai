import { Check, Info } from "lucide-react";

interface Part {
  id: string;
  name: string;
  image: string;
  category: string;
  price: number;
}

interface PartSelectorProps {
  parts: Part[];
  selectedPart: Part | null;
  onSelect: (part: Part) => void;
  isLoading?: boolean;
}

export function PartSelector({ parts, selectedPart, onSelect, isLoading }: PartSelectorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Available Parts</h2>
        <span className="text-xs text-gray-500 uppercase tracking-wider">{parts.length} Items</span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl p-8">
          Loading catalog...
        </div>
      ) : parts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl p-8">
           <p>No parts found.</p>
           <p className="text-xs mt-2">Check backend connection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 pb-20">
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => onSelect(part)}
              className={`group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all hover:border-blue-500/50 hover:bg-gray-800/50 ${
                selectedPart?.id === part.id
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
                  : "border-gray-800 bg-gray-900/50"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-950">
                {/* Mock Image Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-gray-900 to-gray-800">
                   <div className="w-12 h-12 rounded-full border-2 border-gray-700/50" />
                </div>
                {/* If real images exist, use next/image here */}
                {/* <img src={part.image} alt={part.name} className="object-cover w-full h-full" /> */}
                
                {selectedPart?.id === part.id && (
                  <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="w-full">
                <div className="flex items-start justify-between">
                  <span className="font-medium text-gray-200 line-clamp-1">{part.name}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 capitalize">{part.category}</span>
                  <span className="text-sm font-semibold text-blue-400">${part.price}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

