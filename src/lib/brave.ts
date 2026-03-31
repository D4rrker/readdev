export const fetchBraveSearch = async (
  query: string
): Promise<{ text: string; links: { title: string; url: string }[] }> => {
  const apiKey = import.meta.env.BRAVE_SEARCH_API_KEY;
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!res.ok) throw new Error('Error en Brave API');

    const data = await res.json();

    const text = data.web?.results
      ?.map((r: any) => `${r.title}: ${r.description}`)
      .join('\n');

    const links =
      data.web?.results?.map((r: any) => ({ title: r.title, url: r.url })) ||
      [];
    return { text: text || 'No se encontraron resultados.', links };
  } catch (error) {
    return { text: 'Error de conexión.', links: [] };
  }
};
