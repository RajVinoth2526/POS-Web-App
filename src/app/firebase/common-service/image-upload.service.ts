import { Injectable } from '@angular/core';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private storage = getStorage(); // Uses default Firebase app

  async uploadImage(file: File, folder: string): Promise<string> {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get and return the download URL
    return await getDownloadURL(storageRef);
  }
}
