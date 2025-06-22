// components/dashboard/ExportButton.tsx
import React, { useState } from 'react';
import type { Anomaly } from '../../types';
import { exportData } from '../../utils/exportUtil';

interface ExportButtonProps {
    data: Anomaly[];
    disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, disabled = false }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async (format: 'csv' | 'excel') => {
        // Clear previous errors
        setError(null);

        // Validation
        if (!data || data.length === 0) {
            setError('No data available to export');
            return;
        }

        // Check if data has required structure
        const sampleRow = data[0];
        if (!sampleRow || typeof sampleRow.id === 'undefined') {
            setError('Invalid data structure');
            return;
        }

        setIsExporting(true);
        setShowDropdown(false);

        try {
            console.log(`Starting ${format} export with ${data.length} records`);

            // Add small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 300));

            const filename = `anomaly-detection-report`;
            await exportData(data, format, filename);

            // Show success message briefly
            setTimeout(() => {
                alert(`File exported successfully as ${format.toUpperCase()}!`);
            }, 100);

        } catch (error) {
            console.error('Export failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(`Export failed: ${errorMessage}`);

            // Show error alert
            setTimeout(() => {
                alert(`Export failed: ${errorMessage}`);
            }, 100);
        } finally {
            setIsExporting(false);
        }
    };

    // Auto-hide error after 5 seconds
    React.useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="relative inline-block">
            <button
                className="w-32 h-12 px-4 text-base font-semibold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={disabled || isExporting}
                title={disabled ? 'Export is disabled' : 'Export data'}
            >
                {isExporting ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Exporting...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export</span>
                        <svg className={`w-3 h-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                )}
            </button>

            {/* Error message */}
            {error && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-md shadow-lg z-30">
                    <div className="p-3">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h4 className="text-sm font-medium text-red-800">Export Error</h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dropdown Menu */}
            {showDropdown && !isExporting && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    ></div>

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                            <button
                                onClick={() => handleExport('excel')}
                                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                disabled={isExporting}
                            >
                                <svg className="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Export as Excel</span>
                                    <span className="text-xs text-gray-500">(.xls format)</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('csv')}
                                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                disabled={isExporting}
                            >
                                <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Export as CSV</span>
                                    <span className="text-xs text-gray-500">(.csv format)</span>
                                </div>
                            </button>
                        </div>

                        {/* Footer info */}
                        <div className="border-t border-gray-100 px-4 py-2">
                            <p className="text-xs text-gray-500">
                                {data?.length || 0} records will be exported
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};