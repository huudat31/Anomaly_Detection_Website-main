import React, { useState, type ChangeEvent } from 'react';
import { useAnomalyData } from '../hooks/useAnomalyData';
import { triggerBackendAutomation } from '../services/automationServer';

import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { DataTable } from '../components/dashboard/DataTable';
import { StatisticsCards } from '../components/dashboard/StatisticsCards';
import { FileUpload } from '../components/dashboard/FileUpload';
import { anomalyService } from '../services/anomalyServer';
import type { Anomaly } from '../types';


export const AnomalyDetectionDashboard: React.FC = () => {
  const { anomalies, statistics, loading, error, refetch, fetchStatistics } = useAnomalyData(true);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string|null>(null);
  const [autoSuccess, setAutoSuccess] = useState(false);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const result = await anomalyService.uploadData(file);

      if (result.success) {
        setUploadSuccess(true);
        refetch(); // Refresh data after upload
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Failed to upload file');
    } finally {
      setUploadLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRowClick = (row: Anomaly) => {
    alert(`Selected anomaly: ID ${row.id}\nValue: ${row.value.toFixed(4)}\nConfidence: ${(row.confidence * 100).toFixed(1)}%`);
  };

  const handleAutoUpdate = async () => {
    setAutoLoading(true);
    setAutoError(null);
    setAutoSuccess(false);
    const result = await triggerBackendAutomation();
    if (result.success) {
      setAutoSuccess(true);
      await refetch();
      await fetchStatistics();
      setTimeout(() => setAutoSuccess(false), 2000);
    } else {
      setAutoError(result.error || 'Cập nhật thất bại');
    }
    setAutoLoading(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading anomaly data..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-lg shadow">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Anomaly Detection Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and analyze anomalies in your data streams
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <FileUpload
              onFileUpload={handleFileUpload}
              uploadLoading={uploadLoading}
              uploadError={uploadError}
              uploadSuccess={uploadSuccess}
            />
            <button
              className="ml-4 px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              onClick={handleAutoUpdate}
              disabled={autoLoading}
            >
              {autoLoading ? 'Updating...' : 'Update'}
            </button>
            {autoSuccess && <span className="text-green-600 ml-2">Updated!</span>}
            {autoError && <span className="text-red-600 ml-2">{autoError}</span>}
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && <StatisticsCards statistics={statistics} />}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Anomalies ({anomalies.length} records)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on any row to view detailed information
            </p>
          </div>

          <div className="p-6">
            <DataTable
              data={anomalies}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Last updated: {statistics?.lastUpdated ? new Date(statistics.lastUpdated).toLocaleString() : 'Never'}
          </p>
          <p className="mt-1">
            Data refreshes automatically every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
};