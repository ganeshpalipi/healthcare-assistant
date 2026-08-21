import { NextRequest, NextResponse } from 'next/server';

const DISCLAIMER = 'This is for educational purposes only. Do NOT self-medicate. Always consult a healthcare provider.';

const MEDICINE_DB: Record<string, { uses: string[]; side_effects: string[]; precautions: string[]; warnings: string[] }> = {
  paracetamol: { uses: ['Mild to moderate pain relief', 'Fever reduction'], side_effects: ['Nausea', 'Allergic reactions (rare)', 'Liver damage with overdose'], precautions: ['Do not exceed 4g per day', 'Avoid alcohol', 'Consult doctor if liver disease'], warnings: ['Overdose causes severe liver damage', 'Check labels — many cold medicines contain paracetamol'] },
  ibuprofen: { uses: ['Pain relief', 'Reducing inflammation', 'Fever reduction'], side_effects: ['Stomach upset', 'Heartburn', 'Nausea', 'Stomach ulcers with long-term use'], precautions: ['Take with food', 'Do not take with other NSAIDs', 'Consult doctor if kidney/heart disease'], warnings: ['Heart attack/stroke risk with long-term use', 'Not recommended in third trimester'] },
  aspirin: { uses: ['Pain relief', 'Fever reduction', 'Blood thinner (low-dose)'], side_effects: ['Stomach irritation', 'Heartburn', 'Increased bleeding'], precautions: ['Take with food', 'Not for children under 16', 'Inform doctor before surgery'], warnings: ['Can cause stomach bleeding', 'Reye syndrome risk in children'] },
  metformin: { uses: ['Type 2 diabetes management', 'Improves insulin sensitivity'], side_effects: ['Nausea', 'Diarrhea', 'Vitamin B12 deficiency', 'Lactic acidosis (rare)'], precautions: ['Take with meals', 'Regular kidney monitoring', 'Inform doctor before imaging procedures'], warnings: ['Risk of lactic acidosis', 'Alcohol increases risk'] },
  amoxicillin: { uses: ['Bacterial infections', 'Dental infections', 'H. pylori'], side_effects: ['Diarrhea', 'Nausea', 'Skin rash', 'Yeast infection'], precautions: ['Complete full course', 'Inform doctor of penicillin allergy', 'May reduce birth control effectiveness'], warnings: ['Severe allergy if allergic to penicillin', 'Do not use for viral infections'] },
  cetirizine: { uses: ['Allergy relief', 'Hives and itching', 'Runny nose'], side_effects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue'], precautions: ['Avoid driving if drowsy', 'Avoid alcohol', 'Consult doctor if kidney disease'], warnings: ['Not a substitute for epinephrine in anaphylaxis'] },
  omeprazole: { uses: ['Acid reflux (GERD)', 'Stomach ulcers', 'Erosive esophagitis'], side_effects: ['Headache', 'Nausea', 'Diarrhea', 'B12 deficiency', 'Bone fractures (long-term)'], precautions: ['Take 30 min before meal', 'Not for long-term without supervision', 'May interact with other meds'], warnings: ['Long-term use increases fracture risk', 'Reduces magnesium, B12, iron absorption'] },
  azithromycin: { uses: ['Bacterial infections', 'Traveler diarrhea', 'Certain STIs'], side_effects: ['Diarrhea', 'Nausea', 'Abdominal pain'], precautions: ['Take on empty stomach or with food', 'Complete full course'], warnings: ['Do not take with aluminum/magnesium antacids', 'Watch for severe diarrhea'] },
};

function searchLocalDB(query: string): string | null {
  const key = query.toLowerCase().trim();
  for (const [name, data] of Object.entries(MEDICINE_DB)) {
    if (key.includes(name) || name.includes(key)) {
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return `### ${cap(name)}\n\n### Common Uses\n${data.uses.map(u => '- ' + u).join('\n')}\n\n### Side Effects\n${data.side_effects.map(s => '- ' + s).join('\n')}\n\n### Precautions\n${data.precautions.map(p => '- ' + p).join('\n')}\n\n### Warnings\n${data.warnings.map(w => '- ' + w).join('\n')}`;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');
  if (!query) return NextResponse.json({ detail: 'Query parameter required' }, { status: 400 });

  const localResult = searchLocalDB(query);
  if (localResult) return NextResponse.json({ medicine: query, information: localResult, disclaimer: DISCLAIMER, source: 'Local medicine database' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Provide educational medicine info. Use ### headings and - for lists. NEVER prescribe dosages.' }, { role: 'user', content: `Information about: ${query}. Include Uses, Side Effects, Precautions, Warnings.` }], max_tokens: 800, temperature: 0.5 }),
      });
      if (res.ok) { const data = await res.json(); const info = data.choices?.[0]?.message?.content; if (info) return NextResponse.json({ medicine: query, information: info, disclaimer: DISCLAIMER, source: 'AI-generated (educational only)' }); }
    } catch { /* fallback */ }
  }

  return NextResponse.json({
    medicine: query,
    information: `### ${query}\n\nNot found in local database.\n\n### What To Do\n- **Consult your doctor or pharmacist**\n- **Check reliable sources**: Mayo Clinic, WebMD, NIH\n\n*Add OPENAI_API_KEY to .env for AI-powered lookup*`,
    disclaimer: DISCLAIMER, source: 'fallback',
  });
}