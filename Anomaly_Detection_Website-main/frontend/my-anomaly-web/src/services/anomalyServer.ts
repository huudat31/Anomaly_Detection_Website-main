import type { AnomalyDataResponse, ApiResponse, Statistics, UploadResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export class AnomalyService {
  private static instance: AnomalyService;

  static getInstance(): AnomalyService {
    if (!AnomalyService.instance) {
      AnomalyService.instance = new AnomalyService();
    }
    return AnomalyService.instance;
  }

  async getAnomalyData(params: Record<string, any> = {}): Promise<ApiResponse<AnomalyDataResponse>> {
    try {
      const response = await fetch(`${API_BASE}/api/results`);
      if (!response.ok) {
        return { success: false, error: 'Failed to fetch anomaly data' };
      }
      const json = await response.json();
      // Xử lý dữ liệu từ backend để đảm bảo tất cả các trường đều có giá trị
      const anomalies = json.data.anomalies?.data || [];
      const processedAnomalies = anomalies.map((item: any) => ({
        id: item.id || 0,
        timestamp: item.timestamp || new Date().toISOString(),
        value: item.value !== undefined ? Number(item.value) : 0,
        isAnomaly: !!item.isAnomaly,
        confidence: item.confidence !== undefined ? Number(item.confidence) : 0

      }));

      return {
        success: true,
        data: {
          anomalies: processedAnomalies,
          totalRecords: json.data.anomalies?.count || 0,
          anomaliesCount: json.data.anomalies?.count || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch anomaly data'
      };
    }
  }

  async uploadData(file: File): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        return { success: false, error: err.error || 'Failed to upload file' };
      }
      const json = await response.json();
      return {
        success: true,
        data: { message: json.message || 'File uploaded successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload file'
      };
    }
  }

  async getStatistics(): Promise<ApiResponse<Statistics>> {
    try {
      const response = await fetch(`${API_BASE}/api/statistics`);
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const json = await response.json();

      if (json.success && json.data) {
        return {
          success: true,
          data: {
            totalRecords: json.data.totalRecords || 0,
            anomaliesCount: json.data.anomaliesCount || 0,
            detectionAccuracy: json.data.detectionAccuracy || 0,
            lastUpdated: new Date().toISOString()
          }
        };
      } else {
        throw new Error(json.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  }
}

export const anomalyService = AnomalyService.getInstance();