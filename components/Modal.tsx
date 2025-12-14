import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { PromptEntry } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface ModalProps {
  entry: PromptEntry;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ entry, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-5xl h-[90vh] md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left: Image (Scrollable if needed, or fit) */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full bg-gray-100 flex items-center justify-center p-2 md:p-8 overflow-hidden relative shrink-0">
          {entry.image_url ? (
            <img
              src={getOptimizedImageUrl(entry.image_url, 1200)}
              alt={entry.summary}
              className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
            />
          ) : (
            <div className="text-gray-400 text-sm">No Image</div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">
            {entry.aspect_ratio}
          </div>
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 leading-tight mb-2">
              {entry.summary || "Untitled Prompt"}
            </h2>
            <div className="inline-block text-[10px] px-2 py-0.5 border border-gray-300 rounded text-gray-500 uppercase tracking-wider">
              {entry.generation_type}
            </div>
          </div>

          {/* Prompt Box 1 (Main/Original) */}
          <div className="mb-4 border border-gray-200 rounded-2xl p-4 bg-white hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Prompt (Original - {/[\u4e00-\u9fa5]/.test(entry.original_prompt) ? 'Chinese' : 'English'})
              </span>
              <button
                onClick={() => handleCopy(entry.original_prompt, 'orig')}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                {copied === 'orig' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'orig' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-mono border border-gray-100/50">
              {entry.original_prompt || "N/A"}
            </div>
          </div>

          {/* Prompt Box 2 (Translated) */}
          <div className="mb-6 border border-gray-200 rounded-2xl p-4 bg-white hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Prompt (Translated - {/[\u4e00-\u9fa5]/.test(entry.original_prompt) ? 'English' : 'Chinese'})
              </span>
              <button
                onClick={() => handleCopy(entry.translated_prompt, 'trans')}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                {copied === 'trans' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'trans' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-mono border border-gray-100/50">
              {entry.translated_prompt || "N/A"}
            </div>
          </div>

          {/* Tags Section */}
          <div className="flex flex-wrap gap-2 mb-6">
            {entry.tags.map(tag => (
              <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                #{tag}
              </span>
            ))}
          </div>

          {/* Metadata / Footer */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
            <div className="text-right">
              <span className="block text-xs text-gray-400 mb-1">Created</span>
              <span className="text-sm text-gray-700 font-medium">{new Date(entry.created_at).toLocaleDateString()}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Modal;
