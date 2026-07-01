import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeadPayload {
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  challenge: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: LeadPayload = await req.json();

    // ── Server-side validation ──────────────────────────────────────────────
    const errors: Record<string, string> = {};

    if (!body.name?.trim())     errors.name     = 'Name is required';
    if (!body.business?.trim()) errors.business = 'Business name is required';
    if (!body.email?.trim())    errors.email    = 'Email is required';
    else if (!isValidEmail(body.email)) errors.email = 'Invalid email format';
    if (!body.phone?.trim())    errors.phone    = 'Phone number is required';
    else if (!isValidPhone(body.phone)) errors.phone = 'Invalid phone number';
    if (!body.service?.trim())  errors.service  = 'Please select a service';
    if (!body.challenge?.trim()) errors.challenge = 'Please describe your challenge';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // ── Forward to Google Apps Script (server-side — URL never exposed) ─────
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

    if (!scriptUrl) {
      console.error('GOOGLE_APPS_SCRIPT_URL is not set');
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Google Apps Script Web Apps follow redirects automatically.
    // fetch() follows redirects by default (redirect: 'follow').
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        name:      body.name.trim(),
        business:  body.business.trim(),
        email:     body.email.trim().toLowerCase(),
        phone:     body.phone.trim(),
        service:   body.service.trim(),
        challenge: body.challenge.trim(),
      }),
    });

    // Read as text first so we can log it if JSON parsing fails
    const text = await response.text();

    if (!response.ok) {
      console.error('Apps Script HTTP error:', response.status, text);
      return NextResponse.json(
        { success: false, error: 'Failed to save submission' },
        { status: 502 }
      );
    }

    // Parse the Apps Script response
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('Apps Script non-JSON response:', text);
      // Apps Script returned something we can't parse — treat as failure
      return NextResponse.json(
        { success: false, error: 'Unexpected response from service' },
        { status: 502 }
      );
    }

    if (!result.success) {
      console.error('Apps Script reported failure:', result);
      return NextResponse.json(
        { success: false, error: (result.error as string) || 'Submission failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Submit lead error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Reject non-POST methods ──────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
