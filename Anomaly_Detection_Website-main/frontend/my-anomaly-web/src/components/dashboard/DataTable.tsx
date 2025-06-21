import React, { useState, useMemo } from 'react';
import type { Anomaly, SortConfig, TableColumn } from '../../types';

interface DataTableProps {
    data: Anomaly[];
    onRowClick?: (row: Anomaly) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, onRowClick }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const handleSort = (key: keyof Anomaly) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    // Pagination calculations
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = sortedData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const columns: TableColumn<Anomaly>[] = [
        {
            key: 'id',
            label: 'ID',
            sortable: true
        },
        {
            key: 'timestamp',
            label: 'Timestamp',
            sortable: true,
            render: (value: string) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                        {new Date(value).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500">
                        {new Date(value).toLocaleTimeString()}
                    </span>
                </div>
            )
        },
        {
            key: 'value',
            label: 'Value',
            sortable: true,
            render: (value: number) => (
                <span className="font-mono text-blue-700 font-semibold">
                    {value !== undefined && value !== null ? value.toFixed(4) : 'N/A'}
                </span>
            )
        },
        {
            key: 'isAnomaly',
            label: 'Status',
            render: (value: boolean) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${value
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-red-500' : 'bg-green-500'
                        }`}></span>
                    {value ? 'Anomaly' : 'Normal'}
                </span>
            )
        },
        {
            key: 'confidence',
            label: 'Confidence',
            sortable: true,
            render: (value: number) => {
                if (value === undefined || value === null) return 'N/A';
                const percentage = value * 100;
                const getConfidenceColor = (conf: number) => {
                    if (conf >= 80) return 'text-green-700 bg-green-50';
                    if (conf >= 60) return 'text-yellow-700 bg-yellow-50';
                    return 'text-red-700 bg-red-50';
                };

                return (
                    <div className="flex items-center">
                        <div className={`px-2 py-1 rounded-lg font-medium text-sm ${getConfidenceColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-500' :
                                    percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        },
    ];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Anomaly Detection Results</h2>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Normal: {data.filter(item => !item.isAnomaly).length}
                    </span>
                    <span className="flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        Anomalies: {data.filter(item => item.isAnomaly).length}
                    </span>
                    <span>Total: {data.length} records</span>
                    <span className="text-blue-600 font-medium">
                        Page {currentPage} of {totalPages} (showing {startIndex + 1}-{Math.min(endIndex, data.length)})
                    </span>
                </div>
            </div>

            {/* Table Container */}
            <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                {columns.map((column) => (
                                    <th
                                        key={String(column.key)}
                                        className={`px-8 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-blue-100 transition-colors duration-200' : ''
                                            }`}
                                        onClick={() => column.sortable && handleSort(column.key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label}
                                            {column.sortable && (
                                                <span className={`text-gray-400 transition-colors duration-200 ${sortConfig.key === column.key ? 'text-blue-600' : ''
                                                    }`}>
                                                    {sortConfig.key === column.key
                                                        ? sortConfig.direction === 'asc' ? '↑' : '↓'
                                                        : '↕️'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {currentData.map((row, index) => (
                                <tr
                                    key={index}
                                    className={`transition-all duration-200 ${row.isAnomaly
                                        ? 'bg-red-25 hover:bg-red-50 border-l-4 border-red-300'
                                        : 'hover:bg-gray-50'
                                        } ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((column) => (
                                        <td key={String(column.key)} className="px-8 py-5 text-sm">
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : <span className="text-gray-900">{String(row[column.key])}</span>
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty state */}
                {data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-2">📊</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No data available</h3>
                        <p className="text-gray-500">No anomaly data to display at this time.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {data.length > 0 && totalPages > 1 && (
                <div className="mt-6 bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Records info */}
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
                            <span className="font-medium text-gray-900">{Math.min(endIndex, data.length)}</span> of{' '}
                            <span className="font-medium text-gray-900">{data.length}</span> results
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center space-x-2">
                            {/* Previous button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Previous
                            </button>

                            {/* First page + ellipsis */}
                            {getPageNumbers()[0] > 1 && (
                                <>
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    >
                                        1
                                    </button>
                                    {getPageNumbers()[0] > 2 && (
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white">
                                            ...
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Page numbers */}
                            {getPageNumbers().map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${currentPage === page
                                        ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Last page + ellipsis */}
                            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                                <>
                                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white">
                                            ...
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            {/* Next button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
                            >
                                Next
                                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Quick jump to page */}
                        <div className="flex items-center space-x-3">
                            <label className="text-sm text-gray-600 font-medium">Jump to:</label>
                            <select
                                value={currentPage}
                                onChange={(e) => handlePageChange(parseInt(e.target.value))}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                            >
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <option key={page} value={page}>
                                        Page {page}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};