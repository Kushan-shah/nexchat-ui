import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { LogOut, Send, Check, CheckCheck, Bot, Globe, MessageSquare, Users, Copy, Zap, Wifi, WifiOff, Clock, Search, Smile, ArrowLeft, Paperclip, FileText, BookOpen, Database, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL || '';

// Premium RAG Answer Card — renders Gemini answer + citation pills
function RagCard({ answer, citations, query, onClose }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rag-card animate-enter">
      <div className="rag-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="rag-card-icon"><Bot size={16} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-hover)' }}>NexBot · RAG Engine</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '1px' }}>Query: {query}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', borderRadius: '6px', lineHeight: 1 }}>✕</button>
      </div>
      <div className="rag-card-answer">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
      </div>
      {citations.length > 0 && (
        <div className="rag-card-citations">
          <button className="rag-citations-toggle" onClick={() => setExpanded(!expanded)}>
            <FileText size={12} />
            {citations.length} source{citations.length > 1 ? 's' : ''} cited
            <span style={{ marginLeft: '4px' }}>{expanded ? '▲' : '▼'}</span>
          </button>
          {expanded && (
            <div className="rag-citations-list">
              {citations.map((c, i) => (
                <div key={i} className="rag-citation-item">
                  <div className="rag-citation-pill">
                    <BookOpen size={10} />
                    <span>{c.source}</span>
                    <span className="rag-citation-page">p.{c.page_num}</span>
                  </div>
                  <div className="rag-citation-snippet">&ldquo;{c.snippet}&rdquo;</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #6b4cff, #a855f7)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #22d3ee)',
];

const EMOJI_LIST = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '💯', '🚀'];

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { user, logout, token } = useContext(AuthContext);
  const { socket, onlineUsers, typingUsers, emitTyping } = useContext(SocketContext);

  const [tab, setTab] = useState('global');
  const tabRef = useRef(tab);
  useEffect(() => { tabRef.current = tab; }, [tab]);

  const [dmTargetId, setDmTargetId] = useState('');
  const [activeDM, setActiveDM] = useState(null);
  const activeDMRef = useRef(activeDM);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);

  const [inputMsg, setInputMsg] = useState('');
  const [globalMessages, setGlobalMessages] = useState([]);
  const [dmMessages, setDmMessages] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [dmNotification, setDmNotification] = useState(null);
  const [connected, setConnected] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactions, setReactions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [unreadDM, setUnreadDM] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [aiEnabledLocal, setAiEnabledLocal] = useState(true);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [ragCards, setRagCards] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const chatEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported for the Knowledge Base.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API_URL}/api/rag/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSystemMessages(prev => [...prev.slice(-20), { id: Date.now(), text: `📄 Attached to Knowledge Base: ${file.name}`, time: new Date().toISOString() }]);
        fetchDocuments(); // Refresh the list
      } else {
        alert(data.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error. Is the Python RAG Microservice running?');
    } finally {
      setIsUploading(false);
      e.target.value = null; // reset input
    }
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rag/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchDocuments();
  }, [token, fetchDocuments]);

  const deleteDocument = async (filename) => {
    try {
      const res = await fetch(`${API_URL}/api/rag/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.filename !== filename));
        setSystemMessages(prev => [...prev.slice(-20), { id: Date.now(), text: `🗑️ Removed from Knowledge Base: ${filename}`, time: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages, dmMessages, aiSuggestions]);

  const fetchRecentChats = useCallback(() => {
    fetch(`${API_URL}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      if (r.status === 401) logout();
      return r.json();
    }).then(data => {
      if (data.success) {
        setRecentChats(data.data || []);
      }
    }).catch(() => {});
  }, [token, logout]);

  useEffect(() => {
    if (token) fetchRecentChats();
  }, [token, fetchRecentChats]);

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startDM = useCallback((targetUser) => {
    if (!socket) return;
    setActiveDM(targetUser);
    setTab('dm');
    setAiSuggestions([]);
    setUnreadDM(0);
    setShowSidebarOnMobile(false);
    socket.emit('join_dm', { targetUserId: targetUser.id });

    // Mark messages as read and visually clear the badge
    fetch(`${API_URL}/api/chat/read/${targetUser.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchRecentChats()).catch(() => {});

    fetch(`${API_URL}/api/chat/history/${targetUser.id}?limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      if (r.status === 401) logout();
      return r.json();
    }).then(data => {
      if (data.success) {
        setDmMessages(data.data.messages.reverse());
      }
    }).catch(() => {});
  }, [socket, token, logout, fetchRecentChats]);

  const connectById = (e) => {
    e.preventDefault();
    if (!dmTargetId.trim()) return;
    const found = onlineUsers.find(u => u.id === dmTargetId.trim());
    startDM(found || { id: dmTargetId.trim(), username: 'User' });
    setDmTargetId('');
  };

  const addReaction = (msgId, emoji) => {
    setReactions(prev => {
      const msgReactions = { ...(prev[msgId] || {}) };
      msgReactions[emoji] = (msgReactions[emoji] || 0) + 1;
      return { ...prev, [msgId]: msgReactions };
    });
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const handleMessage = (payload) => {
      if (payload.isGlobal) {
        setGlobalMessages(prev => [...prev, {
          id: payload.messageId, content: payload.content,
          senderId: payload.senderId, senderName: payload.senderName,
          createdAt: payload.timestamp, status: 'DELIVERED',
        }]);
      } else {
        const currentActive = activeDMRef.current;
        if (currentActive && (payload.senderId === currentActive.id || payload.receiverId === currentActive.id)) {
          setDmMessages(prev => [...prev, {
            id: payload.messageId, content: payload.content,
            senderId: payload.senderId, senderName: payload.senderName,
            createdAt: payload.timestamp, status: 'DELIVERED',
          }]);
          
          if (payload.senderId !== user.id) {
            fetch(`${API_URL}/api/chat/read/${payload.senderId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
          }
        } else if (!currentActive && tabRef.current === 'dm') {
          // Auto-start DM visually so the user immediately sees the message!
          const senderUser = { id: payload.senderId, username: payload.senderName };
          startDM(senderUser);
          setDmMessages([{
            id: payload.messageId, content: payload.content,
            senderId: payload.senderId, senderName: payload.senderName,
            createdAt: payload.timestamp, status: 'DELIVERED',
          }]);
        } else {
          setUnreadDM(prev => prev + 1);
          setDmNotification({ from: payload.senderName, userId: payload.senderId });
          setTimeout(() => setDmNotification(null), 4000);
        }
        fetchRecentChats(); // Immediately update the sidebar order
      }
    };

    const handleDMRequest = (data) => {
      socket.emit('join_room', data.roomId);
    };

    const handlePresence = (data) => {
      const label = data.status === 'online' ? `${data.username} joined the room` : `${data.username} left the room`;
      setSystemMessages(prev => [...prev.slice(-20), { id: Date.now(), text: label, time: new Date().toISOString() }]);
    };

    const handleGlobalHistory = (historyArr) => {
      const mapped = historyArr.map(payload => ({
        id: payload.messageId,
        content: payload.content,
        senderId: payload.senderId,
        senderName: payload.senderName,
        createdAt: payload.timestamp,
        status: 'DELIVERED'
      }));
      setGlobalMessages(mapped);
    };

    const handleAI = (payload) => {
      const currentActive = activeDMRef.current;
      if (currentActive && currentActive.id === payload.senderId) {
        setAiSuggestions(payload.suggestions);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message_received', handleMessage);
    socket.on('dm_request', handleDMRequest);
    socket.on('presence_update', handlePresence);
    socket.on('global_history', handleGlobalHistory);
    socket.on('ai_suggestion_ready', handleAI);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message_received', handleMessage);
      socket.off('dm_request', handleDMRequest);
      socket.off('presence_update', handlePresence);
      socket.off('global_history', handleGlobalHistory);
      socket.off('ai_suggestion_ready', handleAI);
    };
  }, [socket, activeDM]);

  const handleInputChange = (e) => {
    setInputMsg(e.target.value);
    if (activeDM && socket) {
      emitTyping(activeDM.id, null, true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => emitTyping(activeDM.id, null, false), 1500);
    }
  };

  const sendMessage = async (e, aiText = null) => {
    if (e) e.preventDefault();
    const txt = aiText || inputMsg;
    if (!txt.trim() || !socket) return;

    // --- RAG AI Interception ---
    if (txt.trim().toLowerCase().startsWith('@doc')) {
      const query = txt.trim().substring(4).trim();
      const messageId = crypto.randomUUID();
      const isGlobal = tab === 'global';
      
      // Show user's query
      const optimisticMsg = { id: messageId, content: txt.trim(), senderId: user.id, senderName: user.username, createdAt: new Date().toISOString(), status: 'DELIVERED' };
      if (isGlobal) setGlobalMessages(prev => [...prev, optimisticMsg]);
      else if (activeDM) setDmMessages(prev => [...prev, { ...optimisticMsg, receiverId: activeDM.id }]);
      
      setInputMsg('');
      
      // Fake typing indicator for AI
      setSystemMessages(prev => [...prev.slice(-20), { id: Date.now(), text: `🤖 AI is searching documents...`, time: new Date().toISOString() }]);

      setRagLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/rag/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        
        if (res.ok) {
          // Push a structured RAG card instead of a messy chat bubble
          const newCard = {
            id: crypto.randomUUID(),
            query,
            answer: data.data.llm_prompt,
            citations: data.data.citations,
            createdAt: new Date().toISOString(),
          };
          setRagCards(prev => [...prev, newCard]);
        } else {
          alert(data.message || 'RAG query failed');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to connect to RAG engine. Is it running on port 8001?');
      } finally {
        setRagLoading(false);
      }
      return;
    }
    // ---------------------------

    const messageId = crypto.randomUUID();
    const isGlobal = tab === 'global';
    const payload = { messageId, content: txt.trim(), isGlobal, ...((!isGlobal && activeDM) && { receiverId: activeDM.id }) };
    const optimisticMsg = { id: messageId, content: txt.trim(), senderId: user.id, senderName: user.username, createdAt: new Date().toISOString(), status: 'SENT' };
    if (isGlobal) setGlobalMessages(prev => [...prev, optimisticMsg]);
    else if (activeDM) setDmMessages(prev => [...prev, { ...optimisticMsg, receiverId: activeDM.id }]);
    setInputMsg('');
    setAiSuggestions([]);
    setShowEmoji(false);
    socket.emit('send_message', payload, (ack) => {
      const updater = (prev) => prev.map(m => m.id === messageId ? { ...m, status: ack.status } : m);
      if (isGlobal) setGlobalMessages(updater); else setDmMessages(updater);
      if (!isGlobal) fetchRecentChats();
    });
  };

  const activeMessages = tab === 'global' ? globalMessages : dmMessages;
  const filteredMessages = searchQuery ? activeMessages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())) : activeMessages;

  return (
    <div className="app-shell">
      {/* ===== SIDEBAR ===== */}
      <div className={`sidebar-container ${!showSidebarOnMobile ? 'sidebar-hidden' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>NexChat</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {connected
                ? <><Wifi size={12} color="var(--success)" /><span className="badge badge-online">Connected</span></>
                : <><WifiOff size={12} color="var(--danger)" /><span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>Reconnecting</span></>
              }
            </div>
          </div>

          {/* Greeting */}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            {getGreeting()}, <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{user.username}</span>
          </p>

          {/* Your ID */}
          <div onClick={copyId} className="user-id-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {copied ? '✓ Copied!' : 'Your ID'}
              </span>
              <Copy size={10} color="var(--text-dim)" />
            </div>
            <span className="user-id-text">{user.id}</span>
          </div>
        </div>

        {/* Scrollable Container for Lists */}
        <div className="sidebar-scroll">
          {/* Global Room entry — visible on mobile as navigation */}
          <div className="sidebar-section sidebar-nav-cards">
            <div className="user-card" onClick={() => { setTab('global'); setShowSidebarOnMobile(false); }}
              style={{ background: tab === 'global' ? 'var(--accent-glow)' : 'transparent', border: '1px solid var(--glass-border)', borderRadius: '12px', marginBottom: '6px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Globe size={18} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Global Room</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Chat with everyone</div>
              </div>
            </div>
            
            <div className="user-card" onClick={() => setShowDocsModal(true)}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '12px', marginBottom: '6px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Database size={18} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Knowledge Base</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Manage uploaded PDFs</div>
              </div>
            </div>

          </div>

          {/* Online Users */}
          <div className="sidebar-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '0 4px' }}>
              <Users size={13} color="var(--text-dim)" />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Online — {onlineUsers.length}
              </span>
            </div>
            {onlineUsers.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '8px 4px', lineHeight: '1.5' }}>
                No other users online.
              </p>
            )}
            {onlineUsers.map(u => {
              if (!u) return null;
              const recentData = recentChats.find(c => c?.partner?.id === u.id);
              const unreadBadge = recentData ? recentData.unreadCount : 0;
              return (
                <div key={u.id} className="user-card" onClick={() => startDM(u)}>
                  <div className="user-avatar" style={{ background: getAvatarColor(u.username || 'User') }}>{(u.username || 'U')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: unreadBadge > 0 ? 700 : 500, fontSize: '0.85rem' }}>{u.username || 'Unknown User'}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--success)' }}>● online</div>
                  </div>
                  {unreadBadge > 0 ? (
                    <div style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', borderRadius: '12px', padding: '2px 6px', minWidth: '22px', height: '22px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', border: '1px solid rgba(255,255,255,0.2)', textShadow: '0 1px 1px rgba(0,0,0,0.3)', animation: 'badgePulse 2s infinite' }}>
                      {unreadBadge > 99 ? '99+' : unreadBadge}
                    </div>
                  ) : (
                    <MessageSquare size={14} color="var(--text-dim)" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Chats (Offline included) */}
          <div className="sidebar-section" style={{ borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '0 4px' }}>
              <Clock size={13} color="var(--text-dim)" />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Recent Chats
              </span>
            </div>
            {recentChats.length === 0 && (
               <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '8px 4px' }}>No recent chats.</p>
            )}
            {recentChats.map(c => {
              if (!c || !c.partner) return null;
              const isOnline = onlineUsers.some(u => u.id === c.partner.id);
              if (isOnline) return null; // Don't duplicate online users
              return (
                <div key={c.partner.id} className="user-card" onClick={() => startDM(c.partner)}>
                  <div className="user-avatar" style={{ background: getAvatarColor(c.partner.username || 'User'), opacity: 0.7 }}>{(c.partner.username || 'U')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: c.unreadCount > 0 ? 700 : 500, fontSize: '0.85rem' }}>{c.partner.username || 'Unknown User'}</div>
                    <div className="truncate" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {c.lastMessage ? c.lastMessage.content : 'Started a conversation'}
                    </div>
                  </div>
                  {c.unreadCount > 0 && (
                    <div style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', borderRadius: '12px', padding: '2px 6px', minWidth: '22px', height: '22px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', border: '1px solid rgba(255,255,255,0.2)', textShadow: '0 1px 1px rgba(0,0,0,0.3)', animation: 'badgePulse 2s infinite' }}>
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Paste ID */}
        <div className="sidebar-bottom">
          <form onSubmit={connectById} style={{ display: 'flex', gap: '6px' }}>
            <input type="text" className="input-field" placeholder="Paste ID to DM..." value={dmTargetId} onChange={e => setDmTargetId(e.target.value)} style={{ flex: 1, fontSize: '0.78rem', padding: '9px 11px' }} />
            <button type="submit" className="primary-btn" style={{ padding: '9px 12px', borderRadius: '10px' }}><Send size={14} /></button>
          </form>
        </div>

        {/* Logout */}
        <div className="sidebar-bottom">
          <button onClick={logout} style={{ width: '100%', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--glass-border)', padding: '9px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', transition: 'all 0.2s' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* ===== MAIN ===== */}
      <div className="main-chat-container">
        {/* DM Notification Toast */}
        {dmNotification && (
          <div className="animate-enter dm-toast" onClick={() => {
            const found = onlineUsers.find(u => u.id === dmNotification.userId);
            if (found) startDM(found);
            setDmNotification(null);
          }}>
            💬 <strong>{dmNotification.from}</strong> sent you a message
          </div>
        )}

        {/* Tab Bar */}
        <div className="chat-tab-bar">
          <button className="mobile-back-btn" onClick={() => setShowSidebarOnMobile(true)} title="Back to menu">
            <ArrowLeft size={20} />
          </button>
          <button className={`tab-btn ${tab === 'global' ? 'active' : ''}`} onClick={() => { setTab('global'); setShowSidebarOnMobile(false); }}>
            <Globe size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Global Room
          </button>
          <button className={`tab-btn ${tab === 'dm' ? 'active' : ''}`} onClick={() => { setTab('dm'); setUnreadDM(0); setShowSidebarOnMobile(false); }} style={{ position: 'relative' }}>
            <MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Direct Message
            {unreadDM > 0 && <span style={{ position: 'absolute', top: '6px', right: '20px', width: '18px', height: '18px', background: 'var(--danger)', borderRadius: '50%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unreadDM}</span>}
          </button>
          {/* Search toggle */}
          <button onClick={() => setShowSearch(!showSearch)} style={{ marginLeft: 'auto', marginRight: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: showSearch ? 'var(--accent)' : 'var(--text-dim)', transition: 'color 0.2s' }}>
            <Search size={16} />
          </button>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="animate-enter" style={{ padding: '8px 16px', borderBottom: '1px solid var(--glass-border)', background: 'var(--surface)' }}>
            <input type="text" className="input-field" placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ fontSize: '0.82rem', padding: '8px 12px' }} />
          </div>
        )}

        {/* DM header */}
        {tab === 'dm' && activeDM && (
          <div className="dm-header">
            <div className="user-avatar" style={{ background: getAvatarColor(activeDM.username), width: 32, height: 32, fontSize: '0.75rem' }}>{activeDM.username[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{activeDM.username}</div>
              {typingUsers.has(activeDM.id) ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  typing <div className="typing-dots"><span></span><span></span><span></span></div>
                </div>
              ) : (
                <div style={{ fontSize: '0.68rem', color: onlineUsers.find(u => u.id === activeDM.id) ? 'var(--success)' : 'var(--text-dim)' }}>
                  {onlineUsers.find(u => u.id === activeDM.id) ? '● online' : '○ offline'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty DM */}
        {tab === 'dm' && !activeDM && (
          <div className="empty-state">
            <div className="animate-enter">
              <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p style={{ fontSize: '0.95rem', marginBottom: '6px' }}>Select a user from the sidebar</p>
              <p style={{ fontSize: '0.78rem' }}>or paste their ID to start a private chat</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {(tab === 'global' || (tab === 'dm' && activeDM)) && (
          <>
            <div className="chat-messages-area">
              {/* Welcome */}
              {tab === 'global' && filteredMessages.length === 0 && !searchQuery && (
                <div className="animate-enter" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-dim)' }}>
                  <Globe size={44} style={{ marginBottom: '14px', opacity: 0.2 }} />
                  <p style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Welcome to the Global Room</p>
                  <p style={{ fontSize: '0.78rem' }}>Every connected user sees messages here instantly.</p>
                </div>
              )}

              {/* System messages interleaved */}
              {tab === 'global' && filteredMessages.length === 0 && systemMessages.slice(-5).map(sm => (
                <div key={sm.id} className="animate-fade" style={{ textAlign: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.03)', padding: '3px 12px', borderRadius: '10px' }}>
                    {sm.text}
                  </span>
                </div>
              ))}

              {filteredMessages.map(msg => {
                const isMe = msg.senderId === user.id;
                const msgReactions = reactions[msg.id] || {};
                return (
                  <div key={msg.id} className={`msg-bubble ${isMe ? 'animate-left' : 'animate-right'}`} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px', marginLeft: '12px', fontWeight: 500 }}>{msg.senderName || 'User'}</div>}
                    <div style={{ position: 'relative' }} onDoubleClick={() => addReaction(msg.id, '❤️')}>
                      <div style={{ background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.05)', padding: '9px 13px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: '0.88rem', lineHeight: '1.45', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                      {/* Reactions */}
                      {Object.keys(msgReactions).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          {Object.entries(msgReactions).map(([emoji, count]) => (
                            <span key={emoji} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => addReaction(msg.id, emoji)}>
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '4px', marginTop: '1px', fontSize: '0.62rem', color: 'var(--text-dim)', paddingLeft: isMe ? 0 : '12px', paddingRight: isMe ? '4px' : 0 }}>
                      <Clock size={9} /> {timeAgo(msg.createdAt)}
                      {isMe && (msg.status === 'SENT' ? <Check size={10} /> : <CheckCheck size={10} color="var(--success)" />)}
                    </div>
                  </div>
                );
              })}

              {/* RAG Cards — premium structured AI answers */}
              {ragCards.map(card => (
                <RagCard
                  key={card.id}
                  query={card.query}
                  answer={card.answer}
                  citations={card.citations}
                  onClose={() => setRagCards(prev => prev.filter(c => c.id !== card.id))}
                />
              ))}
              {/* RAG Loading Indicator */}
              {ragLoading && (
                <div className="rag-loading animate-enter">
                  <div className="rag-loading-dots">
                    <span/><span/><span/>
                  </div>
                  <span>Searching knowledge base…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* AI Suggestions */}
            {aiEnabledLocal && aiSuggestions.length > 0 && (
              <div className="animate-enter ai-suggestions-row">
                <Bot size={15} color="var(--accent)" />
                {aiSuggestions.map((sug, i) => (
                  <button key={i} onClick={() => sendMessage(null, sug)} style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent-hover)', padding: '5px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{sug}</button>
                ))}
              </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <div className="animate-enter" style={{ padding: '6px 20px', display: 'flex', gap: '6px', borderTop: '1px solid var(--glass-border)' }}>
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => setInputMsg(prev => prev + e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={ev => ev.target.style.background = 'var(--glass-hover)'}
                    onMouseLeave={ev => ev.target.style.background = 'transparent'}
                  >{e}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={e => sendMessage(e)} className="chat-input-bar">
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleFileUpload} />
              <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isUploading ? 'var(--success)' : 'var(--text-dim)', transition: 'color 0.2s', padding: '4px' }} title="Upload PDF to Knowledge Base">
                <Paperclip size={20} />
              </button>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: showEmoji ? 'var(--accent)' : 'var(--text-dim)', transition: 'color 0.2s', padding: '4px' }} title="Toggle Emojis">
                <Smile size={20} />
              </button>
              <button type="button" onClick={() => { setAiEnabledLocal(!aiEnabledLocal); setAiSuggestions([]); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: aiEnabledLocal ? 'var(--accent)' : 'var(--text-dim)', transition: 'color 0.2s', padding: '4px' }} title="Toggle AI Smart Replies">
                <Bot size={20} />
              </button>
              <input type="text" className="input-field" placeholder={tab === 'global' ? 'Message everyone (or type @doc to query PDF)...' : `Message ${activeDM?.username || ''} (or type @doc)...`} value={inputMsg} onChange={handleInputChange} style={{ flex: 1 }} />
              <button type="submit" className="primary-btn" style={{ padding: '11px 15px' }} disabled={isUploading}><Send size={17} /></button>
            </form>
          </>
        )}
        {/* RAG Engine Info Modal */}
        {showDocsModal && (
          <div className="modal-overlay" onClick={() => setShowDocsModal(false)}>
            <div className="modal-content animate-scale" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '500px', width: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} color="var(--accent)" /> Knowledge Base
                </h3>
                <button onClick={() => setShowDocsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20}/></button>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                Documents uploaded here are embedded in your private Vector database. Type <strong>@doc</strong> in any chat to query your knowledge base.
                <br/><br/>
                <strong style={{ color: 'var(--accent)' }}>💡 Tip for multiple files:</strong> If you have many files, you can target a specific one using Hybrid Search exact matching. For example: <br/>
                <code>@doc "invoice.pdf" what is the total amount?</code>
              </p>

              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                {documents.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No documents found. Upload a PDF using the paperclip icon in the chat.
                  </div>
                ) : (
                  documents.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < documents.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <FileText size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                        <span className="truncate" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{doc.filename}</span>
                      </div>
                      <button onClick={() => deleteDocument(doc.filename)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--danger)', transition: 'background 0.2s' }} title="Delete document">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDocsModal(false)} className="btn">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
