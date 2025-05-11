import { Injectable } from '@angular/core';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AngularFireStorage } from '@angular/fire/compat/storage'; // or '@angular/fire/storage' depending on your version
import { environment } from 'src/environments/environment'; // Your Firebase config here
@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
    constructor(private angularFireStorage: AngularFireStorage) { }
    async uploadImage(file: File): Promise<string> {
        const timestamp = Date.now();
        const filePath = `${environment.firebaseDB}-images/${timestamp}_${file.name}`;
        const fileRef = this.angularFireStorage.ref(filePath);
      
        const task = this.angularFireStorage.upload(filePath, file, {
          contentType: file.type,
        });
      
        await task.snapshotChanges().toPromise(); // Wait for upload to complete
        return fileRef.getDownloadURL().toPromise(); // Return download URL
    }
    
    async deleteImage(imageUrl: string): Promise<void> {
        if (imageUrl && imageUrl !== '') {
            await this.angularFireStorage.refFromURL(imageUrl).delete().toPromise();
        }
    }

  
}
