import React, { type ChangeEvent } from 'react';

interface FileUploadProps {
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  uploadLoading: boolean;
  uploadError: string | null;
  uploadSuccess: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  uploadLoading,
  uploadError,
  uploadSuccess
}) => (
  <div className="mt-4 md:mt-0">
    <label className="block">
      <span className="block mb-2 text-sm font-medium text-gray-700">Upload input file (.csv or .json)</span>
      <input
        type="file"
        accept=".csv,.json"
        onChange={onFileUpload}
        disabled={uploadLoading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
      />
    </label>

    {/* Upload Status Messages */}
    {uploadLoading && (
      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        Uploading...
      </p>
    )}
    {uploadError && (
      <p className="text-sm text-red-600 mt-2">{uploadError}</p>
    )}
    {uploadSuccess && (
      <p className="text-sm text-green-600 mt-2">✅ File uploaded successfully!</p>
    )}
  </div>
);