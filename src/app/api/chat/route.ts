import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const HC_SYSTEM = `You are a knowledgeable and empathetic Healthcare Conversational Assistant. You provide general health information for EDUCATIONAL PURPOSES ONLY.

CRITICAL RULES:
1. NEVER diagnose any condition. Say "Possible causes may include..." not "You have..."
2. NEVER prescribe medication or recommend dosages.
3. NEVER recommend stopping prescribed medication.
4. ALWAYS recommend consulting a qualified healthcare provider.
5. ALWAYS include a disclaimer that responses are educational only.
6. For emergencies (chest pain, difficulty breathing, loss of consciousness, severe bleeding, stroke signs, suicidal thoughts), URGENTLY direct to emergency services (911/112/108).
7. Be empathetic, clear, concise.

FORMATTING RULES (MANDATORY):
- You MUST use proper Markdown formatting in EVERY response.
- Use ### for section headings (e.g., ### Possible Causes, ### Suggestions, ### When to Seek Help).
- Use - (hyphen) at the start of each line for ALL lists. NEVER write list items as bare text on separate lines.
- Use **bold** for emphasis on key medical terms and important points.
- Separate sections with a blank line.
- Example correct format:
  ### Possible Causes
  - Tension or stress
  - Dehydration
  - Lack of sleep

9. If unsure, say so honestly.`;

const EMERGENCY_KEYWORDS = ['chest pain', 'difficulty breathing', "can't breathe", 'loss of consciousness', 'unconscious', 'severe bleeding', 'stroke', 'suicidal', 'suicide', 'want to die', 'self-harm', 'seizure', 'overdose', 'poisoning', 'heart attack', 'anaphylaxis'];

function checkRisk(text: string): string {
  const t = text.toLowerCase();
  if (EMERGENCY_KEYWORDS.some(k => t.includes(k))) return 'urgent';
  if (['high fever', 'blood in stool', 'blood in urine', 'coughing blood', 'severe abdominal pain'].some(k => t.includes(k))) return 'high';
  if (['fever', 'headache', 'cough', 'sore throat', 'rash', 'nausea', 'vomiting', 'diarrhea', 'fatigue', 'dizziness'].some(k => t.includes(k))) return 'moderate';
  return 'low';
}

function isEmergency(text: string): boolean {
  const t = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(k => t.includes(k));
}

const DISCLAIMER = 'This AI-powered healthcare assistant provides information for educational purposes only. It does NOT provide medical diagnoses, prescribe treatments, or replace professional medical advice. Always consult a qualified healthcare provider.';

// Chat history stored in memory
interface ChatEntry { id: string; question: string; answer: string; timestamp: string; sources: string[]; user_id?: string; }
if (typeof globalThis._chatHistory === 'undefined') globalThis._chatHistory = [] as ChatEntry[];

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ detail: 'Message cannot be empty' }, { status: 400 });

    const risk_level = checkRisk(message);

    // Emergency check
    if (isEmergency(message)) {
      const emergencyResp = `⚠️ **EMERGENCY DETECTED** ⚠️\n\nBased on what you've described, you may be experiencing a **medical emergency**. Please take immediate action:\n\n1. **Call your local emergency number** (911 in the US, 112 in Europe, 108 in India) **right now**.\n2. Do NOT drive yourself to the hospital if you are alone.\n3. If someone is with you, ask them to call for help.\n4. If you have emergency medication (e.g., nitroglycerin, EpiPen), use it as directed.\n\n**This AI assistant cannot provide emergency care. Please seek immediate medical attention.**`;
      const entry: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer: emergencyResp, timestamp: new Date().toISOString(), sources: [] };
      (globalThis._chatHistory as ChatEntry[]).unshift(entry);
      return NextResponse.json({ answer: emergencyResp, sources: [], risk_level: 'urgent', disclaimer: DISCLAIMER });
    }

    let answer = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: HC_SYSTEM },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      });
      answer = completion.choices[0]?.message?.content || '';
    } catch {
      answer = generateFallback(message, risk_level);
    }

    const sources: string[] = [];
    const entry: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer, timestamp: new Date().toISOString(), sources };
    (globalThis._chatHistory as ChatEntry[]).unshift(entry);
    if ((globalThis._chatHistory as ChatEntry[]).length > 100) (globalThis._chatHistory as ChatEntry[]).pop();

    return NextResponse.json({ answer, sources, risk_level, disclaimer: DISCLAIMER });
  } catch {
    return NextResponse.json({ detail: 'Failed to process message' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ history: (globalThis._chatHistory as ChatEntry[]) || [] });
}

function generateFallback(message: string, risk: string): string {
  const parts = ['Thank you for your question. Based on the information provided:'];
  if (risk === 'high') parts.push('Your description suggests symptoms that may require **prompt medical attention**. I strongly recommend consulting a healthcare provider as soon as possible.');
  else if (risk === 'moderate') parts.push('Your symptoms are relatively common and may resolve on their own. However, if symptoms persist for more than a few days or worsen, please see a doctor.');
  else parts.push('This appears to be a general health query. Monitor your symptoms, maintain good hydration and rest, and consider over-the-counter medications for mild symptoms following package instructions.');
  parts.push('\n**Important:** This is general information only and does not replace professional medical advice. Please consult a qualified healthcare provider.');
  return parts.join('\n\n');
}