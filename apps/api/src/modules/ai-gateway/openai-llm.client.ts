import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RagCitation } from './ai-gateway.types';

type OpenAiResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export type LlmGenerationResult = {
  answer: string;
  provider: 'openai';
  model: string;
};

@Injectable()
export class OpenAiLlmClient {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  getStatus() {
    return {
      provider: 'openai',
      configured: this.hasApiKey(),
      model: this.getModel(),
    };
  }

  async validateConnection() {
    const model = this.getModel();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        provider: 'openai',
        configured: false,
        model,
        ok: false,
        status: null,
        message: 'OPENAI_API_KEY nao configurada.',
      };
    }

    const response = await fetch(
      `https://api.openai.com/v1/models/${encodeURIComponent(model)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    return {
      provider: 'openai',
      configured: true,
      model,
      ok: response.ok,
      status: response.status,
      message: response.ok
        ? 'Token e modelo validados com sucesso.'
        : await this.readError(response),
    };
  }

  async generateRagAnswer(input: {
    query: string;
    citations: RagCitation[];
  }): Promise<LlmGenerationResult | null> {
    const apiKey = this.getApiKey();

    if (!apiKey || input.citations.length === 0) {
      return null;
    }

    const model = this.getModel();
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 500,
        input: [
          {
            role: 'system',
            content: [
              'Voce e um agente de governanca ambiental.',
              'Responda em portugues do Brasil.',
              'Use somente as fontes fornecidas.',
              'Se as fontes nao forem suficientes, diga exatamente o que falta validar.',
              'Cite os arquivos usados pelo nome.',
            ].join(' '),
          },
          {
            role: 'user',
            content: this.buildRagPrompt(input.query, input.citations),
          },
        ],
      }),
    });

    const payload = (await response.json()) as OpenAiResponsePayload;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ??
          `OpenAI respondeu com status ${response.status}.`,
      );
    }

    return {
      answer: this.extractText(payload),
      provider: 'openai',
      model,
    };
  }

  private buildRagPrompt(query: string, citations: RagCitation[]) {
    const sources = citations
      .map((citation, index) =>
        [
          `Fonte ${index + 1}: ${citation.fileName}`,
          `Tipo: ${citation.metadata.documentType ?? 'desconhecido'}`,
          `Licenca: ${citation.metadata.licenseNumber ?? 'nao informada'}`,
          `Processo: ${citation.metadata.processNumber ?? 'nao informado'}`,
          `Trecho: ${citation.snippet}`,
        ].join('\n'),
      )
      .join('\n\n');

    return [`Pergunta: ${query}`, '', 'Fontes recuperadas:', sources].join('\n');
  }

  private extractText(payload: OpenAiResponsePayload) {
    if (payload.output_text?.trim()) {
      return payload.output_text.trim();
    }

    const text = payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!text) {
      throw new Error('OpenAI nao retornou texto na resposta.');
    }

    return text;
  }

  private async readError(response: Response) {
    try {
      const payload = (await response.json()) as OpenAiResponsePayload;

      return payload.error?.message ?? `OpenAI respondeu ${response.status}.`;
    } catch {
      return `OpenAI respondeu ${response.status}.`;
    }
  }

  private hasApiKey() {
    return Boolean(this.getApiKey());
  }

  private getApiKey() {
    return this.config.get<string>('OPENAI_API_KEY')?.trim();
  }

  private getModel() {
    return this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';
  }
}
