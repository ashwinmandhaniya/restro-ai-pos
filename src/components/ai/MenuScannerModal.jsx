import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Image as ImageIcon, X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import useMenuScannerStore from '@/store/menuScannerStore';
import MenuPreviewGrid from './MenuPreviewGrid';

export default function MenuScannerModal({ isOpen, onClose, onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { 
    file, setFile, scanMenu, isScanning, scanProgress, 
    scanStatus, parsedData, error, clearSession 
  } = useMenuScannerStore();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      alert("Please upload a valid JPG, PNG, WEBP, or PDF file.");
      return;
    }
    setFile(selectedFile);
  };

  const handleScan = () => {
    if (file) scanMenu(file);
  };

  const handleClose = () => {
    clearSession();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-800 transition-all ${parsedData ? 'w-full max-w-5xl' : 'w-full max-w-xl'}`}
        >
          {/* Header */}
          <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-900">
            <div>
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                AI Menu Digitization
              </h3>
              <p className="text-sm text-surface-500 mt-0.5">Upload a photo or PDF of your menu to automatically convert it.</p>
            </div>
            <button onClick={handleClose} disabled={isScanning} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* State 1: Upload / Drag & Drop */}
            {!isScanning && !parsedData && (
              <div className="space-y-6">
                <div 
                  className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-500/5' 
                      : 'border-surface-300 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-800/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/jpeg, image/png, image/webp, application/pdf" 
                    onChange={handleChange}
                    className="hidden" 
                  />
                  
                  {file ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                         <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-base font-semibold text-surface-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-surface-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-4 text-sm text-red-500 font-medium hover:text-red-600"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="text-center cursor-pointer">
                      <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <UploadCloud className="w-8 h-8 text-surface-400" />
                      </div>
                      <p className="text-base font-semibold text-surface-900 dark:text-white">Click to upload or drag & drop</p>
                      <p className="text-sm text-surface-500 mt-1">Supports strict JPG, PNG, WEBP, or PDF</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={handleClose} className="btn-secondary">Cancel</button>
                  <button 
                    onClick={handleScan}
                    disabled={!file}
                    className={`btn-primary flex items-center gap-2 ${!file && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <Sparkles className="w-4 h-4" /> Start AI Scan
                  </button>
                </div>
              </div>
            )}

            {/* State 2: Scanning (Loading animation) */}
            {isScanning && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-surface-200 dark:border-surface-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{scanStatus}</h4>
                <div className="w-64 h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                  />
                </div>
                <p className="text-sm text-surface-500 mt-4 max-w-xs">Our Universal AI model is identifying layout patterns, categories, and classifying vegan properties...</p>
              </div>
            )}

            {/* State 3: Preview UI */}
            {!isScanning && parsedData && (
              <MenuPreviewGrid onImportSuccess={() => { handleClose(); onImportSuccess(); }} />
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
