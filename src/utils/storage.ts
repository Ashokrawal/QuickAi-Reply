// src/utils/storage.ts

export const saveApiKey = async (key: string): Promise<void> => {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ gemini_api_key: key }, () => {
        console.log("Saved to Chrome Storage");
        resolve();
      });
    });
  } else {
    localStorage.setItem("gemini_api_key", key);
    console.log("Saved to LocalStorage (Dev Mode)");
  }
};

export const getApiKey = async (): Promise<string | null> => {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["gemini_api_key"], (result) => {
        resolve(result.gemini_api_key || null);
      });
    });
  } else {
    return localStorage.getItem("gemini_api_key");
  }
};
