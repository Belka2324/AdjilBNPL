import { useEffect, useState, useRef } from 'react'
import { getSession } from '../lib/storage'
import { supabase, hasSupabase } from '../lib/supabase'
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime'

export type PortalMessage = {
  id: string
  sender_id: string
  sender_name: string
  sender_role: string
  receiver_id?: string
  content: string
  created_at: string
}

export default function Messages() {
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const session = getSession()

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasSupabase && supabase) {
      supabase
        .from('portal_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)
        .then(({ data, error }) => {
          if (!error && data) {
            setMessages(data)
          }
        })
    }
  }, [])

  const { data: realTimeMessages } = useSupabaseRealtime<PortalMessage>('portal_messages', messages)

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [realTimeMessages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session || !hasSupabase || !supabase) return

    setIsSending(true)
    try {
      // In a real app we'd get sender_id from session, assuming session.username for now
      const messageData = {
        sender_id: session.username,
        sender_name: session.username,
        sender_role: session.role,
        content: newMessage.trim()
      }

      const { error } = await supabase
        .from('portal_messages')
        .insert(messageData)

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message: ' + error.message)
      } else {
        setNewMessage('')
      }
    } finally {
      setIsSending(false)
    }
  }

  // Use realTimeMessages instead of messages for the latest view
  const displayMessages = realTimeMessages.length > 0 ? realTimeMessages : messages

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <i className="fa-solid fa-comments text-xl"></i>
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-lg">المركز الداخلي للرسائل / Internal Chat Hub</h2>
          <p className="text-xs text-slate-500 font-medium tracking-wide">Secure Communication Channel</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
        {displayMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
            <i className="fa-regular fa-comment-dots text-5xl"></i>
            <p className="text-sm font-bold tracking-widest uppercase">No messages yet</p>
          </div>
        )}
        
        {displayMessages.map((msg, idx) => {
          const isMe = msg.sender_id === session?.username
          const showSenderInfo = idx === 0 || displayMessages[idx - 1].sender_id !== msg.sender_id

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && showSenderInfo && (
                <div className="text-[10px] font-bold text-slate-400 mb-1 ml-2 uppercase tracking-wider">
                  {msg.sender_name} <span className="text-nexus-gold opacity-80">({msg.sender_role})</span>
                </div>
              )}
              {isMe && showSenderInfo && (
                <div className="text-[10px] font-bold text-slate-400 mb-1 mr-2 uppercase tracking-wider">
                  You
                </div>
              )}
              <div 
                className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-500/20' 
                    : 'bg-white text-slate-700 rounded-tl-sm shadow-sm border border-slate-100'
                }`}
              >
                {msg.content}
                <div className={`text-[9px] mt-2 font-medium ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-3 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة... / Type a message..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            disabled={isSending}
          />
          <button 
            type="submit" 
            disabled={isSending || !newMessage.trim()}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {isSending ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-paper-plane mr-1"></i>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
