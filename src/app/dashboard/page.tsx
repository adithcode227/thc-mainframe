import React from 'react';
import Link from 'next/link';
import { 
  Hotel, Users, LogOut, ArrowRight, ShieldAlert, 
  MapPin, Calendar, Smartphone, Lock, FileSpreadsheet, Printer 
} from 'lucide-react';
import { createSupabaseServerClient, createSupabaseAdminClient } from 'src/lib/supabase';
import ViewIdButton from 'src/components/ViewIdButton';
import PropertyFilter from 'src/components/PropertyFilter';
import { redirect } from 'next/navigation';

interface Property {
  id: string;
  name: string;
  location: string;
}

interface GuestRecord {
  id: string;
  property_id: string;
  villa_type: string;
  guest_name: string;
  phone: string;
  email?: string | null;
  nationality: string;
  purpose_of_visit: string;
  arriving_from?: string | null;
  proceeding_to?: string | null;
  check_in: string;
  expected_checkout?: string | null;
  number_of_guests: number;
  id_type: string;
  properties?: {
    name: string;
    location: string;
  };
}

interface DashboardProps {
  searchParams: Promise<{ propertyId?: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MOCK_PROPERTIES: Property[] = [
  { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Pantai Retreat Villa', location: 'Azhikode, Thrissur, Kerala' },
  { id: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', name: 'Ocean Pals', location: 'Azhikode, Thrissur, Kerala' }
];

const MOCK_GUESTS: GuestRecord[] = [
  {
    id: 'guest-mock-1',
    property_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    villa_type: 'Full Property',
    guest_name: 'Adithyan Nair',
    phone: '+91 94472 12345',
    email: 'adithyan.nair@example.com',
    nationality: 'Indian',
    purpose_of_visit: 'Leisure',
    arriving_from: 'Kochi, Kerala',
    proceeding_to: 'Azhikode, Thrissur',
    check_in: new Date(Date.now() - 3600000 * 2).toISOString(),
    expected_checkout: new Date(Date.now() + 3600000 * 24).toISOString(),
    number_of_guests: 2,
    id_type: 'Aadhaar'
  },
  {
    id: 'guest-mock-2',
    property_id: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c',
    villa_type: 'Full Property',
    guest_name: 'Elena Rostova',
    phone: '+7 912 345-67-89',
    email: 'elena.rost@travel.org',
    nationality: 'Russian',
    purpose_of_visit: 'Leisure',
    arriving_from: 'Moscow, Russia',
    proceeding_to: 'Varkala, Kerala',
    check_in: new Date(Date.now() - 3600000 * 48).toISOString(),
    expected_checkout: new Date(Date.now() - 36500 * 24).toISOString(),
    number_of_guests: 1,
    id_type: 'Passport'
  }
];

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const resolvedParams = await searchParams;
  const filterPropertyId = resolvedParams.propertyId || '';

  let properties: Property[] = [];
  let guests: GuestRecord[] = [];
  let userProfile: { role: string; property_id: string | null } | null = null;
  let isSandbox = false;
  let connectionError = '';

  try {
    const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasEnv) {
      isSandbox = true;
    } else {
      const supabase = await createSupabaseServerClient();
      
      // Fetch session and role details
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect('/login');
      }

      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('role, property_id')
        .eq('id', user.id)
        .single();
      userProfile = profile;

      // Fetch resorts list for admin select filters
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .order('name');
      
      if (propsError) throw propsError;
      properties = propsData || [];

      // Build guest logs query
      let query = supabase
        .from('guest_register')
        .select('*, properties(name, location)');

      // Enforce property scope if receptionist
      if (userProfile?.role === 'receptionist') {
        const repPropId = userProfile.property_id;
        if (repPropId) {
          query = query.eq('property_id', repPropId);
        }
      } else if (filterPropertyId) {
        // If admin filtered by property
        query = query.eq('property_id', filterPropertyId);
      }

      const { data: guestData, error: guestError } = await query.order('check_in', { ascending: false });
      if (guestError) throw guestError;

      guests = guestData || [];
    }
  } catch (err: any) {
    console.error('Supabase fetch failed:', err);
    connectionError = err.message;
    isSandbox = true;
  }

  // Populate mock data if Sandbox mode is triggered
  if (isSandbox) {
    properties = MOCK_PROPERTIES;
    
    // Simulate query filtering
    if (filterPropertyId) {
      guests = MOCK_GUESTS.filter(g => g.property_id === filterPropertyId);
    } else {
      guests = MOCK_GUESTS;
    }

    // Attach property details
    guests = guests.map(g => ({
      ...g,
      properties: MOCK_PROPERTIES.find(p => p.id === g.property_id)
    }));

    userProfile = { role: 'admin', property_id: null }; // Simulate admin view in Sandbox
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans select-none p-4 sm:p-6 md:p-8">
      
      {/* Top Header Navbar */}
      <header className="sticky top-0 bg-zinc-900 border border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between z-30 shadow-md rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-zinc-800 bg-zinc-950 text-zinc-100 flex items-center justify-center rounded-xl shadow-sm">
            <Hotel size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wide leading-none">Resort Dashboard</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1.5">[ Manager Central Ledger ]</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-semibold border border-zinc-800 text-zinc-200 bg-zinc-950 px-2.5 py-0.5 rounded-lg uppercase">
              ROLE: {userProfile?.role || 'STAFF'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wide">NODE: KERALA_CENTRAL</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-rose-400 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 px-3.5 py-2.5 rounded-xl font-bold uppercase transition-all shadow-sm cursor-pointer"
          >
            <LogOut size={14} /> GRC Form
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-1 py-8 space-y-6">
        
        {/* Connection/Sandbox Notice Banner */}
        {isSandbox && (
          <div className="p-4 bg-amber-955/20 border border-amber-900 text-amber-300 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm font-semibold">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-amber-505 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold tracking-wide">[ Sandbox Ledger Active ]</h4>
                <p className="text-xs text-amber-400 mt-1 font-normal leading-relaxed">
                  Offline storage buffer is active. Supabase connection keys are missing.
                  {connectionError && <span className="block mt-1 font-mono text-[9px] select-all uppercase">Dev Log: {connectionError}</span>}
                </p>
              </div>
            </div>
            <span className="self-start md:self-center bg-amber-950 border border-amber-800 text-amber-350 text-[10px] font-semibold tracking-wider px-3 py-1 rounded-lg whitespace-nowrap">
              OFFLINE PREVIEW
            </span>
          </div>
        )}

        {/* Dashboard Title & Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-50 tracking-wide">[ Guest Access Ledger ]</h1>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-1 tracking-wider">Secured DPDP Audited Local Police Logs &amp; Read-Only Buffer</p>
          </div>

          {/* Property Filter Dropdown */}
          <PropertyFilter properties={properties} defaultValue={filterPropertyId} />
        </div>

        {/* Guest Logs Table */}
        <div className="bg-zinc-900 text-zinc-50 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 border-r border-zinc-800">Guest Particulars</th>
                  <th className="px-6 py-4 border-r border-zinc-800">Resort Villa</th>
                  <th className="px-6 py-4 border-r border-zinc-800">Check-in Timeline</th>
                  <th className="px-6 py-4 border-r border-zinc-800">Doc Type</th>
                  <th className="px-6 py-4 text-right">Data Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                {guests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-semibold tracking-wide bg-zinc-950">
                      [ NO VISITORS DETECTED ON SYSTEM FILE ]
                    </td>
                  </tr>
                ) : (
                  guests.map(guest => (
                    <tr key={guest.id} className="hover:bg-zinc-800/40 transition-colors">
                      
                      {/* Guest Info */}
                      <td className="px-6 py-4 border-r border-zinc-800">
                        <div className="font-bold text-zinc-50 flex items-center gap-2">
                          <span className="uppercase tracking-wide">{guest.guest_name}</span>
                          <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 font-semibold uppercase rounded-md">
                            {guest.nationality}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex flex-col gap-0.5 font-normal">
                          <span className="flex items-center gap-1">
                            <Smartphone size={11} className="opacity-70" />
                            <span>{guest.phone}</span>
                          </span>
                          {guest.email && (
                            <span className="text-[10px] opacity-80 truncate max-w-[180px] select-all lowercase text-zinc-500">
                              {guest.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Resort / Villa */}
                      <td className="px-6 py-4 border-r border-zinc-800">
                        <div className="font-semibold text-zinc-100 text-xs flex items-center gap-1 uppercase tracking-wide">
                          <MapPin size={12} className="text-zinc-505 shrink-0" />
                          <span>{guest.properties?.name || 'KERALA RESORT'}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex flex-col gap-0.5 font-normal">
                          <span>VILLA: <strong className="font-semibold text-zinc-100 uppercase">{guest.villa_type}</strong></span>
                          <span>GUESTS_QTY: <strong className="font-semibold text-zinc-100">{guest.number_of_guests}</strong></span>
                          <span>PURPOSE: {guest.purpose_of_visit.toUpperCase()}</span>
                          {(guest.arriving_from || guest.proceeding_to) && (
                            <span className="truncate max-w-[180px] text-[10px] text-zinc-500 font-medium">
                              ROUTE: {guest.arriving_from?.toUpperCase() || 'LOCAL'} &rarr; {guest.proceeding_to?.toUpperCase() || 'RESORT'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check-In / Checkout */}
                      <td className="px-6 py-4 border-r border-zinc-800 leading-normal font-semibold">
                        <div className="text-[11px] text-zinc-305 flex items-center gap-1.5 uppercase">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0" />
                          <span>In: {new Date(guest.check_in).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} {new Date(guest.check_in).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                        </div>
                        {guest.expected_checkout && (
                          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 uppercase">
                            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full shrink-0" />
                            <span>Out: {new Date(guest.expected_checkout).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} {new Date(guest.expected_checkout).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                          </div>
                        )}
                      </td>

                      {/* Document Type */}
                      <td className="px-6 py-4 border-r border-zinc-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-zinc-400 rounded-md text-[9px] font-semibold uppercase">
                          <Lock size={10} className="text-zinc-500" />
                          <span>{guest.id_type}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right relative flex justify-end items-center gap-2">
                        <a
                          href={`/print/${guest.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-800 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-bold uppercase transition-all shadow-sm cursor-pointer select-none"
                        >
                          <Printer size={13} />
                          <span>PRINT</span>
                        </a>

                        <ViewIdButton
                          guestId={guest.id}
                          guestName={guest.guest_name}
                          idType={guest.id_type}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-zinc-955 px-6 py-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1">
              <FileSpreadsheet size={14} className="opacity-70" />
              TOTAL SUMMARY REGISTERS :: {guests.length} FILES LOADED
            </span>
            <span className="flex items-center gap-1 text-zinc-600 font-semibold tracking-wider text-[9px]">
              [ COMPLIANCE ISO 27001 SECURED SYSTEM ]
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}
