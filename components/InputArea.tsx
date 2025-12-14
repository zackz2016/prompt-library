import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { GenerationType, Tag, PromptEntry } from '../types';
import { analyzePromptText } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface InputAreaProps {
  availableTags: Tag[];
  onAddTag: (tagName: string) => void;
  onSave: (entry: Omit<PromptEntry, 'id' | 'created_at'>) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ availableTags, onAddTag, onSave }) => {
  const [promptText, setPromptText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [genType, setGenType] = useState<GenerationType>(GenerationType.TextToImage);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [imageRatio, setImageRatio] = useState<string>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // 1. Calculate Aspect Ratio
        const w = img.width;
        const h = img.height;
        const r = w / h;
        let ratioStr = "1:1";
        if (r >= 1.7) ratioStr = "16:9";
        else if (r >= 1.3) ratioStr = "4:3";
        else if (r <= 0.6) ratioStr = "9:16";
        else if (r <= 0.8) ratioStr = "3:4";
        setImageRatio(ratioStr);

        // 2. Resize and Compress Image
        // Limit max dimension to 800px to avoid localStorage quota issues
        const MAX_DIM = 800;
        let newW = w;
        let newH = h;

        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            newW = MAX_DIM;
            newH = (h / w) * MAX_DIM;
          } else {
            newH = MAX_DIM;
            newW = (w / h) * MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, newW, newH);
          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedDataUrl);

          canvas.toBlob((blob) => {
            if (blob) setImageFile(blob);
          }, 'image/jpeg', 0.7);
        } else {
          // Fallback if canvas fails
          setImagePreview(objectUrl);
        }

        URL.revokeObjectURL(objectUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert("Failed to load image");
      };

      img.src = objectUrl;
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
      onAddTag(newTagInput.trim());
      setSelectedTags(prev => [...prev, newTagInput.trim()]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleSave = async () => {
    if (!promptText.trim() && !imagePreview) return;

    setIsProcessing(true);

    try {
      // 1. Analyze Text with Gemini
      let analysis = { cn: promptText, en: promptText, summary: "No summary generated" };
      if (promptText.trim()) {
        analysis = await analyzePromptText(promptText);
      } else {
        analysis.summary = "Image-based prompt";
      }

      let finalImageUrl = imagePreview;

      if (imageFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('prompts')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('prompts')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const entry: Omit<PromptEntry, 'id' | 'created_at'> = {
        original_prompt: promptText,
        translated_prompt: /[\u4e00-\u9fa5]/.test(promptText) ? analysis.en : analysis.cn,
        summary: analysis.summary,
        image_url: finalImageUrl,
        aspect_ratio: imageRatio,
        tags: selectedTags,
        generation_type: genType,
      };

      onSave(entry);

      // Reset Form
      setPromptText('');
      setImagePreview(null);
      setImageFile(null);
      setSelectedTags([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to analyze prompt. Please check your API key or connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 transition-all hover:shadow-md">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: Text Input */}
        <div className="flex-1 flex flex-col gap-4">
          <textarea
            className="w-full h-40 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-sm leading-relaxed"
            placeholder="Input prompt here... (Chinese or English)"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />

          {/* Tags Selection */}
          <div className="flex flex-wrap items-center gap-2">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedTags.includes(tag.name)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
              >
                #{tag.name}
              </button>
            ))}

            {isAddingTag ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  className="w-24 px-2 py-1 text-xs border border-blue-400 rounded-md outline-none"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  onBlur={() => setIsAddingTag(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                className="px-3 py-1 text-xs rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors"
              >
                + New
              </button>
            )}
          </div>
        </div>

        {/* Right: Image & Controls */}
        <div className="w-full lg:w-72 flex flex-col gap-4">

          {/* Image Upload Area */}
          <div
            className={`relative flex-1 min-h-[160px] rounded-xl border-2 border-dashed ${imagePreview ? 'border-transparent' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'} transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer bg-gray-50 group`}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                  Change Image
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md">
                  {imageRatio}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload size={24} className="mb-2" />
                <span className="text-xs">Upload Image</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="genType"
                  checked={genType === GenerationType.TextToImage}
                  onChange={() => setGenType(GenerationType.TextToImage)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Text to Image
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="genType"
                  checked={genType === GenerationType.ImageToImage}
                  onChange={() => setGenType(GenerationType.ImageToImage)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Image to Image
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={isProcessing || (!promptText.trim() && !imagePreview)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;