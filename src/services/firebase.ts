import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, SiteSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must use firestoreDatabaseId specified in firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Specification compliance
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'store'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Collection paths
const PRODUCTS_COLLECTION = 'products';
const SETTINGS_DOC = 'settings/store';

// Helper to seed Firestore if empty on first boot
let isSeeding = false;
async function seedInitialDataIfNeeded(existingProducts: Product[], existingSettings: SiteSettings | null) {
  if (isSeeding) return;
  isSeeding = true;
  try {
    // Seed Settings if not present
    if (!existingSettings) {
      await setDoc(doc(db, 'settings', 'store'), INITIAL_SETTINGS);
    }
    // Seed Products if collection is completely empty
    if (existingProducts.length === 0) {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), prod);
      }
    }
  } catch (err) {
    console.warn('Initial Firestore seed notice (may already be initialized):', err);
  } finally {
    isSeeding = false;
  }
}

// ----------------------------------------------------
// Firestore Real-Time Global Data Service
// ----------------------------------------------------

export type StoreDataListener = (data: { products: Product[]; settings: SiteSettings }) => void;

class FirebaseStoreService {
  private activeProducts: Product[] = INITIAL_PRODUCTS;
  private activeSettings: SiteSettings = INITIAL_SETTINGS;
  private listeners = new Set<StoreDataListener>();
  private unsubscribeProducts: Unsubscribe | null = null;
  private unsubscribeSettings: Unsubscribe | null = null;
  private isInitialized = false;

  private notify() {
    const payload = { products: this.activeProducts, settings: this.activeSettings };
    this.listeners.forEach(cb => {
      try {
        cb(payload);
      } catch (e) {
        console.error('Error invoking store listener:', e);
      }
    });
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Listen to Site Settings in real-time
    const settingsDocRef = doc(db, 'settings', 'store');
    this.unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteSettings = snapshot.data() as SiteSettings;
          this.activeSettings = { ...INITIAL_SETTINGS, ...remoteSettings };
          this.notify();
        } else {
          // Initialize remote settings document
          seedInitialDataIfNeeded(this.activeProducts, null);
        }
      },
      (error) => {
        console.error('Settings snapshot error:', error);
      }
    );

    // 2. Listen to Products collection in real-time
    const productsColRef = collection(db, PRODUCTS_COLLECTION);
    this.unsubscribeProducts = onSnapshot(
      productsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const prods: Product[] = [];
          snapshot.forEach((d) => {
            prods.push(d.data() as Product);
          });
          // Preserve creation order
          this.activeProducts = prods;
          this.notify();
        } else {
          // Initialize default products if Firestore is fresh
          seedInitialDataIfNeeded([], this.activeSettings);
        }
      },
      (error) => {
        console.error('Products snapshot error:', error);
      }
    );
  }

  public subscribe(callback: StoreDataListener): () => void {
    this.init();
    this.listeners.add(callback);
    // Call immediately with current state
    callback({ products: this.activeProducts, settings: this.activeSettings });
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getSettings(): SiteSettings {
    return this.activeSettings;
  }

  public getProducts(): Product[] {
    return this.activeProducts;
  }

  // Update Settings directly in Cloud Firestore (Global Sync)
  public async saveSettings(newSettings: SiteSettings): Promise<SiteSettings> {
    const path = SETTINGS_DOC;
    try {
      this.activeSettings = { ...this.activeSettings, ...newSettings };
      this.notify();

      const docRef = doc(db, 'settings', 'store');
      await setDoc(docRef, this.activeSettings, { merge: true });
      return this.activeSettings;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Update Admin Password directly in Cloud Firestore (Global Sync)
  public async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();

    if (!cleanNew || cleanNew.length < 3) {
      return { success: false, message: 'New password must be at least 3 characters long.' };
    }

    if (cleanCurrent !== this.activeSettings.adminPin) {
      return { success: false, message: 'Current password does not match our security records.' };
    }

    if (cleanNew === cleanCurrent) {
      return { success: false, message: 'New password cannot be the same as your current password.' };
    }

    const updatedSettings: SiteSettings = {
      ...this.activeSettings,
      adminPin: cleanNew,
    };

    try {
      await this.saveSettings(updatedSettings);
      return { success: true, message: 'Password updated and synchronized globally across all devices!' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update password in cloud database.'
      };
    }
  }

  // Verify PIN directly from cloud state
  public verifyAdminPin(pin: string): 'super_admin' | 'staff' | null {
    const cleanPin = pin.trim();
    if (cleanPin === this.activeSettings.adminPin) {
      return 'super_admin';
    }
    if (this.activeSettings.staffPin && cleanPin === this.activeSettings.staffPin) {
      return 'staff';
    }
    return null;
  }

  // Save / Update a product directly in Cloud Firestore (Global Sync)
  public async saveProduct(product: Product): Promise<Product> {
    const path = `${PRODUCTS_COLLECTION}/${product.id}`;
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
      await setDoc(docRef, product);

      // Local optimistic update
      const existingIdx = this.activeProducts.findIndex(p => p.id === product.id);
      if (existingIdx >= 0) {
        this.activeProducts[existingIdx] = product;
      } else {
        this.activeProducts.unshift(product);
      }
      this.notify();

      return product;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Delete a product directly from Cloud Firestore (Global Sync)
  public async deleteProduct(productId: string): Promise<void> {
    const path = `${PRODUCTS_COLLECTION}/${productId}`;
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await deleteDoc(docRef);

      this.activeProducts = this.activeProducts.filter(p => p.id !== productId);
      this.notify();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

export const CloudStorageService = new FirebaseStoreService();
