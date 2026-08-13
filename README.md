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

## Produção em VPS com Nginx existente

O arquivo `docker-compose.production.yml` não publica portas no host. O banco e
a API ficam na rede interna do Sanetes, e apenas o serviço `sanetes-web` entra na
rede Docker do proxy reverso.

Confira a rede utilizada pelo Nginx:

```bash
docker inspect hexflow_nginx --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{println}}{{end}}'
```

Informe esse nome em `PROXY_NETWORK` no `.env` e suba a aplicação:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

Use `deploy/nginx-sanetes.conf.example` como base para o novo domínio. O Nginx
deve encaminhar as requisições para `http://sanetes-web:80`; as rotas `/api`
serão encaminhadas internamente pelo Nginx do próprio frontend.

## Estrutura

```text
apps/web   React + Vite
apps/api   Fastify + Drizzle ORM
drizzle    Migrações SQL aplicadas automaticamente
```
