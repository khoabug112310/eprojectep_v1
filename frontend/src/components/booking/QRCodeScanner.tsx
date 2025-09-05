// QR Code Scanner Component for CineBook
// Allows scanning of e-ticket QR codes for validation

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeData, useQRCode } from '../../services/QRCodeService';

interface QRScannerProps {
  onScanSuccess: (data: QRCodeData) => void;
  onScanError: (error: string) => void;
  onClose?: () => void;
  isActive?: boolean;
  className?: string;
}

interface ScanResult {
  success: boolean;
  data?: QRCodeData;
  error?: string;
  timestamp: number;
}

export function QRCodeScanner({
  onScanSuccess,
  onScanError,
  onClose,
  isActive = true,
  className = ''
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { decodeQRData, validateQRData } = useQRCode();

  // Start camera and scanning
  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      setCameraError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning process
        videoRef.current.onloadedmetadata = () => {
          startScanningProcess();
        };
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraError('Camera access denied. Please allow camera permission or use manual input.');
      setIsScanning(false);
    }
  }, []);

  // Stop camera and scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start the scanning process
  const startScanningProcess = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Scan every 500ms
    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Attempt to decode QR code (simplified implementation)
        const qrData = this.scanImageData(imageData);
        
        if (qrData) {
          this.handleScanResult(qrData);
        }
      }
    }, 500);
  }, []);

  // Simplified QR code scanning (in production, use a proper library like jsQR)
  private scanImageData = (imageData: ImageData): string | null => {
    // This is a simplified implementation
    // In production, use a proper QR code scanning library like 'jsqr'
    
    // For demo purposes, we'll simulate finding QR codes occasionally
    if (Math.random() < 0.1) { // 10% chance of "finding" a QR code
      // Return sample QR data for testing
      return JSON.stringify({
        b: 'CB123456789',
        m: 'Avengers: Endgame',
        t: 'Galaxy Cinema District 1',
        s: '2024-01-15 19:30',
        e: 'A1,A2',
        c: 'John Doe',
        a: 240000,
        u: 'VND',
        p: 'PAY123456',
        d: Date.now(),
        h: 'abc123'
      });
    }
    
    return null;
  };

  // Handle scan result
  const handleScanResult = (dataString: string) => {
    try {
      const qrData = decodeQRData(dataString);
      
      if (!qrData) {
        throw new Error('Invalid QR code format');
      }

      // Validate QR data
      if (!validateQRData(qrData)) {
        throw new Error('QR code validation failed - data may be corrupted');
      }

      // Check if this QR code was already scanned recently
      const recentScan = scanResults.find(
        result => result.data?.bookingId === qrData.bookingId &&
        Date.now() - result.timestamp < 5000 // 5 seconds
      );

      if (recentScan) {
        return; // Ignore duplicate scans
      }

      // Record successful scan
      const scanResult: ScanResult = {
        success: true,
        data: qrData,
        timestamp: Date.now()
      };

      setScanResults(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 results
      onScanSuccess(qrData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scanning error';
      
      // Record failed scan
      const scanResult: ScanResult = {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };

      setScanResults(prev => [scanResult, ...prev.slice(0, 9)]);
      onScanError(errorMessage);
    }
  };

  // Handle manual QR code input
  const handleManualInput = () => {
    if (!manualInput.trim()) {
      onScanError('Please enter QR code data');
      return;
    }

    handleScanResult(manualInput.trim());
    setManualInput('');
    setShowManualInput(false);
  };

  // Start/stop scanning based on isActive prop
  useEffect(() => {
    if (isActive && !isScanning) {
      startScanning();
    } else if (!isActive && isScanning) {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, isScanning, startScanning, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <div className={`qr-scanner ${className}`}>
      <div className="qr-scanner__header">
        <h2>🔍 QR Code Scanner</h2>
        <p>Scan e-ticket QR codes for validation</p>
        
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="qr-scanner__content">
        {/* Camera View */}
        {!cameraError && (
          <div className="camera-container">
            <video
              ref={videoRef}
              className="camera-video"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="camera-canvas"
              style={{ display: 'none' }}
            />
            
            {/* Scanning Overlay */}
            <div className="scanning-overlay">
              <div className="scan-frame">
                <div className="scan-corners">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                {isScanning && (
                  <div className="scan-line"></div>
                )}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="scan-status">
              {isScanning ? (
                <span className="status-scanning">📡 Scanning...</span>
              ) : (
                <span className="status-inactive">📷 Camera Inactive</span>
              )}
            </div>
          </div>
        )}

        {/* Camera Error */}
        {cameraError && (
          <div className="camera-error">
            <div className="error-icon">📷</div>
            <div className="error-message">{cameraError}</div>
          </div>
        )}

        {/* Manual Input Option */}
        <div className="manual-input-section">
          {!showManualInput ? (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowManualInput(true)}
            >
              ⌨️ Enter QR Code Manually
            </button>
          ) : (
            <div className="manual-input-form">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste QR code data here..."
                className="manual-input-textarea"
                rows={4}
              />
              <div className="manual-input-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleManualInput}
                >
                  Validate
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowManualInput(false);
                    setManualInput('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="scanner-controls">
          {isScanning ? (
            <button 
              className="btn btn-danger"
              onClick={stopScanning}
            >
              ⏹️ Stop Scanning
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={startScanning}
              disabled={!!cameraError}
            >
              ▶️ Start Scanning
            </button>
          )}
        </div>

        {/* Scan Results History */}
        {scanResults.length > 0 && (
          <div className="scan-results">
            <h3>Recent Scans</h3>
            <div className="results-list">
              {scanResults.map((result, index) => (
                <div 
                  key={index}
                  className={`result-item ${result.success ? 'success' : 'error'}`}
                >
                  <div className="result-icon">
                    {result.success ? '✅' : '❌'}
                  </div>
                  <div className="result-content">
                    {result.success && result.data ? (
                      <>
                        <div className="result-title">
                          {result.data.movieTitle}
                        </div>
                        <div className="result-details">
                          Booking: {result.data.bookingId} | 
                          Customer: {result.data.customerName}
                        </div>
                      </>
                    ) : (
                      <div className="result-error">
                        {result.error}
                      </div>
                    )}
                  </div>
                  <div className="result-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="clear-results-btn"
              onClick={() => setScanResults([])}
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRCodeScanner;