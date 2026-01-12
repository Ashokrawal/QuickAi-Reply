const injectAiButton = () => {
  // 1. Target the 'btC' row which contains all action buttons
  const composeRows = document.querySelectorAll(".btC");

  composeRows.forEach((row) => {
    // Avoid duplicate buttons in the same row
    if (row.querySelector(".ai-draft-button-cell")) return;

    // 2. Find the Formatting Options button (Aa) to use as an anchor
    // Gmail uses 'div.dv > div.a3I' for that specific icon cell
    const formatBtnIcon = row.querySelector("div.dv > div.a3I");
    const anchorTd = formatBtnIcon?.closest("td");

    if (anchorTd) {
      // 3. Clone the anchor <td> to inherit Gmail's native spacing/padding
      const aiTd = anchorTd.cloneNode(false) as HTMLTableCellElement;
      aiTd.classList.add("ai-draft-button-cell");

      // 4. Create the Button
      const btn = document.createElement("div");
      btn.className = "ai-draft-button";

      const iconUrl = chrome.runtime.getURL("email-writer.webp");

      // Professional Flexbox layout for the button
      btn.innerHTML = `
        <img src="${iconUrl}" style="width: 20px; height: 20px; border-radius: 50%; display: block;" title="AI Draft" />
      `;

      // Styling to match the native round icon buttons
      Object.assign(btn.style, {
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        transition: "background-color 0.2s",
        marginLeft: "2px",
        marginRight: "2px",
      });

      // Hover Effect
      btn.onmouseenter = () =>
        (btn.style.backgroundColor = "rgba(32, 33, 36, 0.059)");
      btn.onmouseleave = () => (btn.style.backgroundColor = "transparent");

      // 5. Execution Logic
      btn.onclick = async () => {
        const img = btn.querySelector("img");
        if (img) img.style.opacity = "0.5"; // Loading visual

        const emailContent =
          (document.querySelector(".ii.gt") as HTMLElement)?.innerText || "";

        chrome.runtime.sendMessage(
          { type: "GENERATE_GMAIL_DRAFT", context: emailContent },
          (response) => {
            if (response.success) {
              const replyBox = row
                .closest("table")
                ?.parentElement?.querySelector(
                  'div[contenteditable="true"]'
                ) as HTMLElement;

              if (replyBox) {
                replyBox.focus();
                document.execCommand("insertText", false, response.draft);
                replyBox.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }
            if (img) img.style.opacity = "1";
          }
        );
      };

      aiTd.appendChild(btn);

      // 6. PRECISE PLACEMENT: Insert right before the formatting button (Aa)
      anchorTd.parentElement?.insertBefore(aiTd, anchorTd);
    }
  });
};

// Continuous observation for new reply windows
const observer = new MutationObserver(() => injectAiButton());
observer.observe(document.body, { childList: true, subtree: true });
