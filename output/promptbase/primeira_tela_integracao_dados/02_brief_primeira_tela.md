# Brief da primeira tela

## Nome da feature

Central de Dados e Evidências

## Hipótese estratégica

O primeiro valor do produto não está em substituir imediatamente o Google Drive. O valor está em conectar essa fonte, monitorar pastas, importar documentos, preservar origem/versão, extrair texto básico e tornar a consulta mais segura, rápida e auditável.

Google Sheets estruturado, classificação automática e vínculos regulatórios completos são evoluções planejadas, mas não fazem parte do backend funcional atual.

## Contexto de branding

A interface deve seguir a identidade institucional da Suape, usando o manual de marca como referência, mas adaptada para um sistema operacional de uso diário.

Elementos principais:

- Marca: SUAPE - Complexo Industrial Portuário de Pernambuco.
- Paleta principal:
  - Azul Suape: Pantone Blue 072 C, `#2E60AD`, RGB 46 96 173.
  - Amarelo Suape: Pantone 137 C, `#FCB316`, RGB 252 179 22.
- Tipografia de apoio do manual: Matt Regular, Matt Medium, Matt Bold e Matt Black.
- Caso a fonte Matt não esteja disponível, usar fallback com aparência institucional e geométrica, como Inter ou Manrope.
- A marca usa um símbolo modular com sol/estrela central. Esse repertório pode inspirar detalhes visuais, padrões discretos e empty states.

Aplicação na tela:

- Azul deve ser a cor dominante de navegação, seleção, cabeçalho e confiança.
- Amarelo deve ser acento, não fundo dominante.
- A interface deve manter base clara, limpa e legível, com cinzas frios e superfícies brancas.
- O uso da marca deve reforçar pertencimento institucional sem prejudicar densidade de informação.
- Evitar aparência de campanha, banner, landing page ou material promocional.
- Usar logo e padrões da marca com moderação, especialmente em sidebar, cabeçalho ou estados vazios.

## Problema que a tela resolve

Hoje a equipe sabe que os documentos existem, mas a busca depende de memória operacional, pastas, planilhas e conhecimento informal. A tela deve reduzir essa fricção mostrando:

- quais fontes estão conectadas;
- quais documentos foram importados;
- quais documentos foram extraídos com sucesso;
- quais documentos ainda não têm classificação/metadados;
- quais documentos foram marcados para validação humana;
- quais arquivos tiveram erro de sincronização.

## Usuário principal

Equipe GML / gestão ambiental / responsáveis por licenças, condicionantes, protocolos, evidências e prazos.

## Momento de uso

O usuário abre o sistema para:

- encontrar uma licença/autorização;
- verificar se um PDF do Drive foi importado;
- conferir se um Google Docs, PDF ou arquivo textual foi detectado e extraído;
- marcar um documento para validação;
- editar metadados básicos de um documento;
- descobrir quais documentos ainda estão sem classificação;
- iniciar a organização de uma pasta real do Drive.

## Metáfora de interface

Uma camada familiar de organização de arquivos, parecida com um drive corporativo, mas enriquecida com governança regulatória.

O usuário deve pensar:

"Eu continuo enxergando minhas pastas e documentos, mas agora o sistema preserva origem, versão, status de sincronização e conteúdo extraído para começar a governar esses arquivos."

Os vínculos com licença, condicionante, prazo, evidência e protocolo devem ser sugeridos visualmente como próximos passos do produto, não como fluxo completo já disponível.

## Primeira tela ideal

A primeira tela deve abrir com:

1. Sidebar de fontes conectadas.
2. Área central com lista/tabela de documentos.
3. Painel lateral de detalhes do documento selecionado.
4. Indicadores compactos de conexão, importação, extração e erros.

## Hierarquia visual

Prioridade 1:

- Documentos importados.
- Status de sincronização.
- Status de extração.
- Origem, caminho, versão e link para abrir no Drive.

Prioridade 2:

- Filtros.
- Pasta de origem.
- Status de importação.
- Última atualização.
- Erros de importação.

Prioridade 3:

- Métricas agregadas.
- Histórico resumido.
- Ações secundárias e placeholders de vínculos futuros.

## Estados de documento

| Estado | Significado |
|---|---|
| Importado | O arquivo foi detectado e copiado/indexado pelo sistema. |
| Extraído | O sistema conseguiu ler texto e metadados. |
| Não classificado | O documento ainda não tem tipo ou vínculo confiável. |
| Sugestão gerada | Estado futuro para sugestão automática/manual de vínculos. |
| Aguardando validação | Precisa de conferência humana; backend permite marcar esse status. |
| Vinculado | Estado futuro para documento conectado a licença, cláusula, obrigação ou processo. |
| Evidência validada | Estado futuro para documento aprovado como evidência oficial de cumprimento. |
| Erro de sincronização | Falha de permissão, leitura, formato ou conexão. |
| Reprocessamento pendente | Estado visual futuro; hoje nova alteração detectada gera nova versão/importação. |

## Entidades que a tela deve sugerir visualmente

- Fonte conectada.
- Pasta monitorada.
- Documento importado.
- Documento extraído.
- Versão do documento.
- Job de importação/sincronização.
- Evento de auditoria.
- Metadados básicos do documento.
- Planilha importada como evolução futura.
- Licença/autorização como vínculo futuro.
- Cláusula regulatória como vínculo futuro.
- Obrigação como vínculo futuro.
- Ocorrência de prazo como vínculo futuro.
- Evidência como vínculo futuro.
- Protocolo como vínculo futuro.
- Processo externo como vínculo futuro: SEI, SISAM, SILIA, CPRH, ANM, IBAMA.
- Responsável/ponto focal como filtro futuro.

## Dados de exemplo recomendados

Use documentos e termos próximos da realidade:

- `RLO CIPS - 05.21.09.003636-1.pdf`
- `Autorização Ambiental - Monitoramento de Fauna - 04.25.04.002491-3.pdf`
- `Planilha de Controle de Licenças GML 2026.xlsx`
- `brief ecommerce vitoria400anos`
- `Condicionante 13 - Relatório trimestral PAM`
- `Processo SEI 0050200040.000002/2026-09`
- `Auto de Infração nº 089/2012`

O exemplo `brief ecommerce vitoria400anos` representa um documento real já lido no backend como Google Docs, com status `EXTRACTED` e preview textual disponível.

## O que evitar

- Evitar landing page.
- Evitar hero section.
- Evitar excesso de cards grandes.
- Evitar visual de BI genérico.
- Evitar parecer sistema só de upload manual.
- Evitar esconder a origem do documento.
- Evitar IA como protagonista visual da primeira tela.
- Evitar prometer Google Sheets estruturado, validação de evidência ou vínculos regulatórios como recursos já funcionais.

## O que precisa ficar evidente

- O Drive é a fonte.
- O sistema é a camada de governança.
- A sincronização tem status.
- Origem, caminho, revisão e link do Drive ficam rastreáveis.
- Documento extraído ainda não é evidência governada.
- Documento sem vínculo validado não deve aparecer como evidência oficial.
- A consulta será feita no sistema, mas a origem continua rastreável.

## Backend funcional nesta versão

O backend disponível entrega:

- OAuth Google Drive.
- Status de conexão.
- Listagem de pastas do Drive.
- Cadastro/listagem/edição/desativação de pastas monitoradas.
- Sincronização manual.
- Jobs de sincronização/importação.
- Importação de metadados do Drive.
- Detecção de versão/revisão.
- Extração textual básica de Google Docs, arquivos textuais e alguns PDFs textuais.
- Listagem de documentos.
- Preview textual do documento.
- Edição de metadados básicos.
- Marcação como aguardando validação.
- Auditoria de eventos.

Não estão funcionais ainda:

- Ingestão estruturada de Google Sheets por abas/linhas/células.
- OCR para PDFs digitalizados.
- Classificação automática por IA.
- Vínculo real com licença, condicionante, obrigação, protocolo ou processo.
- Validação formal de evidência oficial.
- Responsáveis e filtros regulatórios avançados.

O frontend deve tratar esses itens como próximos passos, placeholders ou controles desabilitados.
