import { useState } from 'react';
import { Waves } from 'lucide-react';

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function MediaImage({ src, alt, className = '', fallbackLabel }: MediaImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 text-slate-500 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Waves className="h-7 w-7 text-sky-600 mb-1.5" />
        <span className="text-xs font-medium text-slate-600 px-3 text-center">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
