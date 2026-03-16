import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Image as ImageIcon, Loader2, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ATTIRE_OPTIONS = [
  { id: 'white-shirt', label: 'Áo sơ mi trắng (White Shirt)', prompt: 'white button-down shirt' },
  { id: 'black-suit', label: 'Áo vest đen (Black Suit)', prompt: 'black suit with a white shirt and tie' },
  { id: 'navy-suit', label: 'Áo vest xanh navy (Navy Suit)', prompt: 'navy blue suit with a white shirt and tie' },
  { id: 'ao-dai', label: 'Áo dài truyền thống (Ao Dai)', prompt: 'traditional Vietnamese Ao Dai' },
];

const BACKGROUND_OPTIONS = [
  { id: 'blue', label: 'Nền xanh (Blue)', prompt: 'blue', colorClass: 'bg-blue-600' },
  { id: 'white', label: 'Nền trắng (White)', prompt: 'white', colorClass: 'bg-white' },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [selectedAttire, setSelectedAttire] = useState(ATTIRE_OPTIONS[0]);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setImageMimeType(file.type);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setImageMimeType(file.type);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePhoto = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data without the data:image/...;base64, prefix
      const base64Data = selectedImage.split(',')[1];

      const prompt = `Transform this photo into a professional ID photo. The person must be wearing a ${selectedAttire.prompt}. Ensure the person has a serious, professional expression. The lighting must be bright and even, like a studio portrait. The background MUST be a solid, plain ${selectedBackground.prompt} color. Maintain the person's facial identity perfectly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: imageMimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let foundImage = false;
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error('No image was generated. Please try again.');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'An error occurred while generating the photo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'professional-id-photo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              ID
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ProPhoto Gen</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Upload Section */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-medium mb-4">1. Tải ảnh lên (Upload Photo)</h2>
              
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${selectedImage ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {selectedImage ? (
                  <div className="space-y-4">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
                      <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-medium text-blue-600">Nhấn để thay đổi ảnh</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
                      <Upload size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">Kéo thả ảnh vào đây</p>
                      <p className="text-sm text-slate-500 mt-1">hoặc nhấn để chọn file</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Attire Selection */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-medium mb-4">2. Chọn trang phục (Select Attire)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ATTIRE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedAttire(option)}
                    className={`
                      p-3 rounded-xl text-left border transition-all text-sm font-medium
                      ${selectedAttire.id === option.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Background Selection */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-medium mb-4">3. Chọn phông nền (Select Background)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedBackground(option)}
                    className={`
                      p-3 rounded-xl text-left border transition-all text-sm font-medium flex items-center gap-3
                      ${selectedBackground.id === option.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    <div className={`w-6 h-6 rounded-full border border-slate-300 shadow-sm ${option.colorClass}`}></div>
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Action Button */}
            <button
              onClick={generatePhoto}
              disabled={!selectedImage || isGenerating}
              className={`
                w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all
                ${!selectedImage || isGenerating 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]'}
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang tạo ảnh... (Generating...)
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Tạo ảnh thẻ (Generate ID Photo)
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full min-h-[500px] flex flex-col">
              <h2 className="text-lg font-medium mb-4 flex items-center justify-between">
                <span>Kết quả (Result)</span>
                {generatedImage && (
                  <button
                    onClick={handleDownload}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Download size={16} />
                    Tải xuống (Download)
                  </button>
                )}
              </h2>
              
              <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm z-10"
                    >
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-600 font-medium animate-pulse">AI đang xử lý khuôn mặt...</p>
                    </motion.div>
                  ) : generatedImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex items-center justify-center p-4"
                    >
                      <img 
                        src={generatedImage} 
                        alt="Generated ID Photo" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-slate-400 p-8"
                    >
                      <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Ảnh thẻ của bạn sẽ xuất hiện ở đây</p>
                      <p className="text-sm mt-1">Your ID photo will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
