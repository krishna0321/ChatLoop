import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {

  // ✅ Your real Cloudinary values
  private CLOUD_NAME = 'dtjiusnag';
  private UPLOAD_PRESET = 'chatloop';

  private BASE_URL = 'https://api.cloudinary.com/v1_1';

  // ======================
  // 🖼 IMAGE UPLOAD
  // ======================
  async uploadImage(file: File): Promise<{ url: string; size: number }> {

    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1400,
      useWebWorker: true
    });

    const form = new FormData();
    form.append('file', compressed);
    form.append('upload_preset', this.UPLOAD_PRESET);

    const res = await fetch(
      `${this.BASE_URL}/${this.CLOUD_NAME}/image/upload`,
      { method: 'POST', body: form }
    );

    const data = await res.json();

    if (!data?.secure_url) throw new Error('Image upload failed');

    return {
      url: data.secure_url,
      size: compressed.size
    };
  }

  // ======================
  // 📄 DOCUMENT UPLOAD
  // ======================
  async uploadDocument(file: File): Promise<{ url: string; size: number }> {

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', this.UPLOAD_PRESET);

    const res = await fetch(
      `${this.BASE_URL}/${this.CLOUD_NAME}/raw/upload`,
      { method: 'POST', body: form }
    );

    const data = await res.json();

    if (!data?.secure_url) throw new Error('Document upload failed');

    return {
      url: data.secure_url,
      size: file.size
    };
  }
}
