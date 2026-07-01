'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Property {
  id: string;
  name: string;
  location: string;
}

interface PropertyFilterProps {
  properties: Property[];
  defaultValue: string;
}

export default function PropertyFilter({ properties, defaultValue }: PropertyFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('propertyId', value);
    } else {
      params.delete('propertyId');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 font-sans">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Filter:</span>
      <select
        value={defaultValue}
        onChange={handleChange}
        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-semibold text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer uppercase tracking-wider"
      >
        <option value="" className="bg-zinc-900 text-zinc-50">All Resort Properties</option>
        {properties.map(p => (
          <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-50">
            {p.name.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
