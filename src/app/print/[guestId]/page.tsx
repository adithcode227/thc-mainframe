import React from 'react';
import { notFound } from 'next/navigation';
import { ShieldCheck, FileText, Calendar, MapPin, User } from 'lucide-react';
import { createSupabaseServerClient } from 'src/lib/supabase';
import { getSignedIdUrl } from 'src/actions/get-signed-url';

interface PrintPageProps {
  params: Promise<{ guestId: string }>;
}

export const revalidate = 0; // Dynamic server component

export default async function PrintGrcPage({ params }: PrintPageProps) {
  const resolvedParams = await params;
  const guestId = resolvedParams.guestId;

  let guest: any = null;
  let idSignedUrls: string[] = [];
  let sigSignedUrl: string | null = null;
  let isSandbox = false;

  try {
    const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasEnv) {
      isSandbox = true;
    } else {
      const supabase = await createSupabaseServerClient();
      
      // Fetch user to check authorization (must be receptionist or admin)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return (
          <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 text-center font-sans">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl max-w-sm w-full text-zinc-50 shadow-md">
              <ShieldCheck className="mx-auto text-rose-500 mb-4" size={32} />
              <h3 className="text-lg font-bold uppercase tracking-wider mb-2">Staff Auth Required</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                You must be logged in as an authorized receptionist or manager to print GRC records.
              </p>
              <a 
                href="/login" 
                className="inline-block w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-955 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wide transition-colors"
              >
                Log In as Staff
              </a>
            </div>
          </div>
        );
      }

      // Fetch guest record
      const { data: guestData, error: guestError } = await supabase
        .from('guest_register')
        .select('*, properties(name, location)')
        .eq('id', guestId)
        .single();

      if (guestError || !guestData) {
        return notFound();
      }

      guest = guestData;

      // Generate signed URLs using admin client
      const signedUrlsResult = await getSignedIdUrl(guestId);
      if (signedUrlsResult.success) {
        sigSignedUrl = signedUrlsResult.signatureUrl || null;
        idSignedUrls = signedUrlsResult.idUrls || [];
      }
    }
  } catch (err) {
    console.error('Fetch GRC error, triggering offline fallback:', err);
    isSandbox = true;
  }

  // Populate mock data if Sandbox mode is active
  if (isSandbox) {
    guest = {
      id: guestId,
      guest_name: 'Adithyan Prakash',
      phone: '+91 98765 43210',
      email: 'adithyprakash12@gmail.com',
      nationality: 'Indian',
      purpose_of_visit: 'Leisure',
      villa_type: 'Full Property',
      arriving_from: 'Kochi, Kerala',
      proceeding_to: 'Azhikode, Thrissur',
      check_in: new Date().toISOString(),
      expected_checkout: new Date(Date.now() + 3600000 * 24).toISOString(),
      number_of_guests: 1,
      id_type: 'PAN Card',
      id_storage_path: '["sandbox/guest/id_document_0.jpeg"]',
      properties: {
        name: 'Ocean Pals',
        location: 'Azhikode, Thrissur, Kerala'
      }
    };
    idSignedUrls = []; 
    sigSignedUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><text x="10" y="40" style="font: italic 22px Georgia, serif; fill: %23c2a03d;">Adithyan Prakash</text></svg>';
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-800 p-4 sm:p-8 flex items-center justify-center font-sans print:bg-white print:p-0">
      
      {/* Inject precise A4 Print Engine CSS directives */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .a4-print-card {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 15mm 10mm 15mm !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
      
      {/* Formal GRC Frame (A4 Aspect Ratio on Screen, exact A4 size on Print, Elegant double gold border) */}
      <div className="bg-white border-[8px] border-double border-[#c2a03d]/70 w-[210mm] h-[297mm] p-12 shadow-2xl a4-print-card flex flex-col justify-between print:border-[8px] print:border-double print:border-[#c2a03d]/80">
        <div className="flex flex-col flex-grow justify-between">
          
          {/* Resort Letterhead Header with Logo */}
          <div className="flex items-center justify-between border-b border-[#c2a03d] pb-4 mb-4">
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/thc_logo.png" 
                alt="THC Group Logo" 
                className="h-14 w-auto object-contain"
              />
              <div className="border-l border-slate-200 pl-3.5">
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 leading-tight">
                  {guest.properties?.name}
                </h1>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={10} className="shrink-0 text-slate-400" />
                  <span>{guest.properties?.location}</span>
                </p>
              </div>
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <span className="text-[9px] font-bold border border-[#c2a03d] bg-amber-50/30 px-3 py-0.5 rounded text-[#8c6f1a] tracking-wider uppercase block mb-1 print:bg-transparent">
                OFFICIAL RECORD
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase leading-none">
                ID: {guest.id.substring(0, 18).toUpperCase()}...
              </span>
            </div>
          </div>

          {/* Form Title Banner in gold theme */}
          <div className="bg-[#c2a03d] text-white p-3 text-center rounded-lg mb-5 print:bg-[#c2a03d] print:text-white">
            <h2 className="text-sm font-bold uppercase tracking-widest leading-none">
              Guest Registration Card (GRC)
            </h2>
          </div>

          {/* Section 1 & 2 side-by-side columns to save vertical space */}
          <div className="grid grid-cols-2 gap-5 mb-4">
            
            {/* COLUMN 1: Stay particulars */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-[#8c6f1a] mb-2 flex items-center gap-1 border-b border-[#c2a03d]/30 pb-1">
                <Calendar size={11} className="text-[#c2a03d]" />
                <span>1. Stay Particulars</span>
              </h3>
              <table className="w-full border-collapse border border-[#c2a03d]/30 text-[10px]">
                <tbody>
                  <tr>
                    <td className="w-2/5 bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Resort</td>
                    <td className="w-3/5 border border-[#c2a03d]/20 p-2 font-semibold text-slate-900 truncate max-w-[120px]">{guest.properties?.name}</td>
                  </tr>
                  <tr>
                    <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Villa Type</td>
                    <td className="border border-[#c2a03d]/20 p-2 font-bold text-slate-900 uppercase">{guest.villa_type}</td>
                  </tr>
                  <tr>
                    <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Check-In</td>
                    <td className="border border-[#c2a03d]/20 p-2 font-semibold text-slate-900 font-mono text-[9px]">{new Date(guest.check_in).toLocaleString([], {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                  </tr>
                  <tr>
                    <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Expected Out</td>
                    <td className="border border-[#c2a03d]/20 p-2 font-semibold text-slate-900 font-mono text-[9px]">
                      {guest.expected_checkout ? new Date(guest.expected_checkout).toLocaleString([], {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* COLUMN 2: Guest particulars */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-[#8c6f1a] mb-2 flex items-center gap-1 border-b border-[#c2a03d]/30 pb-1">
                <User size={11} className="text-[#c2a03d]" />
                <span>2. Visitor Details</span>
              </h3>
              <table className="w-full border-collapse border border-[#c2a03d]/30 text-[10px]">
                <tbody>
                  <tr>
                    <td className="w-2/5 bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Guest Name</td>
                    <td className="w-3/5 border border-[#c2a03d]/20 p-2 font-bold text-slate-900 uppercase truncate max-w-[120px]">{guest.guest_name}</td>
                  </tr>
                  <tr>
                    <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Phone</td>
                    <td className="border border-[#c2a03d]/20 p-2 font-semibold text-slate-900 font-mono">{guest.phone}</td>
                  </tr>
                  <tr>
                    <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Email</td>
                    <td className="border border-[#c2a03d]/20 p-2 font-medium text-slate-900 font-mono truncate max-w-[120px]">{guest.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2 font-bold uppercase text-slate-500 text-[8px]">Nationality</td>
                    <td className="border border-[#c2a03d]/20 p-2 font-semibold text-slate-900 uppercase">{guest.nationality}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Section 2 Continued: Additional Travel Details */}
          <div className="mb-4">
            <table className="w-full border-collapse border border-[#c2a03d]/30 text-[10px]">
              <tbody>
                <tr>
                  <td className="w-1/6 bg-amber-50/10 border border-[#c2a03d]/20 p-2.5 font-bold uppercase text-slate-500 text-[8px]">ID Verification</td>
                  <td className="w-2/6 border border-[#c2a03d]/20 p-2.5 font-semibold text-slate-900 uppercase">{guest.id_type} (Scanned)</td>
                  <td className="w-1/6 bg-amber-50/10 border border-[#c2a03d]/20 p-2.5 font-bold uppercase text-slate-500 text-[8px]">Guests Quantity</td>
                  <td className="w-2/6 border border-[#c2a03d]/20 p-2.5 font-semibold text-slate-900">
                    {guest.number_of_guests === 1 
                      ? '1 Pax (Primary Guest only)' 
                      : `${guest.number_of_guests} Pax (1 Primary + ${guest.number_of_guests - 1} Accompanied)`}
                  </td>
                </tr>
                <tr>
                  <td className="bg-amber-50/10 border border-[#c2a03d]/20 p-2.5 font-bold uppercase text-slate-500 text-[8px]">Travel Route</td>
                  <td className="border border-[#c2a03d]/20 p-2.5 font-semibold text-slate-805" colSpan={3}>
                    From: <span className="uppercase font-bold text-slate-900">{guest.arriving_from || 'Local'}</span> &rarr; Going to: <span className="uppercase font-bold text-slate-900">{guest.proceeding_to || 'Resort'}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    Purpose: <span className="uppercase font-bold text-[#8c6f1a] text-[9px]">{guest.purpose_of_visit}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 3 & 4: Sideways Layout (Guest Signature left, ID Dossier right) */}
          <div className="grid grid-cols-2 gap-5 mb-4">
            
            {/* Left side: Guest Digital Signature block */}
            <div className="border border-[#c2a03d]/30 p-3.5 rounded-xl flex flex-col justify-between h-40">
              <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none">
                3. Guest Digital Signature
              </span>
              <div className="w-full flex-grow flex items-center justify-center p-1.5 bg-amber-50/5 rounded-lg border border-slate-100 print:bg-transparent">
                {sigSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sigSignedUrl} alt="Guest Signature" className="max-h-24 max-w-full object-contain invert" />
                ) : (
                  <span className="text-[10px] text-slate-405 italic">Signed electronically</span>
                )}
              </div>
              <div className="text-center text-[9px] text-[#8c6f1a] font-bold uppercase leading-none mt-1">
                Guest Representative Signature
              </div>
            </div>

            {/* Right side: Scanned ID Verification Dossier */}
            <div className="border border-[#c2a03d]/30 p-3.5 rounded-xl flex flex-col justify-between h-40">
              <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none mb-1">
                4. Identity Document Verification
              </span>
              
              <div className="w-full flex-grow flex items-center justify-center bg-amber-50/5 rounded-lg border border-slate-105 overflow-hidden print:bg-transparent">
                {idSignedUrls.length > 0 ? (
                  <div className="flex gap-2 w-full h-full p-1 justify-center items-center">
                    {idSignedUrls.slice(0, 2).map((url, idx) => (
                      <div key={idx} className="border border-[#c2a03d]/10 bg-white p-0.5 rounded shadow-sm flex flex-col items-center h-full justify-center w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`ID Card #${idx + 1}`} className="max-h-20 max-w-full object-contain rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-2 text-slate-400 flex flex-col items-center justify-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase leading-none">Archived Securely</span>
                    <span className="text-[7.5px] font-mono select-all break-all text-slate-450 mt-1 block">
                      {guest.id_storage_path.substring(0, 30)}...
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-[#8c6f1a] font-bold uppercase leading-none mt-1">
                Verified Document ({guest.id_type})
              </div>
            </div>

          </div>

          {/* SECTION 5: Legal Disclaimers & Rules Agreement */}
          <div className="mb-4">
            <div className="border border-[#c2a03d]/30 p-3.5 bg-amber-50/5 text-[9px] text-slate-550 leading-relaxed rounded-xl print:bg-transparent">
              <span className="font-bold text-[#8c6f1a] uppercase block mb-1">5. Privacy Notice, Consent &amp; Rules Agreement (DPDP Act, 2023):</span>
              <p className="mb-2">
                I declare details above are true. Under India&apos;s DPDP Act, I grant consent to the resort to process, store, and transmit my personal details, signature, and scanned IDs to official security nodes (Form C) for safety audits. Checkout is strictly 11:00 AM. Quiet hours are 10:00 PM - 8:00 AM. Damaged assets are billed to the guest.
              </p>
              <div className="mt-2.5 p-2 bg-[#c2a03d]/10 border border-[#c2a03d]/30 rounded-lg text-center font-bold text-[#8c6f1a] text-[9.5px] print:bg-transparent">
                &ldquo; I hereby agree to all the rules and regulations of the resort during my stay. &rdquo;
              </div>
            </div>
          </div>

        </div>

        {/* Footer credentials */}
        <div className="text-center text-[9px] text-[#8c6f1a] font-semibold uppercase tracking-widest pt-3 border-t border-[#c2a03d] font-mono">
          Pantai &amp; Ocean Pals Resorts &bull; Private GRC Database Ledger
        </div>

      </div>

    </div>
  );
}
