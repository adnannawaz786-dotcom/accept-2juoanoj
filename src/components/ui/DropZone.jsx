import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { handleFileDrop, isDragEventWithFiles, validateFileType, validateFileSize, formatFileSize } from '../../utils/fileUtils';

const DropZone = ({ 
  onFilesSelected, 
  acceptedTypes = ['.json'], 
  maxFileSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  disabled = false,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const validateFiles = useCallback((fileList) => {
    const validFiles = [];
    const fileErrors = [];

    Array.from(fileList).forEach((file, index) => {
      const typeValidation = validateFileType(file, acceptedTypes);
      const sizeValidation = validateFileSize(file, maxFileSize);

      if (!typeValidation.isValid) {
        fileErrors.push({
          file: file.name,
          message: typeValidation.error
        });
        return;
      }

      if (!sizeValidation.isValid) {
        fileErrors.push({
          file: file.name,
          message: sizeValidation.error
        });
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors: fileErrors };
  }, [acceptedTypes, maxFileSize]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !isDragEventWithFiles(e)) return;
    
    setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.currentTarget.contains(e.relatedTarget)) return;
    
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    
    if (disabled) return;

    try {
      const droppedFiles = await handleFileDrop(e);
      const { validFiles, errors: validationErrors } = validateFiles(droppedFiles);
      
      setErrors(validationErrors);
      
      if (validFiles.length > 0) {
        const filesToAdd = multiple ? validFiles : [validFiles[0]];
        const newFiles = multiple ? [...files, ...filesToAdd] : filesToAdd;
        
        setFiles(newFiles);
        onFilesSelected(newFiles);
      }
    } catch (error) {
      setErrors([{ message: 'Error processing dropped files: ' + error.message }]);
    }
  }, [disabled, files, multiple, onFilesSelected, validateFiles]);

  const handleFileInputChange = useCallback((e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const { validFiles, errors: validationErrors } = validateFiles(selectedFiles);
    
    setErrors(validationErrors);
    
    if (validFiles.length > 0) {
      const filesToAdd = multiple ? validFiles : [validFiles[0]];
      const newFiles = multiple ? [...files, ...filesToAdd] : filesToAdd;
      
      setFiles(newFiles);
      onFilesSelected(newFiles);
    }

    // Reset input
    e.target.value = '';
  }, [files, multiple, onFilesSelected, validateFiles]);

  const removeFile = useCallback((indexToRemove) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, onFilesSelected]);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setErrors([]);
    onFilesSelected([]);
  }, [onFilesSelected]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const dropZoneClasses = `
    relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
    ${isDragOver 
      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
    }
    ${disabled 
      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' 
      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }
    ${className}
  `;

  return (
    <div className="w-full space-y-4">
      <div
        className={dropZoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragOver ? 'Drop files here' : 'Drop files or click to browse'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports {acceptedTypes.join(', ')} files up to {formatFileSize(maxFileSize)}
              {multiple && ' (multiple files allowed)'}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            Choose Files
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {error.file && <strong>{error.file}: </strong>}
                {error.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Selected Files ({files.length})
            </h4>
            {files.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFiles}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropZone;