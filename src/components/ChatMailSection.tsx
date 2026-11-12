import React, { useState, useEffect } from 'react';
import { User, MailMessage, PrivateMessage } from '../types';
import { MessageSquare, Mail, Send, Plus, X, Paperclip, Trash2, Image as ImageIcon, Smile, Search, Check, CheckCheck, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

function SearchableDropdown({ options, value, onChange, placeholder }: { options: {id: string, label: string}[], value: string, onChange: (id: string) => void, placeholder: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = options.filter(o => o.label.includes(searchTerm));
  
  return (
    <div className="relative">
      <input 
        type="text" 
        value={isOpen ? searchTerm : options.find(o => o.id === value)?.label || ''}
        onChange={e => {setSearchTerm(e.target.value); setIsOpen(true);}}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
      />
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
          {filteredOptions.map(o => (
            <button key={o.id} onClick={() => {onChange(o.id); setIsOpen(false); setSearchTerm('');}} className="w-full text-right p-2 text-xs hover:bg-slate-100">{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSearchableDropdown({ options, values, onChange, placeholder }: { options: {id: string, label: string}[], values: string[], onChange: (ids: string[]) => void, placeholder: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = options.filter(o => o.label.includes(searchTerm) && !values.includes(o.id));

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(v => {
          const opt = options.find(o => o.id === v);
          return opt ? (
            <span key={v} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs flex items-center gap-1 font-bold">
              {opt.label}
              <button type="button" onClick={() => onChange(values.filter(id => id !== v))} className="hover:text-rose-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ) : null;
        })}
      </div>
      <input 
        type="text" 
        value={searchTerm}
        onChange={e => {setSearchTerm(e.target.value); setIsOpen(true);}}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
      />
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
          {filteredOptions.length > 0 ? filteredOptions.map(o => (
            <button key={o.id} type="button" onClick={() => {onChange([...values, o.id]); setIsOpen(false); setSearchTerm('');}} className="w-full text-right p-2 text-xs hover:bg-slate-100">{o.label}</button>
          )) : (
            <div className="p-2 text-xs text-slate-500 text-center">لا توجد خيارات مطابقة</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMailSection({ currentUser, users, mails, setMails, privateMessages, setPrivateMessages }: any) {
  const [subTab, setSubTab] = useState<'chat' | 'mail'>('chat');
  
  const safeMails = mails || [];
  const safePrivateMessages = privateMessages || [];

  const unreadPrivateCount = safePrivateMessages.filter((m: PrivateMessage) => m.receiverId === currentUser?.id && !m.isRead).length;
  const unreadMailCount = safeMails.filter((m: MailMessage) => m.receiverId === currentUser?.id && !m.isRead).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[500px] h-[calc(100vh-130px)]">
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setSubTab('chat')}
          className={`flex-1 py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${subTab === 'chat' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <span>الدردشة الخاصة</span>
          {unreadPrivateCount > 0 && (
            <span className="relative flex h-5 min-w-5 px-1.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 min-w-5 px-1.5 bg-rose-500 text-[10px] text-white font-bold items-center justify-center shadow-xs">
                {unreadPrivateCount}
              </span>
            </span>
          )}
        </button>
        <button 
          onClick={() => setSubTab('mail')}
          className={`flex-1 py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${subTab === 'mail' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <span>صندوق البريد الإلكتروني (Inbox)</span>
          {unreadMailCount > 0 && (
            <span className="relative flex h-5 min-w-5 px-1.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 min-w-5 px-1.5 bg-rose-500 text-[10px] text-white font-bold items-center justify-center shadow-xs">
                {unreadMailCount}
              </span>
            </span>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {subTab === 'chat' ? (
          <PrivateChat currentUser={currentUser} users={users} privateMessages={privateMessages} setPrivateMessages={setPrivateMessages} />
        ) : (
          <MailInbox currentUser={currentUser} users={users} mails={mails} setMails={setMails} />
        )}
      </div>
    </div>
  );
}

function PrivateChat({ currentUser, users = [], privateMessages = [], setPrivateMessages }: any) {
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const safeUsers = users || [];
  const safePrivateMessages = privateMessages || [];
  const usersWithChats = safeUsers.filter((u: User) => {
    if (u.id.endsWith('_config')) return false;
    return safePrivateMessages.some((m: PrivateMessage) => 
      (m.senderId === currentUser?.id && m.receiverId === u.id) ||
      (m.senderId === u.id && m.receiverId === currentUser?.id)
    );
  });

  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return usersWithChats.length > 0 ? usersWithChats[0].id : '';
  });
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<{name: string, url: string} | null>(null);

  const selectedUser = safeUsers.find((u: User) => u.id === selectedUserId);

  // Mark messages from selectedUser as read
  useEffect(() => {
    if (!selectedUserId || !currentUser?.id) return;
    const hasUnreadFromThisUser = safePrivateMessages.some(
      (m: PrivateMessage) => m.senderId === selectedUserId && m.receiverId === currentUser.id && !m.isRead
    );
    if (hasUnreadFromThisUser) {
      const updated = safePrivateMessages.map((m: PrivateMessage) => {
        if (m.senderId === selectedUserId && m.receiverId === currentUser.id && !m.isRead) {
          return { ...m, isRead: true, readAt: new Date().toISOString() };
        }
        return m;
      });
      setPrivateMessages(updated);
    }
  }, [selectedUserId, safePrivateMessages, currentUser?.id, setPrivateMessages]);

  const conversationMessages = safePrivateMessages.filter((m: PrivateMessage) => 
    (m.senderId === currentUser?.id && m.receiverId === selectedUserId) ||
    (m.senderId === selectedUserId && m.receiverId === currentUser?.id)
  ).sort((a: PrivateMessage, b: PrivateMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !selectedUserId) return;

    const newMsg: PrivateMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullName,
      receiverId: selectedUserId,
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
      attachmentName: attachment?.name,
      attachmentUrl: attachment?.url
    };

    setPrivateMessages([...privateMessages, newMsg]);
    setMessageText('');
    setAttachment(null);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataURL(file);
    setAttachment({ name: file.name, url });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' || item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const url = await readFileAsDataURL(file);
          setAttachment({ name: file.name || `pasted-image-${Date.now()}.png`, url });
          break;
        }
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className={`w-full md:w-72 border-b md:border-b-0 md:border-l border-slate-200 bg-slate-50 flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المحادثات السابقة</span>
            <SearchableDropdown
              options={safeUsers.filter((u: User) => !u.id.endsWith('_config')).map((u: User) => ({id: u.id, label: u.name || u.fullName || ''}))}
              value=""
              onChange={setSelectedUserId}
              placeholder="+ محادثة جديدة"
            />
          </div>
          <SearchableDropdown
            options={usersWithChats.map((u: User) => ({id: u.id, label: u.name || u.fullName || ''}))}
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder="بحث في المحادثات..."
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {usersWithChats.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">لا توجد محادثات سابقة. ابدأ محادثة جديدة من الأعلى.</div>
          ) : (
            usersWithChats.map((u: User) => {
              const isSelected = u.id === selectedUserId;
              const unreadFromUserCount = safePrivateMessages.filter((m: PrivateMessage) =>
                m.senderId === u.id && m.receiverId === currentUser?.id && !m.isRead
              ).length;
              const lastMsg = safePrivateMessages.filter((m: PrivateMessage) =>
                (m.senderId === currentUser?.id && m.receiverId === u.id) ||
                (m.senderId === u.id && m.receiverId === currentUser?.id)
              ).slice(-1)[0];

              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-right p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                      : unreadFromUserCount > 0 
                        ? 'bg-indigo-50/50 hover:bg-indigo-100/60 font-semibold' 
                        : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center overflow-hidden">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        (u.name || u.fullName || 'م').charAt(0)
                      )}
                    </div>
                    {unreadFromUserCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-xs truncate ${unreadFromUserCount > 0 ? 'font-black text-indigo-950' : 'font-bold text-slate-800'}`}>{u.name || u.fullName}</span>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[11px] truncate flex-1 ${unreadFromUserCount > 0 ? 'text-indigo-900 font-bold' : 'text-slate-500'}`}>
                        {lastMsg ? lastMsg.content : (u.jobTitle || 'موظف')}
                      </p>
                      {unreadFromUserCount > 0 && (
                        <span className="relative flex h-4 min-w-4 px-1 items-center justify-center shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 min-w-4 px-1 bg-rose-500 text-[9px] text-white font-black items-center justify-center shadow-xs">
                            {unreadFromUserCount}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className={`flex-1 flex-col bg-white ${selectedUserId ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserId('')}
                  className="md:hidden p-2 -mr-2 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  title="الرجوع للقائمة"
                >
                  <span className="text-base font-bold">←</span>
                </button>
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    (selectedUser.name || selectedUser.fullName || 'م').charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{selectedUser.name || selectedUser.fullName}</h4>
                  <span className="text-xs text-slate-500">{selectedUser.jobTitle || 'موظف'}</span>
                </div>
              </div>
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if(window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) {
                      setPrivateMessages(privateMessages.filter((m: PrivateMessage) => 
                        !(
                          (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
                          (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
                        )
                      ));
                      setSelectedUserId('');
                    }
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف المحادثة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/35">
              {conversationMessages.map((m: PrivateMessage) => {
                  const isMe = m.senderId === currentUser.id;
                  const msgUser = isMe ? currentUser : selectedUser;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'justify-end flex-row-reverse' : 'justify-start'} group relative`}>
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                        {msgUser.avatarUrl ? (
                          <img src={msgUser.avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          (msgUser.name || msgUser.fullName || 'م').charAt(0)
                        )}
                      </div>
                      <div className={`flex flex-col gap-1 max-w-[80%] sm:max-w-[70%]`}>
                        <div className={`rounded-2xl p-3 shadow-xs flex flex-col gap-2 ${isMe ? 'bg-indigo-600 text-white rounded-bl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-br-none'}`}>
                          {m.attachmentUrl && (
                            m.attachmentName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || m.attachmentName?.startsWith('pasted-image') ? (
                              <img src={m.attachmentUrl} alt="مرفق" referrerPolicy="no-referrer" className="max-w-full sm:max-w-[300px] rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setActiveLightbox(m.attachmentUrl || null)} />
                            ) : (
                              <a href={m.attachmentUrl} download={m.attachmentName || 'مرفق'} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors w-max ${isMe ? 'bg-indigo-500/50 hover:bg-indigo-500' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                <Paperclip className="w-3.5 h-3.5" />
                                {m.attachmentName || 'مرفق'}
                              </a>
                            )
                          )}
                          {m.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                        </div>
                        <div className={`text-[10px] text-slate-400 px-1 flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span>{new Date(m.createdAt).toLocaleDateString('ar-OM')} {new Date(m.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            m.isRead ? (
                              <span className="text-blue-500 flex items-center" title={`تمت القراءة ${m.readAt ? new Date(m.readAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }) : ''}`}>
                                <CheckCheck className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center" title="تم الإرسال">
                                <Check className="w-3 h-3" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            if(window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                              setPrivateMessages(safePrivateMessages.filter((msg: PrivateMessage) => msg.id !== m.id));
                            }
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer ${isMe ? 'mr-1' : 'ml-1'}`}
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
              })}
            </div>
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              {attachment && (
                <div className="mb-2 flex items-center justify-between bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-xs text-indigo-700 font-bold truncate max-w-[200px] flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5" />
                    {attachment.name}
                  </span>
                  <button type="button" onClick={() => setAttachment(null)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <label className="text-slate-500 hover:text-indigo-600 cursor-pointer p-3 transition-colors bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl shrink-0">
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleFileAttach} />
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="اكتب رسالتك هنا... (يمكنك لصق الصور مباشرة)"
                  className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm h-12 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (messageText.trim() || attachment) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() && !attachment}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 mb-0.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-5 h-5 rtl:rotate-180" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-slate-400 text-sm">
            <p>اختر موظفاً من القائمة الجانبية لبدء المحادثة.</p>
          </div>
        )}
      </div>
    
      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 bg-slate-900/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          >
            <button 
              type="button" 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
              onClick={() => setActiveLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightbox} 
              alt="عرض كامل" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
</div>
  );
}

function MailInbox({ currentUser, users = [], mails = [], setMails }: any) {
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const safeMails = mails || [];
  const safeUsers = users || [];
  const [subView, setSubView] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [receiverIds, setReceiverIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{name: string, url: string, type: string}[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Reply states inside thread view
  const [replyContent, setReplyContent] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<{name: string, url: string, type: string}[]>([]);
  const [showReplyEmoji, setShowReplyEmoji] = useState(false);

  // Group messages into Threads (Conversations)
  const threadMap = new Map<string, MailMessage[]>();
  safeMails.forEach((m: MailMessage) => {
    const tId = m.threadId || m.subject?.trim().toLowerCase() || m.id;
    if (!threadMap.has(tId)) {
      threadMap.set(tId, []);
    }
    threadMap.get(tId)!.push(m);
  });

  const threads = Array.from(threadMap.entries()).map(([threadId, messages]) => {
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const lastMsg = messages[messages.length - 1];
    const firstMsg = messages[0];
    const hasUnread = messages.some(m => m.receiverId === currentUser?.id && !m.isRead);
    const isInbox = messages.some(m => m.receiverId === currentUser?.id);
    const isSent = messages.some(m => m.senderId === currentUser?.id);
    const participants = Array.from(new Set(messages.flatMap(m => [m.senderId, m.receiverId]))).map(id => {
      const u = safeUsers.find((user: User) => user.id === id);
      return { id, name: u?.name || u?.fullName || (id === currentUser?.id ? (currentUser.name || currentUser.fullName) : 'مستخدم') };
    });

    return {
      threadId,
      subject: firstMsg.subject || 'بدون موضوع',
      messages,
      lastMessageAt: lastMsg.createdAt,
      hasUnread,
      isInbox,
      isSent,
      participants
    };
  }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  const inboxThreads = threads.filter(t => t.isInbox);
  const sentThreads = threads.filter(t => t.isSent);

  const [searchQuery, setSearchQuery] = useState('');

  const totalUnreadCount = safeMails.filter((m: MailMessage) => m.receiverId === currentUser?.id && !m.isRead).length;

  const filteredInboxThreads = inboxThreads.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchSubject = t.subject.toLowerCase().includes(q);
    const matchParticipants = t.participants.some(p => p.name.toLowerCase().includes(q));
    const matchContent = t.messages.some(m => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q));
    return matchSubject || matchParticipants || matchContent;
  });

  const filteredSentThreads = sentThreads.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchSubject = t.subject.toLowerCase().includes(q);
    const matchParticipants = t.participants.some(p => p.name.toLowerCase().includes(q));
    const matchContent = t.messages.some(m => m.content.toLowerCase().includes(q));
    return matchSubject || matchParticipants || matchContent;
  });

  const selectedThread = selectedThreadId ? threads.find(t => t.threadId === selectedThreadId) : null;

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiverIds.length === 0 || !subject.trim() || (!content.trim() && attachments.length === 0)) return;
    
    const threadId = `thread-${Date.now()}`;
    const newMessages = receiverIds.map(rId => ({
      id: `mail-${Date.now()}-${rId}`,
      threadId,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullName,
      receiverId: rId,
      subject: subject.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: attachments.length > 0 ? attachments : undefined,
    }));
    
    setMails([...newMessages, ...safeMails]);
    setReceiverIds([]);
    setSubject('');
    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setSelectedThreadId(threadId);
    setSubView('sent');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyContent.trim() && replyAttachments.length === 0) || !selectedThread) return;

    const otherParticipants = Array.from(new Set(
      selectedThread.messages.flatMap(m => [m.senderId, m.receiverId])
    )).filter(id => id !== currentUser.id);

    const targetReceivers = otherParticipants.length > 0 ? otherParticipants : [selectedThread.messages[0].senderId];
    const sub = selectedThread.subject.startsWith('Re:') ? selectedThread.subject : `Re: ${selectedThread.subject}`;

    const newReplyMessages = targetReceivers.map(rId => ({
      id: `mail-${Date.now()}-${rId}`,
      threadId: selectedThread.threadId,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullName,
      receiverId: rId,
      subject: sub,
      content: replyContent.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: replyAttachments.length > 0 ? replyAttachments : undefined,
    }));

    setMails([...newReplyMessages, ...safeMails]);
    setReplyContent('');
    setReplyAttachments([]);
    setShowReplyEmoji(false);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>, isReply = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newAttachments = await Promise.all(files.map(async (file: File) => ({
      name: file.name,
      url: await readFileAsDataURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'file'
    })));
    
    if (isReply) {
      setReplyAttachments(prev => [...prev, ...newAttachments]);
    } else {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>, isReply = false) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' || item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const url = await readFileAsDataURL(file);
          const att = { name: file.name || `pasted-image-${Date.now()}.png`, url, type: file.type.startsWith('image/') ? 'image' : 'file' };
          if (isReply) {
            setReplyAttachments(prev => [...prev, att]);
          } else {
            setAttachments(prev => [...prev, att]);
          }
          break;
        }
      }
    }
  };

  const emojis = ['😀', '😂', '🥰', '😎', '🤔', '👍', '🙏', '🔥', '✨', '🎉', '💡', '✅', '❌', '👀', '💼'];

  const insertEmoji = (emoji: string, isReply = false) => {
    if (isReply) {
      setReplyContent(prev => prev + emoji);
      setShowReplyEmoji(false);
    } else {
      setContent(prev => prev + emoji);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-slate-200 bg-slate-50 flex flex-col shrink-0">
        <div className="p-3 sm:p-4">
          <button onClick={() => { setSubView('compose'); setSelectedThreadId(null); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> رسالة جديدة
          </button>
        </div>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto px-3 pb-3 md:pb-0 space-x-2 md:space-x-0 md:space-y-1">
          <button onClick={() => { setSubView('inbox'); setSelectedThreadId(null); }} className={`flex-1 md:flex-none text-right px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${subView === 'inbox' && !selectedThreadId ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> البريد الوارد</span>
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">{totalUnreadCount}</span>
          </button>
          <button onClick={() => { setSubView('sent'); setSelectedThreadId(null); }} className={`flex-1 md:flex-none text-right px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${subView === 'sent' && !selectedThreadId ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <Send className="w-4 h-4" /> البريد المرسل ({sentThreads.length})
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {subView === 'compose' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <form onSubmit={handleSendMail} className="space-y-4 sm:space-y-5 max-w-2xl mx-auto md:mx-0">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">المستلمون</label>
                <MultiSearchableDropdown
                  options={safeUsers.filter((u: User) => !u.id.endsWith('_config')).map((u: User) => ({id: u.id, label: u.name}))}
                  values={receiverIds}
                  onChange={setReceiverIds}
                  placeholder="اختر الموظفين المستلمين..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الموضوع</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="أدخل موضوع الرسالة..." className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">محتوى الرسالة</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} onPaste={(e) => handlePaste(e, false)} placeholder="اكتب محتوى الرسالة هنا... (يمكنك لصق الصور مباشرة)" className="w-full p-3 border border-slate-200 rounded-xl text-sm h-44 sm:h-52 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y" />
              </div>
              
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 max-w-[220px]">
                      {att.type === 'image' ? <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" /> : <Paperclip className="w-4 h-4 text-indigo-500 shrink-0" />}
                      <span className="text-xs text-indigo-700 font-bold truncate flex-1">{att.name}</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-center justify-center sm:justify-start gap-1 relative">
                  <label className="p-2.5 text-slate-500 hover:text-indigo-600 cursor-pointer rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                    <Paperclip className="w-5 h-5" />
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileAttach(e, false)} />
                  </label>
                  <label className="p-2.5 text-slate-500 hover:text-indigo-600 cursor-pointer rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                    <ImageIcon className="w-5 h-5" />
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileAttach(e, false)} />
                  </label>
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-slate-500 hover:text-indigo-600 cursor-pointer rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                    <Smile className="w-5 h-5" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-1 w-48 z-10">
                      {emojis.map(emoji => (
                        <button key={emoji} type="button" onClick={() => insertEmoji(emoji, false)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg cursor-pointer">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={receiverIds.length === 0 || !subject.trim() || (!content.trim() && attachments.length === 0)} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                  <Send className="w-4 h-4 rtl:rotate-180" /> إرسال الرسالة
                </button>
              </div>
            </form>
          </div>
        ) : selectedThread ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">{selectedThread.subject}</h2>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>المشاركون: {selectedThread.participants.map(p => p.name).join(', ')}</span>
                  <span>•</span>
                  <span>{selectedThread.messages.length} رسائل في المحادثة</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => {
                      if(window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) {
                        setMails(safeMails.filter((m: MailMessage) => (m.threadId || m.subject?.trim().toLowerCase() || m.id) !== selectedThread.threadId));
                        setSelectedThreadId(null);
                      }
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف المحادثة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedThreadId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thread Messages List (Conversation View) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
              {selectedThread.messages.map((m: MailMessage) => {
                const isMe = m.senderId === currentUser.id;
                const senderUser = safeUsers.find((u: User) => u.id === m.senderId);
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-slate-700">{m.senderName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleString('ar-OM', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            if(window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                              setMails(safeMails.filter((mail: MailMessage) => mail.id !== m.id));
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer mx-2"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs border ${isMe ? 'bg-indigo-600 text-white border-indigo-600 rounded-tl-none' : 'bg-white text-slate-800 border-slate-200 rounded-tr-none'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100/20 flex flex-wrap gap-2">
                          {m.attachments.map((att: any, i: number) => (
                            att.type === 'image' ? (
                              <img key={i} src={att.url} alt={att.name || "مرفق"} referrerPolicy="no-referrer" className="max-w-full sm:max-w-[300px] rounded-lg object-contain mt-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setActiveLightbox(att.url || null)} />
                            ) : (
                              <a key={i} href={att.url} download={att.name || 'مرفق'} className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors w-max ${isMe ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-slate-100 text-indigo-700 hover:bg-slate-200'}`}>
                                <Paperclip className="w-3.5 h-3.5" />
                                {att.name}
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Reply Box inside Thread */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {replyAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-100 max-w-[200px]">
                      {att.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> : <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      <span className="text-xs text-indigo-700 font-bold truncate flex-1">{att.name}</span>
                      <button type="button" onClick={() => setReplyAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendReply} className="flex gap-2 items-end">
                <div className="flex items-center gap-1 relative shrink-0">
                  <label className="p-3 text-slate-500 hover:text-indigo-600 cursor-pointer rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 transition-colors">
                    <Paperclip className="w-5 h-5" />
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileAttach(e, true)} />
                  </label>
                  <label className="p-3 text-slate-500 hover:text-indigo-600 cursor-pointer rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileAttach(e, true)} />
                  </label>
                  <button type="button" onClick={() => setShowReplyEmoji(!showReplyEmoji)} className="p-3 text-slate-500 hover:text-indigo-600 cursor-pointer rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>

                  {showReplyEmoji && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-1 w-48 z-10">
                      {emojis.map(emoji => (
                        <button key={emoji} type="button" onClick={() => insertEmoji(emoji, true)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg cursor-pointer">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onPaste={(e) => handlePaste(e, true)}
                  placeholder="اكتب ردك هنا..."
                  className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm h-12 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (replyContent.trim() || replyAttachments.length > 0) {
                        handleSendReply(e as any);
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim() && replyAttachments.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white h-12 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 mb-0.5 cursor-pointer shadow-sm font-bold text-xs"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" /> إرسال رد
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={subView === 'inbox' ? "بحث في البريد الوارد (حسب العنوان أو اسم المرسل)..." : "بحث في البريد المرسل (حسب العنوان أو اسم المستلم)..."}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
               {(subView === 'inbox' ? filteredInboxThreads : filteredSentThreads).length === 0 ? (
                 <div className="text-center text-slate-400 py-10 text-sm">لا توجد محادثات بريدية تطابق بحثك</div>
               ) : (
                 (subView === 'inbox' ? filteredInboxThreads : filteredSentThreads).map((thread) => {
                   const lastMsg = thread.messages[thread.messages.length - 1];
                   const isUnread = subView === 'inbox' && thread.hasUnread;
                   
                   let personDisplay = '';
                   if (subView === 'inbox') {
                     const incoming = thread.messages.find(m => m.receiverId === currentUser?.id) || lastMsg;
                     personDisplay = incoming.senderName || 'مرسل';
                   } else {
                     const sentMsgs = thread.messages.filter(m => m.senderId === currentUser?.id);
                     const receiverIds = Array.from(new Set(sentMsgs.map(m => m.receiverId)));
                     const receiverNames = receiverIds.map(rId => {
                       const u = safeUsers.find((user: User) => user.id === rId);
                       return u?.name || u?.fullName || 'مستلم';
                     });
                     personDisplay = receiverNames.length > 0 ? receiverNames.join(', ') : thread.participants.filter(p => p.id !== currentUser?.id).map(p => p.name).join(', ') || 'مستلم';
                   }

                   return (
                     <div key={thread.threadId} className="flex items-center gap-3">
                       <button 
                         onClick={() => {
                           setSelectedThreadId(thread.threadId);
                           if (subView === 'inbox' && thread.hasUnread) {
                             const updatedMails = safeMails.map((mail: MailMessage) => {
                               const tId = mail.threadId || mail.subject?.trim().toLowerCase() || mail.id;
                               if (tId === thread.threadId && mail.receiverId === currentUser?.id && !mail.isRead) {
                                 return { ...mail, isRead: true };
                               }
                               return mail;
                             });
                             setMails(updatedMails);
                           }
                         }}
                         className={`flex-1 text-right p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${isUnread ? 'bg-indigo-50/80 border-indigo-200 shadow-xs' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                       >
                         <div className="flex flex-col min-w-0 flex-1 ml-4">
                           <div className="flex items-center gap-2 mb-1">
                             <span className={`text-sm truncate ${isUnread ? 'font-bold text-indigo-950' : 'font-semibold text-slate-800'}`}>
                               {thread.subject}
                             </span>
                             <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold">
                               {thread.messages.length} رسائل
                             </span>
                           </div>
                           <p className="text-xs text-slate-500 truncate">
                             <span className="font-bold text-slate-700">{subView === 'inbox' ? 'من: ' : 'إلى: '}{personDisplay}:</span> {lastMsg.content}
                           </p>
                         </div>
                         <span className="text-[11px] text-slate-400 shrink-0">
                           {new Date(thread.lastMessageAt).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </button>
                       {currentUser.role === 'admin' && (
                         <button
                           onClick={() => {
                             if(window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) {
                               setMails(safeMails.filter((mail: MailMessage) => (mail.threadId || mail.subject?.trim().toLowerCase() || mail.id) !== thread.threadId));
                             }
                           }}
                           className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors shrink-0 cursor-pointer"
                           title="حذف المحادثة"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       )}
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 bg-slate-900/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          >
            <button 
              type="button" 
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
              onClick={() => setActiveLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightbox} 
              alt="عرض كامل" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
</div>
  );
}
