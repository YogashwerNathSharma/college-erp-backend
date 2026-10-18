//////////////////////////////////////////////////////
// 💵 CURRENCY FORMATTING UTILITIES (INR)
//////////////////////////////////////////////////////

/**
 * Format number to Indian Rupee format: ₹1,23,456.00
 */
export function formatINR(amount: number, showDecimal = true): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  });
  return formatter.format(amount);
}

/**
 * Format number with Indian comma system: 1,23,456
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

/**
 * Convert number to words (Indian system)
 * e.g., 123456 → "One Lakh Twenty Three Thousand Four Hundred Fifty Six"
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertHundreds(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  let result = "";
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim();
}

/**
 * Format amount to compact form: ₹1.2L, ₹3.5Cr
 */
export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

/**
 * Parse INR string back to number
 */
export function parseINR(amountStr: string): number {
  return Number(amountStr.replace(/[₹,\s]/g, "")) || 0;
}
