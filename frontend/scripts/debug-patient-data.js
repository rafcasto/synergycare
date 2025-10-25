#!/usr/bin/env node

/**
 * Debug script to check patient data consistency
 * Run with: node scripts/debug-patient-data.js
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs'); 
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../../backend/synergycare-firebase-adminsdk.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Could not load service account key. Make sure the file exists at:', serviceAccountPath);
  process.exit(1);
}

initializeApp({
  credential: require('firebase-admin/app').cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore();

async function debugPatientData() {
  console.log('🔍 Debugging Patient Data Consistency\n');
  
  try {
    // Get all appointments
    const appointmentsRef = db.collection('appointments');
    const appointmentsSnapshot = await appointmentsRef.get();
    
    console.log(`📋 Found ${appointmentsSnapshot.size} appointments\n`);
    
    for (const appointmentDoc of appointmentsSnapshot.docs) {
      const appointment = appointmentDoc.data();
      const patientId = appointment.patientId;
      
      console.log(`\n📅 Appointment ID: ${appointmentDoc.id}`);
      console.log(`👤 Patient ID: ${patientId}`);
      
      // Check users collection
      let userProfile = null;
      try {
        const userDoc = await db.collection('users').doc(patientId).get();
        if (userDoc.exists) {
          userProfile = userDoc.data();
          console.log(`✅ Users collection: ${userProfile.displayName || userProfile.email}`);
          console.log(`   - Email: ${userProfile.email}`);
          console.log(`   - Display Name: ${userProfile.displayName || 'MISSING'}`);
        } else {
          console.log(`❌ Not found in users collection`);
        }
      } catch (err) {
        console.log(`❌ Error checking users collection: ${err.message}`);
      }
      
      // Check patients collection
      let patientProfile = null;
      try {
        const patientDoc = await db.collection('patients').doc(patientId).get();
        if (patientDoc.exists) {
          patientProfile = patientDoc.data();
          console.log(`✅ Patients collection: ${patientProfile.displayName || `${patientProfile.firstName} ${patientProfile.lastName}`}`);
          console.log(`   - Email: ${patientProfile.email}`);
          console.log(`   - Display Name: ${patientProfile.displayName || 'MISSING'}`);
          console.log(`   - First Name: ${patientProfile.firstName || 'MISSING'}`);
          console.log(`   - Last Name: ${patientProfile.lastName || 'MISSING'}`);
        } else {
          console.log(`❌ Not found in patients collection`);
        }
      } catch (err) {
        console.log(`❌ Error checking patients collection: ${err.message}`);
      }
      
      // Summary
      if (!userProfile && !patientProfile) {
        console.log(`🚨 CRITICAL: Patient data completely missing for ID: ${patientId}`);
      } else if (userProfile && patientProfile) {
        const userName = userProfile.displayName || userProfile.email;
        const patientName = patientProfile.displayName || `${patientProfile.firstName} ${patientProfile.lastName}`;
        
        if (userName !== patientName) {
          console.log(`⚠️  NAME MISMATCH:`);
          console.log(`   Users collection: "${userName}"`);
          console.log(`   Patients collection: "${patientName}"`);
        }
      }
      
      console.log(`${'='.repeat(60)}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging patient data:', error);
  }
}

// Run the debug script
debugPatientData().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
