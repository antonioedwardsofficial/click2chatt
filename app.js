// app.js
// Handles sending user messages to the Gemini backend

const chatBox = document.getElementById("chat");
const inputField = document.getElementById("input");
const sendBtn = document.getElementById("send");

sendBtn.onclick = () => sendMessage();

inputField.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const text = inputField.value.trim();
  if (!text) return;

  appendMessage("user", text);
  inputField.value = "";

  appendMessage("bot", "Typing...");

  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    document.querySelector(".bot:last-child").innerText =
      data.reply || "No response.";
  } catch (error) {
    document.querySelector(".bot:last-child").innerText =
      "Error connecting to Gemini.";
  }
}
