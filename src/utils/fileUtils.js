/**
 * File handling utility functions for JSON to ZIP conversion
 */

/**
 * Validates if a string is valid JSON
 * @param {string} jsonString - The JSON string to validate
 * @returns {boolean} - True if valid JSON, false otherwise
 */
export const isValidJson = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates JSON data structure
 * @param {any} data - The data to validate
 * @returns {object} - Validation result with isValid and errors
 */
export const validateJsonData = (data) => {
  const errors = [];
  
  if (!data) {
    errors.push('Data is required');
    return { isValid: false, errors };
  }

  if (typeof data === 'string') {
    if (!isValidJson(data)) {
      errors.push('Invalid JSON format');
      return { isValid: false, errors };
    }
    try {
      data = JSON.parse(data);
    } catch (error) {
      errors.push('Failed to parse JSON');
      return { isValid: false, errors };
    }
  }

  if (typeof data !== 'object') {
    errors.push('JSON must be an object or array');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Formats file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generates a filename with timestamp
 * @param {string} baseName - Base filename
 * @param {string} extension - File extension
 * @returns {string} - Generated filename
 */
export const generateFilename = (baseName = 'converted', extension = 'zip') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${baseName}-${timestamp}.${extension}`;
};

/**
 * Downloads a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for download
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Reads a file as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} - Promise resolving to file content
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

/**
 * Reads a file as array buffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} - Promise resolving to array buffer
 */
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validates file type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
export const validateFileType = (file, allowedTypes = ['application/json', 'text/plain']) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validates file size
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum size in bytes (default 10MB)
 * @returns {boolean} - True if file size is within limit
 */
export const validateFileSize = (file, maxSize = 10 * 1024 * 1024) => {
  return file.size <= maxSize;
};

/**
 * Creates a FormData object from JSON data
 * @param {object} jsonData - The JSON data to convert
 * @param {string} fieldName - The field name for the FormData
 * @returns {FormData} - FormData object
 */
export const createFormDataFromJson = (jsonData, fieldName = 'jsonData') => {
  const formData = new FormData();
  const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  const blob = new Blob([jsonString], { type: 'application/json' });
  formData.append(fieldName, blob, 'data.json');
  return formData;
};

/**
 * Parses and validates multiple JSON files
 * @param {FileList} files - List of files to process
 * @returns {Promise<object[]>} - Promise resolving to array of parsed JSON objects
 */
export const parseMultipleJsonFiles = async (files) => {
  const results = [];
  
  for (const file of files) {
    try {
      if (!validateFileType(file)) {
        throw new Error(`Invalid file type: ${file.type}`);
      }
      
      if (!validateFileSize(file)) {
        throw new Error('File size exceeds limit');
      }
      
      const content = await readFileAsText(file);
      const validation = validateJsonData(content);
      
      if (!validation.isValid) {
        throw new Error(`Invalid JSON in ${file.name}: ${validation.errors.join(', ')}`);
      }
      
      results.push({
        filename: file.name,
        data: JSON.parse(content),
        size: file.size
      });
    } catch (error) {
      throw new Error(`Error processing ${file.name}: ${error.message}`);
    }
  }
  
  return results;
};

/**
 * Creates a download link for a blob URL
 * @param {string} blobUrl - The blob URL
 * @param {string} filename - The filename for download
 * @returns {HTMLAnchorElement} - Download link element
 */
export const createDownloadLink = (blobUrl, filename) => {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.style.display = 'none';
  return link;
};

/**
 * Handles file drop events
 * @param {DragEvent} event - The drop event
 * @returns {FileList} - List of dropped files
 */
export const handleFileDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();
  
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    throw new Error('No files dropped');
  }
  
  return files;
};

/**
 * Checks if drag event contains files
 * @param {DragEvent} event - The drag event
 * @returns {boolean} - True if event contains files
 */
export const isDragEventWithFiles = (event) => {
  return event.dataTransfer?.types?.includes('Files') || false;
};

/**
 * Sanitizes filename for safe download
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Gets file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Removes file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - Filename without extension
 */
export const removeFileExtension = (filename) => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
};