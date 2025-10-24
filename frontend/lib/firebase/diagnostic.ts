import { auth, db } from './config';
import { doc, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';

export class FirebaseDiagnostic {
  static async runFullDiagnostic() {
    const results = {
      auth: false,
      userDoc: false,
      userRole: null as string | null,
      writeTest: false,
      scheduleWrite: false,
      slotWrite: false,
      errors: [] as string[]
    };

    try {
      // 1. Check authentication
      const user = auth.currentUser;
      if (!user) {
        results.errors.push('No authenticated user');
        return results;
      }
      results.auth = true;
      console.log('✅ Auth: User authenticated', user.uid);

      // 2. Check user document exists and has role
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          results.userDoc = true;
          const userData = userDoc.data();
          results.userRole = userData.role || null;
          console.log('✅ User Doc: Exists with role:', userData.role);
        } else {
          results.errors.push('User document does not exist');
          console.log('❌ User Doc: Does not exist');
        }
      } catch (error) {
        results.errors.push(`User doc read error: ${error}`);
        console.log('❌ User Doc: Read error', error);
      }

      // 3. Test basic write permission
      try {
        const testDoc = await addDoc(collection(db, 'test_collection'), {
          test: true,
          timestamp: new Date()
        });
        await deleteDoc(testDoc);
        results.writeTest = true;
        console.log('✅ Basic Write: Success');
      } catch (error) {
        results.errors.push(`Basic write error: ${error}`);
        console.log('❌ Basic Write: Failed', error);
      }

      // 4. Test doctor schedule creation
      if (results.userRole === 'doctor') {
        try {
          const scheduleData = {
            doctorId: user.uid,
            name: 'Test Schedule',
            isDefault: false,
            timezone: 'America/New_York',
            weeklySchedule: {
              monday: { isWorking: true, shifts: [], breaks: [] },
              tuesday: { isWorking: true, shifts: [], breaks: [] },
              wednesday: { isWorking: true, shifts: [], breaks: [] },
              thursday: { isWorking: true, shifts: [], breaks: [] },
              friday: { isWorking: true, shifts: [], breaks: [] },
              saturday: { isWorking: false, shifts: [], breaks: [] },
              sunday: { isWorking: false, shifts: [], breaks: [] }
            },
            effectiveFrom: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const testScheduleDoc = await addDoc(collection(db, 'doctor_schedules'), scheduleData);
          await deleteDoc(testScheduleDoc);
          results.scheduleWrite = true;
          console.log('✅ Schedule Write: Success');
        } catch (error) {
          results.errors.push(`Schedule write error: ${error}`);
          console.log('❌ Schedule Write: Failed', error);
        }

        // 5. Test availability slot creation
        try {
          const slotData = {
            doctorId: user.uid,
            date: '2024-10-25',
            startTime: '09:00',
            endTime: '09:30',
            duration: 30,
            isBooked: false,
            status: 'available',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const testSlotDoc = await addDoc(collection(db, 'availability_slots'), slotData);
          await deleteDoc(testSlotDoc);
          results.slotWrite = true;
          console.log('✅ Slot Write: Success');
        } catch (error) {
          results.errors.push(`Slot write error: ${error}`);
          console.log('❌ Slot Write: Failed', error);
        }
      } else {
        results.errors.push(`User role is '${results.userRole}', not 'doctor'`);
      }

    } catch (error) {
      results.errors.push(`General error: ${error}`);
      console.log('❌ General Error:', error);
    }

    return results;
  }

  static async checkEnvironment() {
    console.log('🔍 Environment Check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('Firebase Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
    
    const user = auth.currentUser;
    if (user) {
      console.log('Current User:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      // Check token claims
      try {
        const token = await user.getIdTokenResult();
        console.log('Token Claims:', token.claims);
      } catch (error) {
        console.log('❌ Token Claims Error:', error);
      }
    }
  }
}
