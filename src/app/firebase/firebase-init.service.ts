import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app'; // ✅ Needed
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment'; // Your Firebase config here

@Injectable({ providedIn: 'root' })
export class FirebaseInitService {
  private firestore: Firestore;

  constructor(private http: HttpClient) {
    // ✅ Initialize Firebase app first
    const firebaseApp = initializeApp(environment.firebase);

    // ✅ Then get Firestore instance
    this.firestore = getFirestore(firebaseApp);

    // ✅ Enable offline persistence
    this.enableOfflinePersistence();
  }

  private enableOfflinePersistence() {
    enableIndexedDbPersistence(this.firestore)
      .then(() => {
        console.log('✅ Firestore offline persistence enabled');
      })
      .catch((err: any) => {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Multiple tabs open, persistence not enabled');
        } else if (err.code === 'unimplemented') {
          console.warn('❌ Persistence not supported by this browser');
        } else {
          console.error('Unknown error enabling persistence:', err);
        }
      });
  }

  public getFirestore(): Firestore {
    return this.firestore;
  }
}
