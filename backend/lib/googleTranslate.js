const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || null; // utile si on depasse le quota gratuit (1000 requêtes/jour)

// Traduit un seul texte via MyMemory
async function translateSingle(text, targetLang, sourceLang) {
    const params = new URLSearchParams();
    params.append('q', text);
    params.append('langpair', `${sourceLang}|${targetLang}`);
    if (MYMEMORY_EMAIL) params.append('de', MYMEMORY_EMAIL);

    const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.responseData) {
        console.error('[MYMEMORY] Réponse invalide:', data);
        throw new Error('Échec de la traduction automatique');
    }

    if (data.responseStatus && Number(data.responseStatus) >= 400) {
        console.error('[MYMEMORY] Erreur API:', data.responseStatus, data.responseDetails);
        throw new Error(`MyMemory: ${data.responseDetails || 'erreur inconnue'}`);
    }

    return data.responseData.translatedText;
}

async function translateBatch(texts, targetLang, sourceLang = 'fr') {
    const indexesToTranslate = [];
    const textsToTranslate = [];
    texts.forEach((t, i) => {
        if (t && t.trim() !== '') {
            indexesToTranslate.push(i);
            textsToTranslate.push(t);
        }
    });

    if (textsToTranslate.length === 0) return texts.map(() => null);

    const translatedTexts = await Promise.all(
        textsToTranslate.map((t) => translateSingle(t, targetLang, sourceLang))
    );

    const result = texts.map(() => null);
    indexesToTranslate.forEach((originalIndex, i) => {
        result[originalIndex] = translatedTexts[i];
    });
    return result;
}

module.exports = { translateBatch };