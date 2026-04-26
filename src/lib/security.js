/**
 * security.js
 * Centralized security utilities for the POS panel.
 * Covers: XSS sanitization, localStorage encryption, password validation,
 *         rate limiting, session timeout, and production console stripping.
 */
import { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════
   1. XSS SANITIZATION
   Strips dangerous tags & attributes from HTML strings.
   Used for AI copilot responses and any user-generated content.
═══════════════════════════════════════════════════════════ */
const ALLOWED_TAGS = new Set(['strong', 'em', 'b', 'i', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'span'])
const DANGEROUS_ATTRS = /^on\w+|javascript:|data:/i

export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return ''
  
  // Create a temporary DOM element to parse
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Walk the DOM tree and remove dangerous elements
  const walk = (node) => {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase()
        
        // Remove disallowed tags entirely (keep text content)
        if (!ALLOWED_TAGS.has(tag)) {
          // For script/style/iframe — remove completely including content
          if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'].includes(tag)) {
            child.remove()
            continue
          }
          // For other tags — unwrap (keep content)
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child)
          }
          child.remove()
          continue
        }
        
        // Remove dangerous attributes
        const attrs = Array.from(child.attributes)
        for (const attr of attrs) {
          if (DANGEROUS_ATTRS.test(attr.name) || DANGEROUS_ATTRS.test(attr.value)) {
            child.removeAttribute(attr.name)
          }
        }
        
        // Recursively sanitize children
        walk(child)
      }
    }
  }
  
  walk(temp)
  return temp.innerHTML
}

/**
 * Convert markdown-like bold (**text**) to safe HTML
 * without using dangerouslySetInnerHTML
 */
export function markdownToSafeHTML(text) {
  if (!text) return ''
  // Only allow **bold** conversion, escape everything else
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  // Now convert **bold** 
  return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}


/* ═══════════════════════════════════════════════════════════
   2. SECURE LOCAL STORAGE
   Obfuscates sensitive data before storing in localStorage.
   Not true encryption (client-side keys can always be extracted),
   but prevents casual inspection and automated scrapers.
═══════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'r_a_s' // RestroAI Security — obfuscation key seed

function obfuscate(data) {
  try {
    const json = JSON.stringify(data)
    // Simple XOR + Base64 obfuscation
    const key = STORAGE_KEY
    let result = ''
    for (let i = 0; i < json.length; i++) {
      result += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return btoa(unescape(encodeURIComponent(result)))
  } catch {
    return ''
  }
}

function deobfuscate(encoded) {
  try {
    const result = decodeURIComponent(escape(atob(encoded)))
    const key = STORAGE_KEY
    let json = ''
    for (let i = 0; i < result.length; i++) {
      json += String.fromCharCode(result.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const secureStorage = {
  setItem(key, value) {
    try {
      localStorage.setItem(key, obfuscate(value))
    } catch {
      // Storage full or unavailable
    }
  },
  
  getItem(key) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      // Support legacy unobfuscated data during migration
      const decoded = deobfuscate(raw)
      if (decoded !== null) return decoded
      // Fallback: try raw JSON parse (legacy)
      try { return JSON.parse(raw) } catch { return raw }
    } catch {
      return null
    }
  },
  
  removeItem(key) {
    localStorage.removeItem(key)
  },
  
  clear() {
    localStorage.clear()
  }
}


/* ═══════════════════════════════════════════════════════════
   3. PASSWORD VALIDATION
   Enforces strong passwords on registration.
═══════════════════════════════════════════════════════════ */
export function validatePassword(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
  
  const score = Object.values(checks).filter(Boolean).length
  const isValid = checks.length && checks.uppercase && checks.lowercase && checks.number
  
  let strength = 'weak'
  if (score >= 5) strength = 'strong'
  else if (score >= 4) strength = 'good'
  else if (score >= 3) strength = 'fair'
  
  const messages = []
  if (!checks.length) messages.push('At least 8 characters')
  if (!checks.uppercase) messages.push('One uppercase letter')
  if (!checks.lowercase) messages.push('One lowercase letter')
  if (!checks.number) messages.push('One number')
  if (!checks.special) messages.push('One special character (recommended)')
  
  return { isValid, strength, score, checks, messages }
}


/* ═══════════════════════════════════════════════════════════
   4. RATE LIMITER
   Simple in-memory rate limiter for auth forms.
   Prevents brute-force login attempts.
═══════════════════════════════════════════════════════════ */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    this.attempts = new Map()
  }
  
  check(key = 'default') {
    const now = Date.now()
    const record = this.attempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 }
    
    // Is locked?
    if (record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
      return { allowed: false, remaining: remainingSeconds, message: `Too many attempts. Try again in ${remainingSeconds}s` }
    }
    
    // Reset window if expired
    if (now - record.firstAttempt > this.windowMs) {
      record.count = 0
      record.firstAttempt = now
    }
    
    return { allowed: true, remaining: 0, attemptsLeft: this.maxAttempts - record.count }
  }
  
  record(key = 'default') {
    const now = Date.now()
    const record = this.attempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 }
    
    // Reset if window expired
    if (now - record.firstAttempt > this.windowMs) {
      record.count = 0
      record.firstAttempt = now
    }
    
    record.count++
    
    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.windowMs
    }
    
    this.attempts.set(key, record)
  }
  
  reset(key = 'default') {
    this.attempts.delete(key)
  }
}

export const authRateLimiter = new RateLimiter(5, 60000) // 5 attempts per 60 seconds


/* ═══════════════════════════════════════════════════════════
   5. SESSION TIMEOUT
   Auto-logout after inactivity period.
═══════════════════════════════════════════════════════════ */
class SessionManager {
  constructor(timeoutMs = 30 * 60 * 1000) { // 30 minutes default
    this.timeoutMs = timeoutMs
    this.timer = null
    this.onTimeout = null
    this.events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  }
  
  start(onTimeout) {
    this.onTimeout = onTimeout
    this.resetTimer()
    this.events.forEach(event => 
      window.addEventListener(event, this.handleActivity, { passive: true })
    )
  }
  
  stop() {
    if (this.timer) clearTimeout(this.timer)
    this.events.forEach(event => 
      window.removeEventListener(event, this.handleActivity)
    )
  }
  
  handleActivity = () => {
    this.resetTimer()
  }
  
  resetTimer() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      if (this.onTimeout) this.onTimeout()
    }, this.timeoutMs)
  }
  
  // Update timeout duration from settings
  setTimeout(ms) {
    this.timeoutMs = ms
    this.resetTimer()
  }
}

export const sessionManager = new SessionManager()


/* ═══════════════════════════════════════════════════════════
   6. PRODUCTION CONSOLE STRIPPING
   Silences console output in production builds.
═══════════════════════════════════════════════════════════ */
export function stripConsoleInProduction() {
  if (import.meta.env.PROD) {
    const noop = () => {}
    console.log = noop
    console.debug = noop
    console.info = noop
    console.warn = noop
    // Keep console.error for critical issues
  }
}


/* ═══════════════════════════════════════════════════════════
   7. INPUT SANITIZATION
   Sanitize user inputs before sending to API
═══════════════════════════════════════════════════════════ */
export function sanitizeInput(value) {
  if (typeof value !== 'string') return value
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

export function sanitizeEmail(email) {
  if (typeof email !== 'string') return ''
  return email.toLowerCase().trim()
}

/* ═══════════════════════════════════════════════════════════
   8. DEEP PAYLOAD SANITIZATION
   Recursively sanitizes values in objects/arrays before API dispatch
═══════════════════════════════════════════════════════════ */
export function sanitizePayload(payload) {
  if (payload === null || payload === undefined) return payload;
  
  if (typeof payload === 'string') {
    // Basic sanitization: remove common XSS patterns like <script> or javascript:
    // Notice: We don't strip ALL tags here because some inputs might legitimately contain < or >.
    // However, for strict POS systems, stripping <> entirely is often preferred for standard text fields.
    // If you need more nuanced control, apply it at the component level.
    const sanitized = payload.replace(/(<([^>]+)>)/gi, "");
    return sanitized;
  }
  
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }
  
  if (typeof payload === 'object') {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(payload)) {
      sanitizedObj[key] = sanitizePayload(value);
    }
    return sanitizedObj;
  }
  
  return payload;
}


/* ═══════════════════════════════════════════════════════════
   9. BOT DETECTION (BEHAVIORAL ANALYSIS)
   Tracks basic interaction (mouse, touch, key) to detect automated filling
═══════════════════════════════════════════════════════════ */
export function useBotDetector() {
  const [interactions, setInteractions] = useState({
    mouseMoves: 0,
    keyPresses: 0,
    touchEvents: 0
  });
  const [mountedAt] = useState(Date.now());

  useEffect(() => {
    const handleMouseMove = () => setInteractions(prev => ({ ...prev, mouseMoves: prev.mouseMoves + 1 }));
    const handleKeyDown = () => setInteractions(prev => ({ ...prev, keyPresses: prev.keyPresses + 1 }));
    const handleTouchStart = () => setInteractions(prev => ({ ...prev, touchEvents: prev.touchEvents + 1 }));

    // Only attach once
    window.addEventListener('mousemove', handleMouseMove, { once: true });
    window.addEventListener('keydown', handleKeyDown, { once: true });
    window.addEventListener('touchstart', handleTouchStart, { once: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const isBot = () => {
    const timeToSubmit = Date.now() - mountedAt;
    const totalInteractions = interactions.mouseMoves + interactions.keyPresses + interactions.touchEvents;

    // Flag as bot if form is submitted under 500ms and zero interaction with the document
    if (totalInteractions === 0 && timeToSubmit < 500) {
      return true;
    }
    return false;
  };

  return { isBot, ...interactions };
}
