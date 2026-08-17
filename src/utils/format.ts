export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return `${diffSec}s trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours} giờ trước`;
}

export function formatTimeHM(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN');
}

/**
 * Returns local YYYY-MM-DD string
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate VietQR Quick Link URL (standard Vietnamese banking QR spec)
 */
export function getVietQRUrl(bankBin: string, accountNumber: string, amount: number, memo: string): string {
  const encodedMemo = encodeURIComponent(memo);
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodedMemo}&accountName=NHA%20AN%20CONG%20AN%20TINH%20QUANG%20NGAI`;
}

/**
 * Generate Dine-in Table URL
 */
export function getTableQrTargetUrl(tableNumber: string, customBaseUrl?: string): string {
  let base = customBaseUrl?.trim();
  if (!base) {
    if (typeof window !== 'undefined' && window.location) {
      base = window.location.origin;
    } else {
      base = 'https://ais-dev-ty4vdsigvv64cb5zacojoe-125317174715.asia-southeast1.run.app';
    }
  }

  // Ensure protocol exists
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'https://' + base;
  }

  // Remove trailing slash
  base = base.replace(/\/+$/, '');
  
  return `${base}/?table=${encodeURIComponent(tableNumber)}&mode=customer`;
}

