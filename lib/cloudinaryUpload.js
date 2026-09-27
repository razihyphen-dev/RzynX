// Uploads a file straight from the browser to Cloudinary.
// Netlify never sees the file bytes; Supabase storage is never used.
export async function uploadToCloudinary(file, onProgress) {
  const sigRes = await fetch('/api/upload-signature', { method: 'POST' });
  const { signature, timestamp, apiKey, cloudName, uploadPreset } = await sigRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('upload_preset', uploadPreset);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, type: resourceType });
      } else {
        reject(new Error('Cloudinary upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}
