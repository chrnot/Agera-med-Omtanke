/**
 * Cloud Function Sketch for Batch User Import
 * Implementation for Firebase Functions (index.js / users.js)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Cloud Function: processUserImport
 * This function should be called via a client-side triggered event or HTTPS request.
 * It handles the creation of multiple users in Firebase Auth and updates Firestore.
 */
exports.processUserImport = functions.https.onCall(async (data, context) => {
  // 1. Security Check: Only admins can call this
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Endast administratörer kan importera användare.'
    );
  }

  const { users } = data;
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  // 2. Batch processing
  // Using Promise.all or a sequential loop depending on quota limits
  for (const user of users) {
    try {
      // Create User in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: user.email,
        emailVerified: false,
        displayName: user.name,
        // Password can be random or a temporary one
        password: Math.random().toString(36).slice(-8) + 'A1!',
        disabled: false,
      });

      // Set Custom Claims (Role)
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: user.role || 'staff'
      });

      // 3. Sync to Firestore 'users' collection
      const userId = user.email.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await admin.firestore().collection('users').doc(userId).set({
        uid: userRecord.uid,
        email: user.email,
        name: user.name,
        role: user.role || 'staff',
        team: user.team || '',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        provisionedVia: 'batch-import'
      }, { merge: true });

      results.success++;
    } catch (error) {
      console.error(`Failed to import user ${user.email}:`, error);
      results.failed++;
      results.errors.push({ email: user.email, error: error.message });
    }
  }

  return results;
});
