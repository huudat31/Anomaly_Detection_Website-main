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
import { ExportButton } from '../components/dashboard/ExportButoon';


export const AnomalyDetectionDashboard: React.FC = () => {
  const { anomalies, statistics, loading, error, refetch, fetchStatistics } = useAnomalyData(true);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
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

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <FileUpload
              onFileUpload={handleFileUpload}
              uploadLoading={uploadLoading}
              uploadError={uploadError}
              uploadSuccess={uploadSuccess}
            />

            <div className="flex gap-2 items-center">
              <button
                className="w-24 h-12 px-4 text-base font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center"
                onClick={handleAutoUpdate}
                disabled={autoLoading}
              >
                {autoLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">...</span>
                  </>
                ) : (
                  'Update'
                )}
              </button>

              <ExportButton
                data={anomalies}
                disabled={loading || !anomalies || anomalies.length === 0}
              />
            </div>

            {/* Status Messages - Fixed position */}
            <div className="min-h-[40px] flex flex-col justify-center">
              {autoSuccess && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600 text-sm font-medium">Updated successfully!</span>
                </div>
              )}
              {autoError && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-red-600 text-sm font-medium">{autoError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && <StatisticsCards statistics={statistics} />}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Anomalies ({anomalies.length} records)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on any row to view detailed information
                </p>
              </div>

              {/* Quick Export Info */}
              {anomalies && anomalies.length > 0 && (
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      Anomalies: {anomalies.filter(item => item.isAnomaly).length}
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Normal: {anomalies.filter(item => !item.isAnomaly).length}
                    </span>
                  </div>
                </div>
              )}
            </div>
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