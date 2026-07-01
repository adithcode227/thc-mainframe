'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from 'src/lib/supabase';

/**
 * Next.js Server Action to safely fetch a short-lived (60s) signed URL for a guest ID card.
 * Enforces strict DPDP-compliant multi-property access controls.
 */
export async function getSignedIdUrl(guestId: string) {
  try {
    // 1. Initialize user client to retrieve and authenticate active session
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Please authenticate to view sensitive guest documents.' };
    }

    // 2. Fetch current staff member's profile for role scoping
    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('role, property_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Unauthorized: Staff profile could not be validated.' };
    }

    // 3. Query the specific guest's check-in record to check property ownership
    const { data: guest, error: guestError } = await supabase
      .from('guest_register')
      .select('property_id, id_storage_path, digital_signature_path')
      .eq('id', guestId)
      .single();

    if (guestError || !guest) {
      return { success: false, error: 'Error: Guest registration record not found.' };
    }

    // 4. Multi-Property Access Authorization Check:
    // - Admin: Access to all properties allowed.
    // - Receptionist: Access strictly restricted to their own property.
    if (profile.role === 'receptionist' && profile.property_id !== guest.property_id) {
      return { success: false, error: 'Access Denied: You do not have permission to view guest documents from other properties.' };
    }

    // 5. Generate secure, tokenized short-lived signed URLs (valid for 60 seconds)
    const adminSupabase = createSupabaseAdminClient();
    
    // 5a. Sign Guest Digital Signature
    let signatureUrl: string | null = null;
    if (guest.digital_signature_path) {
      const { data: sigData, error: sigError } = await adminSupabase.storage
        .from('guest-identities')
        .createSignedUrl(guest.digital_signature_path, 60);
      
      if (!sigError && sigData) {
        signatureUrl = sigData.signedUrl;
      }
    }

    // 5b. Sign ID Documents
    let paths: string[] = [];
    if (guest.id_storage_path.startsWith('[')) {
      try {
        paths = JSON.parse(guest.id_storage_path);
      } catch {
        paths = [guest.id_storage_path];
      }
    } else {
      paths = [guest.id_storage_path];
    }

    const idUrls: string[] = [];
    for (const path of paths) {
      const { data: signedData, error: signError } = await adminSupabase.storage
        .from('guest-identities')
        .createSignedUrl(path, 60);
      
      if (!signError && signedData) {
        idUrls.push(signedData.signedUrl);
      }
    }

    return { 
      success: true, 
      signatureUrl, 
      idUrls, 
      signedUrls: idUrls // Backward compatibility for ViewIdButton modal
    };
  } catch (err: any) {
    console.error("getSignedIdUrl exception:", err);
    return { success: false, error: 'Internal server error occurred while retrieving document link.' };
  }
}
