'use client';

import { useState } from 'react';
import { PlayCircle, X } from 'lucide-react';

interface PromoVideoPosterProps {
  posterUrl: string;
  videoUrl: string;
  title: string;
}

export function PromoVideoPoster({ posterUrl, videoUrl, title }: PromoVideoPosterProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
        <img src={posterUrl} alt={title} className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="w-20 h-20 text-white/80 drop-shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:text-white" />
        </div>
      </div>

      {isPlaying && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center animate-in fade-in" onClick={() => setIsPlaying(false)}>
          <button onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }} className="absolute top-4 right-4 z-[210] text-white p-2 rounded-full bg-white/10 hover:bg-white/20">
            <X className="w-8 h-8" />
          </button>
          <video
            className="w-full max-w-4xl max-h-[80vh]"
            src={videoUrl}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the video itself
          />
        </div>
      )}
    </>
  );
}
