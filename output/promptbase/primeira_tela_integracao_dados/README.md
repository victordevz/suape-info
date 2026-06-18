# Promptbase - Primeira tela de integração de dados

Esta pasta reúne a base de prompt e planejamento para a primeira tela estratégica do produto.

## Arquivos

1. `01_prompt_frontend_primeira_tela.md`
   - Prompt principal para gerar a primeira tela frontend.
   - Use quando quiser criar a interface visual da Central de Dados e Evidências.

2. `02_brief_primeira_tela.md`
   - Brief de produto e UX.
   - Define hipótese estratégica, usuário, estados, entidades, branding Suape e o que evitar.

3. `03_plano_feature_backend_google_drive_para_db.md`
   - Plano técnico da primeira feature backend.
   - Foca na integração Google Drive -> sistema -> banco de dados.

4. `04_tela_figma_gerada.md`
   - Registro da tela já criada no Figma.
   - Contém link do arquivo, link do frame, node id, contexto usado e validação visual.

## Tela criada

- Nome: Central de Dados e Evidências.
- Figma: https://www.figma.com/design/dZjHc12Hwpgrrj0UpXJNTD?node-id=3-2
- Status: criada e revisada visualmente em `2026-06-18`.

## Direção estratégica

A primeira entrega não precisa implementar todo o backend regulatório planejado. A fatia estratégica inicial é:

- conectar Google Drive;
- monitorar pastas;
- importar documentos;
- registrar origem e versão;
- extrair conteúdo;
- mostrar documentos no sistema;
- preparar classificação e validação humana.

O Google Drive continua sendo fonte de trabalho. A aplicação passa a ser a camada de governança, consulta e rastreabilidade.

## Branding

O prompt e o brief consideram o Manual de Identidade Visual Suape:

- Azul Suape: `#2E60AD`.
- Amarelo Suape: `#FCB316`.
- Tipografia de apoio: Matt Regular, Matt Medium, Matt Bold e Matt Black.
- Uso de marca institucional com aplicação contida, adequada a uma tela operacional.
