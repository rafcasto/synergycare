/**
 * Debug component to run data migration for availability slots
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AvailabilityDataMigration } from '@/lib/utils/data-migration';

export function DataMigrationDebug() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await AvailabilityDataMigration.fixMissingStatusFields();
      setResult('✅ Migration completed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`❌ Migration failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const validateSlots = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const validation = await AvailabilityDataMigration.validateAllSlots();
      setResult(`✅ Validation completed: ${validation.valid} valid slots, ${validation.invalid} invalid slots. ${validation.errors.length > 0 ? `Errors: ${validation.errors.slice(0, 5).join('; ')}` : 'No errors found.'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`❌ Validation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Data Migration Tools</h3>
      <p className="text-sm text-gray-600 mb-4">
        Use these tools to fix availability slots missing the status property.
      </p>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <Button
            onClick={validateSlots}
            loading={loading}
            disabled={loading}
            variant="outline"
          >
            Validate Slots
          </Button>
          
          <Button
            onClick={runMigration}
            loading={loading}
            disabled={loading}
          >
            Fix Missing Status Fields
          </Button>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-800 text-sm">{result}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default DataMigrationDebug;
