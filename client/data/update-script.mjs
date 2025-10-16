// To run this script:
// 1. Make sure you have the Firebase Admin SDK installed: `npm install firebase-admin`
// 2. Set up a service account for your Firebase project: https://firebase.google.com/docs/admin/setup#initialize-sdk
// 3. Download the service account JSON key file and place it in your project root.
// 4. Update the `serviceAccount` path below to point to your key file.
// 5. From your terminal, run: `node --experimental-modules src/data/update-script.mjs`

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json' with { type: "json" };


// --- Configuration ---
const BATCH_SIZE = 100; // Number of documents to process in each batch

// --- Firebase Initialization ---
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();


async function migrateCollection(collectionName, oldField, newField) {
  console.log(`\nStarting migration for collection: "${collectionName}"...`);
  const collectionRef = db.collection(collectionName);
  let lastVisible = null;
  let totalProcessed = 0;

  while (true) {
    let query = collectionRef.orderBy('__name__').limit(BATCH_SIZE);
    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      console.log(`No more documents to process in "${collectionName}".`);
      break;
    }
    
    lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data[oldField] && data[newField] === undefined) {
         console.log(`  -> Migrating doc: ${doc.id}`);
         const updateData = { [newField]: data[oldField] };
         batch.update(doc.ref, updateData);
      } else if (data[newField] !== undefined) {
         // console.log(`  -> Skipping doc ${doc.id}, already has new field.`);
      } else {
         // console.log(`  -> Skipping doc ${doc.id}, missing old field.`);
      }
    });

    await batch.commit();
    totalProcessed += snapshot.size;
    console.log(`  Processed ${snapshot.size} documents (Total: ${totalProcessed}).`);
  }
  
  console.log(`Migration for "${collectionName}" completed. Total processed: ${totalProcessed}`);
}


async function main() {
  console.log("--- Starting Firestore Data Migration Script ---");
  
  // Migrate 'attendance' collection
  await migrateCollection('attendance', 'studentNum', 'studentId');
  
  // Migrate 'counselingRecords' collection
  await migrateCollection('counselingRecords', 'studentNum', 'studentId');
  
  console.log("\n--- Data Migration Finished ---");
  console.log("Please verify the data in your Firebase console.");
}

main().catch(error => {
  console.error("An error occurred during migration:", error);
});
