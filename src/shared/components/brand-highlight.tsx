import React from 'react';

/**
 * Highlights any appearance of the brand word "بينكم" (or "*بينكم*")
 * in the distinctive sovereign logo teal/turquoise color (#14F5D5).
 */
export function highlightBrand(text: string | null | undefined): React.ReactNode {
  if (!text) return text;
  if (typeof text !== 'string') return text;
  if (!text.includes('بينكم')) return text;

  const parts = text.split(/(\*?بينكم\*?)/g);
  return parts.map((part, index) => {
    if (part === 'بينكم' || part === '*بينكم*') {
      return (
        <span key={index} className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.35)]">
          بينكم
        </span>
      );
    }
    return part;
  });
}

