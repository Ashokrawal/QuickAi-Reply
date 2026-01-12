import React, { useState, useEffect } from "react";
import { generateReply } from "../services/gemini";
import { getApiKey, saveApiKey } from "../utils/storage";

const Popup = () => {
  // --- State Management ---
  const [view, setView] = useState<"main" | "settings">("main");
  const [tone, setTone] = useState("Professional");
  const [userInput, setUserInput] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy to Clipboard");

  // --- Load API Key on Startup ---
  // Inside your Popup component
  useEffect(() => {
    const init = async () => {
      const savedKey = await getApiKey();
      if (savedKey) {
        setApiKey(savedKey); // This fills the input box automatically
      }
    };
    init();
  }, []);

  const handleInsertReply = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: (textToInsert: string) => {
          // Find Gmail's reply box (it's a div with contenteditable="true")
          const replyBox = document.querySelector(
            'div[contenteditable="true"][role="textbox"]'
          ) as HTMLElement;

          if (replyBox) {
            replyBox.innerText = textToInsert;
            // Trigger an 'input' event so Gmail knows the text has changed
            replyBox.dispatchEvent(new Event("input", { bubbles: true }));
          } else {
            alert(
              "Could not find the reply box. Are you sure the reply window is open?"
            );
          }
        },
        args: [generatedText], // Pass the AI text into the script
      });
    } catch (error) {
      console.error("Insert error:", error);
    }
  };

  const handleReadEmail = async () => {
    setLoading(true);
    try {
      // 1. Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // 2. Execute a script to grab text from the page (Gmail specific)
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          // This selector targets the body of an open email in Gmail
          const emailBody = document.querySelector(".ii.gt") as HTMLElement;
          return emailBody?.innerText || "";
        },
      });

      const grabbedText = result[0].result;
      if (grabbedText) {
        setUserInput(`Draft a reply to this email: ${grabbedText}`);
      } else {
        alert("No email content found. Make sure an email is open!");
      }
    } catch (error) {
      console.error("Scripting error:", error);
      alert("Please refresh Gmail or check permissions.");
    } finally {
      setLoading(false);
    }
  };

  // --- Action Handlers ---
  const handleGenerate = async () => {
    if (!userInput) return;
    setLoading(true);
    try {
      const result = await generateReply(apiKey, userInput, tone);
      setGeneratedText(result);
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    await saveApiKey(apiKey);
    setView("main");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy to Clipboard"), 2000);
  };

  // --- Settings View ---
  if (view === "settings") {
    return (
      <div className="w-[360px] p-6 bg-white flex flex-col font-sans antialiased shadow-2xl">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          API Configuration
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Enter your Gemini API Key to enable AI drafting.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste API Key here..."
          className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-4"
        />
        <button
          onClick={handleSaveSettings}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
        >
          Save and Continue
        </button>
      </div>
    );
  }

  // --- Main View ---
  return (
    <div className="w-[360px] min-h-[480px] bg-white flex flex-col font-sans antialiased shadow-2xl overflow-hidden">
      {/* Premium Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            <img
              src="/email-writer.webp"
              alt="Logo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              QuickReply AI
            </h1>
            <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
              Enterprise Edition
            </span>
          </div>
        </div>
        <button
          onClick={() => setView("settings")}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
        >
          ⚙️
        </button>
      </header>

      <div className="flex justify-between items-end">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
          Your Message
        </label>
        <button
          onClick={handleReadEmail}
          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
        >
          📥 Read Open Email
        </button>
      </div>

      {/* Main Content Area */}
      <section className="p-5 flex-1 space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
            Response Strategy
          </label>
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {["Professional", "Friendly", "Direct"].map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  tone === t
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Briefly describe your reply..."
            className="w-full h-32 p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !userInput}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
            loading || !userInput
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 active:scale-[0.97]"
          }`}
        >
          <span>{loading ? "⏳" : "✨"}</span>
          {loading ? "Generating Draft..." : "Draft Response"}
        </button>

        {/* Generated Text Area */}
        {generatedText && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-slate-700 mb-3 max-h-40 overflow-y-auto leading-relaxed">
              {generatedText}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleInsertReply}
                className="py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                🚀 Insert into Gmail
              </button>
              <button
                onClick={handleCopy}
                className="py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
              >
                {copyLabel}
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
        <span className="text-[10px] text-slate-400 font-medium">
          System Status
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
            Active
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
};

export default Popup;
