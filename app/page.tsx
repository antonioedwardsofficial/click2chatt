"use client";

import { FormEvent, useMemo, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const starters = [
  "How do I book a haircut?",
  "What are your hours?",
  "Are barber booths available?",
  "Do you offer auto detailing?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Cars 2 Cuts. I can help with booking, hours, booth-rental inquiries, and information about upcoming detailing services. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: clean }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to answer right now.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      if (data.intent === "lead") setLeadOpen(true);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I’m having trouble connecting right now. You can still use the booking button below, or leave your contact information for follow-up.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadSaved(true);
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="eyebrow">CLICK2CHATT AI • LIVE PROOF OF CONCEPT</div>
        <h1>Your local business should never miss a conversation.</h1>
        <p>
          This is the working Click2Chatt AI Receptionist, beginning with Cars 2 Cuts Barbershop & Auto Spa in Chattanooga.
        </p>
        <div className="hero-actions">
          <a className="primary-button" href="#receptionist">Try the receptionist</a>
          <a className="secondary-button" href="https://cars2cuts.com" target="_blank" rel="noreferrer">Visit Cars 2 Cuts</a>
        </div>
      </section>

      <section className="proof-grid">
        <article><strong>Answers</strong><span>Business questions immediately</span></article>
        <article><strong>Routes</strong><span>Customers toward booking</span></article>
        <article><strong>Captures</strong><span>Potential customers and barbers</span></article>
      </section>

      <section id="receptionist" className="chat-card">
        <header className="chat-header">
          <div className="avatar">C2C</div>
          <div>
            <h2>Cars 2 Cuts Assistant</h2>
            <p><span className="status-dot" /> Available now</p>
          </div>
        </header>

        <div className="message-window" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              {message.content}
            </div>
          ))}
          {loading && <div className="message assistant typing">Thinking…</div>}
        </div>

        <div className="starter-row">
          {starters.map((starter) => (
            <button key={starter} type="button" onClick={() => void sendMessage(starter)} disabled={loading}>
              {starter}
            </button>
          ))}
        </div>

        <form className="composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="message">Message</label>
          <input
            id="message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about booking, hours, booths, or detailing…"
            maxLength={500}
          />
          <button type="submit" disabled={!canSend}>Send</button>
        </form>

        <div className="conversion-bar">
          <a href="https://cars2cuts.com" target="_blank" rel="noreferrer">Book a barber</a>
          <button type="button" onClick={() => setLeadOpen((value) => !value)}>Request follow-up</button>
        </div>

        {leadOpen && (
          <form className="lead-form" onSubmit={saveLead}>
            {leadSaved ? (
              <p className="success-message">Your request has been captured in this demo. Database delivery is the next production connection.</p>
            ) : (
              <>
                <h3>Request a follow-up</h3>
                <div className="form-grid">
                  <input required name="name" placeholder="Name" />
                  <input required name="contact" placeholder="Phone or email" />
                </div>
                <select name="reason" defaultValue="">
                  <option value="" disabled>What do you need?</option>
                  <option>Haircut or barber help</option>
                  <option>Booth-rental information</option>
                  <option>Auto-detailing information</option>
                  <option>Something else</option>
                </select>
                <button type="submit">Save request</button>
              </>
            )}
          </form>
        )}
      </section>

      <footer>
        <strong>Powered by Click2Chatt AI</strong>
        <span>Human-supervised communication systems for local businesses.</span>
      </footer>
    </main>
  );
}
