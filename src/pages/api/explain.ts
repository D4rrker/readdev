export const prerender = false;

import promptTemplate from '@/prompts/explain.md?raw';
import { extractMainContent } from '@/lib/streamHelpers';
import { client } from '@/lib/deepseek';
import { fetchBraveSearch } from '@/lib/brave';
import { searchTool } from '@/utils/toolsAI';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { mode, input } = await request.json();

  if (!input) {
    return new Response(JSON.stringify({ error: 'Input requerido' }), {
      status: 400,
    });
  }

  let content = input;
  let referenceLinks: { title: string; url: string }[] = [];

  if (mode === 'url') {
    referenceLinks.push({ title: 'Fuente original', url: input });
    try {
      const res = await fetch(input, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DocSimple/1.0)' },
      });
      const html = await res.text();
      content = extractMainContent(html);

      if (content.length < 100) {
        return new Response(
          JSON.stringify({
            error:
              'No se pudo extraer contenido de la URL. Prueba pegando el texto directamente.',
          }),
          { status: 400 }
        );
      }
    } catch {
      return new Response(JSON.stringify({ error: 'No se pudo leer la URL' }), {
        status: 400,
      });
    }
  }

  const preFlightMessages = [
    {
      role: 'system',
      content: `Eres un filtro de contenido técnico. 
      - Si el mensaje NO trata sobre programación, desarrollo web o software, responde ÚNICAMENTE: "ERROR: Tema fuera de contexto".
      - Si es sobre programación pero necesitas más información, usa la herramienta 'search_doc_brave'.
      - Si es sobre programación y tienes info suficiente, no hagas nada.`,
    },
    { role: 'user', content: content },
  ];

  const preFlightRequest = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: preFlightMessages as any,
    tools: [searchTool],
    tool_choice: 'auto',
  });

  const responseMessage = preFlightRequest.choices[0].message;

  if (responseMessage.content?.includes('ERROR:')) {
    return new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const errorMessage = responseMessage
            .content!.replace('ERROR:', '')
            .trim();

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`
            )
          );
          controller.close();
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  let searchQuery = '';

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    const toolCall = responseMessage.tool_calls[0];
    if (toolCall.type === 'function') {
      const args = JSON.parse(toolCall.function.arguments);
      searchQuery = args.query;
    }
  } else if (responseMessage.content?.includes('<｜DSML｜')) {
    const queryMatch = responseMessage.content.match(
      /name="query"[^>]*>([\s\S]*?)<\/｜DSML｜parameter>/
    );
    if (queryMatch) searchQuery = queryMatch[1].trim();
  }

  let finalMessages = [];
  if (searchQuery) {
    const { text, links } = await fetchBraveSearch(searchQuery);
    referenceLinks = links;
    finalMessages = [
      {
        role: 'user' as const,
        content: `${promptTemplate}\n\n<documentacion>\nInfo internet para "${searchQuery}":\n${text}\n\nOriginal:\n${content}\n</documentacion>`,
      },
    ];
  } else {
    finalMessages = [
      {
        role: 'user' as const,
        content: `${promptTemplate}\n\n<documentacion>\n${content}\n</documentacion>`,
      },
    ];
  }

  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    stream: true,
    messages: finalMessages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let firstChunk = true;

      try {
        if (referenceLinks.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'links', data: referenceLinks })}\n\n`
            )
          );
        }

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (!text) continue;

          if (firstChunk && text.startsWith('ERROR:')) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: text.replace('ERROR:', '').trim() })}\n\n`
              )
            );
            controller.close();
            return;
          }
          firstChunk = false;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'chunk', text })}\n\n`
            )
          );
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Error en el stream' })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};
