const FDA_BASE = 'https://api.fda.gov';

export interface InteractionResult {
  medication1: string;
  medication2: string;
  medication2Id: string;
  severity: 'severe' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
}

export async function checkInteractions(
  newMedName: string,
  existingMeds: { name: string; id: string }[]
): Promise<InteractionResult[]> {
  if (existingMeds.length === 0) return [];
  const results: InteractionResult[] = [];

  for (const med of existingMeds) {
    try {
      const url = `${FDA_BASE}/drug/label.json?search=drug_interactions:"${encodeURIComponent(newMedName)}"&limit=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const interactions: string = data.results?.[0]?.drug_interactions?.[0] || '';

      if (interactions.toLowerCase().includes(med.name.toLowerCase())) {
        results.push({
          medication1: newMedName,
          medication2: med.name,
          medication2Id: med.id,
          severity: determineSeverity(interactions, med.name),
          description: extractRelevantText(interactions, med.name),
          recommendation:
            'Please consult your healthcare provider before taking these together.',
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}

function determineSeverity(
  text: string,
  _medName: string
): 'severe' | 'moderate' | 'minor' {
  const lower = text.toLowerCase();
  if (
    lower.includes('contraindicated') ||
    lower.includes('serious') ||
    lower.includes('fatal')
  )
    return 'severe';
  if (
    lower.includes('caution') ||
    lower.includes('monitor') ||
    lower.includes('may increase')
  )
    return 'moderate';
  return 'minor';
}

function extractRelevantText(text: string, medName: string): string {
  const sentences = text.split('.');
  const relevant = sentences.find((s) =>
    s.toLowerCase().includes(medName.toLowerCase())
  );
  return relevant
    ? relevant.trim() + '.'
    : 'Interaction noted. Consult your healthcare provider.';
}
