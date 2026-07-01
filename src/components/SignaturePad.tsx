'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface SignaturePadProps {
  onSave: (base64: string | null) => void;
  label?: string;
}

export default function SignaturePad({ onSave, label = "Guest's Digital Signature" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Resize canvas to match container width
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const tempImage = canvas.toDataURL();
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200; // Fixed height is standard for signature inputs
      
      if (ctx) {
        ctx.strokeStyle = '#fafafa'; // White Ink stroke for Dark Mode canvas
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Restore previous strokes if resized
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = tempImage;
      }
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasSigned(true);
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        onSave(null);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      const base64 = canvas.toDataURL('image/png');
      onSave(base64);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-2 font-sans text-zinc-50">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-zinc-200 mb-1">
          {label} <span className="text-rose-500">*</span>
        </label>
        {hasSigned && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-350 font-bold uppercase cursor-pointer"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>
      <div className="relative border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full block cursor-crosshair touch-none bg-zinc-950"
          style={{ height: '200px' }}
        />
        {!hasSigned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-650 font-bold uppercase tracking-wider text-[10px]">
            <span>Sign with stylus or finger here</span>
          </div>
        )}
      </div>
    </div>
  );
}
