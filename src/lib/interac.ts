/**
 * Interac e-Transfer utilities
 * Generates unique reference codes for auto-reconciliation
 */

const USED_CODES = new Set<string>();

/**
 * Generate a unique Interac reference token
 * Format: PLX-XXXX (e.g., PLX-892A)
 * This will be included in the e-Transfer message field
 */
export function generateInteracRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, O, 0, 1 to avoid confusion
  let code: string;
  
  do {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `PLX-${result}`;
  } while (USED_CODES.has(code));
  
  USED_CODES.add(code);
  return code;
}

/**
 * Calculate Quebec taxes (TPS/TVQ)
 * Returns breakdown of subtotal, TPS, TVQ, and total
 */
export function calculateQuebecTaxes(subtotal: number): {
  subtotal: number;
  tps: number;
  tvq: number;
  total: number;
} {
  const TPS_RATE = 0.05; // 5% Goods and Services Tax
  const TVQ_RATE = 0.09975; // 9.975% Quebec Sales Tax
  
  const tps = Math.round(subtotal * TPS_RATE * 100) / 100;
  const tvq = Math.round(subtotal * TVQ_RATE * 100) / 100;
  const total = Math.round((subtotal + tps + tvq) * 100) / 100;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tps,
    tvq,
    total
  };
}

/**
 * Extract Interac reference from email body
 * Looks for PLX-XXXX pattern
 */
export function extractInteracRef(emailBody: string): string | null {
  const match = emailBody.match(/PLX-[A-Z0-9]{4}/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Extract dollar amount from email body
 * Handles formats: $150.00, 150,00 $, 150.00, etc.
 */
export function extractAmount(emailBody: string): number | null {
  // Look for dollar amounts in various formats
  const patterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})/, // $150.00 or $1,234.56
    /(\d{1,3}(?:[\s,]\d{3})*(?:\.\d{2})?)\s*\$/, // 150.00 $ or 1 234,56 $
    /amount\s*of\s*\$?\s*(\d+\.?\d{0,2})/i, // "amount of $150" or "amount of 150"
    /(?:montant|amount)\s*:?\s*\$?\s*(\d[\d\s,]*\.?\d{0,2})/i, // "montant: $150"
  ];
  
  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/[,\s]/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) {
        return Math.round(amount * 100) / 100;
      }
    }
  }
  
  return null;
}

/**
 * Check if email is from Interac notification system
 */
export function isInteracNotification(emailBody: string, subject: string = '', from: string = ''): boolean {
  const interacKeywords = [
    'interac e-transfer',
    'virement interac',
    'interac.ca',
    'virement@interac',
    'notification@virement',
    'etransfer',
    'e-transfer has been deposited',
    'virement a été déposé'
  ];
  
  const textToCheck = `${subject} ${emailBody} ${from}`.toLowerCase();
  
  return interacKeywords.some(keyword => textToCheck.includes(keyword.toLowerCase()));
}

/**
 * Format amount for display in French Canadian format
 */
export function formatCAD(amount: number): string {
  return amount.toLocaleString('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  });
}
