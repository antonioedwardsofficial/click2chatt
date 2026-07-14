import { NextRequest, NextResponse } from "next/server";

type Message = { role: "user" | "assistant"; content: string };

const BUSINESS_CONTEXT = `
You are the Click2Chatt AI Receptionist for Cars 2 Cuts Barbershop & Auto Spa in Chattanooga, Tennessee.

Verified business information:
- Website and booking entry point: https://cars2cuts.com
- Hours: Tuesday through Saturday, 12:00 PM to 8:00 PM. Closed Monday.
- The business currently operates as a barbershop with independent barbers.
- There are five barber booths total. Three are occupied and two may be available for qualified barbers.
- Auto detailing and hand car wash services are planned but are not currently operational.

Rules:
- Be concise, warm, direct, and useful.
- Never invent prices, availability, barber schedules, appointment confirmations, or services.
- Direct haircut and appointment requests to https://cars2cuts.com.
- For booth-rental, detailing-interest, complaints, partnerships, or requests requiring an owner, ask for the person's name and phone or email so a human can follow up.
- Clearly say detailing is planned and not currently operational.
- Do not claim that a booking is complete.
- The human owner remains the final decision-maker.
`;

function fallbackReply(input: string) {
  const text = input.toLowerCase();

  if (text.includes("hour") || text.includes("open") || text.includes("close")) {
    return { reply: "Cars 2 Cuts is open Tuesday through Saturday from 12:00 PM to 8:00 PM and is closed Monday.", intent: "answer" };
  }
  if (text.includes("book") || text.includes("appointment") || text.includes("haircut") || text.includes("barber")) {
    if (text.includes("booth") || text.includes("rent") || text.includes("work there")) {
      return { reply: "Cars 2 Cuts currently has five booths, with three occupied and two potentially available. Leave your name and phone or email so the owner can follow up about qualifications, rent, and availability.", intent: "lead" };
    }
    return { reply: "You can review the current barbers and begin booking at https://cars2cuts.com. Each barber manages their own schedule, so the website is the best source for current availability.", intent: "booking" };
  }
  if (text.includes("detail") || text.includes("car wash") || text.includes("wash my car")) {
    return { reply: "Auto detailing and hand car wash services are planned, but they are not operational yet. Leave your contact information if you want to be notified when those services launch.", intent: "lead" };
  }
  if (text.includes("price") || text.includes("cost") || text.includes("how much")) {
    return { reply: "Pricing and availability vary by barber. Please visit https://cars2cuts.com to view the active barbers and their current booking information.", intent: "booking" };
  }

  return { reply: "I can help with booking, business hours, barber booth inquiries, and information about future detailing services. For anything that needs the owner, leave your name and phone or email for follow-up.", intent: "answer" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? (body.messages as Message[]) : [];
    const safeMessages = messages
      .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
      .slice(-10)
      .map((message) => ({ ...message, content: message.content.slice(0, 800) }));

    const latest = [...safeMessages].reverse().find((message) => message.role === "user")?.content?.trim();
    if (!latest) return NextResponse.json({ error: "A message is required." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json(fallbackReply(latest));

    const transcript = safeMessages
      .map((message) => `${message.role === "user" ? "Customer" : "Receptionist"}: ${message.content}`)
      .join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: BUSINESS_CONTEXT }] },
          contents: [{ role: "user", parts: [{ text: transcript }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 280 },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!response.ok) return NextResponse.json(fallbackReply(latest));
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (!reply) return NextResponse.json(fallbackReply(latest));

    const leadTerms = ["name", "phone", "email", "follow up", "follow-up", "contact information"];
    const intent = leadTerms.some((term) => reply.toLowerCase().includes(term)) ? "lead" : reply.includes("cars2cuts.com") ? "booking" : "answer";
    return NextResponse.json({ reply, intent });
  } catch {
    return NextResponse.json({ error: "The receptionist could not process that message." }, { status: 500 });
  }
}
