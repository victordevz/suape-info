# Credenciais Google Drive para a integracao

Este guia mostra como obter as credenciais necessarias para conectar o backend ao Google Drive via OAuth 2.0.

## Variaveis usadas pelo backend

Configure estas variaveis no `.env`:

```bash
GOOGLE_OAUTH_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="seu-client-secret"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/api/integrations/google-drive/oauth/callback"
GOOGLE_CREDENTIAL_ENCRYPTION_KEY="chave-base64-de-32-bytes"
GOOGLE_DRIVE_SCOPES="https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/drive.metadata.readonly"
GOOGLE_DRIVE_MAX_EXTRACT_BYTES=5242880
```

Gere a chave de criptografia localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Essa chave criptografa os tokens OAuth antes de persistir no banco. Guarde-a fora do repositorio e mantenha a mesma chave entre deploys; trocar a chave impede descriptografar conexoes ja gravadas.

## 1. Criar ou selecionar um projeto Google Cloud

1. Acesse o Google Cloud Console.
2. Crie um novo projeto ou selecione o projeto da aplicacao.
3. Confirme que a conta usada tem permissao para configurar APIs, tela de consentimento e credenciais.

## 2. Habilitar a Google Drive API

1. No Google Cloud Console, abra `APIs & Services`.
2. Procure por `Google Drive API`.
3. Clique em `Enable`.

Sem essa API habilitada, o OAuth pode ate concluir, mas chamadas como listagem de arquivos e pastas falharao.

## 3. Configurar a tela de consentimento

1. Abra `Google Auth platform`.
2. Configure `Branding` com nome da aplicacao, email de suporte e contato.
3. Configure `Audience`:
   - use `Internal` quando for um app restrito ao Google Workspace da organizacao;
   - use `External` quando usuarios fora do Workspace precisarem autorizar acesso.
4. Em `Data Access`, declare os escopos usados pela aplicacao:

```text
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.metadata.readonly
```

O escopo `drive.readonly` permite visualizar e baixar arquivos do Drive, necessario para extrair texto. O escopo `drive.metadata.readonly` permite ler metadados de arquivos. Para producao publica, esses escopos podem exigir verificacao do app pelo Google.

## 4. Criar o OAuth Client ID

1. Abra `Google Auth platform > Clients`.
2. Clique em `Create Client`.
3. Selecione `Application type > Web application`.
4. Defina um nome, por exemplo `Poketeam Backend Local`.
5. Em `Authorized redirect URIs`, adicione:

```text
http://localhost:3000/api/integrations/google-drive/oauth/callback
```

6. Para homologacao/producao, adicione tambem a URL real da API, por exemplo:

```text
https://api.seudominio.com/api/integrations/google-drive/oauth/callback
```

7. Salve e copie:
   - `Client ID` para `GOOGLE_OAUTH_CLIENT_ID`;
   - `Client secret` para `GOOGLE_OAUTH_CLIENT_SECRET`.

O valor de `GOOGLE_OAUTH_REDIRECT_URI` no backend precisa ser exatamente um dos redirects cadastrados no Google.

## 5. Aplicar banco e iniciar a API

Depois de preencher o `.env`:

```bash
npm run prisma:generate
npm run db:migrate
npm run dev
```

## 6. Testar o fluxo OAuth e a sincronizacao

1. Peça a URL de autorizacao:

```bash
curl -X POST http://localhost:3000/api/integrations/google-drive/connect \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Google Drive Governanca Ambiental"}'
```

2. Abra `authorizationUrl` no navegador e aceite o acesso.
3. O Google redirecionara para `/api/integrations/google-drive/oauth/callback`; o backend troca o `code` por tokens e grava uma `connected_source`.
4. Verifique a conexao:

```bash
curl http://localhost:3000/api/integrations/google-drive/status
```

5. Liste pastas do Drive:

```bash
curl "http://localhost:3000/api/integrations/google-drive/folders?connectedSourceId=UUID_DA_FONTE&q=licencas"
```

6. Registre uma pasta monitorada:

```bash
curl -X POST http://localhost:3000/api/monitored-folders \
  -H "Content-Type: application/json" \
  -d '{
    "connectedSourceId": "UUID_DA_FONTE",
    "driveFolderId": "ID_DA_PASTA",
    "folderName": "Licencas ambientais"
  }'
```

7. Rode uma sincronizacao manual:

```bash
curl -X POST http://localhost:3000/api/sync/google-drive/run \
  -H "Content-Type: application/json" \
  -d '{"connectedSourceId":"UUID_DA_FONTE"}'
```

8. Consulte documentos e jobs:

```bash
curl http://localhost:3000/api/documents
curl http://localhost:3000/api/sync/jobs
```

## Observacoes de seguranca

- Nunca commite `.env`, client secret ou chave de criptografia.
- Em producao, use um secret manager.
- Revogar acesso no Google invalida a conexao; a API passara a marcar a fonte como `EXPIRED` quando nao conseguir renovar o token.
- Exclusao ou alteracao no Drive nao apaga historico importado; uma alteracao gera nova versao quando o Drive informa nova revisao/metadados.
- PDFs digitalizados ou comprimidos podem ficar com extracao `FAILED`; a implementacao atual cobre texto simples e deixa o caminho pronto para OCR.

## Fontes oficiais

- Google Drive API Node.js Quickstart: https://developers.google.com/workspace/drive/api/quickstart/nodejs
- Criar credenciais OAuth: https://developers.google.com/workspace/guides/create-credentials
- OAuth 2.0 para aplicacoes Web Server: https://developers.google.com/identity/protocols/oauth2/web-server
- Escopos da Google Drive API: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
