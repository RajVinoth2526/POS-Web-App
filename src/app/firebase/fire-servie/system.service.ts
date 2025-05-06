import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { Profile, ThemeSettings } from '../../model/system.model';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { FirebaseInitService } from '../firebase-init.service';
import {environment} from 'src/environments/environment';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  getFirestore,
  DocumentData
} from 'firebase/firestore'; // Firebase v9 modular SDK

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private firestore;

  constructor(private firebaseInitService: FirebaseInitService) {
    this.firestore =  this.firebaseInitService.getFirestore();
  }

  // GET: Get theme settings by ID
  getThemeSettings(id: string): Observable<ThemeSettings | undefined> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-theme-settings/${id}`);
    return from(getDoc(docRef)).pipe(
      map(snapshot =>
        snapshot.exists()
          ? { ...(snapshot.data() as ThemeSettings & DocumentData), id: snapshot.id }
          : undefined
      )
    );
  }

  // Create new theme settings
  createThemeSettings(theme: ThemeSettings): Observable<ThemeSettings & { id: string }> {
    const colRef = collection(this.firestore, `${environment.firebaseDB}-theme-settings`);
    return from(addDoc(colRef, theme)).pipe(
      switchMap(docRef =>
        from(getDoc(docRef)).pipe(
          map(snapshot => {
            if (!snapshot.exists()) throw new Error('Document not found after creation.');
            return { ...(snapshot.data() as ThemeSettings & DocumentData), id: snapshot.id };
          })
        )
      )
    );
  }

  // Update existing theme settings
  updateThemeSettings(id: string, updatedData: Partial<ThemeSettings>): Observable<ThemeSettings> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-theme-settings/${id}`);
    return from(updateDoc(docRef, updatedData)).pipe(
      switchMap(() => from(getDoc(docRef))),
      map(snapshot => ({ ...(snapshot.data() as ThemeSettings & DocumentData), id: snapshot.id }))
    );
  }

  // Get all theme settings
  getAllSystemThemeSettings(): Observable<ThemeSettings[]> {
    const colRef = collection(this.firestore, `${environment.firebaseDB}-theme-settings`);
    return from(getDocs(colRef)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          ...(doc.data() as ThemeSettings & DocumentData),
          id: doc.id
        }))
      )
    );
  }

  // GET: Get profile data by ID
  getProfileData(id: string): Observable<Profile | undefined> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-profile/${id}`);
    return from(getDoc(docRef)).pipe(
      map(snapshot =>
        snapshot.exists()
          ? { ...(snapshot.data() as Profile & DocumentData), id: snapshot.id }
          : undefined
      )
    );
  }

  // Create new profile
  createProfile(profile: Profile): Observable<Profile & { id: string }> {
    const colRef = collection(this.firestore, `${environment.firebaseDB}-profile`);
    return from(addDoc(colRef, profile)).pipe(
      switchMap(docRef =>
        from(getDoc(docRef)).pipe(
          map(snapshot => {
            if (!snapshot.exists()) throw new Error('Document not found after creation.');
            return { ...(snapshot.data() as Profile & DocumentData), id: snapshot.id };
          })
        )
      )
    );
  }

  // Update existing profile
  updateProfile(id: string, updatedData: Partial<Profile>): Observable<Profile> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-profile/${id}`);
    return from(updateDoc(docRef, updatedData)).pipe(
      switchMap(() => from(getDoc(docRef))),
      map(snapshot => ({ ...(snapshot.data() as Profile & DocumentData), id: snapshot.id }))
    );
  }

  // Get all profiles
  getAllProfile(): Observable<Profile[]> {
    const colRef = collection(this.firestore, `${environment.firebaseDB}-profile`);
    return from(getDocs(colRef)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          ...(doc.data() as Profile & DocumentData),
          id: doc.id
        }))
      )
    );
  }
}
