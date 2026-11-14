/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

// Firestore-Timestamp compatible shim (keeps the rest of the component unchanged)
interface Timestamp { toDate: () => Date }
const toTs = (iso: string | null | undefined): Timestamp | null => (iso ? { toDate: () => new Date(iso) } : null);
import { User } from '../types';
import { 
  Send, 
  MessageSquare, 
  Clock, 
  ShieldAlert, 
  Smile, 
  Paperclip, 
  X, 
  Image as ImageIcon, 
  Maximize2, 
  Loader2,
  Minimize2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Trash2,
  Reply,
  Download,
  PanelLeft,
  PictureInPicture2,
  Columns2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  imageUrl?: string | null;
  createdAt: Timestamp | null;
  replyToId?: string | null;
  replyToSenderName?: string | null;
  replyToText?: string | null;
}

export type ChatMode = 'docked' | 'floating' | 'hidden' | 'sidebar';

interface ChatBoxProps {
  channelId: string; // 'general' or 'invoice-[invoice-id]'
  currentUser: User | undefined;
  users?: User[];
  title?: string;
  placeholder?: string;
  heightClass?: string;
  currentMode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  onMinimize?: () => void; // minimise to the floating chat button
  defaultCollapsed?: boolean;
  onMessagesLoaded?: (hasMessages: boolean) => void;
}

const POPULAR_EMOJIS = [
  '👍', '👎', '❤️', '🔥', '👏', '🎉', '✨', '✅', '❌', '⚠️', 
  '😊', '😂', '🤣', '😍', '😉', '😎', '😮', '😢', '😡', '😴', 
  '🙏', '🤝', '💡', '💰', '📌', '💬', '📁', '📄', '✉️', '📞'
];

// Helper to compress and resize pasted/uploaded images to fit in Firestore safely
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as compressed JPEG to minimize document size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// ---------- Floating window geometry (position + size, persisted) ----------
type Rect = { x: number; y: number; w: number; h: number };
const FLOAT_KEY = 'riyadah_chat_float';
const SIDEBAR_KEY = 'riyadah_chat_sidebar_w';
const MIN_W = 300;
const MIN_H = 320;
const defaultFloatRect = (): Rect => {
  const w = Math.min(380, window.innerWidth - 32);
  const h = Math.min(520, window.innerHeight - 48);
  return { x: 24, y: Math.max(16, window.innerHeight - h - 24), w, h };
};
const clampRect = (r: Rect): Rect => {
  const w = Math.max(Math.min(MIN_W, window.innerWidth), Math.min(r.w, window.innerWidth - 8));
  const h = Math.max(Math.min(MIN_H, window.innerHeight), Math.min(r.h, window.innerHeight - 8));
  return { w, h, x: Math.max(0, Math.min(r.x, window.innerWidth - w)), y: Math.max(0, Math.min(r.y, window.innerHeight - h)) };
};
const loadFloatRect = (): Rect => {
  try {
    const raw = localStorage.getItem(FLOAT_KEY);
    if (raw) {
      const r = JSON.parse(raw);
      if ([r.x, r.y, r.w, r.h].every((n: any) => typeof n === 'number' && isFinite(n))) return clampRect(r);
    }
  } catch { /* ignore */ }
  return defaultFloatRect();
};
const loadSidebarWidth = () => Math.max(300, Math.min(Number(localStorage.getItem(SIDEBAR_KEY)) || 380, 720));

type Corner = 'tl' | 'tr' | 'bl' | 'br';
const CORNER_STYLE: Record<Corner, { pos: string; cursor: string; border: string }> = {
  tl: { pos: 'top-0 left-0', cursor: 'cursor-nwse-resize', border: 'border-t-2 border-l-2 rounded-tl-lg' },
  tr: { pos: 'top-0 right-0', cursor: 'cursor-nesw-resize', border: 'border-t-2 border-r-2 rounded-tr-lg' },
  bl: { pos: 'bottom-0 left-0', cursor: 'cursor-nesw-resize', border: 'border-b-2 border-l-2 rounded-bl-lg' },
  br: { pos: 'bottom-0 right-0', cursor: 'cursor-nwse-resize', border: 'border-b-2 border-r-2 rounded-br-lg' },
};

export default function ChatBox({ 
  channelId, 
  currentUser, 
  users,
  title = "محادثة الموظفين", 
  placeholder = "اكتب رسالة هنا...",
  heightClass = "h-[350px]",
  currentMode = 'docked',
  onModeChange,
  onMinimize,
  defaultCollapsed = true,
  onMessagesLoaded
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsedState, setIsCollapsed] = useState(defaultCollapsed);
  // Floating / sidebar windows are never collapsed (minimise = floating button)
  const isCollapsed = isCollapsedState && currentMode !== 'floating' && currentMode !== 'sidebar';

  useEffect(() => {
    setIsCollapsed(defaultCollapsed);
  }, [channelId, defaultCollapsed]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
  // Image attachments
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);

  // Emojis
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  // Floating window geometry + sidebar width
  const [floatRect, setFloatRect] = useState<Rect>(loadFloatRect);
  const [sidebarW, setSidebarW] = useState<number>(loadSidebarWidth);
  const rectRef = useRef(floatRect);
  rectRef.current = floatRect;
  const sidebarWRef = useRef(sidebarW);
  sidebarWRef.current = sidebarW;

  useEffect(() => {
    const onResize = () => setFloatRect(r => clampRect(r));
    const onReset = () => { setFloatRect(defaultFloatRect()); setSidebarW(380); };
    window.addEventListener('resize', onResize);
    window.addEventListener('riyadah-reset-layout', onReset);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('riyadah-reset-layout', onReset);
    };
  }, []);

  /** Generic pointer-drag helper: calls onMove(dx, dy) until release, then onEnd(). */
  const trackPointer = (e: React.PointerEvent, onMove: (dx: number, dy: number) => void, onEnd: () => void) => {
    const sx = e.clientX, sy = e.clientY;
    const prevSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    const move = (ev: PointerEvent) => onMove(ev.clientX - sx, ev.clientY - sy);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.style.userSelect = prevSelect;
      onEnd();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const saveFloatRect = () => { try { localStorage.setItem(FLOAT_KEY, JSON.stringify(rectRef.current)); } catch { /* ignore */ } };

  const startMove = (e: React.PointerEvent) => {
    if (currentMode !== 'floating' || (e.target as HTMLElement).closest('button')) return;
    const start = rectRef.current;
    trackPointer(e, (dx, dy) => setFloatRect(clampRect({ ...start, x: start.x + dx, y: start.y + dy })), saveFloatRect);
  };

  const startCornerResize = (corner: Corner) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const st = rectRef.current;
    trackPointer(e, (dx, dy) => {
      let { x, y, w, h } = st;
      if (corner === 'tr' || corner === 'br') w = st.w + dx; else { w = st.w - dx; x = st.x + dx; }
      if (corner === 'bl' || corner === 'br') h = st.h + dy; else { h = st.h - dy; y = st.y + dy; }
      if (w < MIN_W) { if (corner === 'tl' || corner === 'bl') x = st.x + st.w - MIN_W; w = MIN_W; }
      if (h < MIN_H) { if (corner === 'tl' || corner === 'tr') y = st.y + st.h - MIN_H; h = MIN_H; }
      setFloatRect(clampRect({ x, y, w, h }));
    }, saveFloatRect);
  };

  const startSidebarResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startW = sidebarWRef.current;
    trackPointer(e, (dx) => setSidebarW(Math.max(300, Math.min(720, Math.min(window.innerWidth, startW + dx)))), () => {
      try { localStorage.setItem(SIDEBAR_KEY, String(sidebarWRef.current)); } catch { /* ignore */ }
    });
  };

  // Export active chat thread messages to structured Excel file
  const handleExportChatToExcel = () => {
    if (messages.length === 0) {
      toast.error("لا توجد رسائل لتصديرها في هذه المحادثة!");
      return;
    }
    
    try {
      const escapeXml = (unsafe: any): string => {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      const timestampStr = new Date().toLocaleString('ar-OM', { hour12: true });

      let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</Author>
    <LastAuthor>المنصة الرقمية الموحدة لإدارة العمليات والموارد - مركز سند الريادة للخدمات</LastAuthor>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F766E"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F766E"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="SubTitle">
      <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="CellBold">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E293B"/>
    </Style>
    <Style ss:ID="CellReply">
      <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#475569"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="محادثات الشات">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="130"/>
      <Column ss:Width="130"/>
      <Column ss:Width="300"/>
      <Column ss:Width="130"/>
      <Column ss:Width="180"/>
      
      <Row ss:Height="25">
        <Cell ss:MergeAcross="4" ss:StyleID="Title"><Data ss:Type="String">سجل محادثات: ${title}</Data></Cell>
      </Row>
      <Row ss:Height="18">
        <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">تم تصدير السجل في: ${timestampStr} | إجمالي الرسائل: ${messages.length}</Data></Cell>
      </Row>
      <Row ss:Height="22">
        <Cell ss:StyleID="Header"><Data ss:Type="String">التاريخ والوقت</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">المرسل</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">الرسالة</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">رد على (المرسل)</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">نص الرد</Data></Cell>
      </Row>
      ${messages.map(msg => {
        const dateStr = msg.createdAt ? msg.createdAt.toDate().toLocaleString('ar-OM', { hour12: true }) : 'الآن';
        const roleName = msg.senderRole === 'admin' ? 'مدير النظام' : 'موظف';
        const senderLabel = `${msg.senderName} (${roleName})`;
        return `
      <Row ss:Height="24">
        <Cell><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
        <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(senderLabel)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(msg.text || (msg.imageUrl ? '📷 صورة مرفقة' : ''))}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(msg.replyToSenderName || '-')}</Data></Cell>
        <Cell ss:StyleID="CellReply"><Data ss:Type="String">${escapeXml(msg.replyToText || '-')}</Data></Cell>
      </Row>
        `;
      }).join('')}
    </Table>
  </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const sanitizedTitle = title.replace(/\s+/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `سجل_محادثات_${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error("Export chat error:", err);
      toast.error("فشل تصدير المحادثة: " + err.message);
    }
  };

  // Auto-scroll to bottom on new messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior
        });
      }
    }, 100);
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom('auto'); 
      
      if (scrollContainerRef.current) {
        // MutationObserver to watch for new messages being rendered
        const mutationObserver = new MutationObserver(() => {
          scrollToBottom('auto');
        });
        mutationObserver.observe(scrollContainerRef.current, { childList: true, subtree: true });
        
        // ResizeObserver to watch for layout shifts
        const resizeObserver = new ResizeObserver(() => {
          scrollToBottom('auto');
        });
        resizeObserver.observe(scrollContainerRef.current);

        return () => {
          mutationObserver.disconnect();
          resizeObserver.disconnect();
        };
      }
    }
  }, [messages, isCollapsed]);

  // Handle outside click to close emoji picker
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let cancelled = false;
    const rowToMsg = (r: any): ChatMessage => {
      const d = r.data || {};
      return {
        id: r.id,
        channelId: d.channelId,
        senderId: d.senderId,
        senderName: d.senderName,
        senderRole: d.senderRole,
        text: d.text || '',
        imageUrl: d.imageUrl || null,
        attachmentUrl: d.attachmentUrl || null,
        attachmentName: d.attachmentName || null,
        createdAt: toTs(r.sort_ts),
        replyToId: d.replyToId || null,
        replyToSenderName: d.replyToSenderName || null,
        replyToText: d.replyToText || null,
      } as any;
    };
    const load = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('data->>channelId', channelId)
        .order('sort_ts', { ascending: true })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        console.error('Chat load error:', error);
        setError('فشل في تحميل المحادثة.');
        setLoading(false);
        return;
      }
      const msgs = (data || []).map(rowToMsg);
      setMessages(msgs);
      setLoading(false);
      if (onMessagesLoaded) onMessagesLoaded(msgs.length > 0);
    };
    load();
    // Realtime: refetch this channel whenever a message is inserted/deleted
    const channel = supabase
      .channel(`chat-${channelId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => load())
      .subscribe();
    const unsubscribe = () => { cancelled = true; supabase.removeChannel(channel); };

    return () => unsubscribe();
  }, [channelId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage && !attachedFile) || !currentUser) return;

    const textToSend = inputText.trim();
    const imageToSend = attachedImage;
    const currentReply = replyingTo;
    const fileToSend = attachedFile;

    setInputText('');
    setAttachedImage(null);
    setAttachedFile(null);
    setShowEmojiPicker(false);
    setReplyingTo(null);

    const sendData = async (fileUrlData?: string, fileName?: string) => {
      try {
        const nowIso = new Date().toISOString();
        const { error: insErr } = await supabase.from('chat_messages').insert({
          id: (crypto as any).randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          sender_id: currentUser.id,
          sort_ts: nowIso,
          data: {
            channelId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRole: currentUser.role,
            text: textToSend,
            imageUrl: imageToSend || null,
            attachmentUrl: fileUrlData || null,
            attachmentName: fileName || null,
            replyToId: currentReply ? currentReply.id : null,
            replyToSenderName: currentReply ? currentReply.senderName : null,
            replyToText: currentReply ? (currentReply.text || (currentReply.imageUrl ? '📷 صورة مرفقة' : '')) : null,
          },
        });
        if (insErr) throw insErr;
      } catch (err: any) {
        console.error("Error sending chat message:", err);
        if (err?.message?.includes("Quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
          setError("عفواً، تم تجاوز الحد المجاني لقاعدة البيانات للشات. يرجى المحاولة غداً.");
        } else {
          setError("فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.");
        }
      }
    };

    if (fileToSend) {
      setProcessingImage(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        sendData(ev.target?.result as string, fileToSend.name).finally(() => {
          setProcessingImage(false);
        });
      };
      reader.readAsDataURL(fileToSend);
    } else {
      sendData();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const confirmDelete = confirm("هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟");
    if (!confirmDelete) return;
    try {
      const { error: delErr } = await supabase.from('chat_messages').delete().eq('id', messageId);
      if (delErr) throw delErr;
    } catch (err) {
      console.error("Error deleting chat message:", err);
      setError("فشل في حذف الرسالة. يرجى المحاولة مرة أخرى.");
    }
  };

  // Paste Event Handler
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          if (file.type.indexOf('image') !== -1) {
            try {
              setProcessingImage(true);
              const compressed = await compressAndResizeImage(file);
              setAttachedImage(compressed);
            } catch (err) {
              console.error("Failed to process pasted image:", err);
              setError("عذراً، فشل معالجة الصورة الملصقة.");
            } finally {
              setProcessingImage(false);
            }
          } else {
            if (file.size > 700 * 1024) {
              setError("عفواً، حجم الملف يجب أن لا يتجاوز 700 كيلوبايت.");
            } else {
              setAttachedFile(file);
            }
          }
          break;
        }
      }
    }
  };

  // Local File selector handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.indexOf('image') !== -1) {
        try {
          setProcessingImage(true);
          const compressed = await compressAndResizeImage(file);
          setAttachedImage(compressed);
        } catch (err) {
          console.error("Failed to process uploaded image:", err);
          setError("فشل في تحميل ومعالجة الصورة.");
        } finally {
          setProcessingImage(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } else {
        if (file.size > 700 * 1024) {
          setError("عفواً، حجم الملف يجب أن لا يتجاوز 700 كيلوبايت.");
        } else {
          setAttachedFile(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!currentUser) return;
    setInputText(prev => prev + emoji);
    textInputRef.current?.focus();
  };

  // Generate color based on sender name
  const getAvatarBgColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 
      'bg-purple-500', 'bg-emerald-500', 'bg-sky-500', 
      'bg-cyan-500', 'bg-violet-500'
    ];
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    return name.trim().charAt(0) || '?';
  };

  const formatMessageTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'الآن';
    const date = timestamp.toDate();
    return date.toLocaleString('ar-OM', { dateStyle: 'short', timeStyle: 'short' });
  };

  const isOverlay = currentMode === 'floating' || currentMode === 'sidebar';
  const chatMarkup = (
    <div className={`border overflow-hidden flex flex-col w-full text-right transition-colors duration-200 ${
      isOverlay
        ? 'h-full bg-linear-to-br from-white/35 via-teal-50/20 to-sky-100/30 backdrop-blur-md backdrop-saturate-150 border-white/60 shadow-2xl ring-1 ring-slate-900/10'
        : 'bg-white shadow-xl border-slate-100'
    } ${currentMode === 'sidebar' ? 'rounded-none rounded-e-2xl' : 'rounded-2xl'} ${
      currentMode === 'floating' ? 'ring-4 ring-teal-500/10' : ''
    }`} dir="rtl">
      
      {/* Header (with drag capability if floating) */}
      <div 
        onPointerDown={startMove}
        style={{ touchAction: currentMode === 'floating' ? 'none' : undefined }}
        className={`px-4 py-3 border-b border-slate-100/80 flex items-center justify-between select-none shrink-0 ${
          isOverlay ? 'bg-white/15' : 'bg-slate-50/80'
        } ${currentMode === 'floating' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {currentMode === 'floating' && (
            <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <MessageSquare className="w-4 h-4 text-teal-600 shrink-0" />
          <h4 className="text-xs font-bold text-slate-800 truncate">{title}</h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live indicator */}
          {!isCollapsed && (
            <div className="flex items-center gap-1 ml-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-slate-400 font-bold hidden sm:inline">مباشر</span>
            </div>
          )}

          {/* Download Chat Archive */}
          {!isCollapsed && messages.length > 0 && currentUser && ['admin', 'hr'].includes(currentUser.role) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExportChatToExcel();
              }}
              className="p-1 hover:bg-teal-50 text-teal-600 hover:text-teal-700 rounded-md transition-all cursor-pointer flex items-center justify-center"
              title="تنزيل سجل المحادثة إكسل"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Minimize → collapses the chat into the floating chat button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMinimize) onMinimize(); else setIsCollapsed(!isCollapsed);
            }}
            className="p-1 hover:bg-slate-200/60 text-slate-500 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
            title={onMinimize ? "تصغير إلى زر عائم" : (isCollapsed ? "توسيع المحادثة" : "تصغير المحادثة")}
          >
            {onMinimize || !isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Display mode switcher: docked / floating / left sidebar */}
          {onModeChange && (
            <div className="flex items-center gap-0.5 bg-slate-200/50 rounded-lg p-0.5">
              {([
                { mode: 'docked' as ChatMode, Icon: Columns2, title: 'تثبيت بجانب الصفحة' },
                { mode: 'floating' as ChatMode, Icon: PictureInPicture2, title: 'نافذة عائمة قابلة للسحب' },
                { mode: 'sidebar' as ChatMode, Icon: PanelLeft, title: 'شريط جانبي على يسار الشاشة' },
              ]).map(({ mode, Icon, title: t }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onModeChange(mode); }}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    currentMode === mode ? 'bg-white text-teal-600 shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                  title={t}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* Hide / Close Trigger */}
          {onModeChange && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onModeChange('hidden');
              }}
              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
              title="إخفاء الشات"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Collapsible Chat Body */}
      <AnimatePresence initial={false}>
        {(!isCollapsed || isOverlay) && (
          <motion.div
            initial={isOverlay ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={isOverlay ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={isOverlay ? { opacity: 0 } : { height: 0, opacity: 0 }}
            className={`flex flex-col overflow-hidden ${isOverlay ? 'flex-1 min-h-0' : ''}`}
          >
            {/* Messages area */}
            <div ref={scrollContainerRef} className={`p-4 overflow-y-auto space-y-3.5 ${isOverlay ? 'bg-transparent flex-1 min-h-0' : `bg-slate-50/30 ${heightClass}`}`}>
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-slate-400 text-xs animate-pulse font-medium">جاري تحميل الرسائل...</div>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ShieldAlert className="w-8 h-8 text-rose-500 mb-2" />
                  <p className="text-xs font-semibold text-rose-600">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold">لا توجد رسائل بعد</p>
                  <p className="text-[10px] mt-0.5">كن أول من يرسل رسالة في هذه المحادثة!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isMe = currentUser && msg.senderId === currentUser.id;
                      const msgUser = users?.find(u => u.id === msg.senderId);
                      const avatarColor = getAvatarBgColor(msg.senderName);
                      
                      return (
                        <motion.div 
                          key={msg.id}
                          id={`chatmsg-${msg.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex items-start gap-2.5 max-w-[85%] transition-all duration-350 p-1.5 rounded-xl ${isMe ? 'mr-auto flex-row-reverse text-left' : 'ml-auto text-right'}`}
                        >
                          {/* Avatar */}
                          <div className={`w-7 h-7 rounded-full ${msgUser?.avatarUrl ? 'bg-transparent' : avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs overflow-hidden border border-slate-200/60`}>
                            {msgUser?.avatarUrl ? (
                              <img src={msgUser.avatarUrl} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(msg.senderName)
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Name & Role */}
                            <div className={`flex items-center gap-1.5 text-[9px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className="font-bold text-slate-700">{msg.senderName}</span>
                              <span className={`px-1 py-0.2 rounded-sm text-[8px] font-semibold ${
                                msg.senderRole === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {msg.senderRole === 'admin' ? 'مدير' : 'موظف'}
                              </span>
                              {currentUser && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(msg);
                                    textInputRef.current?.focus();
                                  }}
                                  className="text-slate-400 hover:text-teal-600 transition-colors p-0.5 rounded cursor-pointer"
                                  title="رد على الرسالة"
                                >
                                  <Reply className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {currentUser?.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded cursor-pointer"
                                  title="حذف الرسالة"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                            {/* Text / Image Bubble */}
                            <div className={`p-3 rounded-2xl text-[11px] leading-relaxed break-words shadow-2xs flex flex-col gap-2 ${
                              isMe 
                                ? 'bg-teal-600 text-white rounded-tl-none font-medium' 
                                : (isOverlay ? 'bg-white/80 border border-white/70 text-slate-800 rounded-tr-none shadow-xs' : 'bg-white border border-slate-100 text-slate-800 rounded-tr-none')
                            }`}>
                              
                              {/* Replied content preview inside bubble */}
                              {msg.replyToId && (
                                <div 
                                  onClick={() => {
                                    const targetEl = document.getElementById(`chatmsg-${msg.replyToId}`);
                                    if (targetEl) {
                                      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      targetEl.classList.add('bg-teal-50', 'ring-2', 'ring-teal-500/20');
                                      setTimeout(() => {
                                        targetEl.classList.remove('bg-teal-50', 'ring-2', 'ring-teal-500/20');
                                      }, 1500);
                                    }
                                  }}
                                  className={`p-2 mb-1 rounded-lg text-[9px] border-r-3 text-right cursor-pointer select-none transition-all duration-200 ${
                                    isMe 
                                      ? 'bg-teal-700/55 border-teal-300 text-teal-100 hover:bg-teal-700/70' 
                                      : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="font-bold mb-0.5">الرد على: {msg.replyToSenderName}</div>
                                  <div className="truncate opacity-90">{msg.replyToText}</div>
                                </div>
                              )}

                              {msg.imageUrl && (
                                <div className="relative group max-w-full overflow-hidden rounded-lg border border-black/5 bg-slate-100 cursor-zoom-in">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="ملف مرفق" 
                                    className="max-h-[160px] object-cover mx-auto hover:opacity-95 transition-opacity"
                                    referrerPolicy="no-referrer"
                                    onClick={() => setActiveLightbox(msg.imageUrl || null)}
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              
                              {msg.attachmentUrl && (
                                <a 
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msg.attachmentName || 'ملف مرفق'}
                                  className={`mt-1 p-2 rounded-xl flex items-center gap-2 text-xs border transition-colors ${isMe ? 'bg-indigo-700/30 border-indigo-500/50 hover:bg-indigo-700/50 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-indigo-700'}`}
                                >
                                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate max-w-[200px]">{msg.attachmentName || 'ملف مرفق'}</span>
                                </a>
                              )}
                              {msg.text && (
                                <span className="whitespace-pre-wrap">{msg.text}</span>
                              )}
                            </div>

                            {/* Time */}
                            <div className={`text-[8px] text-slate-400 flex items-center gap-1 font-mono ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <Clock className="w-2.5 h-2.5 text-slate-300" />
                              <span>{formatMessageTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                </div>
              )}
            </div>

            {/* Upload/Processing Indicator */}
            {processingImage && (
              <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>جاري معالجة الصورة وضغطها...</span>
              </div>
            )}

            {/* Image Preview attachment bar */}
            <AnimatePresence>
              {attachedImage && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                      <img src={attachedImage} alt="مرفق" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">تم إرفاق صورة</p>
                      <p className="text-[9px] text-slate-400">جاهزة للإرسال أو اضغط إلغاء</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                    title="إزالة المرفق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input container */}
            <form onSubmit={handleSendMessage} className={`p-3 border-t border-slate-100/80 flex flex-col gap-2 relative shrink-0 ${isOverlay ? 'bg-white/20' : 'bg-white'}`}>
              
              {/* Replying to message preview bar */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-between gap-3 p-2 bg-teal-50 border-r-3 border-teal-600 rounded-lg text-right select-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[10px] text-teal-800">الرد على {replyingTo.senderName}</div>
                      <div className="text-[9px] text-teal-600 truncate">{replyingTo.text || (replyingTo.imageUrl ? '📷 صورة مرفقة' : '')}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-teal-100/80 text-teal-600 hover:text-teal-800 rounded-full transition-colors cursor-pointer shrink-0"
                      title="إلغاء الرد"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Selector Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    ref={emojiPickerRef}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-16 right-3 left-3 bg-white border border-slate-100 rounded-2xl shadow-xl p-3 z-[100] select-none"
                  >
                    <div className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1.5">أيقونات تعبيرية سريعة</div>
                    <div className="grid grid-cols-10 gap-1.5 justify-items-center">
                      {POPULAR_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-lg hover:bg-slate-50 active:bg-slate-100 w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {/* File input trigger */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  
                  className="hidden" 
                />
                <button
                  type="button"
                  disabled={!currentUser}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-300 text-slate-500 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  title="إرفاق صورة"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Emoji Trigger */}
                <button
                  type="button"
                  disabled={!currentUser}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                    showEmojiPicker 
                      ? 'bg-teal-50 text-teal-600' 
                      : 'bg-slate-50 hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-300 text-slate-500'
                  }`}
                  title="إضافة إيموجي"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Text input */}
                <textarea
                  ref={textInputRef}
                  value={inputText}
                  onPaste={handlePaste}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  rows={1}
                  placeholder={currentUser ? (placeholder + " (Shift+Enter لسطر جديد)") : "يجب تسجيل الدخول للكتابة"}
                  disabled={!currentUser}
                  className={`flex-1 p-2 ${isOverlay ? 'bg-white/75' : 'bg-slate-50'} border border-slate-200 rounded-xl text-[11px] focus:outline-hidden focus:ring-2 focus:ring-teal-500/15 focus:border-teal-500 focus:bg-white transition-all resize-none min-h-[38px] max-h-[120px] pt-2`}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedImage && !attachedFile) || !currentUser}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
                  title="إرسال"
                >
                  <Send className="w-4 h-4 scale-x-[-1]" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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

  if (currentMode === 'floating') {
    return createPortal(
      <div
        className="fixed z-[9999] rounded-2xl"
        style={{ left: floatRect.x, top: floatRect.y, width: floatRect.w, height: floatRect.h }}
      >
        {chatMarkup}
        {/* Corner resize handles (all four corners) */}
        {(Object.keys(CORNER_STYLE) as Corner[]).map(c => (
          <div
            key={c}
            onPointerDown={startCornerResize(c)}
            style={{ touchAction: 'none' }}
            className={`absolute ${CORNER_STYLE[c].pos} ${CORNER_STYLE[c].cursor} w-6 h-6 z-30 group flex items-center justify-center`}
            title="اسحب لتغيير حجم النافذة"
          >
            <span className={`w-3 h-3 ${CORNER_STYLE[c].border} border-slate-400/70 group-hover:border-teal-500 group-hover:scale-125 transition-all`} />
          </div>
        ))}
      </div>,
      document.body
    );
  }

  if (currentMode === 'sidebar') {
    return createPortal(
      <div
        className="fixed top-0 bottom-0 left-0 z-[9999]"
        style={{ width: Math.min(sidebarW, window.innerWidth) }}
      >
        {chatMarkup}
        {/* Width resize handle on the inner (right) edge */}
        <div
          onPointerDown={startSidebarResize}
          style={{ touchAction: 'none' }}
          className="absolute top-0 bottom-0 -right-2 w-4 cursor-col-resize z-30 group flex items-center justify-center"
          title="اسحب لتغيير عرض الشريط"
        >
          <div className="w-1 h-16 rounded-full bg-slate-400/60 group-hover:bg-teal-500 transition-colors" />
        </div>
      </div>,
      document.body
    );
  }

  return chatMarkup;
}
