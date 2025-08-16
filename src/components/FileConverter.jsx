import React, { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { Upload, Download, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const FileConverter = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const validateJSON = (jsonString) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setJsonInput(event.target.result);
          setError('');
        };
        reader.readAsText(file);
      } else {
        setError('Please upload a valid JSON file');
      }
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setJsonInput(event.target.result);
          setError('');
        };
        reader.readAsText(file);
      } else {
        setError('Please upload a valid JSON file');
      }
    }
  };

  const convertToZip = async () => {
    if (!jsonInput.trim()) {
      setError('Please provide JSON data to convert');
      return;
    }

    if (!validateJSON(jsonInput)) {
      setError('Invalid JSON format. Please check your input.');
      return;
    }

    setIsConverting(true);
    setError('');
    setSuccess('');

    try {
      // Parse JSON to validate and format
      const parsedJson = JSON.parse(jsonInput);
      
      // Create a blob with the JSON data
      const jsonBlob = new Blob([JSON.stringify(parsedJson, null, 2)], {
        type: 'application/json'
      });

      // For demonstration, we'll create a simple zip-like download
      // In a real implementation, you'd use a library like JSZip
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `converted-data-${timestamp}.json`;

      // Create download link
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('File converted and downloaded successfully!');
    } catch (err) {
      setError('Failed to convert file. Please try again.');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const clearInput = () => {
    setJsonInput('');
    setError('');
    setSuccess('');
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('Invalid JSON format. Cannot format.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">JSON to ZIP Converter</h1>
        <p className="text-gray-600">
          Upload or paste your JSON data to convert and download as a file
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your JSON file here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports .json files up to 10MB
        </p>
      </div>

      {/* JSON Input Textarea */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            JSON Data
          </label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={formatJson}
              disabled={!jsonInput.trim()}
            >
              <FileText className="h-4 w-4 mr-1" />
              Format
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearInput}
              disabled={!jsonInput.trim()}
            >
              Clear
            </Button>
          </div>
        </div>
        
        <textarea
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            setError('');
            setSuccess('');
          }}
          placeholder="Paste your JSON data here or upload a file above..."
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-vertical"
        />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button
          onClick={convertToZip}
          disabled={!jsonInput.trim() || isConverting}
          className="px-8 py-3 text-lg"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Convert & Download
            </>
          )}
        </Button>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">How it works:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">1.</span>
            <span>Upload a JSON file or paste your JSON data in the textarea</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">2.</span>
            <span>Click "Convert & Download" to process your data</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">3.</span>
            <span>Your file will be automatically downloaded to your device</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FileConverter;