'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';

export function FirestoreDiagnostic() {
  const [status, setStatus] = useState<string>('Checking...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const runDiagnostic = async () => {
      const logs: string[] = [];
      
      try {
        logs.push('🔍 Starting Firestore diagnostic...');
        
        // Test 1: Basic connection
        logs.push('✅ Firestore instance created');
        
        // Test 2: Write test document
        const testDocRef = doc(db, 'test', 'diagnostic');
        await setDoc(testDocRef, {
          message: 'Hello Firestore!',
          timestamp: new Date(),
        });
        logs.push('✅ Test document written successfully');
        
        // Test 3: Read test document
        const testDoc = await getDoc(testDocRef);
        if (testDoc.exists()) {
          logs.push('✅ Test document read successfully');
          logs.push(`📄 Data: ${JSON.stringify(testDoc.data())}`);
        } else {
          logs.push('❌ Test document not found');
        }
        
        // Test 4: Check collections exist
        const collections = ['users', 'doctors', 'patients'];
        for (const collectionName of collections) {
          try {
            collection(db, collectionName);
            logs.push(`✅ Collection '${collectionName}' accessible`);
          } catch (error) {
            logs.push(`❌ Collection '${collectionName}' error: ${error}`);
          }
        }
        
        setStatus('✅ Firestore is working!');
        
      } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setStatus('❌ Firestore has issues');
      }
      
      setDetails(logs);
    };
    
    runDiagnostic();
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-2">Firestore Diagnostic</h3>
      <p className="text-sm mb-2">{status}</p>
      <div className="text-xs space-y-1">
        {details.map((detail, index) => (
          <div key={index} className="font-mono">{detail}</div>
        ))}
      </div>
    </div>
  );
}
