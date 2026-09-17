import { Contact, ScheduledWhatsAppMessage } from '../types';

const CONTACTS_STORAGE_KEY = 'anshul_contacts_v1';
const SCHEDULED_STORAGE_KEY = 'anshul_scheduled_whatsapp_v1';

export const DEFAULT_CONTACTS: Contact[] = [];

export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out old pre-defined mock contacts
    const mockIds = new Set(['c1', 'c2', 'c3', 'c4', 'c5']);
    return parsed.filter((c) => !mockIds.has(c.id));
  } catch {
    return [];
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
