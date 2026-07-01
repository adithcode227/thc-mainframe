'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Loader2, X, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import { getSignedIdUrl } from 'src/actions/get-signed-url';

interface ViewIdButtonProps {
  guestId: string;
  guestName: string;
  idType: string;
}

export default function ViewIdButton({ guestId, guestName, idType }: ViewIdButtonProps) {
  const [loading, setLoading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Handle URL expiration countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      // Expiration reached, wipe references
      setSignedUrls([]);
      setTimeLeft(null);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleRequestUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSignedIdUrl(guestId);
      if (result.success && result.signedUrls) {
        setSignedUrls(result.signedUrls);
        setTimeLeft(60); // 60 seconds lifetime
      } else if (result.success && (result as any).signedUrl) {
        setSignedUrls([(result as any).signedUrl]);
        setTimeLeft(60);
      } else {
        setError(result.error || 'Failed to retrieve secure URL.');
      }
    } catch (err) {
      setError('An error occurred. Check permissions.');
    } finally {
      setLoading(false);
    }
  };

  const closeViewer = () => {
    setSignedUrls([]);
    setTimeLeft(null);
  };

  return (
    <>
      <button
        onClick={handleRequestUrl}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-800 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-bold uppercase transition-all shadow-sm disabled:opacity-50 select-none cursor-pointer font-sans"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Eye size={13} />
        )}
        <span>VIEW_ID</span>
      </button>

      {/* Expiry Warning banner */}
      {error && (
        <div className="absolute right-0 bottom-full mb-1 p-2 bg-rose-950/20 text-rose-400 border border-rose-900/60 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 shadow-sm z-10 font-mono">
          <AlertCircle size={10} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-zinc-500 hover:text-zinc-305 ml-1 cursor-pointer">
            <X size={10} />
          </button>
        </div>
      )}

      {/* Private ID Viewer Modal Overlay */}
      {signedUrls.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-zinc-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-lg border border-zinc-800">
            {/* Modal Header */}
            <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider font-mono">
                  <ShieldCheck size={12} /> SECURED DECRYPTION VIEW ACTIVE
                </span>
                <h3 className="font-extrabold text-zinc-100 text-sm mt-1 uppercase tracking-wider">
                  {guestName} // {idType} ({signedUrls.length} ID{signedUrls.length === 1 ? '' : 's'})
                </h3>
              </div>
              <button
                onClick={closeViewer}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Viewer Area */}
            <div className="p-6 bg-zinc-950 flex flex-col items-center justify-center">
              <div className="relative w-full max-h-[350px] overflow-y-auto bg-black border border-zinc-800 rounded-xl shadow-inner p-2 space-y-4">
                {signedUrls.map((url, index) => (
                  <div key={index} className="border border-zinc-800 p-1 bg-zinc-900 rounded-lg">
                    <span className="text-[8px] font-bold text-zinc-450 block p-1 bg-zinc-950 uppercase tracking-widest text-center rounded-t-md">
                      GUEST #{index + 1} ID DOCUMENT
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Guest #${index + 1} ID Card`}
                      className="w-full object-contain rounded-b-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>

              {/* Security Banner with active countdown */}
              <div className="mt-6 w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-955/20 border border-indigo-900 p-3 rounded-lg text-xs text-indigo-300 font-bold uppercase tracking-wider">
                <span className="text-center sm:text-left text-[10px]">
                  BUFFER DECRYPTION SELF-DESTRUCT ACTIVE.
                </span>
                <div className="flex items-center gap-1.5 text-rose-400 border border-rose-900/60 bg-zinc-950 px-2.5 py-1 rounded-lg shadow-sm shrink-0">
                  <Clock size={12} className="animate-pulse" />
                  <span>{timeLeft}S TIMER</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-zinc-955 border-t border-zinc-800 flex justify-end">
              <button
                onClick={closeViewer}
                className="px-4 py-2 text-xs font-bold bg-zinc-50 hover:bg-zinc-200 text-zinc-950 border border-zinc-50 rounded-lg shadow-sm transition-all cursor-pointer uppercase tracking-wider"
              >
                CLOSE BUFFER VIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
