import React from 'react';

export interface Anomaly {
    id: number;
    timestamp: string;
    value: number;
    isAnomaly: boolean;
    confidence: number;
}

export interface Statistics {
    totalRecords: number;
    anomaliesCount: number;
    detectionAccuracy: number;
    lastUpdated: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AnomalyDataResponse {
    anomalies: Anomaly[];
    totalRecords: number;
    anomaliesCount: number;
}

export interface UploadResponse {
    message: string;
}

export interface SortConfig {
    key: keyof Anomaly | null;
    direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
}