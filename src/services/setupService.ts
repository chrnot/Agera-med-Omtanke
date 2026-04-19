import { collection, doc, getDocs, setDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ENEBYBERG_STAFF } from '../data/enebybergStaff';

const DANDERYD_SCHOOLS = [
  'Baldersskolan',
  'Ekebyskolan',
  'Enebyberg',
  'Fribergaskolan',
  'Kevingeskolan',
  'Kyrkskolan',
  'Långängsskolan',
  'Mörbyskolan',
  'Stocksundsskolan',
  'Vasaskolan',
  'Danderyds gymnasium',
  'Kevinge anpassad grundskola',
  'Danaskolan',
  'Noraskolan',
  'Anpassad gymnasieskola Danderyds gymnasium'
];

export const setupService = {
  seedInitialData: async () => {
    try {
      console.log('Synchronizing schools and authorities...');
      const batch = writeBatch(db);

      // Create primary authority
      const authorityId = 'danderyd-kommun';
      const authRef = doc(db, 'authorities', authorityId);
      batch.set(authRef, {
        name: 'Danderyds Kommun'
      }, { merge: true });

      // Create schools
      DANDERYD_SCHOOLS.forEach(schoolName => {
        const schoolId = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const schoolRef = doc(db, 'schools', schoolId);
        batch.set(schoolRef, {
          name: schoolName,
          authorityId: authorityId
        }, { merge: true });
      });

      await batch.commit();
      console.log('Synchronization completed successfully.');
    } catch (error) {
      console.error('Error synchronizing data:', error);
    }
  },

  provisionEnebybergStaff: async () => {
    try {
      console.log('Provisioning Enebyberg staff...');
      const schoolId = 'enebyberg';
      
      // We process in chunks because Firestore batch has a limit of 500 operations
      const batchSize = 100;
      for (let i = 0; i < ENEBYBERG_STAFF.length; i += batchSize) {
        const chunk = ENEBYBERG_STAFF.slice(i, i + batchSize);
        const batch = writeBatch(db);
        
        for (const staff of chunk) {
          // Use a deterministic ID based on email to avoid duplicates
          const userId = staff.email.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const userRef = doc(db, 'users', userId);
          
          batch.set(userRef, {
            name: staff.name,
            email: staff.email,
            role: staff.role,
            school: 'Enebyberg',
            schoolId: schoolId,
            team: staff.team,
            schoolAccess: {
              [schoolId]: [staff.role]
            },
            isActive: true,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        
        await batch.commit();
      }
      console.log('Staff provisioning completed.');
    } catch (error) {
      console.error('Error provisioning staff:', error);
      throw error;
    }
  }
};
