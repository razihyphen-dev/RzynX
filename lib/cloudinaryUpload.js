// Uploads a file straight from the browser to Cloudinary.
// Netlify never sees the file bytes; Supabase storage is never used.
export async function uploadToCloudinary(file, onProgress) {
  const sigRes = await fetch('/api/upload-signature', { method: 'POST' });
  if (!sigRes.ok) throw new Error('Could not get an upload signature from the server.');
  const { signature, timestamp, apiKey, cloudName } = await sigRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        return reject(new Error('Cloudinary returned an unreadable response.'));
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ url: data.secure_url, type: resourceType });
      } else {
        // Surface Cloudinary's actual reason (e.g. wrong cloud name, bad API key)
        reject(new Error(data?.error?.message || `Cloudinary upload failed (status ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading — check your connection.'));
    xhr.send(formData);
  });
}
