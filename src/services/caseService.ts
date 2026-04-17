import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error at ' + path + ': ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const caseService = {
  createCase: async (caseData: any) => {
    let currentPath = 'cases';
    try {
      const docRef = await addDoc(collection(db, currentPath), {
        ...caseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'anmäld'
      });
      
      // Initial Audit Log
      currentPath = `cases/${docRef.id}/audit`;
      await addDoc(collection(db, currentPath), {
        caseId: docRef.id,
        userId: auth.currentUser?.uid || 'anonymous',
        userName: auth.currentUser?.displayName || 'Anonym anmälare',
        action: 'Created',
        timestamp: serverTimestamp()
      });
      
      // Secondary Audit info
      currentPath = `cases/${docRef.id}/audit`;
      
      // Automated Notification for Principal
      currentPath = 'notifications';
      await addDoc(collection(db, currentPath), {
        type: 'new_case',
        school: caseData.school || 'Danderyds Skola',
        message: `Ny anmälan inkommen: ${caseData.title || 'Incident'}`,
        caseId: docRef.id,
        recipientUid: caseData.assignedToUid || null,
        read: false,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, currentPath);
    }
  },

  updateCase: async (caseId: string, updateData: any) => {
    const path = `cases/${caseId}`;
    try {
      const finalUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      // If status changes to utredning, mark it
      if (updateData.status === 'utredning' || updateData.status === 'utreds') {
        (finalUpdate as any).investigationStartedAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'cases', caseId), finalUpdate);

      // Automated Audit Log for update
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'system',
        userName: auth.currentUser?.displayName || 'System',
        action: 'Updated',
        oldStatus: updateData.oldStatus || null,
        newStatus: updateData.status || null,
        changes: Object.keys(updateData).filter(key => key !== 'oldStatus'), // Simple version tracking
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  getCase: async (caseId: string) => {
    const path = `cases/${caseId}`;
    try {
      const docSnap = await getDoc(doc(db, 'cases', caseId));
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToCases: (callback: (cases: any[]) => void) => {
    const path = 'cases';
    const q = query(collection(db, path));
    
    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(cases);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  addActor: async (caseId: string, actorData: any) => {
    const path = `cases/${caseId}/actors`;
    try {
      await addDoc(collection(db, path), actorData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  addAction: async (caseId: string, actionData: any) => {
    const path = `cases/${caseId}/actions`;
    try {
      await addDoc(collection(db, path), actionData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  deleteCase: async (caseId: string) => {
    const path = `cases/${caseId}`;
    try {
      await deleteDoc(doc(db, 'cases', caseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
