# 🔗 URL Shortener — Backend

API REST para encurtamento de URLs construída com NestJS, PostgreSQL, Redis e monitoramento via Sentry.

---

## 🚀 Tecnologias

- **[NestJS](https://nestjs.com/)** — Framework Node.js para construção da API
- **[TypeORM](https://typeorm.io/)** — ORM para integração com PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** — Banco de dados relacional
- **[Redis](https://redis.io/)** — Cache de URLs encurtadas e throttling distribuído
- **[JWT](https://jwt.io/)** — Autenticação via JSON Web Token (Bearer)
- **[Swagger](https://swagger.io/)** — Documentação interativa da API
- **[Sentry](https://sentry.io/)** — Monitoramento de erros e performance
- **[Biome](https://biomejs.dev/)** — Linter e formatter
- **[nanoid](https://github.com/ai/nanoid)** — Geração de short codes únicos
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** — Hash de senhas
- **Docker / Docker Compose** — Orquestração dos serviços

---

## 📁 Estrutura do Projeto

```
src/
├── common/
│   ├── auth/           # Guard JWT e decorator @Public
│   ├── cache/          # Serviço de cache (Redis)
│   ├── constants/      # Mensagens HTTP
│   ├── helpers/        # Helpers utilitários
│   ├── interceptors/   # ResponseInterceptor (padronização de respostas)
│   └── interfaces/     # Interfaces de tipagem (Env, JWT, Response)
├── modules/
│   ├── auth/           # Login e geração de token JWT
│   ├── users/          # CRUD de usuários
│   └── urls/           # CRUD de URLs + redirecionamento
├── app.module.ts
├── main.ts
└── instrument.ts       # Inicialização do Sentry
```

---

## ⚙️ Configuração do `.env`

Antes de executar o `docker compose build`, crie o arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

Em seguida, preencha as variáveis:

```env
# Ambiente da aplicação
NODE_ENV=development

# Banco de dados (deve coincidir com o docker-compose.yml)
DB_HOST=localhost        # Use "postgres" ao rodar via Docker Compose
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=URI-BACKEND  # Mesmo valor de POSTGRES_PASSWORD no docker-compose
DB_DATABASE=url_shortener

# JWT — troque por uma string longa e aleatória
JWT_SECRET=sua_chave_super_secreta_aqui

# Sentry — obtenha o DSN no painel do seu projeto em sentry.io
SENTRY_DSN=https://xxxx@oxxxx.ingest.sentry.io/xxxx

# URL base da API (usada para montar o short URL retornado)
API_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379  # Use "redis://redis:6379" via Docker Compose
```

> **Atenção:** ao subir com Docker Compose, `DB_HOST` e `REDIS_URL` são sobrescritos automaticamente pelo `environment` do serviço `api` no `docker-compose.yml`. Você não precisa alterá-los manualmente para uso via Docker.

---

## 🐳 Subindo com Docker Compose

```bash
# 1. Crie e configure o .env
cp .env.example .env
# edite o .env com JWT_SECRET e SENTRY_DSN

# 2. Build e start dos containers
docker compose up --build

# 3. Acesse a API
# http://localhost:3000

# 4. Documentação Swagger
# http://localhost:3000/docs
```

Os serviços iniciados são:

| Serviço    | Porta | Descrição                |
| ---------- | ----- | ------------------------ |
| `api`      | 3000  | Aplicação NestJS         |
| `postgres` | 5432  | Banco de dados           |
| `redis`    | 6379  | Cache e throttle storage |

---

## 🛠️ Desenvolvimento Local (sem Docker)

```bash
# Instale as dependências
npm install

# Suba apenas os serviços de infraestrutura
docker compose up postgres redis -d

# Inicie a aplicação em modo watch
npm run start:dev
```

---

## 👤 Criando o Primeiro Usuário

Não há rota pública de cadastro — o primeiro usuário precisa ser inserido diretamente no banco. A senha deve ser gerada com bcrypt antes do insert.

**1. Gere o hash da senha:**

```bash
npx ts-node src/gen-hash.ts
# Saída: $2b$10$...  ← copie esse valor
```

> O script `gen-hash.ts` usa bcrypt com salt 10 e gera o hash da senha `123` por padrão. Edite o arquivo para usar outra senha se necessário.

**2. Insira o usuário no banco:**

```sql
INSERT INTO users ("firstName", "lastName", "userName", email, password, status, "createdAt")
VALUES (
  'Admin',
  'User',
  'admin',
  'admin@email.com',
  '$2b$10$HASH_GERADO_NO_PASSO_ANTERIOR',
  1,
  NOW()
);
```

**3. Faça login com as credenciais:**

```json
{
  "userName": "admin",
  "password": "123"
}
```

---

## 🗄️ Migrations

```bash
# Gerar uma nova migration
npm run migration:generate --name=NomeDaMigration

# Executar migrations pendentes
npm run migration:run

# Reverter a última migration
npm run migration:revert
```

> Em ambiente de desenvolvimento, o `synchronize: true` do TypeORM está habilitado — as entidades são sincronizadas automaticamente. Em produção, `synchronize` é desativado e o uso de migrations é obrigatório.

---

## 📖 Endpoints principais

A documentação completa está disponível via Swagger em `/docs`.

### Autenticação

| Método | Rota          | Descrição              | Auth |
| ------ | ------------- | ---------------------- | ---- |
| POST   | `/auth/login` | Login e retorno do JWT | ❌   |

### Usuários

| Método | Rota         | Descrição         | Auth |
| ------ | ------------ | ----------------- | ---- |
| POST   | `/users`     | Criar usuário     | ❌   |
| GET    | `/users/me`  | Dados do usuário  | ✅   |
| PATCH  | `/users/:id` | Atualizar usuário | ✅   |
| DELETE | `/users/:id` | Deletar usuário   | ✅   |

### URLs

| Método | Rota                    | Descrição                      | Auth |
| ------ | ----------------------- | ------------------------------ | ---- |
| POST   | `/urls`                 | Criar URL encurtada            | ✅   |
| GET    | `/urls`                 | Listar URLs do usuário         | ✅   |
| GET    | `/urls/:id`             | Buscar URL por ID              | ✅   |
| PATCH  | `/urls/:id`             | Atualizar URL                  | ✅   |
| DELETE | `/urls/:id`             | Soft delete de URL             | ✅   |
| GET    | `/urls/shortCode/:code` | Redirecionar para URL original | ❌   |

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:cov

# Testes e2e
npm run test:e2e
```

---

## 🔒 Segurança

- Todas as rotas são protegidas por JWT por padrão. Use o decorator `@Public()` para rotas públicas.
- Rate limiting de **100 requisições por minuto** por IP, com armazenamento no Redis.
- Senhas armazenadas com hash via **bcrypt**.
- Validação de payload com `class-validator` (whitelist + forbidNonWhitelisted).

---

## 📊 Monitoramento (Sentry)

O Sentry é inicializado via `instrument.ts` antes do bootstrap da aplicação. O `SentryGlobalFilter` captura todas as exceções não tratadas automaticamente.

Para ativar o monitoramento, basta preencher o `SENTRY_DSN` no `.env` com o DSN do seu projeto em [sentry.io](https://sentry.io).

---

## 🏗️ Decisões Técnicas

**Cache de redirecionamento com Redis** — o endpoint de redirecionamento (`/urls/shortCode/:code`) tende a ser o mais acessado da aplicação. Para evitar uma query ao banco a cada acesso, o resultado é cacheado no Redis por 1 hora e invalidado automaticamente ao editar ou deletar a URL.

**Soft delete** — URLs não são removidas fisicamente do banco. O campo `status` é alterado para `2` (inativa) e o campo `disabledAt` é preenchido. Isso preserva o histórico e permite reativação futura.

**Short code com colisão garantida** — o `nanoid(6)` gera o código curto em loop até encontrar um valor único no banco, evitando conflitos sem depender de constraints de banco para controlar o fluxo.

**Guard global com `@Public()`** — em vez de aplicar autenticação rota a rota, o `AuthGuard` é registrado globalmente e as rotas públicas são marcadas com o decorator `@Public()`. Além de verificar o token JWT, o guard consulta o banco para confirmar que o usuário ainda existe e está ativo.

**ResponseInterceptor global** — todas as respostas (sucesso e erro) seguem o mesmo envelope `{ statusCode, message, request_date, path, data }`, facilitando o consumo pelo frontend. Erros 5xx são capturados e enviados ao Sentry automaticamente pelo próprio interceptor.

**Rate limiting com storage no Redis** — o throttle é configurado globalmente (100 req/min por IP) com estado armazenado no Redis, o que garante que o limite funcione corretamente em ambientes com múltiplas instâncias da API.

**Paginação nas listagens** — os endpoints `GET /users` e `GET /urls` utilizam paginação via query params `page` e `limit`. A lógica de montar o envelope paginado (`totalPages`, `page`, `limit`) fica centralizada no `ResponseInterceptor`, que detecta automaticamente quando o service retorna

**Testes unitários** — todos os controllers e services possuem testes unitários com mocks, cobrindo os cenários de sucesso e erro de cada endpoint. O `jest.mock` é usado para isolar dependências externas como bcrypt e nanoid, garantindo testes rápidos e sem dependência de infraestrutura.

---

## 🔮 Melhorias com Mais Tempo

- **Refresh token** — atualmente o JWT expira em 12h sem possibilidade de renovação silenciosa. Implementaria um fluxo de refresh token com rotação e armazenamento seguro.
- **Rota de cadastro pública** — hoje o primeiro usuário precisa ser inserido manualmente no banco. Uma rota de registro publica resolveria isso porém necessitando de uma validação por email ou telefone.
- **Testes e2e** — configuraria o `app.e2e-spec.ts` com banco e Redis dedicados em container para cobrir os principais fluxos de ponta a ponta, validando o comportamento real da aplicação completa.
- **Versionamento semântico** — o projeto já possui version no package.json, mas sem um processo formal. Adotaria o npm version integrado ao CI/CD para que cada release gere automaticamente uma tag Git, facilitando o rastreamento de deploys e a geração de changelogs com ferramentas como conventional-changelog.

---

## 🌐 CORS

Por padrão, o CORS está configurado para aceitar requisições de `http://localhost:4200` (Angular dev server). Altere a `origin` em `src/main.ts` conforme necessário.
