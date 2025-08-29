import { collection, doc, addDoc, getDoc, getDocs, updateDoc, getFirestore, DocumentData } from 'firebase/firestore';

export interface ThemeSettings extends DocumentData {
    id: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontStyle: string;

}

export interface ApiResponse<T> {
  data: T | null;
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

export interface Filter {
  pageNumber: number;
  pageSize: number;
  name: string;
}

// models/paged-result.model.ts
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}



export interface Product extends DocumentData {
  id: string;
  name: string;
  lowerCaseName?: string; // optional for search optimization
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
  isPartialAllowed: boolean;
}

export interface Cart {
  id?: string;   
  orderId?: string;         // optional for new carts
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
  cartDate?: string;
  expanded?: boolean; // optional for UI purposes
}

export interface CartItem {
  product: Product;
  quantity: number;
  name: string;
  price: number;
  total: number; // price * quantity
  tax?: number; // optional tax rate per item
  discount?: number; // optional discount per item
  size?: string; // optional size for clothing
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

export interface OrderId {
  id?: string;
  value: string;
}



  