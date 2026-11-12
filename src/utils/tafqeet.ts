/**
 * Converts numbers to Arabic and English words.
 */

const arabicOnes = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const arabicTens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const arabicTeens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const arabicHundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertArabic(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + convertArabic(-num);

  let parts: string[] = [];

  const thousands = Math.floor(num / 1000);
  const remainder1000 = num % 1000;

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertArabic(thousands) + ' آلاف');
    else parts.push(convertArabic(thousands) + ' ألفاً');
  }

  if (remainder1000 > 0) {
    const hundreds = Math.floor(remainder1000 / 100);
    const remainder100 = remainder1000 % 100;

    if (hundreds > 0) parts.push(arabicHundreds[hundreds]);

    if (remainder100 > 0) {
      if (remainder100 < 10) parts.push(arabicOnes[remainder100]);
      else if (remainder100 >= 10 && remainder100 < 20) parts.push(arabicTeens[remainder100 - 10]);
      else {
        const ones = remainder100 % 10;
        const tens = Math.floor(remainder100 / 10);
        if (ones > 0) {
          parts.push(arabicOnes[ones] + ' و' + arabicTens[tens]);
        } else {
          parts.push(arabicTens[tens]);
        }
      }
    }
  }

  return parts.join(' و');
}

const engOnes = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const engTeens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const engTens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertEnglish(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + convertEnglish(-num);

  let parts: string[] = [];
  const thousands = Math.floor(num / 1000);
  const remainder1000 = num % 1000;

  if (thousands > 0) {
    parts.push(convertEnglish(thousands) + ' Thousand');
  }

  if (remainder1000 > 0) {
    const hundreds = Math.floor(remainder1000 / 100);
    const remainder100 = remainder1000 % 100;

    if (hundreds > 0) parts.push(engOnes[hundreds] + ' Hundred');

    if (remainder100 > 0) {
      if (remainder100 < 10) parts.push(engOnes[remainder100]);
      else if (remainder100 >= 10 && remainder100 < 20) parts.push(engTeens[remainder100 - 10]);
      else {
        const ones = remainder100 % 10;
        const tens = Math.floor(remainder100 / 10);
        if (ones > 0) parts.push(engTens[tens] + ' ' + engOnes[ones]);
        else parts.push(engTens[tens]);
      }
    }
  }
  return parts.join(' ');
}

export function numberToWords(amount: number): { arabic: string, english: string } {
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 1000); // 3 decimal places for OMR

  let arabic = convertArabic(whole) + ' ريال عماني';
  let english = convertEnglish(whole) + ' Omani Rial';

  if (fraction > 0) {
    arabic += ' و' + convertArabic(fraction) + ' بيسة';
    english += ' and ' + convertEnglish(fraction) + ' Baisa';
  }

  return { arabic: arabic.trim() + ' فقط لا غير', english: english.trim() + ' Only' };
}
