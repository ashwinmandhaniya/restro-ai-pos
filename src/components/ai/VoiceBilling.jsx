import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Volume2, Sparkles, Check, Plus, ShieldCheck, Globe, RotateCcw, AudioLines } from 'lucide-react'
import useUIStore from '@/store/uiStore'
import useCartStore from '@/store/cartStore'
import useMenuStore from '@/store/menuStore'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

const LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'mr-IN', label: 'Marathi', flag: '🇮🇳' },
]

export default function VoiceBilling() {
  const { setShowVoiceBilling, addNotification } = useUIStore()
  const { addItem } = useCartStore()
  const { menuItems } = useMenuStore()

  // Core states
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [parsedItems, setParsedItems] = useState([])
  const [processing, setProcessing] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [noiseReduced, setNoiseReduced] = useState(false)
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0])
  const [showLangPicker, setShowLangPicker] = useState(false)

  // Refs
  const recognitionRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const animFrameRef = useRef(null)
  const finalTranscriptRef = useRef('')

  // ─── Noise-Cancellation Audio Pipeline ───────────────────────────
  const startAudioPipeline = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Advanced constraints for better quality
          sampleRate: 48000,
          channelCount: 1,
        }
      })
      mediaStreamRef.current = stream

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)

      // ── High-Pass Filter: Remove low-frequency rumble (AC hum, fans) ──
      const highPass = audioCtx.createBiquadFilter()
      highPass.type = 'highpass'
      highPass.frequency.value = 85  // Cut below 85 Hz
      highPass.Q.value = 0.7

      // ── Low-Pass Filter: Remove high-frequency hiss ──
      const lowPass = audioCtx.createBiquadFilter()
      lowPass.type = 'lowpass'
      lowPass.frequency.value = 8000  // Cut above 8 kHz
      lowPass.Q.value = 0.7

      // ── Compressor: Normalize volume spikes ──
      const compressor = audioCtx.createDynamicsCompressor()
      compressor.threshold.value = -30
      compressor.knee.value = 20
      compressor.ratio.value = 8
      compressor.attack.value = 0.003
      compressor.release.value = 0.15

      // ── Analyser for live audio-level visualization ──
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      // Chain: source → highPass → lowPass → compressor → analyser
      source.connect(highPass)
      highPass.connect(lowPass)
      lowPass.connect(compressor)
      compressor.connect(analyser)
      // NOTE: We intentionally do NOT connect analyser to audioCtx.destination
      // to avoid echo. The pipeline is for analysis + noise suppression only.

      setNoiseReduced(true)
      startLevelMonitor()
    } catch (err) {
      console.error('Audio pipeline error:', err)
      // Fallback: still work without noise cancellation
      setNoiseReduced(false)
    }
  }, [])

  const startLevelMonitor = useCallback(() => {
    const poll = () => {
      if (!analyserRef.current) return
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)

      // Compute RMS volume from frequency data
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length) / 255 // normalized 0-1
      setAudioLevel(rms)

      animFrameRef.current = requestAnimationFrame(poll)
    }
    poll()
  }, [])

  const stopAudioPipeline = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
    setNoiseReduced(false)
  }, [])

  // ─── Speech Recognition Setup ───────────────────────────────────
  const initRecognition = useCallback((langCode) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      addNotification({ type: 'error', title: 'Not Supported', message: 'Voice billing requires Chrome or Edge.' })
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true           // Keep listening until manual stop
    recognition.interimResults = true       // Show words as they're heard
    recognition.maxAlternatives = 3         // Get multiple interpretations
    recognition.lang = langCode

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
          setConfidence(Math.round(result[0].confidence * 100))
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        finalTranscriptRef.current = final
        setTranscript(final)
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        addNotification({ type: 'warning', title: 'No Speech Detected', message: 'Try speaking louder or move closer to the mic.' })
      } else if (event.error === 'audio-capture') {
        addNotification({ type: 'error', title: 'Microphone Error', message: 'No microphone found. Check device settings.' })
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      // Only auto-process if we actually stopped intentionally (via button)
      // The continuous flag means onend fires if speech times out
      setIsListening(false)
    }

    return recognition
  }, [addNotification])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (e) {}
      }
      stopAudioPipeline()
    }
  }, [stopAudioPipeline])

  // ─── Actions ────────────────────────────────────────────────────
  const processTranscript = async (finalText) => {
    if (!finalText.trim()) return

    setProcessing(true)
    setParsedItems([])

    try {
      const res = await api.post('/tenant/ai/voice-parse', {
        transcript: finalText,
        lang: selectedLang.code,
        confidence,
      })
      if (res.data.success) {
        const items = res.data.data || []
        setParsedItems(items)
        if (items.length === 0) {
          addNotification({ type: 'warning', title: 'No Match', message: 'Could not match any menu items. Try again clearly.' })
        }
      }
    } catch (error) {
      console.error('Voice Parsing API Error:', error)
      addNotification({ type: 'error', title: 'AI Error', message: 'Failed to process voice command.' })
    } finally {
      setProcessing(false)
    }
  }

  const handleStartListening = async () => {
    if (isListening) {
      // ── STOP ──
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
      setIsListening(false)
      stopAudioPipeline()

      // Process whatever we captured
      const text = finalTranscriptRef.current || transcript
      if (text.trim()) {
        processTranscript(text)
      }
    } else {
      // ── START ──
      setTranscript('')
      setInterimTranscript('')
      setParsedItems([])
      setProcessing(false)
      setConfidence(0)
      finalTranscriptRef.current = ''

      // 1. Start noise-cancellation audio pipeline
      await startAudioPipeline()

      // 2. Start speech recognition
      const recognition = initRecognition(selectedLang.code)
      if (!recognition) return
      recognitionRef.current = recognition

      try {
        recognition.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to start recognition:', err)
        stopAudioPipeline()
      }
    }
  }

  const handleAddAll = () => {
    parsedItems.forEach(item => {
      const menuItem = menuItems.find(m => m.name === item.name)
      if (menuItem) {
        for (let i = 0; i < item.qty; i++) {
          addItem(menuItem)
        }
      }
    })
    addNotification({ type: 'success', title: 'Items Added!', message: `${parsedItems.length} items added via voice` })
    setShowVoiceBilling(false)
  }

  const handleRetry = () => {
    setTranscript('')
    setInterimTranscript('')
    setParsedItems([])
    setConfidence(0)
    finalTranscriptRef.current = ''
    handleStartListening()
  }

  const handleLangChange = (lang) => {
    setSelectedLang(lang)
    setShowLangPicker(false)
    // If currently listening, restart with new language
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
      setIsListening(false)
      stopAudioPipeline()
      setTimeout(() => handleStartListening(), 200)
    }
  }

  // ─── Audio Level Bars (visualizer) ──────────────────────────────
  const AudioBars = () => {
    const bars = 5
    return (
      <div className="flex items-end gap-[3px] h-8">
        {Array.from({ length: bars }).map((_, i) => {
          const barLevel = isListening ? Math.min(1, audioLevel * (2 + i * 0.6)) : 0
          const height = Math.max(4, barLevel * 32)
          return (
            <motion.div
              key={i}
              animate={{ height }}
              transition={{ duration: 0.08 }}
              className={`w-[4px] rounded-full ${isListening ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}`}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md mx-4 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
                Voice Billing
                {noiseReduced && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-wide">
                    <ShieldCheck className="w-2.5 h-2.5" /> NC
                  </span>
                )}
              </h2>
              <p className="text-xs text-surface-500">AI-powered with noise cancellation</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language Picker */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {selectedLang.flag} {selectedLang.label}
              </button>
              <AnimatePresence>
                {showLangPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-700 rounded-xl shadow-lg border border-surface-200 dark:border-surface-600 z-10 overflow-hidden min-w-[140px]"
                  >
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLangChange(lang)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors ${
                          selectedLang.code === lang.code ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setShowVoiceBilling(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice UI */}
        <div className="p-8 flex flex-col items-center">

          {/* Audio Level Visualizer */}
          <div className="mb-3 h-8 flex items-center justify-center">
            {isListening ? <AudioBars /> : <AudioLines className="w-5 h-5 text-surface-300 dark:text-surface-600" />}
          </div>

          {/* Mic Button */}
          <div className="relative mb-5">
            {/* Outer animated ring */}
            <motion.div
              animate={{
                scale: isListening ? [1, 1.3, 1] : 1,
                opacity: isListening ? [0.3, 0.1, 0.3] : 0,
              }}
              transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
              className="absolute inset-0 rounded-full bg-primary-500"
              style={{ margin: -20 }}
            />
            {/* Middle ring driven by audio level */}
            {isListening && (
              <motion.div
                animate={{ scale: 1 + audioLevel * 0.6 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 rounded-full bg-primary-500/15"
                style={{ margin: -10 }}
              />
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10 animate-pulse" /> : <MicOff className="w-10 h-10" />}
            </motion.button>
          </div>

          {/* Status Text */}
          <p className="text-sm text-surface-500 mb-1 text-center">
            {isListening ? (
              <span className="text-red-500 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening... Tap to stop
              </span>
            ) : processing ? (
              <span className="text-accent-500 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                AI is matching your order...
              </span>
            ) : parsedItems.length > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✅ Items recognized! Review and add to cart.</span>
            ) : (
              <span className="text-surface-400">Tap the mic and speak your order clearly</span>
            )}
          </p>

          {/* Confidence Indicator */}
          {confidence > 0 && !isListening && (
            <p className="text-[10px] text-surface-400 mb-3 flex items-center gap-1">
              Hear confidence: <span className={`font-bold ${confidence >= 80 ? 'text-emerald-500' : confidence >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{confidence}%</span>
            </p>
          )}

          {/* Live Transcript */}
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-3 rounded-xl bg-surface-50 dark:bg-surface-900 mb-4"
            >
              <p className="text-[10px] text-surface-400 mb-1 font-medium uppercase tracking-wider">Heard:</p>
              <p className="text-sm font-medium text-surface-900 dark:text-white leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-surface-400 italic"> {interimTranscript}</span>
                )}
              </p>
            </motion.div>
          )}

          {/* Parsed Items */}
          <AnimatePresence>
            {parsedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-2 mb-4"
              >
                {parsedItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{item.name}</p>
                    </div>
                    <span className="text-xs font-bold bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-md">×{item.qty}</span>
                    <span className="text-sm font-mono font-semibold">{formatCurrency(item.price * item.qty)}</span>
                  </motion.div>
                ))}

                <div className="pt-2 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400">
                    {formatCurrency(parsedItems.reduce((s, i) => s + i.price * i.qty, 0))}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        {parsedItems.length > 0 && (
          <div className="p-4 pt-0 flex gap-2">
            <button onClick={handleRetry} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button onClick={handleAddAll} className="btn-primary flex-[2] flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Add All to Cart
            </button>
          </div>
        )}

        {/* Noise Cancellation Info Footer */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pb-3 flex items-center justify-center gap-2 text-[10px] text-surface-400"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Active noise cancellation · High-pass 85Hz · Low-pass 8kHz · Compressor ON
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
