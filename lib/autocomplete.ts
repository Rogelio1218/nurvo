const FDA_BASE = 'https://api.fda.gov';
const NIH_BASE = 'https://api.ods.od.nih.gov/dsld/v9';

export interface MedSuggestion {
  name: string;
  genericName?: string;
  strength?: string;
  source: 'fda' | 'supplement' | 'manual';
}

export async function searchMedications(query: string): Promise<MedSuggestion[]> {
  if (query.length < 2) return [];

  try {
    const [fdaResults, nihResults] = await Promise.allSettled([
      searchFDA(query),
      searchNIH(query),
    ]);

    const fda = fdaResults.status === 'fulfilled' ? fdaResults.value : [];
    const nih = nihResults.status === 'fulfilled' ? nihResults.value : [];

    // Deduplicate by name
    const combined = [...fda, ...nih];
    const seen = new Set<string>();
    return combined
      .filter((item) => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function searchFDA(query: string): Promise<MedSuggestion[]> {
  const encoded = encodeURIComponent(query);
  const url = `${FDA_BASE}/drug/label.json?search=openfda.brand_name:"${encoded}"+openfda.generic_name:"${encoded}"&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((r: any): MedSuggestion => ({
    name: r.openfda?.brand_name?.[0] || r.openfda?.generic_name?.[0] || query,
    genericName: r.openfda?.generic_name?.[0],
    strength: r.openfda?.strength?.[0],
    source: 'fda',
  }));
}

async function searchNIH(query: string): Promise<MedSuggestion[]> {
  const url = `${NIH_BASE}/browse?name=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.hits || []).map((r: any): MedSuggestion => ({
    name: r.productName || query,
    genericName: r.ingredients?.join(', '),
    source: 'supplement',
  }));
}
