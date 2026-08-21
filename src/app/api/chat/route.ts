import { NextRequest, NextResponse } from 'next/server';

const HC_SYSTEM = `You are a Healthcare Conversational Assistant for EDUCATIONAL PURPOSES ONLY.
CRITICAL RULES:
1. NEVER diagnose. Say "Possible causes may include..." not "You have..."
2. NEVER prescribe medication or dosages.
3. ALWAYS recommend consulting a healthcare provider.
4. For emergencies, direct to emergency services (911/112/108).
5. Be empathetic, clear, concise.
FORMATTING (MANDATORY):
- Use ### for headings, - for lists, **bold** for emphasis.
- Separate sections with blank lines.
9. If unsure, say so.`;

const EMERGENCY_KW = ['chest pain', 'difficulty breathing', "can't breathe", 'loss of consciousness', 'unconscious', 'severe bleeding', 'stroke', 'suicidal', 'suicide', 'self-harm', 'seizure', 'overdose', 'heart attack', 'anaphylaxis'];

function checkRisk(t: string): string {
  const l = t.toLowerCase();
  if (EMERGENCY_KW.some(k => l.includes(k))) return 'urgent';
  if (['high fever', 'blood in stool', 'blood in urine', 'coughing blood', 'severe abdominal pain'].some(k => l.includes(k))) return 'high';
  if (['fever', 'headache', 'cough', 'sore throat', 'rash', 'nausea', 'vomiting', 'diarrhea', 'fatigue', 'dizziness'].some(k => l.includes(k))) return 'moderate';
  return 'low';
}

const DISCLAIMER = 'This provides information for educational purposes only. It does NOT diagnose, prescribe, or replace professional medical advice. Always consult a qualified healthcare provider.';

interface ChatEntry { id: string; question: string; answer: string; timestamp: string; sources: string[]; }
if (typeof globalThis._chatHistory === 'undefined') globalThis._chatHistory = [] as ChatEntry[];

async function callLLM(message: string): Promise<string> {
  // Try OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: HC_SYSTEM }, { role: 'user', content: message }], max_tokens: 1000, temperature: 0.7 }),
      });
      if (res.ok) { const d = await res.json(); return d.choices?.[0]?.message?.content || ''; }
    } catch {}
  }
  return '';
}

function fallback(msg: string, risk: string): string {
  const t = msg.toLowerCase();
  if (t.includes('headache')) return '### About Headaches\n\n### Possible Causes\n- **Tension headache** - Tight band feeling\n- **Migraine** - Throbbing, one side, nausea\n- **Dehydration** - Not enough water\n- **Eye strain** - Too much screen time\n- **Sinus congestion** - Pressure around forehead\n\n### Suggestions\n- Rest in a quiet, dark room\n- Stay hydrated\n- Cold/warm compress on forehead\n- OTC pain relief if appropriate\n\n### When to Seek Help\n- Sudden severe headache\n- Headache with fever and stiff neck\n- Headache after head injury\n\n*This is general information only. Consult a healthcare provider.*';
  if (t.includes('fever')) return '### About Fever\n\n### Possible Causes\n- **Viral infections** - Cold, flu, COVID-19\n- **Bacterial infections** - Strep throat, UTI\n- **Heat exhaustion**\n\n### Suggestions\n- Rest and hydrate\n- OTC fever reducers (follow instructions)\n- Cool compress on forehead\n\n### When to Seek Help\n- Fever above 103°F (39.4°C)\n- Lasting more than 3 days\n- Difficulty breathing\n\n*This is general information only. Consult a healthcare provider.*';
  if (t.includes('diabet')) return '### About Diabetes\n\n### Types\n- **Type 1** - No insulin production\n- **Type 2** - Insulin resistance (most common)\n\n### Key Management\n- Monitor blood sugar regularly\n- Balanced diet (limit sugars/carbs)\n- Exercise regularly (150 min/week)\n- Take prescribed medications\n\n### When to Seek Help\n- Very high/low blood sugar\n- Shaking, confusion, excessive thirst\n\n*This is general information only. Follow your doctor\'s plan.*';
  if (t.includes('cold') || t.includes('flu') || t.includes('cough')) return '### Cold & Flu\n\n### Cold Symptoms\n- Runny nose, sneezing, sore throat, mild cough\n\n### Flu Symptoms\n- High fever, body aches, fatigue, severe cough\n\n### Suggestions\n- Rest, warm fluids, OTC medicine\n- Salt water gargle for sore throat\n- Use a humidifier\n\n### When to Seek Help\n- Difficulty breathing\n- Fever above 103°F\n- Symptoms lasting 10+ days\n\n*This is general information only.*';
  if (risk === 'high') return '### ⚠️ Important\n\nYour symptoms may require **prompt medical attention**.\n\n- Consult a healthcare provider soon\n- Do not ignore persistent/worsening symptoms\n\n*Always seek professional medical advice.*';
  return '### HealthAssist AI\n\nThank you for your question. I provide general health information.\n\n### How I Can Help\n- **Describe symptoms** for guidance\n- **Ask about health topics**\n- **Use Medicine Info page** for drug details\n\n*To enable AI responses, add OPENAI_API_KEY to .env*\n\n*This is educational only. Always consult a healthcare provider.*';
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ detail: 'Message cannot be empty' }, { status: 400 });
    const risk_level = checkRisk(message);
    if (EMERGENCY_KW.some(k => message.toLowerCase().includes(k))) {
      const r = '⚠️ **EMERGENCY DETECTED** ⚠️\n\nCall your emergency number (911/112/108) **now**.\n\nDo not drive yourself. If someone is with you, ask them to call for help.';
      const e: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer: r, timestamp: new Date().toISOString(), sources: [] };
      (globalThis._chatHistory as ChatEntry[]).unshift(e);
      return NextResponse.json({ answer: r, sources: [], risk_level: 'urgent', disclaimer: DISCLAIMER });
    }
    const answer = (await callLLM(message)).trim() || fallback(message, risk_level);
    const e: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer, timestamp: new Date().toISOString(), sources: [] };
    (globalThis._chatHistory as ChatEntry[]).unshift(e);
    if ((globalThis._chatHistory as ChatEntry[]).length > 100) (globalThis._chatHistory as ChatEntry[]).pop();
    return NextResponse.json({ answer, sources: [], risk_level, disclaimer: DISCLAIMER });
  } catch { return NextResponse.json({ detail: 'Failed' }, { status: 500 }); }
}

export async function GET() { return NextResponse.json({ history: (globalThis._chatHistory as ChatEntry[]) || [] }); }