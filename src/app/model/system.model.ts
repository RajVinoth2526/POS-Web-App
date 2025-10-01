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
  totalCount?: number;
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
  category?: string; // Filter by product category
  orderNumber?: string;
  orderStartDate?: string;
  orderEndDate?: string;
  orderDate?: string;
  orderStatus?: string;
  isDraft?: boolean; // Filter by draft status
  customerName?: string;
  customerPhone?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
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
  orderItems: CartItem[];
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
  isDraft?: boolean; // true for draft orders, false for completed orders
  orderStatus?: string; // 'draft', 'completed', 'cancelled'
}

export interface CartItem {
  product: Product;
  productId: string; // Direct access to product ID for easier querying and backward compatibility
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

// API Response interfaces for orders
export interface ApiOrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
}

export interface ApiOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  isDraft: boolean; // ✅ Added missing isDraft property
  notes: string;
  orderDate: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: ApiOrderItem[];
}

export interface ApiOrderResponse {
  items: ApiOrder[];
  totalCount: number;
}


  