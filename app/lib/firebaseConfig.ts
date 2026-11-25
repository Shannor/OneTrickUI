import { log } from 'evlog';
import type { DocumentData, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA6SF9UbC3df_PWgERiwrfzOF2h3tJDXe8',
  authDomain: 'gruntt-destiny.firebaseapp.com',
  projectId: 'gruntt-destiny',
  storageBucket: 'gruntt-destiny.firebasestorage.app',
  messagingSenderId: '63827765203',
  appId: '1:63827765203:web:7bd098550dcb2140d6f126',
  measurementId: 'G-EQN0Y59J6B',
};

type FirestoreModule = typeof import('firebase/firestore');

interface LoadedFirestoreClient {
  db: Firestore;
  doc: FirestoreModule['doc'];
  onSnapshot: FirestoreModule['onSnapshot'];
}

let cachedClientPromise: Promise<LoadedFirestoreClient> | null = null;

function loadFirestoreClient(): Promise<LoadedFirestoreClient> {
  if (!cachedClientPromise) {
    cachedClientPromise = Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
    ])
      .then(([{ initializeApp }, { getFirestore, doc, onSnapshot }]) => {
        const app = initializeApp(firebaseConfig);
        return {
          db: getFirestore(app),
          doc,
          onSnapshot,
        };
      })
      .catch((error) => {
        cachedClientPromise = null;
        throw error;
      });
  }
  return cachedClientPromise;
}

export function getFirestoreDb(): Promise<Firestore> {
  return loadFirestoreClient().then(({ db }) => db);
}

export interface DocumentSubscriptionCallbacks<T = DocumentData> {
  onData: (data: T | undefined) => void;
  onError?: (error: unknown) => void;
}

export function subscribeToDocument<T = DocumentData>(
  collectionName: string,
  documentId: string,
  callbacks: DocumentSubscriptionCallbacks<T>,
): () => void {
  let cancelled = false;
  let unsubscribe: (() => void) | undefined;

  const reportError = (error: unknown) => {
    if (callbacks.onError) {
      callbacks.onError(error);
      return;
    }
    log.error({
      action: 'firestore.subscription_error',
      message: 'Firestore document subscription error',
      collection: collectionName,
      documentId,
      error: error instanceof Error ? error.message : String(error),
    });
  };

  loadFirestoreClient()
    .then(({ db, doc, onSnapshot }) => {
      if (cancelled) {
        return;
      }
      unsubscribe = onSnapshot(
        doc(db, collectionName, documentId),
        (snapshot) => {
          callbacks.onData(snapshot.data() as T | undefined);
        },
        reportError,
      );
    })
    .catch((error) => {
      if (cancelled) {
        return;
      }
      reportError(error);
    });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
