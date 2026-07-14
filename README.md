# Click2Chatt AI Receptionist

A working, human-supervised AI receptionist proof of concept for Cars 2 Cuts Barbershop & Auto Spa in Chattanooga, Tennessee.

## Version 1 capabilities

- Answers verified business questions
- Routes customers to Cars 2 Cuts booking
- Identifies booth-rental and detailing leads
- Uses deterministic fallback answers when no AI key is configured
- Uses Gemini when `GEMINI_API_KEY` is configured
- Refuses to invent prices, schedules, appointments, or active detailing services

## Local setup

```bash
npm install
npm run dev
```

Optional environment variable:

```bash
GEMINI_API_KEY=your_key_here
```

The application remains functional without the key by using guarded business rules.
