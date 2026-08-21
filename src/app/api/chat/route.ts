import { NextRequest, NextResponse } from 'next/server';

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
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: HC_SYSTEM },
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch { /* OpenAI failed */ }
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ detail: 'Message cannot be empty' }, { status: 400 });

    const risk_level = checkRisk(message);

    if (isEmergency(message)) {
      const emergencyResp = `⚠️ **EMERGENCY DETECTED** ⚠️\n\nBased on what you've described, you may be experiencing a **medical emergency**. Please take immediate action:\n\n1. **Call your local emergency number** (911 in the US, 112 in Europe, 108 in India) **right now**.\n2. Do NOT drive yourself to the hospital if you are alone.\n3. If someone is with you, ask them to call for help.\n4. If you have emergency medication (e.g., nitroglycerin, EpiPen), use it as directed.\n\n**This AI assistant cannot provide emergency care. Please seek immediate medical attention.**`;
      const entry: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer: emergencyResp, timestamp: new Date().toISOString(), sources: [] };
      (globalThis._chatHistory as ChatEntry[]).unshift(entry);
      return NextResponse.json({ answer: emergencyResp, sources: [], risk_level: 'urgent', disclaimer: DISCLAIMER });
    }

    const answer = await callLLM(message);
    const finalAnswer = answer.trim() || generateFallback(message, risk_level);

    const sources: string[] = [];
    const entry: ChatEntry = { id: `ch-${Date.now()}`, question: message, answer: finalAnswer, timestamp: new Date().toISOString(), sources };
    (globalThis._chatHistory as ChatEntry[]).unshift(entry);
    if ((globalThis._chatHistory as ChatEntry[]).length > 100) (globalThis._chatHistory as ChatEntry[]).pop();

    return NextResponse.json({ answer: finalAnswer, sources, risk_level, disclaimer: DISCLAIMER });
  } catch {
    return NextResponse.json({ detail: 'Failed to process message' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ history: (globalThis._chatHistory as ChatEntry[]) || [] });
}

function generateFallback(message: string, risk: string): string {
  const t = message.toLowerCase();

  if (t.includes('headache')) return `### About Headaches\n\nHeadaches are one of the most common health complaints. Here's what you should know:\n\n### Possible Causes\n- **Tension headache** - Most common, feels like a tight band around the head\n- **Migraine** - Throbbing pain, often on one side, may include nausea and light sensitivity\n- **Dehydration** - Not drinking enough water can trigger headaches\n- **Eye strain** - Extended screen time or uncorrected vision\n- **Sinus congestion** - Pressure around forehead and cheeks\n\n### Suggestions\n- Rest in a quiet, dark room\n- Stay hydrated (drink 8+ glasses of water)\n- Apply a cold or warm compress to your forehead\n- Take over-the-counter pain relief if appropriate\n- Reduce screen time and take regular breaks\n\n### When to Seek Help\n- Sudden, severe headache ("worst headache of your life")\n- Headache with fever and stiff neck\n- Headache after a head injury\n- Headache that worsens over days\n\n**Note:** This is general information only. Please consult a healthcare provider if headaches persist or are severe.`;

  if (t.includes('fever')) return `### About Fever\n\nFever is a sign that your body is fighting an infection. Here's what you should know:\n\n### Possible Causes\n- **Viral infections** - Common cold, flu, COVID-19\n- **Bacterial infections** - Strep throat, urinary tract infection\n- **Heat exhaustion** - Prolonged exposure to high temperatures\n\n### Suggestions\n- Rest and stay hydrated\n- Take over-the-counter fever reducers (follow package instructions)\n- Use a cool compress on your forehead\n- Wear light, breathable clothing\n\n### When to Seek Help\n- Fever above 103°F (39.4°C)\n- Fever lasting more than 3 days\n- Fever with severe headache, rash, or breathing difficulty\n- In infants under 3 months: any fever above 100.4°F (38°C)\n\n**Note:** This is general information only. Please consult a healthcare provider.`;

  if (t.includes('diabet')) return `### About Diabetes\n\nDiabetes is a chronic condition that affects how your body processes blood sugar (glucose).\n\n### Types\n- **Type 1 Diabetes** - Autoimmune condition, body produces no insulin\n- **Type 2 Diabetes** - Body becomes resistant to insulin, most common type\n- **Gestational Diabetes** - Occurs during pregnancy\n\n### Key Management Points\n- Monitor blood sugar levels regularly\n- Follow a balanced diet (limit refined sugars and carbs)\n- Exercise regularly (at least 150 minutes per week)\n- Take prescribed medications as directed\n- Regular check-ups with your healthcare provider\n\n### When to Seek Help\n- Very high or very low blood sugar readings\n- Symptoms of hypoglycemia: shakiness, confusion, sweating\n- Symptoms of hyperglycemia: excessive thirst, frequent urination\n\n**Note:** This is general information only. Always follow your doctor's treatment plan.`;

  if (t.includes('cold') || t.includes('flu') || t.includes('cough')) return `### About Cold & Flu\n\n### Common Symptoms\n- **Cold** - Runny nose, sneezing, sore throat, mild cough\n- **Flu** - High fever, body aches, fatigue, severe cough, chills\n\n### Suggestions\n- Get plenty of rest\n- Drink warm fluids (water, tea, soup)\n- Use over-the-counter decongestants and pain relievers\n- Gargle with warm salt water for sore throat\n- Use a humidifier to ease congestion\n\n### When to Seek Help\n- Difficulty breathing or shortness of breath\n- Fever above 103°F (39.4°C)\n- Symptoms lasting more than 10 days\n- Coughing up blood\n\n**Note:** This is general information only. Please consult a healthcare provider if symptoms are severe.`;

  if (risk === 'high') return `### Important Notice\n\nYour description suggests symptoms that may require **prompt medical attention**.\n\n### Recommendation\n- **Consult a healthcare provider as soon as possible**\n- Do not ignore persistent or worsening symptoms\n- Keep a record of your symptoms (when they started, severity, triggers)\n\n**This is general information only. A healthcare provider can give you proper medical advice.**`;
  if (risk === 'moderate') return `### General Health Information\n\nThank you for your question. Based on general health knowledge:\n\n### What You Can Do\n- **Monitor your symptoms** - Track when they occur and their severity\n- **Stay hydrated** - Drink plenty of water and fluids\n- **Get adequate rest** - Sleep 7-9 hours per night\n- **Maintain a balanced diet** - Eat fruits, vegetables, and whole grains\n- **Exercise gently** - Light activity if you feel up to it\n\n### When to See a Doctor\n- If symptoms persist beyond a few days\n- If symptoms worsen significantly\n- If you develop new or concerning symptoms\n\n**Note:** This is general information only and does not replace professional medical advice.`;

  return `### HealthAssist AI\n\nThank you for your question. I'm designed to provide general health information.\n\n### How I Can Help\n- **Symptom information** - Describe your symptoms for general guidance\n- **Health topics** - Ask about conditions, wellness, nutrition\n- **Medicine info** - Use the Medicine Information page for drug details\n\n### Important\nThis is an educational tool only. **Always consult a qualified healthcare provider** for medical advice, diagnosis, or treatment.\n\n*To enable AI-powered responses, configure an OpenAI API key in your Vercel environment variables.*`;
}