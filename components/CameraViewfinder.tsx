
import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCw, Check, RotateCcw, AlertCircle } from 'lucide-react';

interface CameraViewfinderProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraViewfinder: React.FC<CameraViewfinderProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Initialize Camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setIsLoading(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        
        activeStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Auto-play was prevented:", playErr);
          }
        }
        setStream(mediaStream);
        setError(null);
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError(err.name === 'NotAllowedError' 
          ? "Camera access denied. Please check your browser permissions." 
          : "Camera not supported or could not be initialized.");
      } finally {
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      // Shutter flash effect
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        video.pause();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Dark Overlay Background */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      {/* Viewfinder Modal Content */}
      <div className="relative w-full max-w-[380px] bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        
        {/* Header with Close */}
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={onClose}
            className="p-3 bg-black/30 backdrop-blur-xl rounded-full text-white/80 hover:text-white hover:bg-black/50 transition-all border border-white/10 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport (Video/Image) */}
        <div className="relative aspect-[3/4] bg-black flex items-center justify-center overflow-hidden">
          {isLoading && !error && (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Calibrating...</p>
            </div>
          )}

          {error && (
            <div className="px-10 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-white text-sm font-medium mb-4">{error}</p>
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white text-black rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          )}

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading || error || capturedImage ? 'opacity-0' : 'opacity-100'}`}
          />

          {capturedImage && (
            <img 
              src={capturedImage} 
              className="absolute inset-0 w-full h-full object-cover animate-in zoom-in-95 duration-500" 
              alt="Captured" 
            />
          )}

          {/* Flash Feedback Layer */}
          <div className={`absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none z-20 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        {/* Footer Controls */}
        <div className="p-10 bg-gradient-to-b from-slate-900 to-[#0a0f18] flex justify-center items-center">
          {!error && !isLoading && (
            <div className="flex items-center justify-center w-full">
              {!capturedImage ? (
                /* Simplified Shutter Button - Clean and Solid */
                <button 
                  onClick={handleCapture}
                  className="w-20 h-20 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <div className="w-[72px] h-[72px] border-2 border-slate-900/5 rounded-full" />
                </button>
              ) : (
                /* Post-Capture Buttons */
                <div className="flex items-center gap-12 animate-in slide-in-from-bottom-4 duration-500">
                  <button 
                    onClick={handleRetake}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all group-active:scale-90">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors">Retake</span>
                  </button>

                  <button 
                    onClick={handleUsePhoto}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all group-active:scale-90">
                      <Check className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Apply Photo</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        .w-18 { width: 4.5rem; }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default CameraViewfinder;
