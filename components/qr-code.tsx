'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export const CertificateQRCode: React.FC<QRCodeProps> = ({
  value,
  size = 100,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  className = '',
}) => {
  return (
    <div className={`p-2 bg-white rounded-md shadow-sm border border-slate-200 inline-flex items-center justify-center ${className}`}>
      <QRCodeCanvas
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="M" // Standard Medium (15%) error correction creates larger, high-contrast modules that cameras scan effortlessly
        marginSize={2} // Required quiet zone so scanner cameras can reliably detect corner finder patterns
      />
    </div>
  );
};
