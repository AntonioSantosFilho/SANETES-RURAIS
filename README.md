# Sanetes

Base multiplataforma do Sanetes Rurais com React, Vite, Node.js, PostgreSQL e Docker.

## Executar

1. Copie `.env.example` para `.env` e ajuste a senha.
2. Execute `docker compose up --build`.
3. Abra `http://localhost:8082`.

A API fica disponível em `http://localhost:3000` e o PostgreSQL somente em
`127.0.0.1:5433`.

Contas locais iniciais:

- administrador: `admin` / `admin123`;
- responsável de campo: `campo` / `campo123`.

Essas credenciais servem apenas para desenvolvimento e devem ser alteradas no
arquivo `.env` antes de qualquer publicação.

## Funcionalidades implementadas

- autenticação com perfis administrador e campo;
- cadastro de sistemas e contas responsáveis;
- registro da última visita;
- questionário Q1–Q17 com validações condicionais;
- rascunho local retomável;
- captura ou seleção de quatro fotos;
- monitoramento persistido no PostgreSQL;
- arquivos em volume Docker persistente;
- consulta administrativa de respostas, fotos e feedback.

## Desenvolvimento sem Docker

```bash
npm install
npm run dev:api
npm run dev:web
```

O frontend usa `/api` em produção. Durante o desenvolvimento, o Vite encaminha
as chamadas para `http://localhost:3000`.

## Android

O projeto Capacitor fica em `apps/web/android`. Para sincronizar a interface:

```bash
npm run android:sync --workspace @sanetes/web
```

Para gerar um APK de desenvolvimento em um ambiente com Android SDK/JDK:

```bash
npm run android:apk --workspace @sanetes/web
```

Em um celular, a URL da API deverá apontar para um domínio HTTPS acessível pelo
dispositivo; `localhost` funciona apenas no ambiente web local.

## Estrutura

```text
apps/web   React + Vite
apps/api   Fastify + Drizzle ORM
drizzle    Migrações SQL aplicadas automaticamente
```
