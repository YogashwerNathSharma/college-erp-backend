import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, X, Loader2, Volume2, VolumeX, Maximize2, Minimize2, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { processCommand } from "../../services/ynAiService";
import "./YnAiAssistant.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: {
    type: "navigate" | "fetch" | "print" | "show" | "generate";
    payload?: any;
  };
};

// 🤖 yn AI Robot Icon SVG
const YnAiIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="16" width="36" height="30" rx="8" fill="url(#robotGrad)" stroke="#4F46E5" strokeWidth="2"/>
    <line x1="32" y1="16" x2="32" y2="8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="32" cy="6" r="3" fill="#22D3EE" className="yn-ai-antenna-pulse"/>
    <circle cx="24" cy="30" r="4" fill="#22D3EE" className="yn-ai-eye"/>
    <circle cx="40" cy="30" r="4" fill="#22D3EE" className="yn-ai-eye"/>
    <circle cx="24" cy="30" r="2" fill="white" opacity="0.7"/>
    <circle cx="40" cy="30" r="2" fill="white" opacity="0.7"/>
    <path d="M25 38 Q32 43 39 38" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <rect x="20" y="46" width="24" height="12" rx="4" fill="url(#robotGrad)" stroke="#4F46E5" strokeWidth="1.5"/>
    <circle cx="32" cy="52" r="3" fill="#22D3EE" opacity="0.8"/>
    <rect x="8" y="48" width="12" height="4" rx="2" fill="#6366F1" opacity="0.8"/>
    <rect x="44" y="48" width="12" height="4" rx="2" fill="#6366F1" opacity="0.8"/>
    <defs>
      <linearGradient id="robotGrad" x1="14" y1="16" x2="50" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EEF2FF"/>
        <stop offset="1" stopColor="#C7D2FE"/>
      </linearGradient>
    </defs>
  </svg>
);

// Panel states: closed | minimized | open | expanded
type PanelState = "closed" | "minimized" | "open" | "expanded";

export default function YnAiAssistant() {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `🤖 Namaste! Main **yn AI** hoon.

Mujhse kuch bhi poocho — bilkul ChatGPT ki tarah!

💬 General: "What is photosynthesis?", "5 + 3 kitna hota hai"
🏫 ERP: "Rahul ki fee dikhao", "class 10 ka report card"
🧠 Generate: "math paper banao", "lesson plan science"
📍 Navigate: "dashboard kholo", "attendance page"

Hindi, English, Hinglish — sab chalega! 🎤⌨️`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // Handles Hinglish well

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice not supported. Use Chrome browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakResponse = (text: string) => {
    if (!speakEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#_`|•📚💰📝📋📅🚌📖🧠📄📊📈🤖✅❌🔍💡⏳🖨️📍👨🎓👨🏫🏫💬🎤⌨️💪🏫━═]/g, "")
      .replace(/\n+/g, ". ")
      .slice(0, 250);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    // If minimized, open it
    if (panelState === "minimized") setPanelState("open");

    try {
      const response = await processCommand(text);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Execute action
      if (response.action) {
        switch (response.action.type) {
          case "navigate":
            setTimeout(() => navigate(response.action!.payload.path), 1200);
            break;
          case "print":
            setTimeout(() => window.open(response.action!.payload.path, "_blank"), 1200);
            break;
        }
      }

      speakResponse(response.message);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "❌ Kuch error aa gaya. Please dobara try karo.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick suggestions
  const quickSuggestions = [
    "📄 Paper Generate",
    "📋 Lesson Plan",
    "📊 School Stats",
    "💰 Fee Receipt",
    "📝 Report Card",
    "📋 Attendance",
    "❓ Help",
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER based on panel state
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // CLOSED — Show floating button
  if (panelState === "closed") {
    return (
      <button
        onClick={() => setPanelState("open")}
        className="yn-ai-fab fixed bottom-4 right-4 z-[9999] bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
        title="yn AI Assistant"
      >
        <YnAiIcon size={36} />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  // MINIMIZED — Small bar at bottom right
  if (panelState === "minimized") {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] w-[calc(100vw-32px)] max-w-[300px] bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 rounded-xl shadow-2xl flex items-center px-3 py-2 gap-2 animate-in cursor-pointer"
        onClick={() => setPanelState("open")}
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <YnAiIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">yn AI</p>
          <p className="text-white/60 text-[10px] truncate">
            {isProcessing ? "🧠 Processing..." : "Click to open"}
          </p>
        </div>
        {/* Quick input in minimized mode */}
        <input
          type="text"
          value={input}
          onChange={(e) => { e.stopPropagation(); setInput(e.target.value); }}
          onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Type here..."
          className="w-24 px-2 py-1 text-[11px] bg-white/20 text-white placeholder:text-white/50 rounded-md focus:outline-none focus:bg-white/30"
        />
        <button
          onClick={(e) => { e.stopPropagation(); setPanelState("closed"); }}
          className="text-white/70 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // OPEN or EXPANDED — Full chat panel
  const panelClasses = panelState === "expanded"
    ? "fixed inset-4 z-[9999]"
    : "fixed bottom-0 right-0 z-[9999] w-full h-full sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[600px] sm:rounded-2xl";

  return (
    <div className={`${panelClasses} bg-white shadow-2xl flex flex-col overflow-hidden border border-indigo-100 animate-in sm:rounded-2xl`}>
      {/* ══ HEADER ══ */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <YnAiIcon size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">yn AI</h3>
            <p className="text-white/70 text-[10px]">
              {isListening ? "🎤 Sun raha hoon..." : isProcessing ? "🧠 Soch raha hoon..." : "✨ Kuch bhi poocho!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSpeakEnabled(!speakEnabled)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10" title={speakEnabled ? "Mute" : "Unmute"}>
            {speakEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button onClick={() => setPanelState("minimized")} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10" title="Minimize">
            <Minus size={14} />
          </button>
          <button onClick={() => setPanelState(panelState === "expanded" ? "open" : "expanded")} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10" title={panelState === "expanded" ? "Restore" : "Maximize"}>
            {panelState === "expanded" ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={() => setPanelState("closed")} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ══ MESSAGES ══ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <YnAiIcon size={16} />
              </div>
            )}
            <div
              className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-indigo-100 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1">
              <YnAiIcon size={16} />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-indigo-100 shadow-sm">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ══ QUICK SUGGESTIONS (only at start) ══ */}
      {messages.length <= 2 && (
        <div className="px-3 py-2 border-t bg-slate-50/80 flex flex-wrap gap-1.5">
          {quickSuggestions.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleSend(cmd)}
              className="text-[11px] px-2.5 py-1 bg-white border border-indigo-200 rounded-full text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition"
            >
              {cmd}
            </button>
          ))}
        </div>
      )}

      {/* ══ INPUT ══ */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {isListening && (
          <div className="mb-2 flex items-center gap-2 text-xs text-red-500">
            <div className="voice-wave"><span /><span /><span /><span /><span /></div>
            <span>Bol raha hoon... sun raha hoon</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? "bg-red-100 text-red-600 animate-pulse shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600"
            }`}
            title={isListening ? "Stop" : "Voice command (🎤)"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Kuch bhi poocho..."
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-gray-400"
            disabled={isProcessing}
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
