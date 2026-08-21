import { NextRequest, NextResponse } from 'next/server';

const DISCLAIMER = 'This information is for educational purposes only. Do NOT use this to self-medicate. Always consult a qualified healthcare provider.';

const MEDICINE_DB: Record<string, { uses: string[]; side_effects: string[]; precautions: string[]; warnings: string[] }> = {
  paracetamol: { uses: ['Mild to moderate pain relief', 'Fever reduction'], side_effects: ['Nausea', 'Allergic reactions (rare)', 'Liver damage with overdose'], precautions: ['Do not exceed 4g per day', 'Avoid alcohol', 'Consult doctor if liver disease'], warnings: ['Overdose can cause severe liver damage'] },
  ibuprofen: { uses: ['Pain relief', 'Reducing inflammation', 'Fever reduction'], side_effects: ['Stomach upset', 'Heartburn', 'Nausea', 'Dizziness'], precautions: ['Take with food', 'Do not take with other NSAIDs'], warnings: ['Increases risk of heart attack with long-term use'] },
  aspirin: { uses: ['Pain relief', 'Fever reduction', 'Blood thinner'], side_effects: ['Stomach irritation', 'Heartburn', 'Increased bleeding risk'], precautions: ['Take with food', 'Not for children under 16'], warnings: ['Can cause stomach bleeding', 'Reye syndrome risk in children'] },
  metformin: { uses: ['Type 2 diabetes management', 'Improves insulin sensitivity'], side_effects: ['Nausea', 'Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency'], precautions: ['Take with meals', 'Regular kidney monitoring needed'], warnings: ['Risk of lactic acidosis'] },
  amoxicillin: { uses: ['Bacterial infections', 'Dental infections', 'H. pylori treatment'], side_effects: ['Diarrhea', 'Nausea', 'Skin rash'], precautions: ['Complete full prescribed course', 'Inform doctor of penicillin allergy'], warnings: ['Severe allergic reaction possible if allergic to penicillin'] },
  cetirizine: { uses: ['Allergy relief', 'Hives and itching', 'Runny nose'], side_effects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue'], precautions: ['Avoid driving if drowsy', 'Avoid alcohol'], warnings: ['Not a substitute for epinephrine'] },
  omeprazole: { uses: ['Acid reflux (GERD)', 'Stomach ulcers', 'Erosive esophagitis'], side_effects: ['Headache', 'Nausea', 'Diarrhea', 'Vitamin B12 deficiency'], precautions: ['Take 30 minutes before meal', 'May interact with other medications'], warnings: ['Long-term use may increase bone fracture risk'] },
  azithromycin: { uses: ['Bacterial infections', 'Travelers diarrhea', 'Certain STIs'], side_effects: ['Diarrhea', 'Nausea', 'Abdominal pain'], precautions: ['Complete full course', 'May cause heart rhythm issues'], warnings: ['Seek help for severe diarrhea'] },
};

function searchLocalDB(query: string): string | null {
  const key = query.toLowerCase().trim();
  for (const [name, data] of Object.entries(MEDICINE_DB)) {
    if (key.includes(name) || name.includes(key)) {
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return `### ${cap(name)}\n\n### Common Uses\n${data.uses.map(u => `- ${u}`).join('\n')}\n\n### Side Effects\n${data.side_effects.map(s => `- ${s}`).join('\n')}\n\n### Precautions\n${data.precautions.map(p => `- ${p}`).join('\n')}\n\n### Warnings\n${data.warnings.map(w => `- ${w}`).join('\n')}`;
    }
  }
  return null;
}

async function callLLM(query: string): Promise<string> {
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
            { role: 'system', content: 'You are a medication information assistant. Provide educational info about medicines. Use markdown with ### headings and - for lists. NEVER prescribe dosages.' },
            { role: 'user', content: `Provide educational information about: ${query}. Include: Common Uses, Side Effects, Precautions, Warnings.` },
          ],
          max_tokens: 800,
          temperature: 0.5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch {}
  }
  return '';
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');
  if (!query) {
    return NextResponse.json({ detail: 'Query parameter required' }, { status: 400 });
  }

  const localResult = searchLocalDB(query);
  if (localResult) {
    return NextResponse.json({
      medicine: query,
      information: localResult,
      disclaimer: DISCLAIMER,
      source: 'Local medicine database',
    });
  }

  const llmResult = await callLLM(query);
  if (llmResult.trim()) {
    return NextResponse.json({
      medicine: query,
      information: llmResult,
      disclaimer: DISCLAIMER,
      source: 'AI-generated (educational only)',
    });
  }

  return NextResponse.json({
    medicine: query,
    information: `### ${query}\n\nInformation not found in local database.\n\n### What To Do\n- Consult your doctor or pharmacist\n- Read the medication label\n- Check reliable sources like Mayo Clinic or WebMD\n\n*To enable AI-powered lookup, add OPENAI_API_KEY in Vercel environment variables.*`,
    disclaimer: DISCLAIMER,
    source: 'fallback',
  });
}