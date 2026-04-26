import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Send, Bot, Sparkles, Brain, ChevronDown,
  TrendingUp, TrendingDown, ShoppingCart, UtensilsCrossed,
  Users, IndianRupee, Clock, Zap, AlertTriangle,
  BarChart3, RefreshCw, Maximize2, Minimize2, Copy, Check
} from 'lucide-react'
import useUIStore from '@/store/uiStore'
import api from '@/lib/api'
import { useAIGate } from '@/hooks/useAIGate'
import AIKeyRequired from '@/components/ai/AIKeyRequired'
import { cn, formatCurrency } from '@/lib/utils'

// ── Markdown Parser (supports bold, italic, lists, code, line breaks) ──
function parseMarkdown(text) {
  if (!text) return ''
  let html = text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Code blocks (```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="copilot-codeblock"><code>${code.trim()}</code></pre>`
  )
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="copilot-inline-code">$1</code>')
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Bullet lists (- or * at start of line)
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="copilot-li">$1</li>')
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="copilot-ul">$&</ul>')
  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="copilot-li-num">$1</li>')
  html = html.replace(/(<li class="copilot-li-num">[^<]*<\/li>\n?)+/g, '<ol class="copilot-ol">$&</ol>')
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 class="copilot-h4">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="copilot-h3">$1</h3>')
  // Line breaks
  html = html.replace(/\n/g, '<br/>')

  return html
}

// ── Metrics Bar Component ──
function MetricsBar({ metrics }) {
  if (!metrics) return null
  const items = [
    { label: 'Revenue', value: formatCurrency(metrics.todayRevenue || 0), icon: IndianRupee, color: 'text-emerald-500', growth: metrics.revenueGrowth },
    { label: 'Orders', value: metrics.todayOrders || 0, icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'Active', value: metrics.activeOrders || 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Tables', value: `${metrics.occupancyRate || 0}%`, icon: UtensilsCrossed, color: 'text-purple-500' },
  ]

  return (
    <div className="grid grid-cols-4 gap-1.5 px-4 py-2.5 bg-surface-50 dark:bg-surface-800/60 border-b border-surface-100 dark:border-surface-700">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="text-center">
            <Icon size={13} className={cn('mx-auto mb-0.5', item.color)} />
            <p className="text-[11px] font-bold text-surface-900 dark:text-white leading-tight font-mono">
              {item.value}
            </p>
            <p className="text-[9px] text-surface-400 leading-tight">{item.label}</p>
            {item.growth !== undefined && item.growth !== 0 && (
              <span className={cn('text-[9px] font-bold', item.growth > 0 ? 'text-emerald-500' : 'text-red-500')}>
                {item.growth > 0 ? '↑' : '↓'}{Math.abs(item.growth)}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Message Bubble ──
function MessageBubble({ msg, onSuggestionClick }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className={cn(
        'max-w-[88%] relative group',
        isUser
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md shadow-primary-500/10'
          : 'bg-surface-100 dark:bg-surface-700/70 text-surface-900 dark:text-white rounded-2xl rounded-bl-md px-4 py-3'
      )}>
        {/* Copy button for assistant messages */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-surface-200/60 dark:bg-surface-600/60 hover:bg-surface-300 dark:hover:bg-surface-500"
            title="Copy"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-surface-400" />}
          </button>
        )}

        {/* Intent badge */}
        {!isUser && msg.intent && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-surface-400 mb-1.5">
            <Zap size={10} />
            {msg.intent.replace('_', ' ')}
          </span>
        )}

        {/* Message content */}
        {isUser ? (
          <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
        ) : (
          <div
            className="text-sm leading-relaxed copilot-prose"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
          />
        )}

        {/* Platform pending alert */}
        {!isUser && msg.metrics?.platformPending > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-300 font-medium">
              {msg.metrics.platformPending} platform order(s) awaiting your action
            </span>
          </div>
        )}

        {/* Suggestions */}
        {!isUser && msg.suggestions?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-200/70 dark:bg-surface-600/50 text-surface-600 dark:text-surface-300 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={cn('text-[10px] mt-1.5', isUser ? 'opacity-60' : 'text-surface-400')}>
          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────
//  MAIN COPILOT COMPONENT
// ──────────────────────────────────────────────────────────
export default function OwnerCopilot() {
  const { setShowCopilot } = useUIStore()
  const { isReady: aiReady, isLoading: aiLoading } = useAIGate()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm **RestroAI Copilot** — your real-time AI business analyst.\n\nI can answer questions about your **revenue, orders, menu performance, customers, reservations, tables, platform orders**, and more — all from your live data.\n\nWhat would you like to know?",
      timestamp: new Date(),
      suggestions: [],
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [latestMetrics, setLatestMetrics] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [initialSuggestions, setInitialSuggestions] = useState([
    "What's today's total revenue?",
    "Which item sold the most today?",
    "Give me a business summary",
    "Any active orders in the kitchen?",
  ])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleSend = useCallback(async (text = input) => {
    if (!text.trim() || isTyping) return

    const userMessage = { role: 'user', content: text.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const res = await api.post('/tenant/ai/copilot-chat', {
        message: text.trim(),
        history: messages.map(m => ({ role: m.role, content: m.content }))
      })

      const responseData = res.data.data

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseData.text,
        intent: responseData.intent,
        suggestions: responseData.suggestions || [],
        metrics: responseData.metrics,
        timestamp: new Date(),
      }])

      // Update the metrics bar
      if (responseData.metrics) {
        setLatestMetrics(responseData.metrics)
      }

      // Update suggestions for the initial suggestions area
      if (responseData.suggestions?.length) {
        setInitialSuggestions(responseData.suggestions)
      }
    } catch (error) {
      const errCode = error.response?.data?.code
      const errMsg = errCode === 'AI_CONFIG_REQUIRED'
        ? '🔑 **AI features require a Gemini API key.** Please go to **Settings → AI Configuration** to set up your key.'
        : "Sorry, I couldn't process that right now. Please try again in a moment."
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errMsg,
        timestamp: new Date(),
      }])
    } finally {
      setIsTyping(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, messages, isTyping])

  const handleSuggestionClick = useCallback((text) => {
    handleSend(text)
  }, [handleSend])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCopilot(false)} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          'relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-surface-200 dark:border-surface-700',
          expanded
            ? 'w-full max-w-2xl h-[85vh]'
            : 'w-full max-w-md h-[600px]'
        )}
        style={{ transition: 'width 0.3s, height 0.3s, max-width 0.3s' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                RestroAI Copilot
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              </h2>
              <p className="text-[11px] opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live data • AI-powered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all"
              title={expanded ? 'Minimize' : 'Expand'}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={() => setShowCopilot(false)} className="p-2 rounded-lg hover:bg-white/10 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── AI Key Gate ── */}
        {!aiLoading && !aiReady ? (
          <div className="flex-1 overflow-y-auto">
            <AIKeyRequired featureName="AI Copilot" />
          </div>
        ) : (
          <>
            {/* ── Live Metrics Bar ── */}
            <MetricsBar metrics={latestMetrics} />

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface-100 dark:bg-surface-700/70 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-surface-400 ml-1">Analyzing your data...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Initial Suggestions ── */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] uppercase tracking-wider text-surface-400 font-bold mb-2">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {initialSuggestions.slice(0, 4).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-700 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-300 transition-all border border-surface-200/50 dark:border-surface-600/50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input ── */}
            <div className="p-3 border-t border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about revenue, orders, menu, staff..."
                  className="input flex-1 py-2.5 text-sm bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600"
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    'p-2.5 rounded-xl font-bold transition-all flex-shrink-0',
                    input.trim() && !isTyping
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl'
                      : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-surface-400 mt-1.5 text-center">
                Powered by Gemini • Uses your live restaurant data
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* ── CSS for copilot prose ── */}
      <style>{`
        .copilot-prose strong { font-weight: 700; }
        .copilot-prose em { font-style: italic; }
        .copilot-prose .copilot-ul { list-style: none; padding-left: 0; margin: 6px 0; }
        .copilot-prose .copilot-ol { list-style: none; padding-left: 0; margin: 6px 0; counter-reset: ol-counter; }
        .copilot-prose .copilot-li { position: relative; padding-left: 16px; margin-bottom: 3px; }
        .copilot-prose .copilot-li::before { content: "•"; position: absolute; left: 4px; color: #818cf8; font-weight: 700; }
        .copilot-prose .copilot-li-num { position: relative; padding-left: 20px; margin-bottom: 3px; counter-increment: ol-counter; }
        .copilot-prose .copilot-li-num::before { content: counter(ol-counter) "."; position: absolute; left: 2px; color: #818cf8; font-weight: 700; font-size: 11px; }
        .copilot-prose .copilot-codeblock { background: rgba(0,0,0,0.08); border-radius: 8px; padding: 8px 12px; margin: 6px 0; overflow-x: auto; font-size: 12px; font-family: 'SF Mono', monospace; }
        .dark .copilot-prose .copilot-codeblock { background: rgba(255,255,255,0.06); }
        .copilot-prose .copilot-inline-code { background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; font-size: 12px; font-family: 'SF Mono', monospace; }
        .dark .copilot-prose .copilot-inline-code { background: rgba(255,255,255,0.08); }
        .copilot-prose .copilot-h3 { font-size: 14px; font-weight: 800; margin: 8px 0 4px; }
        .copilot-prose .copilot-h4 { font-size: 13px; font-weight: 700; margin: 6px 0 3px; }
      `}</style>
    </div>
  )
}
