declare module "firebase/app" {
  import { FirebaseApp, FirebaseOptions } from "@firebase/app";
  export { FirebaseApp, FirebaseOptions };
  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module "firebase/auth" {
  import { Auth, User, UserCredential } from "@firebase/auth";
  export { Auth, User, UserCredential };
  export function getAuth(app?: any): Auth;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: any): () => void;
}

declare module "firebase/firestore" {
  import {
    Firestore,
    CollectionReference,
    DocumentReference,
    DocumentData,
    Query,
    Timestamp,
    FieldValue,
  } from "@firebase/firestore";
  export {
    Firestore,
    CollectionReference,
    DocumentReference,
    DocumentData,
    Query,
    Timestamp,
    FieldValue,
  };
  export function getFirestore(app?: any): Firestore;
  export function collection(db: Firestore, path: string): CollectionReference;
  export function doc(db: Firestore, path: string, ...pathSegments: string[]): DocumentReference;
  export function addDoc(ref: CollectionReference, data: any): Promise<DocumentReference>;
  export function getDoc(ref: DocumentReference): Promise<any>;
  export function getDocs(ref: Query): Promise<any>;
  export function updateDoc(ref: DocumentReference, data: any): Promise<void>;
  export function deleteDoc(ref: DocumentReference): Promise<void>;
  export function query(ref: CollectionReference, ...queryConstraints: any[]): Query;
  export function orderBy(field: string, direction?: "asc" | "desc"): any;
  export function limit(n: number): any;
  export function startAfter(doc: any): any;
  export function serverTimestamp(): FieldValue;
}
