import { NextRequest, NextResponse } from 'next/server';

const HC_SYSTEM = `You are a knowledgeable and empathetic Healthcare Conversational Assistant. You provide general health information for EDUCATIONAL PURPOSES ONLY.

CRITICAL RULES:
1. NEVER diagnose any condition.
2. NEVER prescribe medication or recommend dosages.
3. ALWAYS recommend consulting a qualified healthcare provider.
4. ALWAYS include a disclaimer that responses are educational only.
5. For emergencies, URGENTLY direct to emergency services (911/112/108).
6. Be empathetic, clear, concise.

FORMATTING RULES:
- Use ### for section headings.
- Use - for lists.
- Use **bold** for key terms.
- Separate sections with blank lines.`;

const EMERGENCY_KEYWORDS = ['chest pain', 'difficulty breathing', "can't breathe", 'loss of consciousness', 'unconscious', 'severe bleeding', 'stroke', 'suicidal', 'suicide', 'want to die', 'self-harm', 'seizure', 'overdose', 'poisoning', 'heart attack', 'anaphylaxis'];

function checkRisk(text: string): string {
  const t = text.toLowerCase();
  if (EMERGENCY_KEYWORDS.some(k => t.includes(k))) return 'urgent';
  if (['high fever', 'blood in stool', 'blood in urine', 'coughing blood', 'severe abdominal pain'].some(k => t.includes(k))) return 'high';
  if (['fever', 'headache', 'cough', 'sore throat', 'rash', 'nausea', 'vomiting', 'diarrhea', 'fatigue', 'dizziness'].some(k => t.includes(k))) return 'moderate';
  return 'low';
}

function isEmergency(text: string): boolean {
  return EMERGENCY_KEYWORDS.some(k => text.toLowerCase().includes(k));
}

const DISCLAIMER = 'This AI assistant provides information for educational purposes only. Always consult a qualified healthcare provider.';

interface ChatEntry { id: string; question: string; answer: string; timestamp: string; sources: string[]; }
if (typeof globalThis._chatHistory === 'undefined') globalThis._chatHistory = [] as ChatEntry[];

async function callLLM(message: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: HC_SYSTEM }, { role: 'user', content: message }], max_tokens: 1000, temperature: 0.7 }),
      });
      if (res.ok) { const data = await res.json(); return data.choices?.[0]?.message?.content || ''; }
    } catch {}
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ detail: 'Message cannot be empty' }, { status: 400 });
    const risk_level = checkRisk(message);
    if (isEmergency(message)) {
      const emergencyResp = 'EMERGENCY DETECTED - Call emergency services (108 in India) immediately. This AI cannot provide emergency care.';
      const entry: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer: emergencyResp, timestamp: new Date().toISOString(), sources: [] };
      (globalThis._chatHistory as ChatEntry[]).unshift(entry);
      return NextResponse.json({ answer: emergencyResp, sources: [], risk_level: 'urgent', disclaimer: DISCLAIMER });
    }
    const answer = await callLLM(message);
    const finalAnswer = answer.trim() || generateFallback(message, risk_level);
    const entry: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer: finalAnswer, timestamp: new Date().toISOString(), sources: [] };
    (globalThis._chatHistory as ChatEntry[]).unshift(entry);
    if ((globalThis._chatHistory as ChatEntry[]).length > 100) (globalThis._chatHistory as ChatEntry[]).pop();
    return NextResponse.json({ answer: finalAnswer, sources: [], risk_level, disclaimer: DISCLAIMER });
  } catch { return NextResponse.json({ detail: 'Failed to process message' }, { status: 500 }); }
}

export async function GET() {
  return NextResponse.json({ history: (globalThis._chatHistory as ChatEntry[]) || [] });
}

function generateFallback(message: string, risk: string): string {
  const t = message.toLowerCase();
  if (t.includes('headache')) return '### About Headaches\n\n### Possible Causes\n- Tension headache\n- Migraine\n- Dehydration\n- Eye strain\n- Sinus congestion\n\n### Suggestions\n- Rest in a quiet, dark room\n- Stay hydrated\n- Apply cold or warm compress\n\n**Note:** Consult a healthcare provider if headaches persist.';
  if (t.includes('fever')) return '### About Fever\n\n### Possible Causes\n- Viral infections\n- Bacterial infections\n\n### Suggestions\n- Rest and stay hydrated\n- Take over-the-counter fever reducers\n\n**Note:** Consult a healthcare provider if fever is above 103F or lasts more than 3 days.';
  if (t.includes('diabet')) return '### About Diabetes\n\n### Types\n- Type 1 Diabetes\n- Type 2 Diabetes\n\n### Management\n- Monitor blood sugar regularly\n- Follow a balanced diet\n- Exercise regularly\n\n**Note:** Always follow your doctors treatment plan.';
  if (t.includes('cold') || t.includes('flu') || t.includes('cough')) return '### About Cold & Flu\n\n### Symptoms\n- Cold: Runny nose, sneezing, sore throat\n- Flu: High fever, body aches, fatigue\n\n### Suggestions\n- Get plenty of rest\n- Drink warm fluids\n\n**Note:** Consult a healthcare provider if symptoms are severe.';
  if (risk === 'high') return '### Important Notice\n\nYour symptoms may require prompt medical attention. Please consult a healthcare provider.';
  if (risk === 'moderate') return '### General Health Information\n\n- Monitor your symptoms\n- Stay hydrated\n- Get adequate rest\n\n**Note:** Consult a healthcare provider if symptoms persist.';
  return '### HealthAssist AI\n\nI provide general health information. Ask about symptoms, conditions, or medicines.\n\n*To enable AI responses, add OPENAI_API_KEY in Vercel environment variables.*';
}