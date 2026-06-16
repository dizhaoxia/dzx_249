import dayjs from 'dayjs';

export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
