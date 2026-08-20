import { NextRequest, NextResponse } from 'next/server';

const SYMptom_DATA: Record<string, { causes: string[]; warnings: string[] }> = {
  fever: { causes: ['Viral infection (cold, flu, COVID-19)', 'Bacterial infection', 'Heat exhaustion', 'Inflammatory condition'], warnings: ['Fever above 103°F (39.4°C)', 'Fever lasting more than 3 days', 'Fever with stiff neck'] },
  cough: { causes: ['Common cold', 'Flu', 'Bronchitis', 'Allergies', 'Asthma', 'Pneumonia'], warnings: ['Coughing blood', 'Difficulty breathing', 'Cough lasting more than 3 weeks'] },
  headache: { causes: ['Tension headache', 'Migraine', 'Sinus congestion', 'Dehydration', 'Eye strain', 'Stress'], warnings: ['Sudden severe headache', 'Headache with fever and stiff neck', 'Headache after head injury'] },
  'sore throat': { causes: ['Viral pharyngitis', 'Strep throat', 'Allergies', 'Dry air', 'Acid reflux'], warnings: ['Difficulty breathing', 'Difficulty swallowing', 'Joint pain with sore throat'] },
  nausea: { causes: ['Gastroenteritis', 'Food poisoning', 'Motion sickness', 'Medication side effects', 'Pregnancy', 'Migraine'], warnings: ['Persistent vomiting', 'Vomiting blood', 'Signs of dehydration'] },
  'chest pain': { causes: ['This may indicate a medical emergency', 'Heart-related issues', 'Acid reflux/GERD', 'Muscle strain', 'Anxiety/panic attack'], warnings: ['Crushing or pressure-like pain', 'Pain radiating to arm or jaw', 'Shortness of breath'] },
  'difficulty breathing': { causes: ['This may indicate a medical emergency', 'Asthma', 'Pneumonia', 'Allergic reaction', 'Anxiety', 'COPD'], warnings: ['Severe shortness of breath', 'Blue lips or face', 'Cannot speak in full sentences'] },
  rash: { causes: ['Allergic reaction', 'Eczema', 'Contact dermatitis', 'Viral infection', 'Psoriasis'], warnings: ['Rash spreading rapidly', 'Rash with fever', 'Difficulty breathing with rash'] },
  fatigue: { causes: ['Lack of sleep', 'Stress', 'Anemia', 'Thyroid disorder', 'Depression', 'Viral infection', 'Diabetes'], warnings: ['Extreme fatigue with weight changes', 'Fatigue with chest pain', 'Fatigue lasting weeks'] },
  dizziness: { causes: ['Dehydration', 'Low blood sugar', 'Inner ear issues', 'Medication side effects', 'Anemia', 'Low blood pressure'], warnings: ['Dizziness with fainting', 'Dizziness with chest pain', 'Dizziness after head injury'] },
};

const DISCLAIMER = 'This symptom assessment is for educational purposes only. It does NOT constitute a medical diagnosis. Possible causes listed are general categories. Always consult a qualified healthcare provider for proper diagnosis and treatment.';

export async function POST(req: NextRequest) {
  try {
    const { symptoms } = await req.json();
    if (!symptoms?.length) return NextResponse.json({ detail: 'At least one symptom required' }, { status: 400 });

    const identified = symptoms.map((s: string) => s.toLowerCase().trim()).filter(Boolean);
    const allCauses = new Set<string>();
    const allWarnings = new Set<string>();
    let riskLevel = 'low';

    for (const symptom of identified) {
      const data = SYMptom_DATA[symptom];
      if (data) {
        data.causes.forEach(c => allCauses.add(c));
        data.warnings.forEach(w => allWarnings.add(w));
      }
      if (['chest pain', 'difficulty breathing', 'loss of consciousness', 'severe bleeding'].includes(symptom)) riskLevel = 'urgent';
      else if (riskLevel !== 'urgent' && ['high fever', 'blood in', 'coughing blood', 'severe'].some(k => symptom.includes(k))) riskLevel = 'high';
      else if (riskLevel === 'low') riskLevel = 'moderate';
    }

    return NextResponse.json({
      identified_symptoms: identified,
      possible_causes: [...allCauses],
      risk_level: riskLevel,
      warning_signs: [...allWarnings],
      recommended_action: riskLevel === 'urgent'
        ? 'Seek emergency medical attention IMMEDIATELY. Call your local emergency number (911/112/108).'
        : riskLevel === 'high'
        ? 'Consult a healthcare provider as soon as possible, ideally within 24 hours.'
        : 'Monitor your symptoms. If they persist for more than a few days or worsen, consult a healthcare provider.',
      disclaimer: DISCLAIMER,
    });
  } catch {
    return NextResponse.json({ detail: 'Assessment failed' }, { status: 500 });
  }
}