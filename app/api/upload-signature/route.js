import { NextResponse } from 'next/server';
import crypto from 'crypto';

// The browser calls this to get a one-time signature, then uploads the
// actual file bytes DIRECTLY to Cloudinary (never through our server/Netlify).
// This is what keeps Netlify bandwidth and Supabase storage untouched.
export async function POST() {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET };

  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  });
}
