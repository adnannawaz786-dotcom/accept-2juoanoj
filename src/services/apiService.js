// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Create a fetch request with timeout
 */
const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await response.text() || errorMessage;
      }
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response;
};

/**
 * Convert JSON data to ZIP file and trigger download
 * @param {Object} jsonData - The JSON data to convert to ZIP
 * @param {string} filename - Optional filename for the ZIP file
 * @param {Object} options - Additional options for the conversion
 * @returns {Promise<void>}
 */
export const convertJsonToZip = async (jsonData, filename = 'data.zip', options = {}) => {
  try {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new ApiError('Invalid JSON data provided', 400);
    }

    const requestBody = {
      data: jsonData,
      filename: filename,
      options: {
        compression: options.compression || 'DEFLATE',
        compressionLevel: options.compressionLevel || 6,
        createFolders: options.createFolders || false,
        ...options
      }
    };

    const response = await fetchWithTimeout(`${API_BASE_URL}/convert/json-to-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    await handleResponse(response);

    // Get the blob data for download
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      filename: filename,
      size: blob.size
    };

  } catch (error) {
    console.error('Error converting JSON to ZIP:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to convert JSON to ZIP', 500);
  }
};

/**
 * Upload and convert JSON file to ZIP
 * @param {File} file - The JSON file to upload and convert
 * @param {string} outputFilename - Optional output filename for the ZIP
 * @param {Object} options - Additional conversion options
 * @returns {Promise<Object>}
 */
export const uploadAndConvertJson = async (file, outputFilename = null, options = {}) => {
  try {
    if (!file || file.type !== 'application/json') {
      throw new ApiError('Please provide a valid JSON file', 400);
    }

    const formData = new FormData();
    formData.append('file', file);
    
    if (outputFilename) {
      formData.append('filename', outputFilename);
    }
    
    if (Object.keys(options).length > 0) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/convert/upload-json-to-zip`, {
      method: 'POST',
      body: formData
    });

    await handleResponse(response);

    // Get the blob data for download
    const blob = await response.blob();
    const filename = outputFilename || `${file.name.replace('.json', '')}.zip`;
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      originalFile: file.name,
      outputFile: filename,
      size: blob.size
    };

  } catch (error) {
    console.error('Error uploading and converting JSON:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to upload and convert JSON file', 500);
  }
};

/**
 * Get conversion status for batch operations
 * @param {string} jobId - The job ID to check status for
 * @returns {Promise<Object>}
 */
export const getConversionStatus = async (jobId) => {
  try {
    if (!jobId) {
      throw new ApiError('Job ID is required', 400);
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/convert/status/${jobId}`);
    await handleResponse(response);

    return await response.json();

  } catch (error) {
    console.error('Error getting conversion status:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to get conversion status', 500);
  }
};

/**
 * Convert multiple JSON objects to a single ZIP file
 * @param {Array} jsonArray - Array of JSON objects to convert
 * @param {string} filename - Output ZIP filename
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>}
 */
export const convertMultipleJsonToZip = async (jsonArray, filename = 'batch-data.zip', options = {}) => {
  try {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
      throw new ApiError('Please provide a non-empty array of JSON objects', 400);
    }

    const requestBody = {
      data: jsonArray,
      filename: filename,
      options: {
        compression: options.compression || 'DEFLATE',
        compressionLevel: options.compressionLevel || 6,
        createSeparateFiles: options.createSeparateFiles || true,
        fileNaming: options.fileNaming || 'auto',
        ...options
      }
    };

    const response = await fetchWithTimeout(`${API_BASE_URL}/convert/batch-json-to-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    await handleResponse(response);

    // Get the blob data for download
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      filename: filename,
      itemsProcessed: jsonArray.length,
      size: blob.size
    };

  } catch (error) {
    console.error('Error converting multiple JSON objects to ZIP:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to convert multiple JSON objects to ZIP', 500);
  }
};

/**
 * Validate JSON data before conversion
 * @param {Object} jsonData - The JSON data to validate
 * @returns {Promise<Object>}
 */
export const validateJsonData = async (jsonData) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/validate/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: jsonData })
    });

    await handleResponse(response);
    return await response.json();

  } catch (error) {
    console.error('Error validating JSON data:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to validate JSON data', 500);
  }
};

/**
 * Get supported conversion formats
 * @returns {Promise<Object>}
 */
export const getSupportedFormats = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/formats`);
    await handleResponse(response);
    return await response.json();

  } catch (error) {
    console.error('Error getting supported formats:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to get supported formats', 500);
  }
};

// Export the ApiError class for use in components
export { ApiError };

// Default export with all API functions
export default {
  convertJsonToZip,
  uploadAndConvertJson,
  getConversionStatus,
  convertMultipleJsonToZip,
  validateJsonData,
  getSupportedFormats,
  ApiError
};