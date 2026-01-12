// src/background.ts
import { generateReply } from "./services/gemini";
import { getApiKey } from "./utils/storage";

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "GENERATE_GMAIL_DRAFT") {
    // We fetch the key inside the background worker
    getApiKey().then(async (apiKey) => {
      if (!apiKey) {
        sendResponse({
          success: false,
          error: "API Key not found. Please set it in the extension popup.",
        });
        return;
      }

      try {
        const draft = await generateReply(
          apiKey,
          request.context,
          "Professional"
        );
        sendResponse({ success: true, draft });
      } catch (error: any) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; // Required for async sendResponse
  }
});
