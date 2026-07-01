'use client';

import React, { useState } from 'react';
import { 
  Hotel, User, ShieldAlert, ShieldCheck, FileText, ChevronRight, 
  ChevronLeft, CheckCircle2, Loader2, Printer
} from 'lucide-react';
import { registerGuest } from 'src/actions/register-guest';
import CameraCapture from './CameraCapture';
import SignaturePad from './SignaturePad';

interface Property {
  id: string;
  name: string;
  location: string;
}

interface CheckInFormProps {
  properties: Property[];
  defaultPropertyId?: string;
}

export default function CheckInForm({ properties, defaultPropertyId }: CheckInFormProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: defaultPropertyId || (properties.length > 0 ? properties[0].id : ''),
    villaType: 'Full Property' as 'Full Property' | 'Upper Side Villa' | 'Downside Villa',
    guestName: '',
    phone: '',
    email: '',
    nationality: 'Indian',
    purposeOfVisit: 'Leisure' as 'Leisure' | 'Business' | 'Personal' | 'Other',
    arrivingFrom: '',
    proceedingTo: '',
    expectedCheckout: '',
    numberOfGuests: 1,
    idType: 'Aadhaar' as 'Aadhaar' | 'Passport' | 'Driving License' | 'PAN Card' | 'Voter ID' | 'Other',
    idNumber: '',
    idImagesBase64: [''],
    signatureBase64: '',
    consentGiven: false,
  });

  // Check if selected property is Ocean Pals
  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const isOceanPals = selectedProperty ? selectedProperty.name.toLowerCase().includes('ocean') : false;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updated = {
        ...prev,
        [name]: name === 'numberOfGuests' ? Number(value) : value
      };
      
      // Dynamic Resizing: Resize ID images array to match guest count
      if (name === 'numberOfGuests') {
        const count = Number(value) || 1;
        const newImages = [...prev.idImagesBase64];
        if (newImages.length < count) {
          while (newImages.length < count) newImages.push('');
        } else if (newImages.length > count) {
          newImages.splice(count);
        }
        updated.idImagesBase64 = newImages;
      }

      // Dynamic Reset: If property changes to Ocean Pals, enforce Full Property villa type
      if (name === 'propertyId') {
        const selProp = properties.find(p => p.id === value);
        const isOcean = selProp ? selProp.name.toLowerCase().includes('ocean') : false;
        if (isOcean) {
          updated.villaType = 'Full Property';
        }
      }
      return updated;
    });
  };

  const handleConsentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      consentGiven: e.target.checked
    }));
  };

  const handleSignature = (base64: string | null) => {
    setFormData(prev => ({
      ...prev,
      signatureBase64: base64 || ''
    }));
  };

  // Step Validation
  const validateStep = () => {
    if (step === 1) {
      if (!formData.guestName.trim()) return 'Guest name is required.';
      if (!formData.phone.trim()) return 'Phone / Mobile number is required.';
      if (!formData.nationality.trim()) return 'Nationality is required.';
    }
    if (step === 2) {
      if (!formData.propertyId) return 'Please select a resort property.';
      if (!formData.villaType) return 'Please select a villa type.';
      if (!formData.expectedCheckout) return 'Expected checkout date is required.';
      if (formData.numberOfGuests < 1) return 'Number of guests must be at least 1.';
    }
    if (step === 3) {
      const missingIdIndex = formData.idImagesBase64.findIndex(img => !img);
      if (missingIdIndex !== -1) {
        return `Please capture or upload the ID document for Guest #${missingIdIndex + 1}.`;
      }
      if (!formData.signatureBase64) return 'Guest digital signature is required.';
    }
    if (step === 4) {
      if (!formData.consentGiven) return 'Guest consent under DPDP Act is mandatory to proceed.';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setSubmitError(null);
    setStep(prev => prev - 1);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) {
      setSubmitError(err);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await registerGuest({
        propertyId: formData.propertyId,
        villaType: formData.villaType,
        guestName: formData.guestName,
        phone: formData.phone,
        email: formData.email || undefined,
        nationality: formData.nationality,
        purposeOfVisit: formData.purposeOfVisit,
        arrivingFrom: formData.arrivingFrom || undefined,
        proceedingTo: formData.proceedingTo || undefined,
        expectedCheckout: formData.expectedCheckout || undefined,
        numberOfGuests: Number(formData.numberOfGuests),
        idType: formData.idType,
        idImagesBase64: formData.idImagesBase64,
        signatureBase64: formData.signatureBase64,
        consentGiven: formData.consentGiven,
      });

      if (result.success && result.guestId) {
        setGuestId(result.guestId);
        setSuccess(true);
      } else {
        setSubmitError(result.error || 'Failed to submit registration card.');
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      setSubmitError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: defaultPropertyId || (properties.length > 0 ? properties[0].id : ''),
      villaType: 'Full Property',
      guestName: '',
      phone: '',
      email: '',
      nationality: 'Indian',
      purposeOfVisit: 'Leisure',
      arrivingFrom: '',
      proceedingTo: '',
      expectedCheckout: '',
      numberOfGuests: 1,
      idType: 'Aadhaar',
      idNumber: '',
      idImagesBase64: [''],
      signatureBase64: '',
      consentGiven: false,
    });
    setStep(1);
    setSuccess(false);
    setGuestId(null);
    setSubmitError(null);
  };

  const stepsList = [
    { title: 'Personal', icon: User },
    { title: 'Stay Details', icon: Hotel },
    { title: 'ID Scan', icon: FileText },
    { title: 'Confirm', icon: ShieldCheck }
  ];

  if (success) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8 sm:p-12 rounded-2xl text-center animate-fade-in max-w-xl mx-auto text-zinc-50 shadow-lg">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-850 text-zinc-100 rounded-full mb-6 border border-zinc-800">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-55 mb-2">Registration Complete</h2>
        <p className="text-zinc-400 text-sm font-normal mb-8 max-w-sm mx-auto leading-relaxed">
          Thank you. Your registration has been successfully logged. Please proceed to the reception counter to collect your key.
        </p>
        
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl mb-8 text-left text-xs font-mono text-zinc-400">
          <div className="flex justify-between mb-2 pb-2 border-b border-zinc-850"><span className="font-bold text-zinc-500">GUEST ID:</span> <span className="break-all font-bold text-zinc-100">{guestId}</span></div>
          <div className="flex justify-between mb-2"><span className="font-bold text-zinc-500">NAME:</span> <span className="font-bold text-zinc-100">{formData.guestName.toUpperCase()}</span></div>
          <div className="flex justify-between mb-2"><span className="font-bold text-zinc-500">VILLA TYPE:</span> <span className="font-bold text-zinc-100">{formData.villaType.toUpperCase()}</span></div>
          <div className="flex justify-between"><span className="font-bold text-zinc-500">TIMESTAMP:</span> <span className="font-bold text-zinc-100">{new Date().toLocaleTimeString()}</span></div>
        </div>

        <button
          onClick={resetForm}
          className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-3.5 rounded-lg shadow-sm transition-all uppercase cursor-pointer"
        >
          Register New Guest
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl overflow-hidden max-w-xl mx-auto p-8 sm:p-12 text-zinc-55">
      
      {/* Stepper Progress Steps */}
      <div className="relative mb-8 pb-4 border-b border-zinc-800">
        
        {/* Horizontal Connector Line */}
        <div className="absolute top-4.5 left-8 right-8 h-px bg-zinc-800 -z-0" />
        
        <div className="relative z-10 flex items-center justify-between">
          {stepsList.map((s, index) => {
            const Icon = s.icon;
            const isActive = step >= index + 1;
            const isCurrent = step === index + 1;
            return (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
                  isCurrent 
                    ? 'bg-zinc-50 border-zinc-50 text-zinc-950 shadow-sm' 
                    : isActive 
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100' 
                      : 'bg-zinc-900 border-zinc-850 text-zinc-600'
                }`}>
                  <Icon size={14} className={isCurrent ? 'stroke-[2.5]' : ''} />
                </div>
                <span className={`text-[10px] font-semibold mt-2.5 block text-center ${
                  isCurrent ? 'text-zinc-100 font-bold' : 'text-zinc-500 font-normal'
                }`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        
        {/* STEP 1: Guest Profile & Details */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col">
              <label htmlFor="guestName" className="text-xs font-semibold text-zinc-200 mb-1.5">
                Guest Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleTextChange}
                placeholder="Enter guest full name"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="phone" className="text-xs font-semibold text-zinc-200 mb-1.5">
                  Phone / Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleTextChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="email" className="text-xs font-semibold text-zinc-200 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleTextChange}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="nationality" className="text-xs font-semibold text-zinc-200 mb-1.5">
                  Nationality <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleTextChange}
                  placeholder="Nationality"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="purposeOfVisit" className="text-xs font-semibold text-zinc-200 mb-1.5">
                  Purpose of Visit
                </label>
                <select
                  id="purposeOfVisit"
                  name="purposeOfVisit"
                  value={formData.purposeOfVisit}
                  onChange={handleTextChange}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold cursor-pointer"
                >
                  <option value="Leisure" className="bg-zinc-950 text-zinc-50">Leisure / Holiday</option>
                  <option value="Business" className="bg-zinc-950 text-zinc-50">Business</option>
                  <option value="Personal" className="bg-zinc-950 text-zinc-50">Personal Visit</option>
                  <option value="Other" className="bg-zinc-950 text-zinc-50">Other purpose</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="idType" className="text-xs font-semibold text-zinc-200 mb-1.5">
                Government ID Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="idType"
                name="idType"
                value={formData.idType}
                onChange={handleTextChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold cursor-pointer"
              >
                <option value="Aadhaar" className="bg-zinc-950 text-zinc-50">Aadhaar Card (UIDAI Rules Apply)</option>
                <option value="PAN Card" className="bg-zinc-950 text-zinc-50">PAN Card</option>
                <option value="Passport" className="bg-zinc-950 text-zinc-50">Passport</option>
                <option value="Driving License" className="bg-zinc-950 text-zinc-50">Driving License</option>
                <option value="Voter ID" className="bg-zinc-950 text-zinc-50">Voter ID</option>
                <option value="Other" className="bg-zinc-950 text-zinc-50">Other official ID</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 2: Stay Details */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col">
              <label htmlFor="propertyId" className="text-xs font-semibold text-zinc-200 mb-1.5">
                Resort Property <span className="text-rose-500">*</span>
              </label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleTextChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold cursor-pointer"
              >
                <option value="" disabled className="bg-zinc-950 text-zinc-55">Select property</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id} className="bg-zinc-950 text-zinc-50">
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="numberOfGuests" className="text-xs font-semibold text-zinc-200 mb-1.5">
                Number of Guests <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="numberOfGuests"
                name="numberOfGuests"
                min="1"
                value={formData.numberOfGuests}
                onChange={handleTextChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold"
              />
            </div>

            {/* Villa Type selection dynamically filtered based on selected property */}
            <div className="flex flex-col">
              <label htmlFor="villaType" className="text-xs font-semibold text-zinc-200 mb-1.5">
                Villa Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="villaType"
                name="villaType"
                value={formData.villaType}
                onChange={handleTextChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold cursor-pointer"
              >
                {isOceanPals ? (
                  <option value="Full Property" className="bg-zinc-950 text-zinc-50">Full Property</option>
                ) : (
                  <>
                    <option value="Full Property" className="bg-zinc-950 text-zinc-50">Full Property</option>
                    <option value="Upper Side Villa" className="bg-zinc-950 text-zinc-50">Upper Side Villa</option>
                    <option value="Downside Villa" className="bg-zinc-950 text-zinc-50">Downside Villa</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="expectedCheckout" className="text-xs font-semibold text-zinc-200 mb-1.5">
                Expected Checkout Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="expectedCheckout"
                name="expectedCheckout"
                value={formData.expectedCheckout}
                onChange={handleTextChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="arrivingFrom" className="text-xs font-semibold text-zinc-200 mb-1.5">
                  Arriving From
                </label>
                <input
                  type="text"
                  id="arrivingFrom"
                  name="arrivingFrom"
                  value={formData.arrivingFrom}
                  onChange={handleTextChange}
                  placeholder="City / Country"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="proceedingTo" className="text-xs font-semibold text-zinc-200 mb-1.5">
                  Proceeding To
                </label>
                <input
                  type="text"
                  id="proceedingTo"
                  name="proceedingTo"
                  value={formData.proceedingTo}
                  onChange={handleTextChange}
                  placeholder="City / Country"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 placeholder:text-zinc-500 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Camera Capture & Signature */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {formData.idImagesBase64.map((img, index) => (
              <div key={index} className="space-y-4">
                <CameraCapture
                  onCapture={(file, base64) => {
                    setFormData(prev => {
                      const updatedImages = [...prev.idImagesBase64];
                      updatedImages[index] = base64 || '';
                      return { ...prev, idImagesBase64: updatedImages };
                    });
                  }}
                  initialPreviewUrl={img || undefined}
                  label={`Capture ${formData.idType} ID for Guest #${index + 1} ${index === 0 ? '(Primary Guest)' : ''}`}
                />
                {index < formData.idImagesBase64.length - 1 && <hr className="border-t border-zinc-800 my-4" />}
              </div>
            ))}
            
            <hr className="border-t border-zinc-800 my-4" />

            <SignaturePad
              onSave={handleSignature}
              label="Guest Signature (Authorized Representative)"
            />
          </div>
        )}

        {/* STEP 4: DPDP Compliance Notice & Consent */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-zinc-50 text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck size={16} className="text-zinc-200" />
              <span>DPDP Consent Notice (Act of 2023)</span>
            </div>

            <div className="text-xs bg-zinc-950 p-5 border border-zinc-800 rounded-xl max-h-48 overflow-y-auto leading-relaxed text-zinc-400">
              
              <p className="mb-2 font-bold text-zinc-300 uppercase tracking-wider text-[8px] font-mono">// Notice for Data Fiduciaries</p>
              <p className="mb-3">
                In compliance with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023, and local police reporting mandates 
                (Form C registration for security audits), we require your explicit consent to store and process your GRC check-in card details.
              </p>
              <p className="mb-2">
                <strong>1. Data Collected:</strong> Full name, phone number, designated villa details, photo of government-issued 
                ID card, and digital signature.
              </p>
              <p className="mb-2">
                <strong>2. Core Purpose:</strong> Hotel registration ledger maintenance, security check audits, and mandated 
                local police registry reports. We will never share this data for advertising.
              </p>
              <p className="mb-3">
                <strong>3. Protection Level:</strong> ID cards and signatures are locked in encrypted storage buckets under private Row-Level 
                Security (RLS). They are accessible only by authorized resort executives.
              </p>

              <p className="mt-4 mb-2 font-bold text-zinc-300 uppercase tracking-wider text-[8px] font-mono">// General Resort Guest Rules</p>
              <div className="bg-zinc-900 p-4 border border-zinc-800 rounded-lg mb-3">
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Check-in / Check-out:</strong> Guest check-in is scheduled for 2:00 PM onwards. Regular checkout time is strictly 11:00 AM on the day of departure.</li>
                  <li><strong>Quiet Hours:</strong> To preserve the calm coastal atmosphere, quiet hours are observed from 10:00 PM to 8:00 AM daily. No loud music or events are allowed during this period.</li>
                  <li><strong>Respect of Property:</strong> Guests are requested to respect resort amenities, plants, and structural assets. Breakages or damages will be billed to the guest ledger.</li>
                </ul>
              </div>
              
              <p>
                <strong>4. Your Rights:</strong> You have rights of review, data rectification, and removal post-departure 
                (subject to statutory regulatory retention laws).
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mt-4">
              <input
                type="checkbox"
                checked={formData.consentGiven}
                onChange={handleConsentToggle}
                className="mt-1 w-4 h-4 text-zinc-100 bg-zinc-950 border-zinc-850 rounded focus:ring-zinc-400 focus:ring-offset-zinc-900 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 leading-normal select-none group-hover:text-zinc-200 transition-colors">
                I hereby grant consent to Pantai Retreat & Ocean Pals Villa Resorts to securely store and process my personal details, 
                ID photo, and signature for GRC registration compliance.
              </span>
            </label>
          </div>
        )}

        {/* Error Notification */}
        {submitError && (
          <div className="mt-4 p-3 bg-rose-950/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-900/60 flex items-start gap-2">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-800 font-bold">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-5 py-3 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 font-semibold rounded-lg transition-all text-xs uppercase cursor-pointer"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center justify-center gap-1.5 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-3.5 px-6 rounded-lg transition-all text-xs uppercase cursor-pointer shadow-sm"
            >
              <span>Continue</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-3.5 px-6 rounded-lg transition-all text-xs disabled:bg-zinc-800 disabled:text-zinc-650 disabled:cursor-not-allowed select-none cursor-pointer shadow-sm uppercase tracking-wider font-mono"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
