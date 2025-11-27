"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { clsx } from "clsx";

interface UploadAreaProps {
  onImageSelected: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
}

export function UploadArea({ onImageSelected, selectedImage, onClear }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  if (selectedImage) {
    const imageUrl = URL.createObjectURL(selectedImage);
    return (
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        <img
          src={imageUrl}
          alt="Selected car"
          className="w-full h-full object-cover"
        />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm backdrop-blur transition-all"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        "relative w-full aspect-[4/3] rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="p-4 rounded-full bg-gray-100 group-hover:bg-white mb-4 transition-colors shadow-sm">
        <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">Upload your car</h3>
      <p className="mt-1 text-sm text-gray-500">
        Drag & drop or click to browse
      </p>
      <p className="mt-4 text-xs text-gray-400">
        Supports JPG, PNG (Max 10MB)
      </p>
    </div>
  );
}



