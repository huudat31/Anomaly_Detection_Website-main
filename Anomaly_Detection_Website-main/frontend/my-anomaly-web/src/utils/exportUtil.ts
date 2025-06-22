// utils/exportUtils.ts
import type { Anomaly } from '../types';

// Helper function to escape CSV values
const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
        return 'N/A';
    }

    const stringValue = String(value);

    // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

// Helper function to format timestamp safely
const formatTimestamp = (timestamp: string | Date): { iso: string, date: string, time: string } => {
    try {
        const date = new Date(timestamp);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return {
                iso: 'Invalid Date',
                date: 'Invalid Date',
                time: 'Invalid Time'
            };
        }

        return {
            iso: date.toISOString(),
            date: date.toLocaleDateString('en-US'),
            time: date.toLocaleTimeString('en-US')
        };
    } catch (error) {
        return {
            iso: 'Invalid Date',
            date: 'Invalid Date',
            time: 'Invalid Time'
        };
    }
};

export const exportToCSV = (data: Anomaly[], filename: string = 'anomaly-data') => {
    try {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }

        console.log('Starting CSV export with', data.length, 'records');

        // Define CSV headers
        const headers = ['ID', 'Timestamp', 'Value', 'Status', 'Confidence (%)'];

        // Convert data to CSV format with proper escaping
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row => {
                const timestamp = formatTimestamp(row.timestamp);

                return [
                    escapeCSVValue(row.id),
                    escapeCSVValue(timestamp.iso),
                    escapeCSVValue(row.value !== undefined && row.value !== null ? row.value.toFixed(4) : 'N/A'),
                    escapeCSVValue(row.isAnomaly ? 'Anomaly' : 'Normal'),
                    escapeCSVValue(row.confidence !== undefined && row.confidence !== null ? (row.confidence * 100).toFixed(1) : 'N/A')
                ].join(',');
            })
        ];

        const csvContent = csvRows.join('\n');

        // Add BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // Create and download file
        const blob = new Blob([csvWithBOM], {
            type: 'text/csv;charset=utf-8;'
        });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const finalFilename = `${filename}-${timestamp}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);

        console.log('CSV export completed successfully');

    } catch (error) {
        console.error('CSV export failed:', error);
        throw new Error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const exportToExcel = (data: Anomaly[], filename: string = 'anomaly-data') => {
    try {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }

        console.log('Starting Excel export with', data.length, 'records');

        // Prepare data for Excel format
        const headers = ['ID', 'Timestamp', 'Date', 'Time', 'Value', 'Status', 'Confidence (%)'];

        const tableRows = data.map(row => {
            const timestamp = formatTimestamp(row.timestamp);

            return [
                row.id || 'N/A',
                timestamp.iso,
                timestamp.date,
                timestamp.time,
                row.value !== undefined && row.value !== null ? row.value.toFixed(4) : 'N/A',
                row.isAnomaly ? 'Anomaly' : 'Normal',
                row.confidence !== undefined && row.confidence !== null ? (row.confidence * 100).toFixed(1) : 'N/A'
            ];
        });

        // Create HTML table with proper styling and encoding
        const htmlTable = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
    th { background-color: #f0f0f0; font-weight: bold; padding: 8px; border: 1px solid #ccc; text-align: left; }
    td { padding: 6px; border: 1px solid #ccc; }
    .anomaly { background-color: #fee; color: #c53030; }
    .normal { background-color: #efe; color: #38a169; }
    .number { text-align: right; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        ${headers.map(header => `<th>${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows.map(row =>
            `<tr>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
          <td class="number">${row[4]}</td>
          <td class="${row[5] === 'Anomaly' ? 'anomaly' : 'normal'}">${row[5]}</td>
          <td class="number">${row[6]}</td>
        </tr>`
        ).join('')}
    </tbody>
  </table>
</body>
</html>`;

        // Create and download file
        const blob = new Blob([htmlTable], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const finalFilename = `${filename}-${timestamp}.xls`;

        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);

        console.log('Excel export completed successfully');

    } catch (error) {
        console.error('Excel export failed:', error);
        throw new Error(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const exportData = async (data: Anomaly[], format: 'csv' | 'excel', filename?: string) => {
    try {
        console.log(`Starting ${format.toUpperCase()} export...`);

        if (!data || data.length === 0) {
            throw new Error('No data available to export');
        }

        // Validate data structure
        const sampleRow = data[0];
        if (!sampleRow || typeof sampleRow.id === 'undefined') {
            throw new Error('Invalid data structure');
        }

        if (format === 'csv') {
            await exportToCSV(data, filename);
        } else if (format === 'excel') {
            await exportToExcel(data, filename);
        } else {
            throw new Error(`Unsupported export format: ${format}`);
        }

        console.log(`${format.toUpperCase()} export completed successfully`);

    } catch (error) {
        console.error('Export failed:', error);
        throw error; // Re-throw để component có thể handle
    }
};