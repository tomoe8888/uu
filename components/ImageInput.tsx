
import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Layers } from 'lucide-react';
import CameraViewfinder from './CameraViewfinder';

interface ImageInputProps {
  onImageProcessed: (base64: string) => void;
  onBulkImagesProcessed?: (images: string[]) => void;
  currentImage: string | null;
}

const ImageInput: React.FC<ImageInputProps> = ({ onImageProcessed, onBulkImagesProcessed, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Cast the result of Array.from to File[] to avoid 'unknown' type issues in subsequent processFile calls.
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsProcessing(true);
    
    try {
      const processFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              const img = new Image();
              img.onload = () => {
                const maxDim = 2048;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = (height / width) * maxDim;
                    width = maxDim;
                  } else {
                    width = (width / height) * maxDim;
                    height = maxDim;
                  }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.88));
                }
              };
              img.src = event.target.result as string;
            }
          };
          reader.readAsDataURL(file);
        });
      };

      if (files.length === 1) {
        const base64 = await processFile(files[0]);
        onImageProcessed(base64);
      } else if (onBulkImagesProcessed) {
        const base64Array = await Promise.all(files.map(file => processFile(file)));
        onBulkImagesProcessed(base64Array);
      }
    } catch (err) {
      console.error("Error processing images:", err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const processImage = (base64: string) => {
    if (!base64) {
      onImageProcessed('');
      return;
    }
    const img = new Image();
    img.onload = () => {
      const maxDim = 2048; 
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        onImageProcessed(canvas.toDataURL('image/jpeg', 0.88));
      }
    };
    img.src = base64;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Memory Visuals</h3>
      
      <div className="flex flex-col gap-4">
        {currentImage ? (
           <div className="relative group rounded-2xl overflow-hidden aspect-video border border-white/80 shadow-md">
              <img src={currentImage} className="w-full h-full object-cover" alt="Memory Texture" />
              <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <button 
                      onClick={() => onImageProcessed('')}
                      className="bg-white p-2.5 rounded-full text-slate-900 shadow-xl hover:scale-110 transition-all"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </div>
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center aspect-video rounded-2xl bg-white/30 border border-dashed border-slate-300 text-slate-400 text-[10px] text-center px-4 gap-2">
              <Upload className="w-4 h-4 opacity-40" />
              Texture this sphere with a visual memory.
           </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button 
            disabled={isProcessing}
            onClick={() => setShowCamera(true)}
            className="flex items-center justify-center gap-2 py-3 bg-white/40 border border-white/60 rounded-xl text-slate-600 font-bold text-xs hover:bg-white/80 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            Camera
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="relative flex flex-col items-center justify-center py-3 bg-white/40 border border-white/60 rounded-xl text-slate-600 font-bold text-xs hover:bg-white/80 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing...' : 'Upload'}</span>
            </div>
            {!isProcessing && <span className="text-[7px] text-indigo-400 uppercase tracking-tighter mt-0.5 font-black">Multi supported</span>}
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          multiple
          className="hidden" 
        />
      </div>

      {showCamera && (
        <CameraViewfinder 
          onCapture={(base64) => processImage(base64)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default ImageInput;
