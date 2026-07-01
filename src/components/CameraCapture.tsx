'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File | null, base64: string | null) => void;
  label?: string;
  initialPreviewUrl?: string;
}

export default function CameraCapture({ onCapture, label = "Upload/Capture Government ID", initialPreviewUrl }: CameraCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPreviewUrl) {
      setPreviewUrl(initialPreviewUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [initialPreviewUrl]);

  // Trigger native system camera/gallery selector fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPreviewUrl(base64);
        onCapture(file, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start live WebRTC video stream
  const startLiveCamera = async () => {
    setError(null);
    setIsLive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setIsLive(false);
      setError("Unable to access live camera stream. Please upload or choose a file instead.");
    }
  };

  // Turn off WebRTC stream
  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsLive(false);
  };

  // Capture canvas snapshot image frame
  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the video frame to the temporary canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Export to high-quality compressed JPEG
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "scanned_id.jpg", { type: "image/jpeg" });
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              setPreviewUrl(base64);
              onCapture(file, base64);
            };
            reader.readAsDataURL(file);
          }
        }, 'image/jpeg', 0.85);

        stopLiveCamera();
      }
    }
  };

  // Clear current capture
  const clearCapture = () => {
    setPreviewUrl(null);
    onCapture(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col gap-2 font-sans text-zinc-50">
      <label className="text-xs font-semibold text-zinc-200 mb-1">
        {label} <span className="text-rose-500">*</span>
      </label>

      {/* Main Upload / Capture Actions */}
      {!previewUrl && !isLive && (
        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <button
            type="button"
            onClick={startLiveCamera}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-3 px-4 rounded-lg transition-all shadow-sm cursor-pointer text-xs uppercase"
          >
            <Camera size={16} />
            <span>Open Document Camera</span>
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-3 px-4 rounded-lg transition-all cursor-pointer text-xs uppercase"
          >
            <ImageIcon size={16} />
            <span>Choose from Files</span>
          </button>
        </div>
      )}

      {/* Hidden File Input for Native Camera and File System fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment" // Forces rear-camera prompt on mobile OS
        className="hidden"
      />

      {/* Live Video Viewer */}
      {isLive && (
        <div className="relative border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden p-1 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[4/3] object-cover rounded-lg"
          />
          
          {/* Document Framing Guideline Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="w-full h-full border border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider">
                Align ID card inside framework
              </span>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4 px-4">
            <button
              type="button"
              onClick={stopLiveCamera}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 p-2.5 rounded-lg transition-all cursor-pointer shadow-md"
              title="Cancel"
            >
              <X size={18} />
            </button>
            
            <button
              type="button"
              onClick={captureSnapshot}
              className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 p-3.5 border border-zinc-50 rounded-lg transition-all transform scale-110 shadow-md cursor-pointer"
              title="Capture Photo"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Capture Preview Screen */}
      {previewUrl && (
        <div className="relative border border-zinc-800 rounded-xl bg-zinc-900 p-2.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Government ID Preview"
            className="w-full aspect-[4/3] object-contain rounded-lg bg-zinc-950"
          />
          
          {/* Preview Actions */}
          <div className="absolute top-5 right-5 flex gap-2">
            <button
              type="button"
              onClick={clearCapture}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase cursor-pointer"
              title="Retake Image"
            >
              <RefreshCw size={11} className="inline mr-1 animate-spin-hover" /> Retake
            </button>
          </div>
          <div className="mt-2.5 px-0.5 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
            <span>ID IMAGE BUFFER</span>
            <span className="text-emerald-500 flex items-center gap-1">SECURED DECRYPTED</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-rose-400 text-xs font-semibold p-3 bg-rose-950/20 border border-rose-900/60 rounded-lg mt-1 leading-relaxed">
          {error}
        </div>
      )}
    </div>
  );
}
