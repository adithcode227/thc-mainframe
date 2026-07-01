'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from 'src/lib/supabase';

export type CheckInInput = {
  propertyId: string;
  villaType: 'Full Property' | 'Upper Side Villa' | 'Downside Villa';
  guestName: string;
  phone: string;
  email?: string;
  nationality: string;
  purposeOfVisit: 'Leisure' | 'Business' | 'Personal' | 'Other';
  arrivingFrom?: string;
  proceedingTo?: string;
  expectedCheckout?: string;
  numberOfGuests: number;
  idType: 'Aadhaar' | 'Passport' | 'Driving License' | 'PAN Card' | 'Voter ID' | 'Other';
  idNumber?: string;
  idImagesBase64: string[];
  signatureBase64: string;
  consentGiven: boolean;
};

export async function registerGuest(data: CheckInInput) {
  try {
    // 1. Verify consent under India DPDP Act
    if (!data.consentGiven) {
      return { success: false, error: 'Consent under DPDP Act is mandatory for guest registration.' };
    }

    const isSandbox = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSandbox) {
      // Simulate network insertion latency
      await new Promise(resolve => setTimeout(resolve, 800));
      const guestId = `mock-${crypto.randomUUID()}`;
      return { success: true, guestId };
    }

    // 2. Initialize Server-side Supabase client with staff authentication cookies (optional: guest can check in anonymously)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 3. Fetch staff role and property authorization mapping if session is active
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('role, property_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { role, property_id: staffPropertyId } = profile;

        // 4. Validate Property Scope: Receptionists can only write to their own property
        if (role === 'receptionist' && staffPropertyId !== data.propertyId) {
          return { success: false, error: 'Access Denied: Receptionists can only log check-ins for their assigned resort.' };
        }
      }
    }

    // 5. Initialize secure Admin client to upload files and write to database bypassing RLS on server
    const adminSupabase = createSupabaseAdminClient();

    // 6. Generate a unique guest registry identifier
    const guestId = crypto.randomUUID();

    // 7. Convert signature base64 asset to Buffer for upload
    const signatureBuffer = Buffer.from(data.signatureBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const sigMime = data.signatureBase64.match(/data:(image\/\w+);base64/)?.[1] || 'image/png';
    const sigExt = sigMime.split('/')[1] || 'png';
    const signaturePath = `${data.propertyId}/${guestId}/signature.${sigExt}`;

    // 8. Loop upload all guest ID documents using Admin Client
    const idStoragePaths: string[] = [];

    for (let i = 0; i < data.idImagesBase64.length; i++) {
      const idBase64 = data.idImagesBase64[i];
      if (!idBase64) continue;

      const idImageBuffer = Buffer.from(idBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const idMime = idBase64.match(/data:(image\/\w+);base64/)?.[1] || 'image/jpeg';
      const idExt = idMime.split('/')[1] || 'jpeg';
      const idStoragePath = `${data.propertyId}/${guestId}/id_document_${i}.${idExt}`;

      const { error: idUploadError } = await adminSupabase.storage
        .from('guest-identities')
        .upload(idStoragePath, idImageBuffer, {
          contentType: idMime,
          cacheControl: '3652',
          upsert: true
        });

      if (idUploadError) {
        console.error(`ID Image ${i} upload error:`, idUploadError);
        // Roll back: Delete all uploaded ID images so far using admin client
        if (idStoragePaths.length > 0) {
          await adminSupabase.storage.from('guest-identities').remove(idStoragePaths);
        }
        return { success: false, error: `Failed to upload ID photo for guest #${i + 1}: ${idUploadError.message}` };
      }

      idStoragePaths.push(idStoragePath);
    }

    // 9. Upload Signature to Supabase Storage using Admin Client
    const { error: sigUploadError } = await adminSupabase.storage
      .from('guest-identities')
      .upload(signaturePath, signatureBuffer, {
        contentType: sigMime,
        cacheControl: '3652',
        upsert: true
      });

    if (sigUploadError) {
      console.error("Signature upload error:", sigUploadError);
      // Roll back: Delete all uploaded ID images
      if (idStoragePaths.length > 0) {
        await adminSupabase.storage.from('guest-identities').remove([...idStoragePaths, signaturePath]);
      } else {
        await adminSupabase.storage.from('guest-identities').remove([signaturePath]);
      }
      return { success: false, error: `Failed to upload signature: ${sigUploadError.message}` };
    }

    // 10. Log Check-In Record to PostgreSQL database using Admin Client
    const dbIdPath = JSON.stringify(idStoragePaths);

    const { error: dbError } = await adminSupabase
      .from('guest_register')
      .insert({
        id: guestId,
        property_id: data.propertyId,
        villa_type: data.villaType,
        guest_name: data.guestName,
        phone: data.phone,
        email: data.email || null,
        nationality: data.nationality,
        purpose_of_visit: data.purposeOfVisit,
        arriving_from: data.arrivingFrom || null,
        proceeding_to: data.proceedingTo || null,
        expected_checkout: data.expectedCheckout ? new Date(data.expectedCheckout).toISOString() : null,
        number_of_guests: data.numberOfGuests,
        id_type: data.idType,
        id_number: data.idNumber || null,
        id_storage_path: dbIdPath,
        digital_signature_path: signaturePath,
        consent_given: data.consentGiven
      });

    if (dbError) {
      console.error("Database log insert error:", dbError);
      // Roll back: Delete all uploaded guest documents and signature
      await adminSupabase.storage.from('guest-identities').remove([...idStoragePaths, signaturePath]);
      return { success: false, error: `Database check-in logging failed: ${dbError.message}` };
    }

    return { success: true, guestId };
  } catch (err: any) {
    console.error("Register guest exception:", err);
    return { success: false, error: 'Internal server error occurred during guest registration.' };
  }
}
