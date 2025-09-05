// QR Code Service for CineBook E-Tickets
// Generates QR codes for booking verification and e-ticket display

export interface QRCodeData {
  bookingId: string;
  movieTitle: string;
  theater: string;
  showtime: string;
  seats: string[];
  customerName: string;
  amount: number;
  currency: string;
  paymentId: string;
  timestamp: number;
  validationHash: string;
}

export interface QRCodeOptions {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  logo?: {
    src: string;
    size: number;
  };
}

export interface ETicketData {
  id: string;
  bookingCode: string;
  movieTitle: string;
  posterUrl?: string;
  theater: string;
  screen: string;
  showDate: string;
  showTime: string;
  seats: Array<{
    number: string;
    type: 'gold' | 'platinum' | 'box';
    price: number;
  }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  status: 'confirmed' | 'used' | 'cancelled';
  qrCode: string;
  issueDate: string;
  validUntil: string;
  terms: string[];
}

class QRCodeService {
  private static instance: QRCodeService;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  public static getInstance(): QRCodeService {
    if (!QRCodeService.instance) {
      QRCodeService.instance = new QRCodeService();
    }
    return QRCodeService.instance;
  }

  // Generate QR code data URL
  public async generateQRCode(
    data: string | QRCodeData,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    const defaultOptions: QRCodeOptions = {
      size: 200,
      errorCorrectionLevel: 'M',
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'string' ? data : this.encodeQRData(data);
    
    try {
      // Generate QR code using HTML5 Canvas
      return await this.generateQRCodeCanvas(dataString, mergedOptions);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR Code generation failed');
    }
  }

  // Generate QR code using Canvas API (simplified implementation)
  private async generateQRCodeCanvas(data: string, options: QRCodeOptions): Promise<string> {
    const size = options.size;
    const margin = options.margin;
    
    // Set canvas size
    this.canvas.width = size;
    this.canvas.height = size;
    
    // Clear canvas
    this.context.fillStyle = options.color.light;
    this.context.fillRect(0, 0, size, size);
    
    // Generate QR matrix (simplified - in production use a proper QR library)
    const matrix = this.generateQRMatrix(data);
    const moduleSize = (size - margin * 2) / matrix.length;
    
    // Draw QR code
    this.context.fillStyle = options.color.dark;
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          this.context.fillRect(
            margin + col * moduleSize,
            margin + row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
    
    // Add logo if specified
    if (options.logo) {
      await this.addLogoToQR(options.logo, size);
    }
    
    return this.canvas.toDataURL('image/png');
  }

  // Simplified QR matrix generation (for demo purposes)
  private generateQRMatrix(data: string): boolean[][] {
    // This is a simplified implementation
    // In production, use a proper QR code library like 'qrcode' or 'qr-code-generator'
    const size = 25; // QR code modules
    const matrix: boolean[][] = [];
    
    // Initialize matrix
    for (let i = 0; i < size; i++) {
      matrix[i] = new Array(size).fill(false);
    }
    
    // Generate a simple pattern based on data hash
    const hash = this.simpleHash(data);
    const random = this.seededRandom(hash);
    
    // Add finder patterns (corners)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, size - 7, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    
    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }
    
    // Fill data area with pattern based on hash
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!this.isReservedArea(row, col, size)) {
          matrix[row][col] = random() > 0.5;
        }
      }
    }
    
    return matrix;
  }

  // Add finder pattern (QR corner squares)
  private addFinderPattern(matrix: boolean[][], startRow: number, startCol: number): void {
    const pattern = [
      [true, true, true, true, true, true, true],
      [true, false, false, false, false, false, true],
      [true, false, true, true, true, false, true],
      [true, false, true, true, true, false, true],
      [true, false, true, true, true, false, true],
      [true, false, false, false, false, false, true],
      [true, true, true, true, true, true, true]
    ];
    
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (startRow + row < matrix.length && startCol + col < matrix[0].length) {
          matrix[startRow + row][startCol + col] = pattern[row][col];
        }
      }
    }
  }

  // Check if position is reserved for QR patterns
  private isReservedArea(row: number, col: number, size: number): boolean {
    // Finder patterns
    if ((row < 9 && col < 9) || 
        (row < 9 && col >= size - 8) || 
        (row >= size - 8 && col < 9)) {
      return true;
    }
    
    // Timing patterns
    if (row === 6 || col === 6) {
      return true;
    }
    
    return false;
  }

  // Simple hash function for data
  private simpleHash(data: string): number {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Seeded random number generator
  private seededRandom(seed: number): () => number {
    let m = 0x80000000; // 2**31
    let a = 1103515245;
    let c = 12345;
    
    let state = seed;
    return function() {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  }

  // Add logo to QR code
  private async addLogoToQR(logo: { src: string; size: number }, qrSize: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const logoSize = logo.size;
        const x = (qrSize - logoSize) / 2;
        const y = (qrSize - logoSize) / 2;
        
        // Add white background for logo
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
        
        // Draw logo
        this.context.drawImage(img, x, y, logoSize, logoSize);
        resolve();
      };
      img.onerror = reject;
      img.src = logo.src;
    });
  }

  // Encode QR data object to string
  private encodeQRData(data: QRCodeData): string {
    // Create a structured data string
    const qrData = {
      b: data.bookingId,           // booking ID
      m: data.movieTitle,          // movie
      t: data.theater,             // theater
      s: data.showtime,            // showtime
      e: data.seats.join(','),     // seats
      c: data.customerName,        // customer
      a: data.amount,              // amount
      u: data.currency,            // currency
      p: data.paymentId,           // payment ID
      d: data.timestamp,           // timestamp
      h: data.validationHash       // hash for validation
    };
    
    return JSON.stringify(qrData);
  }

  // Decode QR data string to object
  public decodeQRData(dataString: string): QRCodeData | null {
    try {
      const qrData = JSON.parse(dataString);
      
      return {
        bookingId: qrData.b,
        movieTitle: qrData.m,
        theater: qrData.t,
        showtime: qrData.s,
        seats: qrData.e.split(','),
        customerName: qrData.c,
        amount: qrData.a,
        currency: qrData.u,
        paymentId: qrData.p,
        timestamp: qrData.d,
        validationHash: qrData.h
      };
    } catch (error) {
      console.error('Failed to decode QR data:', error);
      return null;
    }
  }

  // Generate validation hash for booking data
  public generateValidationHash(bookingData: Omit<QRCodeData, 'validationHash'>): string {
    const dataString = JSON.stringify(bookingData);
    return this.simpleHash(dataString).toString(36);
  }

  // Validate QR code data
  public validateQRData(data: QRCodeData): boolean {
    const { validationHash, ...bookingData } = data;
    const expectedHash = this.generateValidationHash(bookingData);
    return validationHash === expectedHash;
  }

  // Create e-ticket data with QR code
  public async createETicket(bookingData: {
    bookingId: string;
    bookingCode: string;
    movieTitle: string;
    posterUrl?: string;
    theater: string;
    screen: string;
    showDate: string;
    showTime: string;
    seats: Array<{
      number: string;
      type: 'gold' | 'platinum' | 'box';
      price: number;
    }>;
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentId: string;
  }): Promise<ETicketData> {
    
    // Create QR code data
    const qrData: Omit<QRCodeData, 'validationHash'> = {
      bookingId: bookingData.bookingId,
      movieTitle: bookingData.movieTitle,
      theater: bookingData.theater,
      showtime: `${bookingData.showDate} ${bookingData.showTime}`,
      seats: bookingData.seats.map(s => s.number),
      customerName: bookingData.customer.name,
      amount: bookingData.totalAmount,
      currency: bookingData.currency,
      paymentId: bookingData.paymentId,
      timestamp: Date.now()
    };
    
    // Generate validation hash
    const validationHash = this.generateValidationHash(qrData);
    const completeQRData: QRCodeData = { ...qrData, validationHash };
    
    // Generate QR code image
    const qrCode = await this.generateQRCode(completeQRData, {
      size: 200,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#e50914',
        light: '#ffffff'
      }
    });
    
    // Create e-ticket
    const eTicket: ETicketData = {
      id: bookingData.bookingId,
      bookingCode: bookingData.bookingCode,
      movieTitle: bookingData.movieTitle,
      posterUrl: bookingData.posterUrl,
      theater: bookingData.theater,
      screen: bookingData.screen,
      showDate: bookingData.showDate,
      showTime: bookingData.showTime,
      seats: bookingData.seats,
      customer: bookingData.customer,
      totalAmount: bookingData.totalAmount,
      currency: bookingData.currency,
      paymentMethod: bookingData.paymentMethod,
      paymentId: bookingData.paymentId,
      status: 'confirmed',
      qrCode,
      issueDate: new Date().toISOString(),
      validUntil: this.calculateValidUntil(bookingData.showDate, bookingData.showTime),
      terms: [
        'Ticket is non-refundable and non-transferable',
        'Please arrive at the theater 15 minutes before showtime',
        'Present this e-ticket and valid ID at the entrance',
        'Outside food and beverages are not allowed',
        'Use of mobile phones during the movie is prohibited'
      ]
    };
    
    return eTicket;
  }

  // Calculate ticket validity period
  private calculateValidUntil(showDate: string, showTime: string): string {
    const showDateTime = new Date(`${showDate}T${showTime}`);
    // Ticket is valid until 30 minutes after showtime
    showDateTime.setMinutes(showDateTime.getMinutes() + 30);
    return showDateTime.toISOString();
  }

  // Generate booking code
  public generateBookingCode(): string {
    const prefix = 'CB'; // CineBook
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Format amount for display
  public formatAmount(amount: number, currency: string = 'VND'): string {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Download QR code as image
  public downloadQRCode(dataUrl: string, filename: string = 'qr-code.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Print e-ticket
  public printETicket(eTicket: ETicketData): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = this.generatePrintableTicket(eTicket);
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  }

  // Generate printable ticket HTML
  private generatePrintableTicket(eTicket: ETicketData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CineBook E-Ticket - ${eTicket.bookingCode}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .ticket { max-width: 400px; margin: 0 auto; border: 2px dashed #e50914; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #e50914; }
          .movie-title { font-size: 18px; font-weight: bold; margin: 10px 0; }
          .details { margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .qr-code { text-align: center; margin: 20px 0; }
          .qr-code img { max-width: 150px; }
          .terms { font-size: 10px; margin-top: 20px; }
          @media print {
            body { margin: 0; }
            .ticket { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="logo">🎬 CINEBOOK</div>
            <div class="movie-title">${eTicket.movieTitle}</div>
            <div>Booking Code: ${eTicket.bookingCode}</div>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span>Theater:</span>
              <span>${eTicket.theater}</span>
            </div>
            <div class="detail-row">
              <span>Screen:</span>
              <span>${eTicket.screen}</span>
            </div>
            <div class="detail-row">
              <span>Date:</span>
              <span>${eTicket.showDate}</span>
            </div>
            <div class="detail-row">
              <span>Time:</span>
              <span>${eTicket.showTime}</span>
            </div>
            <div class="detail-row">
              <span>Seats:</span>
              <span>${eTicket.seats.map(s => s.number).join(', ')}</span>
            </div>
            <div class="detail-row">
              <span>Customer:</span>
              <span>${eTicket.customer.name}</span>
            </div>
            <div class="detail-row">
              <span>Total:</span>
              <span>${this.formatAmount(eTicket.totalAmount, eTicket.currency)}</span>
            </div>
          </div>
          
          <div class="qr-code">
            <img src="${eTicket.qrCode}" alt="QR Code" />
            <div>Scan at theater entrance</div>
          </div>
          
          <div class="terms">
            <strong>Terms & Conditions:</strong><br>
            ${eTicket.terms.map(term => `• ${term}`).join('<br>')}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const qrCodeService = QRCodeService.getInstance();

// React Hook for QR code functionality
export function useQRCode() {
  const generateQRCode = async (
    data: string | QRCodeData,
    options?: Partial<QRCodeOptions>
  ): Promise<string> => {
    return qrCodeService.generateQRCode(data, options);
  };

  const createETicket = async (bookingData: any): Promise<ETicketData> => {
    return qrCodeService.createETicket(bookingData);
  };

  const validateQRData = (data: QRCodeData): boolean => {
    return qrCodeService.validateQRData(data);
  };

  const decodeQRData = (dataString: string): QRCodeData | null => {
    return qrCodeService.decodeQRData(dataString);
  };

  const downloadQRCode = (dataUrl: string, filename?: string): void => {
    qrCodeService.downloadQRCode(dataUrl, filename);
  };

  const printETicket = (eTicket: ETicketData): void => {
    qrCodeService.printETicket(eTicket);
  };

  const generateBookingCode = (): string => {
    return qrCodeService.generateBookingCode();
  };

  const formatAmount = (amount: number, currency?: string): string => {
    return qrCodeService.formatAmount(amount, currency);
  };

  return {
    generateQRCode,
    createETicket,
    validateQRData,
    decodeQRData,
    downloadQRCode,
    printETicket,
    generateBookingCode,
    formatAmount
  };
}

export default qrCodeService;