export async function geocodeAddress(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
        headers: { 'Accept-Language': 'fr' },
    });
    if (!res.ok) throw new Error('Erreur de géocodage');
    const results = await res.json();
    if (results.length === 0) throw new Error("Adresse introuvable, essayez d'être plus précis");
    return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
        displayName: results[0].display_name,
    };
}