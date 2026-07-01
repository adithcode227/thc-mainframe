import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { createSupabaseServerClient } from 'src/lib/supabase';
import CheckInForm from 'src/components/CheckInForm';

interface Property {
  id: string;
  name: string;
  location: string;
}

const FALLBACK_PROPERTIES: Property[] = [
  { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Pantai Retreat Villa', location: 'Azhikode, Thrissur, Kerala' },
  { id: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', name: 'Ocean Pals', location: 'Azhikode, Thrissur, Kerala' }
];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FrontDeskPage() {
  let properties: Property[] = [];
  let isSandbox = false;

  try {
    const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasEnv) {
      isSandbox = true;
      properties = FALLBACK_PROPERTIES;
    } else {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, location')
        .order('name');
      
      if (error || !data || data.length === 0) {
        properties = FALLBACK_PROPERTIES;
        isSandbox = true;
      } else {
        properties = data;
      }
    }
  } catch (err) {
    console.error('Supabase fetch properties failed, using sandbox fallback:', err);
    properties = FALLBACK_PROPERTIES;
    isSandbox = true;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans antialiased relative justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Centered Page Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-semibold text-zinc-400 tracking-wider block">
          Pantai Retreat & Ocean Pals
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-50 mt-2 mb-3 tracking-tight">
          Guest Registration
        </h1>
        <p className="text-sm text-zinc-400 font-normal max-w-sm mx-auto leading-relaxed">
          Please complete the registration form below to check-in to your villa.
        </p>
      </div>

      {/* Centered Check-in Form Card */}
      <div className="w-full max-w-xl mx-auto z-10">
        <CheckInForm properties={properties} />
      </div>

      {/* Footer Disclaimer & Staff portal link */}
      <div className="text-center text-xs text-zinc-500 mt-10 max-w-md mx-auto space-y-4 font-normal">
        <div>Your information is kept private and used solely for registration purposes.</div>
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-zinc-50 font-semibold border border-zinc-800 hover:bg-zinc-900 px-4 py-2 rounded-lg transition-colors cursor-pointer text-xs"
          >
            <span>Staff Portal Access</span>
            <ExternalLink size={12} className="shrink-0" />
          </Link>
        </div>
      </div>

    </div>
  );
}
