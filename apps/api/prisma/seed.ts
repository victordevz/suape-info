import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertDocumentAsset(data: Prisma.DocumentAssetUncheckedCreateInput) {
  return prisma.documentAsset.upsert({
    where: {
      storageBucket_storageKey_version: {
        storageBucket: data.storageBucket,
        storageKey: data.storageKey,
        version: data.version,
      },
    },
    update: data,
    create: data,
  });
}

async function upsertSourceRecord(data: Prisma.SourceRecordUncheckedCreateInput) {
  const existing = await prisma.sourceRecord.findFirst({
    where: {
      sourceKind: data.sourceKind,
      documentAssetId: data.documentAssetId,
      spreadsheetId: data.spreadsheetId,
      sheetName: data.sheetName,
      rowNumber: data.rowNumber,
      cellRange: data.cellRange,
      pageNumber: data.pageNumber,
      sectionName: data.sectionName,
      itemCode: data.itemCode,
    },
  });

  if (existing) {
    return prisma.sourceRecord.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.sourceRecord.create({ data });
}

async function upsertRegulatoryClause(data: Prisma.RegulatoryClauseUncheckedCreateInput) {
  return prisma.regulatoryClause.upsert({
    where: {
      licenseId_clauseType_itemCode: {
        licenseId: data.licenseId,
        clauseType: data.clauseType ?? 'CONDICIONANTE',
        itemCode: data.itemCode,
      },
    },
    update: data,
    create: data,
  });
}

async function upsertObligation(data: Prisma.ObligationUncheckedCreateInput) {
  const existing = await prisma.obligation.findFirst({
    where: {
      licenseId: data.licenseId,
      regulatoryClauseId: data.regulatoryClauseId,
      title: data.title,
    },
  });

  if (existing) {
    return prisma.obligation.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.obligation.create({ data });
}

async function upsertResponsibleParty(data: Prisma.ResponsiblePartyUncheckedCreateInput) {
  const existing = await prisma.responsibleParty.findFirst({
    where: {
      name: data.name,
      type: data.type,
      areaId: data.areaId,
      licenseId: data.licenseId,
      obligationId: data.obligationId,
    },
  });

  if (existing) {
    return prisma.responsibleParty.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.responsibleParty.create({ data });
}

async function upsertOccurrence(data: Prisma.ObligationOccurrenceUncheckedCreateInput) {
  const existing = await prisma.obligationOccurrence.findFirst({
    where: {
      obligationId: data.obligationId,
      periodReference: data.periodReference,
      calendarYear: data.calendarYear,
    },
  });

  if (existing) {
    return prisma.obligationOccurrence.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.obligationOccurrence.create({ data });
}

async function upsertProtocol(data: Prisma.ProtocolUncheckedCreateInput) {
  const existing = await prisma.protocol.findFirst({
    where: {
      licenseId: data.licenseId,
      obligationId: data.obligationId,
      number: data.number,
      agency: data.agency,
      system: data.system,
    },
  });

  if (existing) {
    return prisma.protocol.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.protocol.create({ data });
}

async function upsertDelivery(data: Prisma.DeliveryUncheckedCreateInput) {
  const existing = await prisma.delivery.findFirst({
    where: {
      obligationId: data.obligationId,
      obligationOccurrenceId: data.obligationOccurrenceId,
      protocolNumber: data.protocolNumber,
    },
  });

  if (existing) {
    return prisma.delivery.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.delivery.create({ data });
}

async function upsertComplianceAssessment(data: Prisma.ComplianceAssessmentUncheckedCreateInput) {
  const existing = await prisma.complianceAssessment.findFirst({
    where: {
      regulatoryClauseId: data.regulatoryClauseId,
      obligationId: data.obligationId,
      occurrenceId: data.occurrenceId,
    },
  });

  if (existing) {
    return prisma.complianceAssessment.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.complianceAssessment.create({ data });
}

async function upsertAuthorizedResource(data: Prisma.AuthorizedResourceUncheckedCreateInput) {
  const existing = await prisma.authorizedResource.findFirst({
    where: {
      licenseId: data.licenseId,
      regulatoryClauseId: data.regulatoryClauseId,
      type: data.type,
      name: data.name,
      identifier: data.identifier,
    },
  });

  if (existing) {
    return prisma.authorizedResource.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.authorizedResource.create({ data });
}

async function main() {
  const permissions = [
    ['read', 'regulatory'],
    ['write', 'regulatory'],
    ['read', 'evidence'],
    ['validate', 'evidence'],
    ['read', 'audit'],
    ['export', 'dossier'],
    ['read', 'process'],
    ['write', 'delivery'],
    ['assess', 'compliance'],
    ['read', 'infraction'],
  ] as const;

  for (const [action, resource] of permissions) {
    await prisma.permission.upsert({
      where: { action_resource: { action, resource } },
      update: {},
      create: {
        action,
        resource,
        description: `${action}:${resource}`,
      },
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      slug: 'admin',
      description: 'Acesso administrativo para demonstracao do hackathon.',
    },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const area = await prisma.area.upsert({
    where: { slug: 'governanca-ambiental' },
    update: {},
    create: {
      name: 'Governanca Ambiental',
      slug: 'governanca-ambiental',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@poketeam.local' },
    update: {
      areaId: area.id,
      roleId: adminRole.id,
    },
    create: {
      name: 'Admin Poketeam',
      email: 'admin@poketeam.local',
      areaId: area.id,
      roleId: adminRole.id,
    },
  });

  const workActivity = await prisma.workActivity.upsert({
    where: { code: 'SUAPE-CIPS' },
    update: {
      name: 'Complexo Industrial Portuario de Suape - CIPS',
      description: 'Empreendimento, licencas e autorizacoes ambientais acompanhados pela GML.',
      location: 'Suape, Pernambuco',
      areaId: area.id,
    },
    create: {
      name: 'Complexo Industrial Portuario de Suape - CIPS',
      code: 'SUAPE-CIPS',
      description: 'Empreendimento, licencas e autorizacoes ambientais acompanhados pela GML.',
      location: 'Suape, Pernambuco',
      areaId: area.id,
    },
  });

  const rloDocument = await upsertDocumentAsset({
    fileName: '06. Renovacao de licenca operacao',
    kind: 'REGULATORY_DOCUMENT',
    mimeType: 'application/pdf',
    storageBucket: 'suape-real-docs',
    storageKey: '06-renovacao-licenca-operacao',
    version: '2021-09-10',
    checksum: 'suape-rlo-05-21-09-003636-1',
    extractedText:
      'Renovacao da Licenca de Operacao RLO 05.21.09.003636-1, expedida pela CPRH, com exigencias, requisitos e observacoes.',
  });

  const autDocument = await upsertDocumentAsset({
    fileName: '07. Autorizacao ambiental.pdf',
    kind: 'AUTHORIZATION',
    mimeType: 'application/pdf',
    storageBucket: 'suape-real-docs',
    storageKey: '07-autorizacao-ambiental',
    version: '2025-04-24',
    checksum: 'suape-aut-04-25-04-002491-3',
    extractedText:
      'Autorizacao Ambiental 04.25.04.002491-3, expedida pela CPRH, com exigencias, objetivo e observacao.',
  });

  const spreadsheetDocument = await upsertDocumentAsset({
    fileName: '08. Planilha de Controle de Licencas (GML) 2026.xlsx',
    kind: 'OTHER',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    storageBucket: 'suape-real-docs',
    storageKey: '08-planilha-controle-licencas-gml-2026',
    version: '2026',
    checksum: 'suape-planilha-gml-2026',
  });

  const rlo = await prisma.license.upsert({
    where: {
      workActivityId_number: {
        workActivityId: workActivity.id,
        number: '05.21.09.003636-1',
      },
    },
    update: {
      type: 'Renovacao da Licenca de Operacao',
      licenseKind: 'RLO',
      issuingAgency: 'CPRH',
      issuingAuthority: 'Agencia Estadual de Meio Ambiente - CPRH',
      sourceProtocolNumber: '001701/2021',
      authenticationCode: 'BW373CS7',
      scope: 'Licenca de operacao do Complexo Industrial Portuario de Suape.',
      activitySummary: 'Operacao do Complexo Industrial Portuario de Suape.',
      location: 'Suape, Pernambuco',
      issuedAt: new Date('2021-09-10T00:00:00.000Z'),
      validFrom: new Date('2021-09-10T00:00:00.000Z'),
      expiresAt: new Date('2026-09-09T00:00:00.000Z'),
      renewalDeadlineAuthority: new Date('2026-05-12T00:00:00.000Z'),
      renewalDeadlineInternal: new Date('2026-04-12T00:00:00.000Z'),
      renewalRule: 'Solicitar renovacao ate 120 dias antes do vencimento.',
    },
    create: {
      workActivityId: workActivity.id,
      number: '05.21.09.003636-1',
      type: 'Renovacao da Licenca de Operacao',
      licenseKind: 'RLO',
      issuingAgency: 'CPRH',
      issuingAuthority: 'Agencia Estadual de Meio Ambiente - CPRH',
      sourceProtocolNumber: '001701/2021',
      authenticationCode: 'BW373CS7',
      scope: 'Licenca de operacao do Complexo Industrial Portuario de Suape.',
      activitySummary: 'Operacao do Complexo Industrial Portuario de Suape.',
      location: 'Suape, Pernambuco',
      issuedAt: new Date('2021-09-10T00:00:00.000Z'),
      validFrom: new Date('2021-09-10T00:00:00.000Z'),
      expiresAt: new Date('2026-09-09T00:00:00.000Z'),
      renewalDeadlineAuthority: new Date('2026-05-12T00:00:00.000Z'),
      renewalDeadlineInternal: new Date('2026-04-12T00:00:00.000Z'),
      renewalRule: 'Solicitar renovacao ate 120 dias antes do vencimento.',
    },
  });

  const authorization = await prisma.license.upsert({
    where: {
      workActivityId_number: {
        workActivityId: workActivity.id,
        number: '04.25.04.002491-3',
      },
    },
    update: {
      type: 'Autorizacao Ambiental',
      licenseKind: 'AUT',
      issuingAgency: 'CPRH',
      issuingAuthority: 'Agencia Estadual de Meio Ambiente - CPRH',
      sourceProtocolNumber: '001708/2025',
      authenticationCode: 'KY358GX3',
      scope: 'Autorizacao ambiental com materiais, equipamentos e equipe tecnica autorizada.',
      activitySummary: 'Atividade autorizada em area do Complexo Industrial Portuario de Suape.',
      location: 'Suape, Pernambuco',
      issuedAt: new Date('2025-04-24T00:00:00.000Z'),
      validFrom: new Date('2025-04-24T00:00:00.000Z'),
      expiresAt: new Date('2026-04-24T00:00:00.000Z'),
    },
    create: {
      workActivityId: workActivity.id,
      number: '04.25.04.002491-3',
      type: 'Autorizacao Ambiental',
      licenseKind: 'AUT',
      issuingAgency: 'CPRH',
      issuingAuthority: 'Agencia Estadual de Meio Ambiente - CPRH',
      sourceProtocolNumber: '001708/2025',
      authenticationCode: 'KY358GX3',
      scope: 'Autorizacao ambiental com materiais, equipamentos e equipe tecnica autorizada.',
      activitySummary: 'Atividade autorizada em area do Complexo Industrial Portuario de Suape.',
      location: 'Suape, Pernambuco',
      issuedAt: new Date('2025-04-24T00:00:00.000Z'),
      validFrom: new Date('2025-04-24T00:00:00.000Z'),
      expiresAt: new Date('2026-04-24T00:00:00.000Z'),
    },
  });

  const rloClause4 = await upsertRegulatoryClause({
    licenseId: rlo.id,
    sourceDocumentId: rloDocument.id,
    sectionName: '9 - Exigencias',
    clauseType: 'EXIGENCIA',
    itemCode: '4',
    sequence: 4,
    text: 'Exigencia principal da RLO com subitens 4.1 a 4.11 preservados como itens textuais.',
    isTrackable: true,
    generatesObligation: true,
    sourcePage: 1,
    extractionConfidence: 0.95,
  });

  const rloClause410 = await upsertRegulatoryClause({
    licenseId: rlo.id,
    sourceDocumentId: rloDocument.id,
    sectionName: '9 - Exigencias',
    clauseType: 'EXIGENCIA',
    itemCode: '4.10',
    parentItemCode: '4',
    sequence: 410,
    text: 'Subitem 4.10 preservado como texto para evitar conversao indevida em data ou numero decimal.',
    isTrackable: true,
    generatesObligation: true,
    sourcePage: 1,
    extractionConfidence: 0.95,
  });

  const rloRenewalObservation = await upsertRegulatoryClause({
    licenseId: rlo.id,
    sourceDocumentId: rloDocument.id,
    sectionName: '11 - Observacao',
    clauseType: 'OBSERVACAO',
    itemCode: '11',
    sequence: 11,
    text: 'Regra operacional: solicitar renovacao ate 120 dias antes do vencimento para evitar perda de validade.',
    isTrackable: true,
    generatesObligation: true,
    sourcePage: 1,
    extractionConfidence: 0.98,
  });

  const authMaterialClause = await upsertRegulatoryClause({
    licenseId: authorization.id,
    sourceDocumentId: autDocument.id,
    sectionName: '9 - Exigencias',
    clauseType: 'EXIGENCIA',
    itemCode: '1',
    sequence: 1,
    text: 'Lista materiais e equipamentos autorizados pela Autorizacao Ambiental.',
    isTrackable: true,
    generatesObligation: false,
    sourcePage: 1,
    extractionConfidence: 0.95,
  });

  const authTeamClause = await upsertRegulatoryClause({
    licenseId: authorization.id,
    sourceDocumentId: autDocument.id,
    sectionName: '9 - Exigencias',
    clauseType: 'EXIGENCIA',
    itemCode: '2',
    sequence: 2,
    text: 'Lista equipe tecnica autorizada, incluindo identificacao profissional.',
    isTrackable: true,
    generatesObligation: false,
    sourcePage: 1,
    extractionConfidence: 0.95,
  });

  const authReportClause = await upsertRegulatoryClause({
    licenseId: authorization.id,
    sourceDocumentId: autDocument.id,
    sectionName: '9 - Exigencias',
    clauseType: 'EXIGENCIA',
    itemCode: '3',
    sequence: 3,
    text: 'Entregar relatorios trimestrais e relatorio final associados a autorizacao ambiental.',
    periodicity: 'Trimestral',
    isTrackable: true,
    generatesObligation: true,
    sourcePage: 1,
    extractionConfidence: 0.98,
  });

  const rloSheetRecord = await upsertSourceRecord({
    sourceKind: 'GOOGLE_SHEETS',
    spreadsheetId: 'planilha-controle-licencas-gml-2026',
    sheetName: 'LO COMPLEXO DE SUAPE CIPS',
    rowNumber: 10,
    cellRange: 'A10:N10',
    itemCode: '4.10',
    version: '2026',
    documentAssetId: spreadsheetDocument.id,
    rawMetadata: {
      note: 'Linha de condicionante da planilha real; item_code deve permanecer texto.',
    },
  });

  await prisma.regulatoryClause.update({
    where: { id: rloClause410.id },
    data: {
      sourceRecordId: rloSheetRecord.id,
    },
  });

  const cprhRloProcess = await prisma.externalProcess.upsert({
    where: {
      processType_processNumber: {
        processType: 'CPRH',
        processNumber: '001701/2021',
      },
    },
    update: {
      licenseId: rlo.id,
      status: 'ACTIVE',
      protocolAt: new Date('2021-09-10T00:00:00.000Z'),
      description: 'Protocolo do expediente da RLO 05.21.09.003636-1.',
    },
    create: {
      processType: 'CPRH',
      processNumber: '001701/2021',
      licenseId: rlo.id,
      status: 'ACTIVE',
      protocolAt: new Date('2021-09-10T00:00:00.000Z'),
      description: 'Protocolo do expediente da RLO 05.21.09.003636-1.',
    },
  });

  const cprhAutProcess = await prisma.externalProcess.upsert({
    where: {
      processType_processNumber: {
        processType: 'CPRH',
        processNumber: '001708/2025',
      },
    },
    update: {
      licenseId: authorization.id,
      status: 'ACTIVE',
      protocolAt: new Date('2025-04-24T00:00:00.000Z'),
      description: 'Protocolo do expediente da Autorizacao Ambiental 04.25.04.002491-3.',
    },
    create: {
      processType: 'CPRH',
      processNumber: '001708/2025',
      licenseId: authorization.id,
      status: 'ACTIVE',
      protocolAt: new Date('2025-04-24T00:00:00.000Z'),
      description: 'Protocolo do expediente da Autorizacao Ambiental 04.25.04.002491-3.',
    },
  });

  const renewalObligation = await upsertObligation({
    licenseId: rlo.id,
    regulatoryClauseId: rloRenewalObservation.id,
    title: 'Solicitar renovacao da RLO',
    description: 'Obrigacao derivada da observacao da RLO sobre renovacao ate 120 dias antes do vencimento.',
    obligationType: 'RENOVACAO',
    triggerType: 'RELATIVE_TO_EXPIRY_DATE',
    deadlineAuthority: new Date('2026-05-12T00:00:00.000Z'),
    deadlineInternal: new Date('2026-04-12T00:00:00.000Z'),
    deadlineBasis: '120 dias antes de 09/09/2026',
    criticality: 'HIGH',
    status: 'PENDING',
  });

  const reportObligation = await upsertObligation({
    licenseId: authorization.id,
    regulatoryClauseId: authReportClause.id,
    title: 'Entregar relatorio trimestral da Autorizacao Ambiental',
    description: 'Obrigacao recorrente criada a partir do item 3 da Autorizacao Ambiental.',
    obligationType: 'RELATORIO',
    triggerType: 'RECURRENT',
    recurrenceRule: 'FREQ=QUARTERLY',
    deadlineBasis: 'Relatorios trimestrais durante a validade da autorizacao.',
    criticality: 'MEDIUM',
    status: 'PENDING',
  });

  const rloResponsible = await upsertResponsibleParty({
    name: 'Equipe de Governanca Ambiental',
    type: 'AREA',
    isApprover: true,
    isPointOfContact: true,
    areaId: area.id,
    userId: user.id,
    workActivityId: workActivity.id,
    licenseId: rlo.id,
    obligationId: renewalObligation.id,
  });

  await prisma.obligation.update({
    where: { id: renewalObligation.id },
    data: {
      responsiblePartyId: rloResponsible.id,
    },
  });

  const occurrence = await upsertOccurrence({
    obligationId: reportObligation.id,
    periodReference: '2026-Q1',
    dueDateAuthority: new Date('2026-01-24T00:00:00.000Z'),
    dueDateInternal: new Date('2026-01-10T00:00:00.000Z'),
    calendarYear: 2026,
    status: 'SCHEDULED',
    deliveryExpected: true,
  });

  const protocol = await upsertProtocol({
    licenseId: authorization.id,
    obligationId: reportObligation.id,
    obligationOccurrenceId: occurrence.id,
    externalProcessId: cprhAutProcess.id,
    number: '001708/2025',
    agency: 'CPRH',
    system: 'CPRH',
    submittedAt: new Date('2025-04-24T00:00:00.000Z'),
    status: 'COMPLETED',
  });

  await upsertDelivery({
    licenseId: authorization.id,
    obligationId: reportObligation.id,
    obligationOccurrenceId: occurrence.id,
    deliveryType: 'RELATORIO',
    recipientAuthority: 'CPRH',
    protocolNumber: protocol.number,
    protocolId: protocol.id,
    status: 'PENDING',
    notes: 'Entrega esperada no calendario GML 2026.',
  });

  await prisma.deadline.upsert({
    where: { id: occurrence.id },
    update: {
      title: 'Prazo interno do relatorio trimestral 2026-Q1',
      dueDate: new Date('2026-01-10T00:00:00.000Z'),
      licenseId: authorization.id,
      regulatoryClauseId: authReportClause.id,
      obligationId: reportObligation.id,
      obligationOccurrenceId: occurrence.id,
      responsiblePartyId: rloResponsible.id,
    },
    create: {
      id: occurrence.id,
      title: 'Prazo interno do relatorio trimestral 2026-Q1',
      dueDate: new Date('2026-01-10T00:00:00.000Z'),
      licenseId: authorization.id,
      regulatoryClauseId: authReportClause.id,
      obligationId: reportObligation.id,
      obligationOccurrenceId: occurrence.id,
      responsiblePartyId: rloResponsible.id,
    },
  });

  await upsertComplianceAssessment({
    regulatoryClauseId: rloClause410.id,
    obligationId: renewalObligation.id,
    status: 'PENDENTE',
    weight: 1,
    score: 0,
    assessedById: user.id,
    assessedAt: new Date('2026-06-18T00:00:00.000Z'),
    justification: 'Controle importado deve preservar item 4.10 como texto e exigir avaliacao operacional.',
  });

  await upsertAuthorizedResource({
    licenseId: authorization.id,
    regulatoryClauseId: authMaterialClause.id,
    type: 'MATERIAL',
    name: 'Materiais e equipamentos autorizados',
    notes: 'Detalhamento vem do texto integral do item 1 da Autorizacao Ambiental.',
  });

  await upsertAuthorizedResource({
    licenseId: authorization.id,
    regulatoryClauseId: authTeamClause.id,
    responsiblePartyId: rloResponsible.id,
    type: 'TECHNICAL_TEAM',
    name: 'Equipe tecnica autorizada',
    roleDescription: 'Equipe listada no item 2 da Autorizacao Ambiental.',
    notes: 'Identificacoes profissionais devem ser importadas como texto governado quando a extracao estiver habilitada.',
  });

  const existingRisk = await prisma.riskSignal.findFirst({
    where: {
      kind: 'DEADLINE_NEAR',
      obligationId: renewalObligation.id,
    },
  });
  if (!existingRisk) {
    await prisma.riskSignal.create({
      data: {
        kind: 'DEADLINE_NEAR',
        severity: 'HIGH',
        reason: 'Renovacao da RLO deve ser solicitada ate 120 dias antes do vencimento em 09/09/2026.',
        licenseId: rlo.id,
        regulatoryClauseId: rloRenewalObservation.id,
        obligationId: renewalObligation.id,
      },
    });
  }

  const existingAuditEvent = await prisma.auditEvent.findFirst({
    where: {
      resource: 'seed',
      resourceId: workActivity.id,
      action: 'CREATE',
    },
  });
  if (!existingAuditEvent) {
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: 'CREATE',
        resource: 'seed',
        resourceId: workActivity.id,
        reason: 'Seed Suape baseado na validacao de documentos reais.',
        newData: {
          workActivityCode: workActivity.code,
          rloNumber: rlo.number,
          authorizationNumber: authorization.number,
          cprhProcesses: [cprhRloProcess.processNumber, cprhAutProcess.processNumber],
          preservedItemCode: rloClause410.itemCode,
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
