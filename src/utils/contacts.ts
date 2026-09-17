import { Contact, ScheduledWhatsAppMessage } from '../types';

const CONTACTS_STORAGE_KEY = 'anshul_contacts_v1';
const SCHEDULED_STORAGE_KEY = 'anshul_scheduled_whatsapp_v1';

export const DEFAULT_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Mom', phone: '+1 555 101 2020', color: '#FF375F' },
  { id: 'c2', name: 'Dad', phone: '+1 555 202 3030', color: '#0A84FF' },
  { id: 'c3', name: 'Anshul', phone: '+1 555 303 4040', color: '#30D158' },
  { id: 'c4', name: 'Best Friend', phone: '+1 555 404 5050', color: '#BF5AF2' },
  { id: 'c5', name: 'Work / Colleague', phone: '+1 555 505 6060', color: '#FF9F0A' },
];

export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONTACTS;
  } catch {
    return DEFAULT_CONTACTS;
  }
}

export function saveStoredContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error('Failed to save contacts', e);
  }
}

export function getScheduledMessages(): ScheduledWhatsAppMessage[] {
  try {
    const raw = localStorage.getItem(SCHEDULED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScheduledMessages(messages: ScheduledWhatsAppMessage[]): void {
  try {
    localStorage.setItem(SCHEDULED_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save scheduled messages', e);
  }
}

/**
 * Native Device Contact Picker (Android Chrome / supported mobile browsers)
 */
export async function pickDeviceContacts(): Promise<Array<{ name: string; phone: string }> | null> {
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        return contacts.map((c: any) => ({
          name: (c.name && c.name[0]) || 'Contact',
          phone: (c.tel && c.tel[0]) || '',
        })).filter((c: any) => c.phone.trim().length > 0);
      }
    } catch (e) {
      console.warn('Device contacts selector was cancelled or unsupported:', e);
    }
  }
  return null;
}
