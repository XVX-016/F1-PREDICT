import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let app;
let db;
let auth;

try {
  // Check if Firebase app is already initialized
  if (admin.apps.length === 0) {
    // For development, try to use service account or fallback to mock
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account if available
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'f1-webapp-b2598',
        databaseURL: 'https://f1-webapp-b2598-default-rtdb.firebaseio.com'
      });
      
      // Initialize Firestore and Auth
      db = admin.firestore();
      auth = admin.auth();
    } else {
      // Development fallback - create a mock Firebase instance
      console.log('⚠️  Firebase credentials not found. Using mock mode for development.');
      
      // Create a mock Firestore instance
      db = {
        collection: (name) => ({
          doc: () => ({
            set: async (data) => {
              console.log(`📝 Mock Firestore: Setting document in ${name}:`, data);
              return Promise.resolve();
            },
            get: async () => {
              console.log(`📖 Mock Firestore: Getting document from ${name}`);
              return Promise.resolve({ exists: false, data: () => null });
            }
          }),
          where: (field, operator, value) => ({
            get: async () => {
              console.log(`🔍 Mock Firestore: Querying ${name} where ${field} ${operator} ${value}`);
              return Promise.resolve({ docs: [], empty: true });
            }
          }),
          get: async () => {
            console.log(`📚 Mock Firestore: Getting all documents from ${name}`);
            return Promise.resolve({ docs: [], empty: true });
          }
        })
      };

      // Create a mock Auth instance
      auth = {
        verifyIdToken: async (token) => {
          console.log('🔐 Mock Auth: Verifying token:', token);
          return Promise.resolve({ uid: 'mock-user-id' });
        }
      };

      // Create a mock app
      app = { name: 'mock-firebase-app' };
    }
  } else {
    app = admin.app();
    db = admin.firestore();
    auth = admin.auth();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback to mock mode
  console.log('⚠️  Firebase initialization failed. Using mock mode.');
  
  db = {
    collection: (name) => ({
      doc: () => ({
        set: async (data) => {
          console.log(`📝 Mock Firestore: Setting document in ${name}:`, data);
          return Promise.resolve();
        },
        get: async () => {
          console.log(`📖 Mock Firestore: Getting document from ${name}`);
          return Promise.resolve({ exists: false, data: () => null });
        }
      }),
      where: (field, operator, value) => ({
        get: async () => {
          console.log(`🔍 Mock Firestore: Querying ${name} where ${field} ${operator} ${value}`);
          return Promise.resolve({ docs: [], empty: true });
        }
      }),
      get: async () => {
        console.log(`📚 Mock Firestore: Getting all documents from ${name}`);
        return Promise.resolve({ docs: [], empty: true });
      }
    })
  };

  auth = {
    verifyIdToken: async (token) => {
      console.log('🔐 Mock Auth: Verifying token:', token);
      return Promise.resolve({ uid: 'mock-user-id' });
    }
  };

  app = { name: 'mock-firebase-app' };
}

export { admin, db, auth };
export default app;
