import React, { useState, useEffect } from 'react';
import {
  Send,
  X,
  MessageSquare,
  Phone,
  ExternalLink,
  Users,
  Check,
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Info,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { Contact, ScheduledWhatsAppMessage } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  getStoredContacts,
  saveStoredContacts,
  getScheduledMessages,
  saveScheduledMessages,
  pickDeviceContacts,
} from '../utils/contacts';
import { openWhatsAppChat } from '../utils/apps';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (phoneNumber: string, message: string) => void;
  initialPhone?: string;
  initialMessage?: string;
  onScheduleCreated?: (scheduledMsg: ScheduledWhatsAppMessage) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onSend,
  initialPhone = '',
  initialMessage = '',
  onScheduleCreated,
}) => {
  // Tabs: compose vs scheduled list
  const [activeTab, setActiveTab] = useState<'compose' | 'scheduled'>('compose');

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Manual phone & message
  const [manualPhone, setManualPhone] = useState(initialPhone);
  const [message, setMessage] = useState(initialMessage);

  // Scheduling
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [scheduledList, setScheduledList] = useState<ScheduledWhatsAppMessage[]>([]);

  // Multi-dispatch queue
  const [dispatchQueue, setDispatchQueue] = useState<Array<{ name: string; phone: string }>>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isQueueActive, setIsQueueActive] = useState(false);

  // Load contacts & scheduled messages
  useEffect(() => {
    if (isOpen) {
      const storedContacts = getStoredContacts();
      setContacts(storedContacts);
      setScheduledList(getScheduledMessages());

      if (initialPhone) {
        setManualPhone(initialPhone);
        // Find if matches existing contact
        const matched = storedContacts.find(
          (c) => c.phone.replace(/\D/g, '') === initialPhone.replace(/\D/g, '')
        );
        if (matched) {
          setSelectedContactIds([matched.id]);
        }
      }
      if (initialMessage) {
        setMessage(initialMessage);
      }
    }
  }, [isOpen, initialPhone, initialMessage]);

  if (!isOpen) return null;

  // Toggle contact selection
  const toggleContact = (id: string) => {
    triggerHaptic('light');
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllContacts = () => {
    triggerHaptic('light');
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map((c) => c.id));
    }
  };

  // Add new custom contact
  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    triggerHaptic('success');
    const newContact: Contact = {
      id: 'c_' + Date.now(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      color: ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF375F'][contacts.length % 5],
    };
    const updated = [newContact, ...contacts];
    setContacts(updated);
    saveStoredContacts(updated);
    setSelectedContactIds((prev) => [...prev, newContact.id]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  // Delete contact
  const handleDeleteContact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveStoredContacts(updated);
    setSelectedContactIds((prev) => prev.filter((item) => item !== id));
  };

  // Import from Device Contacts API
  const handleImportDeviceContacts = async () => {
    triggerHaptic('medium');
    const imported = await pickDeviceContacts();
    if (imported && imported.length > 0) {
      const newItems: Contact[] = imported.map((imp, idx) => ({
        id: 'dev_' + Date.now() + '_' + idx,
        name: imp.name,
        phone: imp.phone,
        color: ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF375F'][
          (contacts.length + idx) % 5
        ],
      }));
      const combined = [...newItems, ...contacts];
      setContacts(combined);
      saveStoredContacts(combined);
      setSelectedContactIds((prev) => [...prev, ...newItems.map((n) => n.id)]);
      triggerHaptic('success');
    }
  };

  // Quick schedule offset
  const setQuickSchedule = (minutes: number) => {
    triggerHaptic('light');
    const target = new Date(Date.now() + minutes * 60 * 1000);
    // Format to local ISO string YYYY-MM-DDTHH:MM
    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledDateTime(localIso);
  };

  // Get active recipients list
  const getActiveRecipients = (): Array<{ name: string; phone: string }> => {
    const list: Array<{ name: string; phone: string }> = [];

    // From selected contacts
    selectedContactIds.forEach((id) => {
      const contact = contacts.find((c) => c.id === id);
      if (contact) {
        list.push({ name: contact.name, phone: contact.phone });
      }
    });

    // From manual phone if entered and not already in list
    if (manualPhone.trim()) {
      const cleanManual = manualPhone.replace(/\D/g, '');
      const alreadyIncluded = list.some((r) => r.phone.replace(/\D/g, '') === cleanManual);
      if (!alreadyIncluded) {
        list.push({ name: 'Custom Number', phone: manualPhone.trim() });
      }
    }

    return list;
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getActiveRecipients();

    if (recipients.length === 0) {
      triggerHaptic('error');
      alert('Please select at least one contact or enter a phone number.');
      return;
    }

    if (!message.trim()) {
      triggerHaptic('error');
      alert('Please enter a message to send.');
      return;
    }

    // If Scheduling
    if (isScheduling) {
      if (!scheduledDateTime) {
        triggerHaptic('error');
        alert('Please choose a valid date and time to schedule this message.');
        return;
      }
      const scheduledAtTime = new Date(scheduledDateTime).toISOString();
      const scheduledItem: ScheduledWhatsAppMessage = {
        id: 'sch_' + Date.now(),
        recipients,
        message: message.trim(),
        scheduledAt: scheduledAtTime,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      const updatedList = [scheduledItem, ...scheduledList];
      setScheduledList(updatedList);
      saveScheduledMessages(updatedList);
      if (onScheduleCreated) {
        onScheduleCreated(scheduledItem);
      }
      triggerHaptic('success');
      setActiveTab('scheduled');
      setIsScheduling(false);
      return;
    }

    // If immediate Send to single recipient
    if (recipients.length === 1) {
      triggerHaptic('success');
      onSend(recipients[0].phone, message.trim());
      onClose();
      return;
    }

    // If immediate Multi-Recipient Send
    triggerHaptic('medium');
    setDispatchQueue(recipients);
    setQueueIndex(0);
    setIsQueueActive(true);
  };

  // Multi-dispatch next step
  const handleDispatchCurrentInQueue = () => {
    const current = dispatchQueue[queueIndex];
    if (!current) return;
    triggerHaptic('success');
    openWhatsAppChat(current.phone, message.trim());

    if (queueIndex + 1 < dispatchQueue.length) {
      setQueueIndex(queueIndex + 1);
    } else {
      // Completed all
      setIsQueueActive(false);
      setDispatchQueue([]);
      onClose();
    }
  };

  // Cancel scheduled item
  const handleCancelScheduled = (id: string) => {
    triggerHaptic('light');
    const updated = scheduledList.filter((item) => item.id !== id);
    setScheduledList(updated);
    saveScheduledMessages(updated);
  };

  // Send scheduled item now
  const handleSendScheduledNow = (item: ScheduledWhatsAppMessage) => {
    triggerHaptic('success');
    if (item.recipients.length > 0) {
      openWhatsAppChat(item.recipients[0].phone, item.message);
      handleCancelScheduled(item.id);
    }
  };

  const recipients = getActiveRecipients();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-[#1C1C1E] border border-white/[0.08] shadow-2xl text-white">
        {/* iOS Grabber */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">WhatsApp Dispatch</h3>
              <p className="text-[11px] text-[#8E8E93]">Contacts, Multi-select & Scheduler</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-[#8E8E93] hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Compose vs Scheduled */}
        <div className="flex px-6 pt-3 pb-1 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'compose'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Compose Message
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'scheduled'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scheduled</span>
            {scheduledList.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center">
                {scheduledList.length}
              </span>
            )}
          </button>
        </div>

        {/* Multi-Dispatch Queue Modal Overlay */}
        {isQueueActive && (
          <div className="p-6 space-y-4 bg-[#18181A] border-y border-white/[0.08] animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Multi-Recipient Dispatch ({queueIndex + 1} of {dispatchQueue.length})
              </span>
              <button
                onClick={() => setIsQueueActive(false)}
                className="text-xs text-[#8E8E93] hover:text-white"
              >
                Cancel Queue
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#2C2C2E] border border-white/[0.08]">
              <p className="text-xs text-[#8E8E93]">Ready to dispatch message to:</p>
              <p className="text-base font-bold text-white mt-0.5">{dispatchQueue[queueIndex]?.name}</p>
              <p className="text-xs font-mono text-emerald-400 mt-0.5">
                {dispatchQueue[queueIndex]?.phone}
              </p>
            </div>
            <button
              onClick={handleDispatchCurrentInQueue}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch WhatsApp for {dispatchQueue[queueIndex]?.name}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Content 1: Compose */}
        {activeTab === 'compose' && !isQueueActive && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
            {/* Meta Send Button Explanation Note */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-white">Direct Chat & Pre-filled Text: </span>
                WhatsApp security policies require a quick user tap on the native Send button. E.V.A. pre-fills the recipient and drafted message automatically.
              </div>
            </div>

            {/* Contacts Selector Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                    Select Contacts (Multi-Select)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  {'contacts' in navigator && (
                    <button
                      type="button"
                      onClick={handleImportDeviceContacts}
                      className="text-[10px] text-[#38BDF8] hover:underline font-semibold"
                    >
                      Import Phonebook
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAllContacts}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold"
                  >
                    {selectedContactIds.length === contacts.length ? 'Clear All' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="p-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white"
                    title="Add Contact"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Add Contact inline box */}
              {showAddContact && (
                <div className="p-3 rounded-xl bg-[#242426] border border-white/10 space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-white">Add New Contact</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. Alex)"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#2C2C2E] text-xs text-white border border-white/10"
                    />
                    <input
                      type="tel"
                      placeholder="Phone with country code"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#2C2C2E] text-xs text-white border border-white/10"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-2.5 py-1 text-[11px] text-[#8E8E93]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewContact}
                      className="px-3 py-1 bg-emerald-500 rounded-lg text-xs font-bold text-white"
                    >
                      Save Contact
                    </button>
                  </div>
                </div>
              )}

              {/* Contacts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {contacts.map((contact) => {
                  const isSelected = selectedContactIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={`relative group flex items-center p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                          : 'bg-[#2C2C2E]/70 border-white/[0.06] text-[#AEAEB2] hover:bg-[#2C2C2E]'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white mr-2 flex-shrink-0"
                        style={{ backgroundColor: contact.color || '#0A84FF' }}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate leading-tight">{contact.name}</p>
                        <p className="text-[9px] text-[#8E8E93] truncate">{contact.phone}</p>
                      </div>

                      {/* Check icon */}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ml-1 flex-shrink-0 transition ${
                          isSelected ? 'bg-emerald-500 text-black' : 'border border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      {/* Delete button on hover */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteContact(contact.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition ml-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manual Phone Input Option */}
            <div>
              <label className="block text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 px-1">
                Or Direct Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#2C2C2E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Selected Recipients Preview Badge */}
            {recipients.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93]">Sending to:</span>
                {recipients.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-[11px] font-semibold text-white bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full"
                  >
                    {r.name} ({r.phone})
                  </span>
                ))}
              </div>
            )}

            {/* Message Content */}
            <div>
              <label className="block text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 px-1">
                Message Content
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                required
                className="w-full p-3.5 bg-[#2C2C2E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Scheduler Toggle & Controls */}
            <div className="p-3.5 rounded-2xl bg-[#242426] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white">Schedule Message</span>
                    <p className="text-[10px] text-[#8E8E93]">
                      Automate dispatch at a designated date & time
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isScheduling}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setIsScheduling(e.target.checked);
                    if (e.target.checked && !scheduledDateTime) {
                      setQuickSchedule(15);
                    }
                  }}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {isScheduling && (
                <div className="space-y-2.5 pt-1 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#2C2C2E] border border-white/10 text-xs text-white accent-emerald-500"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[10px] text-[#8E8E93] font-medium mr-1">Quick:</span>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(5)}
                      className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-semibold text-white transition"
                    >
                      +5m
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(15)}
                      className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-semibold text-white transition"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(60)}
                      className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-semibold text-white transition"
                    >
                      +1h
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(180)}
                      className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-semibold text-white transition"
                    >
                      +3h
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-1 pb-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="px-4 py-2.5 text-xs font-semibold text-[#8E8E93] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
              >
                {isScheduling ? (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Dispatch</span>
                  </>
                ) : (
                  <>
                    <span>
                      {recipients.length > 1
                        ? `Dispatch to ${recipients.length} Recipients`
                        : 'Open WhatsApp'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab Content 2: Scheduled Messages List */}
        {activeTab === 'scheduled' && !isQueueActive && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {scheduledList.length === 0 ? (
              <div className="py-12 text-center text-[#8E8E93] space-y-2">
                <Clock className="w-8 h-8 text-[#8E8E93] mx-auto opacity-40" />
                <p className="text-sm font-semibold text-white">No Scheduled Messages</p>
                <p className="text-xs">
                  Compose a message and check "Schedule Message" to automate dispatches.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className="mt-3 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white transition"
                >
                  Create Schedule
                </button>
              </div>
            ) : (
              scheduledList.map((item) => {
                const targetDate = new Date(item.scheduledAt);
                const isPast = Date.now() >= targetDate.getTime();
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#242426] border border-white/[0.08] space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              isPast ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-white">
                            {targetDate.toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isPast && (
                            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              Due Now
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5">
                          To: {item.recipients.map((r) => r.name).join(', ')}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancelScheduled(item.id)}
                        className="p-1 text-[#8E8E93] hover:text-red-400 transition"
                        title="Cancel Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#1C1C1E] border border-white/[0.04] text-xs text-[#E5E5EA]">
                      "{item.message}"
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleSendScheduledNow(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1.5 transition"
                      >
                        <span>Send Now</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
