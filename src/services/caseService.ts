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
  Timestamp,
  or,
  type FieldValue
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface Notification {
  id?: string;
  type: 'ACTION_REQUIRED' | 'INFO' | 'REMINDER' | 'DIRECT_MESSAGE';
  title: string;
  message: string;
  caseId?: string;
  recipientUid: string;
  read: boolean;
  createdAt: FieldValue;
  school?: string;
  actionUrl?: string;
  senderName?: string;
}

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
  getNotificationTemplate: (type: 'new_case' | 'assigned' | 'finished' | 'sla_reminder' | 'follow_up' | 'manual_request', data: { caseId: string, schoolName: string }) => {
    const idDisplay = `ÄRE-${data.caseId.slice(-4).toUpperCase()}`;
    const actionUrl = `/cases/${data.caseId}`;
    
    switch (type) {
      case 'new_case':
        return {
          type: 'ACTION_REQUIRED' as const,
          title: 'Ny trygghetsanmälan inkommen',
          message: `En ny anmälan om misstänkt kränkande behandling har registrerats på ${data.schoolName}. Ärende-ID: ${idDisplay}. Vänligen logga in för att utse utredare.`,
          actionUrl
        };
      case 'assigned':
        return {
          type: 'ACTION_REQUIRED' as const,
          title: 'Nytt utredningsuppdrag',
          message: `Du har blivit tilldelad som utredare i ett trygghetsärende (ID: ${idDisplay}). Dokumentera dina steg och analys i utredningsmodulen.`,
          actionUrl
        };
      case 'finished':
        return {
          type: 'ACTION_REQUIRED' as const,
          title: 'Utredning klar för granskning',
          message: `Utredningen för ärende ${idDisplay} är nu färdigställd. Vänligen granska dokumentationen och åtgärdsplanen inför signering.`,
          actionUrl
        };
      case 'sla_reminder':
        return {
          type: 'REMINDER' as const,
          title: 'PÅMINNELSE: Obehandlat ärende',
          message: `En anmälan (ID: ${idDisplay}) har väntat på åtgärd i mer än 48 timmar. Vänligen tilldela en utredare för att säkerställa skyndsam hantering enligt skollagen.`,
          actionUrl
        };
      case 'follow_up':
        return {
          type: 'REMINDER' as const,
          title: 'Dags för uppföljning',
          message: `Det är nu dags att följa upp de insatta åtgärderna för ärende ${idDisplay} för att utvärdera om kränkningarna har upphört.`,
          actionUrl
        };
      case 'manual_request':
        return {
          type: 'ACTION_REQUIRED' as const,
          title: 'Begäran om förtydligande',
          message: `Rektor på ${data.schoolName} ber om ett snabbt förtydligande eller komplettering i ärende ${idDisplay}.`,
          actionUrl
        };
    }
  },

  sendNotification: async (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notif,
        read: false,
        createdAt: serverTimestamp()
      });

      // Audit Log for notification
      await addDoc(collection(db, 'AuditLog'), {
        action: 'NOTIFIERING_SKICKAD',
        type: notif.type,
        caseId: notif.caseId || null,
        recipientUid: notif.recipientUid,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error('Error sending notification:', e);
    }
  },

  createCase: async (caseData: any) => {
    let currentPath = 'cases';
    try {
      const docRef = await addDoc(collection(db, currentPath), {
        ...caseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'anmäld'
      });
      
      const caseId = docRef.id;

      // Audit Log
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'anonymous',
        userName: auth.currentUser?.displayName || 'Anonym anmälare',
        action: 'Created',
        timestamp: serverTimestamp()
      });
      
      // TRIGGER: Notify Principals and Authorities
      const school = caseData.school || 'Danderyds Skola';
      const usersRef = collection(db, 'users');
      
      // Find principals at this school
      const principalsQuery = query(usersRef, where('role', '==', 'principal'), where('school', '==', school));
      const authoritiesQuery = query(usersRef, where('globalRole', '==', 'admin')); // Simplified authority check
      
      const [principalsSnap, authoritiesSnap] = await Promise.all([
        getDocs(principalsQuery),
        getDocs(authoritiesQuery)
      ]);

      const recipients = new Set<string>();
      principalsSnap.forEach(d => recipients.add(d.id));
      authoritiesSnap.forEach(d => recipients.add(d.id));

      for (const uid of recipients) {
        const template = caseService.getNotificationTemplate('new_case', { caseId, schoolName: school });
        await caseService.sendNotification({
          ...template,
          caseId,
          recipientUid: uid,
          school
        });
      }

      return caseId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, currentPath);
    }
  },

  updateCase: async (caseId: string, updateData: any) => {
    const path = `cases/${caseId}`;
    try {
      const oldDoc = await getDoc(doc(db, 'cases', caseId));
      const oldData = oldDoc.data();
      
      const finalUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      if (updateData.status === 'utredning' || updateData.status === 'utreds') {
        (finalUpdate as any).investigationStartedAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'cases', caseId), finalUpdate);

      // Audit Log
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'system',
        userName: auth.currentUser?.displayName || 'System',
        action: 'Updated',
        oldStatus: oldData?.status || null,
        newStatus: updateData.status || null,
        changes: Object.keys(updateData).filter(key => key !== 'oldStatus'),
        timestamp: serverTimestamp()
      });

      // TRIGGER: Investigator Assigned (Support for multiple)
      if (updateData.investigators && Array.isArray(updateData.investigators)) {
        const oldInvUids = Array.isArray(oldData?.investigatorUids) ? oldData.investigatorUids : [];
        const newInvUids = updateData.investigatorUids || updateData.investigators.map((i: any) => i.uid);
        
        const addedInvUids = newInvUids.filter((uid: string) => !oldInvUids.includes(uid));
        
        for (const uid of addedInvUids) {
          const template = caseService.getNotificationTemplate('assigned', { caseId, schoolName: oldData?.school || 'Danderyds Skola' });
          await caseService.sendNotification({
            ...template,
            caseId,
            recipientUid: uid
          });
        }
      } else if (updateData.assignedToUid && updateData.assignedToUid !== oldData?.assignedToUid) {
        const template = caseService.getNotificationTemplate('assigned', { caseId, schoolName: oldData?.school || 'Danderyds Skola' });
        await caseService.sendNotification({
          ...template,
          caseId,
          recipientUid: updateData.assignedToUid
        });
      }

      // TRIGGER: Investigation Finished / Sent for review
      if ((updateData.status === 'uppföljd' || updateData.status === 'avslutat') && oldData?.status !== updateData.status) {
        const school = oldData?.school || 'Danderyds Skola';
        const principalsQuery = query(collection(db, 'users'), where('role', '==', 'principal'), where('school', '==', school));
        const principalsSnap = await getDocs(principalsQuery);
        
        for (const d of principalsSnap.docs) {
          const template = caseService.getNotificationTemplate('finished', { caseId, schoolName: school });
          await caseService.sendNotification({
            ...template,
            caseId,
            recipientUid: d.id,
            school
          });
        }
      }

      // TRIGGER: Follow-up required (if status changed to åtgärdad or similar)
      if (updateData.status === 'åtgärdad' && oldData?.status !== 'åtgärdad') {
        const school = oldData?.school || 'Danderyds Skola';
        // Notify both investigator and principal
        const recipients = new Set<string>();
        if (oldData?.assignedToUid) recipients.add(oldData.assignedToUid);
        
        const principalsQuery = query(collection(db, 'users'), where('role', '==', 'principal'), where('school', '==', school));
        const principalsSnap = await getDocs(principalsQuery);
        principalsSnap.forEach(d => recipients.add(d.id));

        for (const uid of recipients) {
          const template = caseService.getNotificationTemplate('follow_up', { caseId, schoolName: school });
          await caseService.sendNotification({
            ...template,
            caseId,
            recipientUid: uid,
            school
          });
        }
      }

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

  subscribeToCases: (callback: (cases: any[]) => void, filters?: { school?: string, assignedToUid?: string, reporterUid?: string, reporterEmail?: string, assignedTeam?: string, isAdmin?: boolean }) => {
    const path = 'cases';
    let q = query(collection(db, path));
    
    // If not admin and we have specific user filters, use OR logic for personal visibility
    if (!filters?.isAdmin && (filters?.assignedToUid || filters?.reporterUid || filters?.reporterEmail || filters?.assignedTeam)) {
      const visibilityFilters = [];
      if (filters.assignedToUid) {
        visibilityFilters.push(where('assignedToUid', '==', filters.assignedToUid));
        visibilityFilters.push(where('assignedTeacherUid', '==', filters.assignedToUid));
        visibilityFilters.push(where('investigatorUids', 'array-contains', filters.assignedToUid));
      }
      if (filters.reporterUid) visibilityFilters.push(where('reporterUid', '==', filters.reporterUid));
      if (filters.reporterEmail) visibilityFilters.push(where('reporterEmail', '==', filters.reporterEmail));
      if (filters.assignedTeam) visibilityFilters.push(where('assignedTeam', '==', filters.assignedTeam));
      
      if (visibilityFilters.length > 0) {
        q = query(q, or(...visibilityFilters));
      }
    } else if (filters?.school && filters.school !== 'alla') {
      q = query(q, where('school', '==', filters.school));
    }
    
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
  },

  requestClarification: async (caseId: string) => {
    try {
      const caseDoc = await getDoc(doc(db, 'cases', caseId));
      const caseData = caseDoc.data();
      
      const investigatorUids = caseData?.investigatorUids || (caseData?.assignedToUid ? [caseData.assignedToUid] : (caseData?.assignedTeacherUid ? [caseData.assignedTeacherUid] : []));
      
      if (!caseData || investigatorUids.length === 0) {
        throw new Error('Ärendet saknar tilldelad utredare.');
      }

      const template = caseService.getNotificationTemplate('manual_request', { 
        caseId, 
        schoolName: caseData.school || 'Danderyds Skola' 
      });

      for (const investigatorUid of investigatorUids) {
        await caseService.sendNotification({
          ...template,
          caseId,
          recipientUid: investigatorUid,
          school: caseData.school
        });
      }

      // Audit Log
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'system',
        userName: auth.currentUser?.displayName || 'System',
        action: 'MANUAL_NUDGE',
        message: 'Rektor begärde skyndsamt förtydligande',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error requesting clarification:', error);
      throw error;
    }
  },

  sendDirectMessage: async (caseId: string, messageText: string) => {
    try {
      const caseDoc = await getDoc(doc(db, 'cases', caseId));
      const caseData = caseDoc.data();
      
      const investigatorUids = caseData?.investigatorUids || (caseData?.assignedToUid ? [caseData.assignedToUid] : (caseData?.assignedTeacherUid ? [caseData.assignedTeacherUid] : []));
      
      if (!caseData || investigatorUids.length === 0) {
        throw new Error('Ärendet saknar tilldelad utredare.');
      }

      const senderName = auth.currentUser?.displayName || 'Rektor';

      for (const investigatorUid of investigatorUids) {
        await caseService.sendNotification({
          type: 'DIRECT_MESSAGE',
          title: 'Fråga från rektor',
          message: messageText,
          caseId,
          recipientUid: investigatorUid,
          senderName,
          actionUrl: `/cases/${caseId}`,
          school: caseData.school
        });
      }

      // Logga även i AuditLog för att behålla spårbarhet enligt GDPR
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'system',
        userName: senderName,
        action: 'MANUAL_MESSAGE_SENT',
        message: `Rektor skickade en fråga till utredaren: '${messageText}'`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending direct message:', error);
      throw error;
    }
  },

  analyzeEarlyWarning: (cases: any[]) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);

    const recentCases = cases.filter(c => {
      const date = c.incidentDate?.seconds ? c.incidentDate.seconds * 1000 : new Date(c.incidentDate || c.createdAt).getTime();
      return date > thirtyDaysAgo;
    });

    const alerts: any[] = [];

    // 1. Group by Location (Threshold: 3 in 10 days)
    const locMap: Record<string, any[]> = {};
    recentCases.filter(c => {
       const date = c.incidentDate?.seconds ? c.incidentDate.seconds * 1000 : new Date(c.incidentDate || c.createdAt).getTime();
       return date > tenDaysAgo;
    }).forEach(c => {
      const loc = c.incidentLocation || c.location || 'Okänd';
      if (!locMap[loc]) locMap[loc] = [];
      locMap[loc].push(c);
    });

    Object.entries(locMap).forEach(([loc, cluster]) => {
      if (cluster.length >= 3) {
        alerts.push({
          id: `ews-loc-${loc}-${now}`,
          type: 'LOCATION',
          title: `Hög frekvens vid: ${loc}`,
          description: `${cluster.length} incidenter rapporterade på samma plats inom 10 dagar.`,
          cases: cluster,
          severity: cluster.length > 5 ? 'CRITICAL' : 'WARNING',
          timestamp: now
        });
      }
    });

    // 2. Group by Discrimination Ground (Threshold: 3 in 30 days)
    const groundMap: Record<string, any[]> = {};
    recentCases.forEach(c => {
      if (c.discriminationGround && c.discriminationGround !== 'none') {
        if (!groundMap[c.discriminationGround]) groundMap[c.discriminationGround] = [];
        groundMap[c.discriminationGround].push(c);
      }
    });

    Object.entries(groundMap).forEach(([ground, cluster]) => {
      if (cluster.length >= 3) {
        alerts.push({
          id: `ews-ground-${ground}-${now}`,
          type: 'GROUND',
          title: `Mönster av diskriminering: ${ground}`,
          description: `${cluster.length} fall av kränkningar kopplat till ${ground.toLowerCase()} på 30 dagar.`,
          cases: cluster,
          severity: cluster.length > 4 ? 'CRITICAL' : 'WARNING',
          timestamp: now
        });
      }
    });

    // 3. Group by Student (Threshold: 3 in 30 days)
    // We use studentName/studentId if available. Let's assume studentName for now if ID is missing
    const studentMap: Record<string, any[]> = {};
    recentCases.forEach(c => {
      const id = c.studentId || c.studentName;
      if (id) {
        if (!studentMap[id]) studentMap[id] = [];
        studentMap[id].push(c);
      }
    });

    Object.entries(studentMap).forEach(([student, cluster]) => {
      if (cluster.length >= 3) {
        alerts.push({
          id: `ews-student-${student}-${now}`,
          type: 'PERSON',
          title: `Individuellt mönster identifierat`,
          description: `Upprepad exponering/inblandning (${cluster.length} ggr) för elev i ${cluster[0].studentGrade || 'okänd årskurs'} under 30 dagar.`,
          cases: cluster,
          severity: cluster.length > 4 ? 'CRITICAL' : 'WARNING',
          timestamp: now
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
      return b.cases.length - a.cases.length;
    }).slice(0, 3);
  },

  createCollectionCase: async (alert: any, currentUserId: string, school: string) => {
    try {
      const caseData = {
        title: `EWS: Samlingsärende - ${alert.title}`,
        description: `Automatiskt genererat samlingsärende baserat på Early Warning System.\n\nAnalys: ${alert.description}\n\nKopplade ärenden: ${alert.cases.map((c: any) => c.id).join(', ')}`,
        status: 'anmäld',
        type: 'samling',
        school,
        reporterUid: currentUserId,
        linkedCaseIds: alert.cases.map((c: any) => c.id),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        priority: alert.severity === 'CRITICAL' ? 'high' : 'medium'
      };
      const docRef = await addDoc(collection(db, 'cases'), caseData);
      return docRef.id;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'cases');
    }
  },

  requestTeamContribution: async (caseId: string, teamId: string, investigatorName: string) => {
    try {
      const caseDoc = await getDoc(doc(db, 'cases', caseId));
      const school = caseDoc.data()?.school;

      await updateDoc(doc(db, 'cases', caseId), {
        assignedTeam: teamId,
        requestTeamContribution: true,
        updatedAt: serverTimestamp()
      });

      // Send notifications to all team members
      const usersRef = collection(db, 'users');
      const teamQuery = query(usersRef, where('team', '==', teamId), where('school', '==', school));
      const teamSnap = await getDocs(teamQuery);

      const idDisplay = `ÄRE-${caseId.slice(-4).toUpperCase()}`;

      for (const d of teamSnap.docs) {
        if (d.id === auth.currentUser?.uid) continue; // Don't notify self
        
        await caseService.sendNotification({
          type: 'INFO',
          title: 'Begäran om bidrag till utredning',
          message: `Du har blivit ombedd av ${investigatorName} att bidra med observationer till utredning ${idDisplay}. Klicka här för att lägga till din information.`,
          caseId,
          recipientUid: d.id,
          school,
          actionUrl: `/cases/${caseId}`
        });
      }

      // Audit Log
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'system',
        userName: investigatorName,
        action: 'TEAM_CONTRIBUTION_REQUESTED',
        teamId,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cases/${caseId}`);
    }
  },

  addContribution: async (caseId: string, text: string, userProfile: any) => {
    const path = `cases/${caseId}/contributions`;
    try {
      await addDoc(collection(db, path), {
        caseId,
        text,
        authorUid: userProfile.uid,
        authorName: userProfile.name,
        authorTeam: userProfile.team || 'Okänd',
        createdAt: serverTimestamp()
      });

      // Notify all investigators
      const caseDoc = await getDoc(doc(db, 'cases', caseId));
      const caseData = caseDoc.data();
      const investigatorUids = caseData?.investigatorUids || (caseData?.assignedToUid ? [caseData.assignedToUid] : (caseData?.assignedTeacherUid ? [caseData.assignedTeacherUid] : []));
      const school = caseData?.school || 'Danderyds Skola';

      for (const investigatorUid of investigatorUids) {
        if (investigatorUid !== userProfile.uid) {
          const idDisplay = `ÄRE-${caseId.slice(-4).toUpperCase()}`;
          await caseService.sendNotification({
            type: 'INFO',
            title: 'Ny observation i ärende',
            message: `${userProfile.name} har lagt till en observation i ärende ${idDisplay}.`,
            caseId,
            recipientUid: investigatorUid,
            school,
            actionUrl: `/cases/${caseId}`
          });
        }
      }

      // Audit Log
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: userProfile.uid,
        userName: userProfile.name,
        action: 'CONTRIBUTION_ADDED',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  sendBackForRevision: async (caseId: string, messageText: string) => {
    try {
      const caseDoc = await getDoc(doc(db, 'cases', caseId));
      const caseData = caseDoc.data();
      if (!caseData) throw new Error('Ärendet hittades inte.');

      await updateDoc(doc(db, 'cases', caseId), {
        status: 'utredning',
        needsRevision: true,
        revisionComment: messageText,
        updatedAt: serverTimestamp()
      });

      const investigatorUids = caseData.investigatorUids || (caseData.assignedToUid ? [caseData.assignedToUid] : (caseData.assignedTeacherUid ? [caseData.assignedTeacherUid] : []));
      const school = caseData.school || 'Okänd skola';
      const senderName = auth.currentUser?.displayName || 'Rektor';

      for (const uid of investigatorUids) {
        await caseService.sendNotification({
          type: 'ACTION_REQUIRED',
          title: 'Ärende återskickat för komplettering',
          message: `Rektor har skickat tillbaka ärende ÄRE-${caseId.slice(-4).toUpperCase()} för komplettering: ${messageText}`,
          caseId,
          recipientUid: uid,
          senderName,
          school,
          actionUrl: `/cases/${caseId}`
        });
      }

      // Audit Log
      await addDoc(collection(db, `cases/${caseId}/audit`), {
        caseId,
        userId: auth.currentUser?.uid || 'system',
        userName: senderName,
        action: 'SENT_BACK_FOR_REVISION',
        message: messageText,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending back for revision:', error);
      throw error;
    }
  },

  cloneCase: async (originalCaseId: string, newStudentName: string, newStudentSSN?: string) => {
    try {
      const originalDoc = await getDoc(doc(db, 'cases', originalCaseId));
      const originalData = originalDoc.data();
      if (!originalData) throw new Error('Originalärendet hittades inte.');

      const oldStudentName = originalData.studentName;
      
      // Helper to replace old name with new name in text fields for GDPR safety
      const sanitize = (val: any): any => {
        if (typeof val === 'string' && oldStudentName) {
           // Replace old name with new name. Use a regex for case-insensitive replacement if needed
           return val.split(oldStudentName).join(newStudentName);
        }
        if (Array.isArray(val)) {
          return val.map(v => sanitize(v));
        }
        if (typeof val === 'object' && val !== null && !(val instanceof Timestamp)) {
          const cleaned: any = {};
          for (const key in val) {
            cleaned[key] = sanitize(val[key]);
          }
          return cleaned;
        }
        return val;
      };

      // Define fields to exclude from clone (to ensure fresh start where needed)
      const excludeFields = [
        'id', 'createdAt', 'updatedAt', 'isClosed', 'signatureName', 
        'signatureDate', 'signatureRole', 'incidentId', 'audit', 
        'investigationStartedAt', 'needsRevision', 'revisionComment'
      ];

      const clonedData: any = {};
      for (const key in originalData) {
        if (!excludeFields.includes(key)) {
          clonedData[key] = sanitize(originalData[key]);
        }
      }

      // Set new student specific data
      clonedData.studentName = newStudentName;
      if (newStudentSSN) clonedData.studentSSN = newStudentSSN;
      clonedData.status = 'utredning'; // Start at investigation stage for the new student
      clonedData.clonedFromId = originalCaseId;
      clonedData.clonedAt = serverTimestamp();
      clonedData.clonedByUid = auth.currentUser?.uid;
      clonedData.clonedByName = auth.currentUser?.displayName;

      // Create the new case
      const newCaseId = await caseService.createCase(clonedData);

      // Audit original case
      await addDoc(collection(db, `cases/${originalCaseId}/audit`), {
        caseId: originalCaseId,
        userId: auth.currentUser?.uid || 'system',
        userName: auth.currentUser?.displayName || 'System',
        action: 'CLONED_TO_NEW_CASE',
        newCaseId,
        newStudentName,
        timestamp: serverTimestamp()
      });

      return newCaseId;
    } catch (error) {
       console.error('Error cloning case:', error);
       throw error;
    }
  },

  subscribeToContributions: (caseId: string, callback: (contributions: any[]) => void) => {
    const path = `cases/${caseId}/contributions`;
    const q = query(collection(db, path));
    
    return onSnapshot(q, (snapshot) => {
      const contributions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      callback(contributions.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
