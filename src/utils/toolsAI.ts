export const searchTool = {
  type: 'function' as const,
  function: {
    name: 'search_doc_brave',
    description:
      'Busca en internet documentación técnica o de programación actualizada. Úsalo cuando no tengas la respuesta exacta o necesites validar código reciente.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            "Términos de búsqueda precisos, ej: 'Astro 4 environment variables documentation'",
        },
      },
      required: ['query'],
    },
  },
};
