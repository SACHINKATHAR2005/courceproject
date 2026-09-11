'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export const CertificateQRCode: React.FC<QRCodeProps> = ({
  value,
  size = 128,
  bgColor = '#FFFFFF',
  fgColor = '#0F172A',
  className = '',
}) => {
  return (
    <div className={`p-2 bg-white rounded-lg shadow-sm border border-amber-200 inline-block ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="H" // High error correction for robust camera scans
        includeMargin={false}
      />
    </div>
  );
};
