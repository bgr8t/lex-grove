import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from './firebase';

// Generic type for Firestore documents
type FirestoreDocument = {
  id?: string;
} & DocumentData;

// Create a generic Firestore service
export class FirestoreService<T extends FirestoreDocument> {
  private collectionName: string;
  private collectionRef: CollectionReference;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  // Create a new document
  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = await addDoc(this.collectionRef, data);
    return { ...data, id: docRef.id } as T;
  }

  // Get all documents
  async getAll(): Promise<T[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }

  // Get document by ID
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        console.log(`Document with ID ${id} not found in collection ${this.collectionName}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching document with ID ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Update document
  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    // Remove the id field if it exists in data
    const { id: _, ...updateData } = data;
    await updateDoc(docRef, updateData);
  }

  // Delete document
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  // Query documents
  async query(conditions: {
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=';
    value: any;
  }[], sortOptions?: {
    field: string;
    direction: 'asc' | 'desc';
  }, limitCount?: number): Promise<T[]> {
    // Build where clauses
    const whereConditions = conditions.map(c => 
      where(c.field, c.operator, c.value)
    );
    
    // Create base query with where conditions
    let q = query(this.collectionRef, ...whereConditions);
    
    // Add sorting if specified
    if (sortOptions) {
      q = query(q, orderBy(sortOptions.field, sortOptions.direction));
    }
    
    // Add limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    // Execute query
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }
} 