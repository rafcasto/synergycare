'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function AvailabilitySlotFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fixAvailabilitySlots = async () => {
    setIsFixing(true);
    setError(null);
    setResults([]);

    try {
      const logs: string[] = [];
      logs.push('🔍 Starting availability slot status fix...');

      // Get all availability slots
      const slotsCollection = collection(db, 'availability_slots');
      const snapshot = await getDocs(slotsCollection);
      
      logs.push(`📊 Found ${snapshot.size} availability slots`);

      let fixedCount = 0;
      let alreadyCorrectCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Check if status field is missing or undefined
        if (!data.status) {
          // Determine status based on isBooked field
          const newStatus = data.isBooked ? 'booked' : 'available';
          
          try {
            await updateDoc(doc(db, 'availability_slots', docSnap.id), {
              status: newStatus
            });
            
            logs.push(`✅ Fixed slot ${docSnap.id}: set status to '${newStatus}'`);
            fixedCount++;
          } catch (updateError) {
            logs.push(`❌ Failed to fix slot ${docSnap.id}: ${updateError}`);
          }
        } else {
          alreadyCorrectCount++;
        }
      }

      logs.push(`🎉 Fix completed!`);
      logs.push(`✅ Fixed slots: ${fixedCount}`);
      logs.push(`✓ Already correct: ${alreadyCorrectCount}`);
      logs.push(`📊 Total processed: ${snapshot.size}`);

      setResults(logs);
    } catch (err) {
      console.error('Error fixing availability slots:', err);
      setError(`Failed to fix slots: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Availability Slot Status Fixer</h2>
      <p className="text-gray-600 mb-6">
        This utility fixes availability slots that are missing the &apos;status&apos; field, 
        which causes &quot;Property status is undefined&quot; errors.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Button
          onClick={fixAvailabilitySlots}
          loading={isFixing}
          disabled={isFixing}
          className="w-full"
        >
          {isFixing ? 'Fixing Slots...' : 'Fix Availability Slots'}
        </Button>

        {results.length > 0 && (
          <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
            <h3 className="font-medium mb-2">Fix Results:</h3>
            <div className="space-y-1 text-sm font-mono">
              {results.map((result, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
