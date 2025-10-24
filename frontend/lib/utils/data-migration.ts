/**
 * Data migration utilities for availability slots
 */

import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ValidationResult {
  valid: number;
  invalid: number;
  errors: string[];
}

export class AvailabilityDataMigration {
  private static readonly COLLECTION_NAME = 'availability_slots';

  /**
   * Fix availability slots that are missing the status field
   */
  static async fixMissingStatusFields(): Promise<void> {
    try {
      const slotsRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(slotsRef);
      
      let fixedCount = 0;
      const batch: Promise<void>[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        // Check if status field is missing
        if (!data.status) {
          const slotRef = doc(db, this.COLLECTION_NAME, docSnapshot.id);
          
          // Determine appropriate status based on existing data
          const status = data.patientId ? 'booked' : 'available';
          
          batch.push(
            updateDoc(slotRef, { status }).then(() => {
              fixedCount++;
            })
          );
        }
      });

      // Execute all updates
      await Promise.all(batch);
      
      console.log(`Fixed ${fixedCount} slots with missing status fields`);
    } catch (error) {
      console.error('Error fixing missing status fields:', error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate all availability slots for required fields
   */
  static async validateAllSlots(): Promise<ValidationResult> {
    try {
      const slotsRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(slotsRef);
      
      let valid = 0;
      let invalid = 0;
      const errors: string[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const slotId = docSnapshot.id;
        
        const validationErrors: string[] = [];

        // Check required fields
        if (!data.doctorId) validationErrors.push('Missing doctorId');
        if (!data.date) validationErrors.push('Missing date');
        if (!data.startTime) validationErrors.push('Missing startTime');
        if (!data.endTime) validationErrors.push('Missing endTime');
        if (!data.status) validationErrors.push('Missing status');
        
        // Check valid status values
        if (data.status && !['available', 'booked', 'blocked'].includes(data.status)) {
          validationErrors.push(`Invalid status: ${data.status}`);
        }

        if (validationErrors.length > 0) {
          invalid++;
          errors.push(`Slot ${slotId}: ${validationErrors.join(', ')}`);
        } else {
          valid++;
        }
      });

      return {
        valid,
        invalid,
        errors
      };
    } catch (error) {
      console.error('Error validating slots:', error);
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get slots that are missing the status field
   */
  static async getSlotsWithoutStatus(): Promise<DocumentData[]> {
    try {
      const slotsRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(slotsRef);
      
      const slotsWithoutStatus: DocumentData[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        if (!data.status) {
          slotsWithoutStatus.push({
            id: docSnapshot.id,
            ...data
          });
        }
      });

      return slotsWithoutStatus;
    } catch (error) {
      console.error('Error getting slots without status:', error);
      throw new Error(`Failed to get slots: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
