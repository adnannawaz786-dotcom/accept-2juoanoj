import React, { useState } from 'react'
import { Button } from './components/ui/Button'
import { Upload, Download, FileText, Zap, AlertCircle, CheckCircle } from 'lucide-react'

function App() {
  const [jsonInput, setJsonInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const validateJSON = (text) => {
    try {
      JSON.parse(text)
      return true
    } catch {
      return false
    }
  }

  const convertToZip = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data')
      return
    }

    if (!validateJSON(jsonInput)) {
      setError('Invalid JSON format')
      return
    }

    setIsLoading(true)
    setError('')
    setStatus('Converting JSON to ZIP...')

    try {
      // Create a mock API call for JSON to ZIP conversion
      const response = await fetch('/api/convert-to-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: JSON.parse(jsonInput),
          filename: 'converted-data.json'
        })
      })

      if (!response.ok) {
        throw new Error('Conversion failed')
      }

      // Get the blob data for download
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'converted-data.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setStatus('ZIP file downloaded successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (err) {
      setError('Failed to convert JSON to ZIP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setJsonInput(e.target.result)
        setError('')
      }
      reader.readAsText(file)
    } else {
      setError('Please select a valid JSON file')
    }
  }

  const clearInput = () => {
    setJsonInput('')
    setError('')
    setStatus('')
  }

  const formatJSON = () => {
    if (!jsonInput.trim()) return
    
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
      setError('')
    } catch {
      setError('Cannot format invalid JSON')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800">JSON to ZIP Converter</h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Convert your JSON data into downloadable ZIP files instantly. 
            Upload a file or paste your JSON data below.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            {/* Upload Section */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload JSON File
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={formatJSON}
                    variant="outline"
                    disabled={!jsonInput.trim()}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Format JSON
                  </Button>
                  <Button
                    onClick={clearInput}
                    variant="outline"
                    disabled={!jsonInput.trim()}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* JSON Input Section */}
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                JSON Data
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value)
                  setError('')
                }}
                placeholder='Enter your JSON data here... e.g., {"name": "example", "data": [1, 2, 3]}'
                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Character Count */}
              <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                <span>{jsonInput.length} characters</span>
                {jsonInput.trim() && (
                  <span className={validateJSON(jsonInput) ? 'text-green-600' : 'text-red-600'}>
                    {validateJSON(jsonInput) ? '✓ Valid JSON' : '✗ Invalid JSON'}
                  </span>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {(error || status) && (
              <div className="px-6 pb-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {status && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{status}</span>
                  </div>
                )}
              </div>
            )}

            {/* Convert Button */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <Button
                onClick={convertToZip}
                disabled={!jsonInput.trim() || !validateJSON(jsonInput) || isLoading}
                className="w-full flex items-center justify-center gap-2 py-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Convert to ZIP & Download
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow border border-slate-200">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">Easy Upload</h3>
              <p className="text-sm text-slate-600">
                Upload JSON files directly or paste your data
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow border border-slate-200">
              <Zap className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">Fast Processing</h3>
              <p className="text-sm text-slate-600">
                Instant conversion with real-time validation
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow border border-slate-200">
              <Download className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">Auto Download</h3>
              <p className="text-sm text-slate-600">
                Automatic ZIP file download after conversion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App