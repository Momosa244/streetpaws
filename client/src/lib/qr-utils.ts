import QRCode from 'qrcode';

// QR Code utilities for generating and handling QR codes
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    // Generate QR code asynchronously
    const qrDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    // Fallback to a simple placeholder
    const qrSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="black"/>
        <text x="100" y="100" font-family="Arial" font-size="14" fill="black" text-anchor="middle">
          QR Code Error
        </text>
        <text x="100" y="120" font-family="Arial" font-size="10" fill="gray" text-anchor="middle">
          ${text.substring(0, 30)}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(qrSvg)}`;
  }
}



export function createPrintableQRTag(animalId: string, qrDataURL: string): void {
  if (!qrDataURL) {
    console.error('QR data URL is required for printing');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window - popup might be blocked');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Tag - ${animalId}</title>
      <style>
        @page {
          margin: 0.5in;
          size: 4in 3in;
        }
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          margin: 0; 
          padding: 20px;
          background: white;
        }
        .tag { 
          border: 3px solid #000; 
          padding: 15px; 
          display: inline-block; 
          border-radius: 8px;
          background: white;
          max-width: 300px;
        }
        .header {
          font-size: 16px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .animal-id { 
          font-weight: bold; 
          font-size: 20px; 
          margin: 10px 0;
          letter-spacing: 1px;
        }
        .qr-code { 
          margin: 15px 0; 
          display: flex;
          justify-content: center;
        }
        .qr-code img {
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .instructions { 
          font-size: 11px; 
          margin-top: 12px;
          line-height: 1.3;
          color: #555;
        }
        .emergency {
          font-size: 10px;
          margin-top: 8px;
          color: #dc2626;
          font-weight: bold;
        }
        @media print {
          body { margin: 0; }
          .tag { border: 3px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="tag">
        <div class="header">StreetPaws ID</div>
        <div class="animal-id">${animalId}</div>
        <div class="qr-code">
          <img src="${qrDataURL}" alt="QR Code" width="140" height="140">
        </div>
        <div class="instructions">
          Scan QR code for complete animal records<br>
          Medical history • Vaccinations • Contact info
        </div>
        <div class="emergency">
          Emergency: Call local animal control
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for image to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Auto close after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };
  } catch (error) {
    console.error('Print operation failed:', error);
    printWindow.close();
  }
}
