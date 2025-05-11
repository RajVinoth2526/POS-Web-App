import { Injectable } from '@angular/core';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, getFirestore, DocumentData, query, Query, where } from 'firebase/firestore';
import { from, Observable, throwError } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Cart, Filter, OrderId, Product } from '../../model/system.model';
import { FirebaseInitService } from '../firebase-init.service';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly ordersCol;
    private firestore; // Firestore instance

    constructor(private firebaseInitService: FirebaseInitService) {
        this.firestore = this.firebaseInitService.getFirestore(); // Initialize Firestore using Firebase v9
        this.ordersCol = collection(this.firestore, `${environment.firebaseDB}-orders`);
    }

    saveOrder(profile: Cart): Observable<Cart & { id: string }> {
        const colRef = collection(this.firestore, `${environment.firebaseDB}-orders`);
        return from(addDoc(colRef, profile)).pipe(
            switchMap(docRef =>
                from(getDoc(docRef)).pipe(
                    map(snapshot => {
                        if (!snapshot.exists()) throw new Error('Document not found after creation.');
                        return { ...(snapshot.data() as Cart & DocumentData), id: snapshot.id };
                    })
                )
            )
        );
    }

    // Update a product by its ID, this will work offline and sync when back online
    updateOrderId(id: string, updatedData: Partial<OrderId>): Observable<OrderId> {
        const docRef = doc(this.firestore, `${environment.firebaseDB}-orderId/${id}`);
        return from(updateDoc(docRef, updatedData)).pipe(
            switchMap(() => from(getDoc(docRef))), // Get the updated document after the update
            map(snapshot => {
                const data = snapshot.data() as OrderId & DocumentData; // Correct type assertion
                return { ...data, id: snapshot.id }; // Add `id` to avoid overwriting
            }),
            catchError(this.handleError)
        );
    }

    saveOrderId(profile: OrderId): Observable<OrderId & { id: string }> {
        const colRef = collection(this.firestore, `${environment.firebaseDB}-orderId`);
        return from(addDoc(colRef, profile)).pipe(
            switchMap(docRef =>
                from(getDoc(docRef)).pipe(
                    map(snapshot => {
                        if (!snapshot.exists()) throw new Error('Document not found after creation.');
                        return { ...(snapshot.data() as OrderId & DocumentData), id: snapshot.id };
                    })
                )
            )
        );
    }

    // Get all products, prefer cache when offline and network when online
    getAllOrders(filter?: Filter): Observable<Cart[]> {

        let queryRef: Query<DocumentData> = this.ordersCol;

        // Apply multiple where() filters if filter is provided
        if (filter) {
            const conditions = Object.entries(filter).map(([key, value]) =>
                where(key, '==', value)
            );
            queryRef = query(this.ordersCol, ...conditions);
        }
        return from(getDocs(queryRef)).pipe(
            map(snapshot => {
                if (snapshot.metadata.fromCache) {
                    console.log('Data fetched from cache');
                } else {
                    console.log('Data fetched from network');
                }


                return snapshot.docs.map(doc => {
                    const data = doc.data() as Cart & DocumentData; // Correct type assertion
                    const createdAt = (data.createdAt instanceof Timestamp)
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt);
                    return { ...data, createdAt, id: doc.id }; // Add `id` to avoid overwriting
                });
            }),
            catchError(this.handleError)
        );
    }

    // Get all products, prefer cache when offline and network when online
    getOrderId(): Observable<OrderId[]> {
        const colRef = collection(this.firestore, `${environment.firebaseDB}-orderId`);

        return from(getDocs(colRef)).pipe(
            map(snapshot => {
                if (snapshot.metadata.fromCache) {
                    console.log('Data fetched from cache');
                } else {
                    console.log('Data fetched from network');
                }

                return snapshot.docs.map(doc => {
                    const data = doc.data() as OrderId & DocumentData; // Correct type assertion
                    return { ...data, id: doc.id }; // Add `id` to avoid overwriting
                });
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
