'use client';

import React from 'react';
import { FileCheck } from 'lucide-react';

export interface CEEBadgeConfig {
  code: string;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const CEE_BADGES: Record<string, CEEBadgeConfig> = {
  'IND-UT-102': {
    code: 'IND-UT-102',
    label: 'Variateurs',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  'IND-UT-103': {
    code: 'IND-UT-103',
    label: 'Moteurs HE',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  'IND-UT-116': {
    code: 'IND-UT-116',
    label: 'Compresseurs',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
  },
  'IND-UT-117': {
    code: 'IND-UT-117',
    label: 'Récup. chaleur',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
  },
  'BAT-EQ-133': {
    code: 'BAT-EQ-133',
    label: 'LED',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
  },
  'BAT-TH-116': {
    code: 'BAT-TH-116',
    label: 'Isolation',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  'BAT-TH-104': {
    code: 'BAT-TH-104',
    label: 'Pompe chaleur',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/20',
  },
};

const SECTOR_FALLBACK: Record<string, string[]> = {
  'metallurgie': ['IND-UT-102', 'IND-UT-117'],
  'menuiserie': ['BAT-EQ-133', 'IND-UT-102'],
  'garage': ['BAT-EQ-133', 'IND-UT-103'],
  'automobile': ['BAT-EQ-133', 'IND-UT-103'],
  'industrie': ['IND-UT-102', 'IND-UT-116'],
  'agroalimentaire': ['IND-UT-116', 'IND-UT-117'],
  'logistique': ['BAT-EQ-133', 'BAT-TH-116'],
  'batiment': ['BAT-EQ-133', 'BAT-TH-116'],
  'commerce': ['BAT-EQ-133', 'BAT-TH-104'],
};

interface ComplianceBadgeProps {
  code?: string;
  sector?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function ComplianceBadge({
  code,
  sector,
  showIcon = false,
  size = 'sm',
  className = '',
}: ComplianceBadgeProps) {
  let badgeConfig = code ? CEE_BADGES[code] : null;
  
  if (!badgeConfig && sector) {
    const sectorKey = sector.toLowerCase().replace(/[^a-z]/g, '');
    const fallbackCodes = Object.entries(SECTOR_FALLBACK).find(
      ([key]) => sectorKey.includes(key) || key.includes(sectorKey)
    )?.[1];
    
    if (fallbackCodes && fallbackCodes[0]) {
      badgeConfig = CEE_BADGES[fallbackCodes[0]];
    }
  }

  if (!badgeConfig) {
    badgeConfig = CEE_BADGES['IND-UT-102'];
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full border
        ${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.borderColor}
        ${sizeClasses} ${className}
      `}
    >
      {showIcon && <FileCheck className="w-3 h-3" />}
      {badgeConfig.code}
    </span>
  );
}

interface ComplianceBadgeListProps {
  codes?: string[];
  sector?: string;
  maxDisplay?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function ComplianceBadgeList({
  codes = [],
  sector,
  maxDisplay = 2,
  size = 'sm',
  className = '',
}: ComplianceBadgeListProps) {
  let displayCodes = codes.length > 0 ? codes : [];
  
  if (displayCodes.length === 0 && sector) {
    const sectorKey = sector.toLowerCase().replace(/[^a-z]/g, '');
    const fallbackCodes = Object.entries(SECTOR_FALLBACK).find(
      ([key]) => sectorKey.includes(key) || key.includes(sectorKey)
    )?.[1];
    
    if (fallbackCodes) {
      displayCodes = fallbackCodes;
    }
  }

  if (displayCodes.length === 0) {
    displayCodes = ['IND-UT-102'];
  }

  const visibleCodes = displayCodes.slice(0, maxDisplay);
  const remainingCount = displayCodes.length - maxDisplay;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleCodes.map((code) => (
        <ComplianceBadge key={code} code={code} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-slate-500">+{remainingCount}</span>
      )}
    </div>
  );
}

export { CEE_BADGES, SECTOR_FALLBACK };
