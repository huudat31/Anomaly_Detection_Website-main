import React from 'react';
import type { Statistics } from '../../types';


interface StatisticsCardsProps {
  statistics: Statistics;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ statistics }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Records</h3>
      <p className="text-3xl font-bold text-gray-900">
        {statistics.totalRecords.toLocaleString()}
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Anomalies Detected</h3>
      <p className="text-3xl font-bold text-red-600">
        {statistics.anomaliesCount.toLocaleString()}
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Detection Rate</h3>
      <p className="text-3xl font-bold text-orange-600">
        {statistics.totalRecords > 0
          ? ((statistics.anomaliesCount / statistics.totalRecords) * 100).toFixed(2)
          : '0.00'}%
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Accuracy</h3>
      <p className="text-3xl font-bold text-green-600">
        {statistics.detectionAccuracy}%
      </p>
    </div>
  </div>
);