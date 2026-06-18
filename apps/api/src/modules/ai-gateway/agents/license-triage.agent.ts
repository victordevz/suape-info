import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  LicenseTriageInput,
  LicenseTriageResult,
  RagCitation,
} from '../ai-gateway.types';
import { RagRetrievalService } from '../rag-retrieval.service';

type LicenseForTriage = Prisma.LicenseGetPayload<{
  include: {
    obligations: {
      orderBy: {
        dueDate: 'asc';
      };
      take: 10;
    };
    deadlines: {
      orderBy: {
        dueDate: 'asc';
      };
      take: 10;
    };
  };
}>;

@Injectable()
export class LicenseTriageAgent {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(RagRetrievalService)
    private readonly rag: RagRetrievalService,
  ) {}

  async triage(input: LicenseTriageInput): Promise<LicenseTriageResult> {
    if (!input.licenseId) {
      const ragResult = await this.rag.query({
        query: input.query ?? '',
        take: input.take ?? 8,
      });

      return {
        mode: 'rag_draft',
        summary: ragResult.answerDraft,
        priorities: [
          'Identificar a licenca oficial citada nas fontes.',
          'Validar prazos, condicionantes e evidencias antes de registrar decisao.',
        ],
        pendingItems: [],
        citations: ragResult.citations,
      };
    }

    const license = await this.prisma.license.findUnique({
      where: { id: input.licenseId },
      include: {
        obligations: {
          where: { deletedAt: null },
          orderBy: { dueDate: 'asc' },
          take: 10,
        },
        deadlines: {
          where: { deletedAt: null },
          orderBy: { dueDate: 'asc' },
          take: 10,
        },
      },
    });

    if (!license) {
      throw new NotFoundException('Licenca nao encontrada.');
    }

    const citations = await this.findLicenseCitations(license, input.take ?? 8);

    return {
      mode: 'license_record',
      license: {
        id: license.id,
        number: license.number,
        type: license.type,
        status: license.status,
        expiresAt: license.expiresAt,
        renewalDueAt: license.renewalDueAt,
        renewalDeadlineInternal: license.renewalDeadlineInternal,
        renewalDeadlineAuthority: license.renewalDeadlineAuthority,
        issuingAgency: license.issuingAgency,
      },
      summary: this.buildSummary(license),
      priorities: this.buildPriorities(license),
      pendingItems: this.buildPendingItems(license),
      citations,
    };
  }

  private async findLicenseCitations(
    license: LicenseForTriage,
    take: number,
  ): Promise<RagCitation[]> {
    const query = [
      license.number,
      license.processNumber,
      license.cprhProcessNumber,
      license.seiProcessNumber,
      license.type,
    ]
      .filter(Boolean)
      .join(' ');

    if (!query) {
      return [];
    }

    const result = await this.rag.query({ query, take });

    return result.citations;
  }

  private buildSummary(license: LicenseForTriage) {
    const expiresAt = license.expiresAt
      ? license.expiresAt.toISOString().slice(0, 10)
      : 'sem validade cadastrada';

    return [
      `${license.type} ${license.number} emitida por ${license.issuingAgency}.`,
      `Situacao atual: ${license.status}. Validade: ${expiresAt}.`,
      `Foram avaliados ${license.obligations.length} obrigacao(oes) e ${license.deadlines.length} prazo(s) cadastrados.`,
    ].join(' ');
  }

  private buildPriorities(license: LicenseForTriage) {
    const priorities: string[] = [];
    const now = new Date();

    if (license.expiresAt && license.expiresAt.getTime() < now.getTime()) {
      priorities.push('Licenca vencida: priorizar renovacao e evidencias de protocolo.');
    }

    if (license.renewalDeadlineInternal) {
      priorities.push('Checar marco interno de renovacao e responsavel operacional.');
    }

    if (license.obligations.some((item) => item.status !== 'COMPLETED')) {
      priorities.push('Revisar obrigacoes pendentes ou em validacao.');
    }

    if (license.deadlines.some((item) => item.status === 'OVERDUE')) {
      priorities.push('Tratar prazos vencidos antes de novas classificacoes.');
    }

    if (priorities.length === 0) {
      priorities.push('Manter monitoramento de validade, condicionantes e evidencias.');
    }

    return priorities;
  }

  private buildPendingItems(license: LicenseForTriage) {
    return [
      ...license.deadlines
        .filter((deadline) => deadline.status !== 'COMPLETED')
        .map((deadline) => ({
          kind: 'deadline' as const,
          title: deadline.title,
          status: deadline.status,
          dueDate: deadline.dueDate,
          reason: 'Prazo ainda nao concluido no cadastro regulatorio.',
        })),
      ...license.obligations
        .filter((obligation) => obligation.status !== 'COMPLETED')
        .map((obligation) => ({
          kind: 'obligation' as const,
          title: obligation.title,
          status: obligation.status,
          dueDate: obligation.dueDate,
          reason: 'Obrigacao exige validacao operacional ou evidencia.',
        })),
    ].slice(0, 20);
  }
}
