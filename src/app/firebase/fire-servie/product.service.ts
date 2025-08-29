import { Injectable } from '@angular/core';
import { collection, doc, deleteDoc, addDoc, getDoc, getDocs, updateDoc, getFirestore, DocumentData, where, query, Query, orderBy, startAt, endAt } from 'firebase/firestore';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Cart, Filter, Product } from '../../model/system.model';
import { FirebaseInitService } from '../firebase-init.service';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly productsCol;
  private firestore; // Firestore instance

  constructor(private firebaseInitService: FirebaseInitService) {
    this.firestore = this.firebaseInitService.getFirestore(); // Initialize Firestore using Firebase v9
    this.productsCol = collection(this.firestore, `${environment.firebaseDB}-products`);
  }

  // Add a product to Firestore (works online or offline with local persistence)
  addProduct(product: Product): Observable<any> {
    return from(addDoc(this.productsCol, product)).pipe(
      map(docRef => docRef),
      catchError(this.handleError)
    );
  }


  // getAllProducts(filter?: Filter): Observable<Product[]> {
  //   let queryRef: Query<DocumentData> = this.productsCol;
  
  //   if (filter && filter['lowerCaseName']?.trim()) {
  //     const search = filter['lowerCaseName'].trim();
  //     queryRef = query(
  //       this.productsCol,
  //       orderBy('lowerCaseName'),
  //       startAt(search),
  //       endAt(`${search}\uf8ff`)
  //     );
  //   }
  
  //   return from(getDocs(queryRef)).pipe(
  //     map(snapshot => {
  //       console.log(
  //         snapshot.metadata.fromCache
  //           ? 'Data fetched from cache'
  //           : 'Data fetched from network'
  //       );
  //       return snapshot.docs.map(doc => {
  //         const data = doc.data() as Product;
  //         return { ...data, id: doc.id };
  //       });
  //     }),
  //     catchError(this.handleError)
  //   );
  // }
  



  // Get a product by its ID, from cache if offline or from network if online
  getProductById(id: string): Observable<Product | undefined> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-products/${id}`);
    return from(getDoc(docRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Product & DocumentData; // Correct type assertion
          return { ...data, id: snapshot.id }; // Add `id` to avoid overwriting
        }
        return undefined;
      }),
      catchError(this.handleError)
    );
  }

  deleteProductById(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-products/${id}`);
    return from(deleteDoc(docRef));
  }
  

  // Update a product by its ID, this will work offline and sync when back online
  updateProduct(id: string, updatedData: Partial<Product>): Observable<Product> {
    const docRef = doc(this.firestore, `${environment.firebaseDB}-products/${id}`);
    return from(updateDoc(docRef, updatedData)).pipe(
      switchMap(() => from(getDoc(docRef))), // Get the updated document after the update
      map(snapshot => {
        const data = snapshot.data() as Product & DocumentData; // Correct type assertion
        return { ...data, id: snapshot.id }; // Add `id` to avoid overwriting
      }),
      catchError(this.handleError)
    );
  }

  // Handle errors and return an Observable error
  private handleError(error: any): Observable<never> {
    console.error('Firestore operation failed', error);
    return throwError(() => new Error('Something went wrong with Firestore operation!'));
  }
}
