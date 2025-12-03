// app.js
// Front-end script to send user messages to /api/gemini and display responses

document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chat-window");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");

  // Append messages to chat window
  function appendMessage(text, sender = "user") {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "bubble user-bubble" : "bubble ai-bubble";
    bubble.innerText = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Handle form submit
  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = messageInput.value.trim();
    if (!input) return;

    // Show user's message
    appendMessage(input, "user");
    messageInput.value = "";

    // Call backend
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        appendMessage("⚠️ The AI is having trouble responding. Try again shortly.", "ai");
        return;
      }

      const data = await res.json();
      appendMessage(data.reply, "ai");
    } catch (err) {
      console.error("Client error:", err);
      appendMessage("❌ Network issue. Please try again.", "ai");
    }
  });
});
