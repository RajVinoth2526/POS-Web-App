import { collection, doc, addDoc, getDoc, getDocs, updateDoc, getFirestore, DocumentData } from 'firebase/firestore';

export interface ThemeSettings extends DocumentData {
    id: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontStyle: string;

}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface Profile extends DocumentData  {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
}

export interface Product extends DocumentData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  sku?: string;
  barcode?: string;
  category?: string;
  stockQuantity?: number;
  unitType: string;
  unit?: string; // e.g., pcs, kg
  unitValue?: number
  taxRate?: number; // in percentage
  isAvailable: boolean;
  manufactureDate?: Date;
  expiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;         // Sum of item totals before tax/discount
  taxAmount: number;        // Total tax
  discountAmount: number;   // Total discount
  totalAmount: number;      // Final amount after tax and discount
  isTakeaway: boolean;      // True for takeaway, false for dine-in
  createdAt: Date;          // Time of cart creation
  updatedAt?: Date;         // Time of last update
  paymentMethod?: string // optional
  customerName?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  name: string;
  quantity: number;
  price: number;
  total: number; // price * quantity
  tax?: number; // optional tax rate per item
  discount?: number; // optional discount per item
}

export interface OrderCartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number; // price * quantity
  tax?: number; // optional tax rate per item
  discount?: number; // optional discount per item
}



  