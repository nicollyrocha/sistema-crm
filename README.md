# Sistema CRM

Harness de uma aplicação CRM: autenticação completa, conta de usuário e landing page. Nenhuma
funcionalidade de CRM (contatos, funil, etc.) foi implementada ainda — este é o alicerce para
construir essas features em seguida.

## Stack
- Next.js 16 (App Router, TypeScript)
- Neon (Postgres) + Drizzle ORM
- Better Auth (email/senha, recuperação de senha, troca de email)
- Vercel Blob (upload de foto de perfil)
- Tailwind CSS + shadcn/ui, Framer Motion

## Setup local
1. `npm install`
2. Copie `.env.local.example` para `.env.local` e preencha `DATABASE_URL` (connection string do
   Neon). Gere `BETTER_AUTH_SECRET` com:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. `npx drizzle-kit generate && npx drizzle-kit migrate`
4. `npm run dev`

Sem `RESEND_API_KEY` configurado, os links de recuperação de senha e troca de email são logados
no console do servidor em vez de enviados por email — copie a URL do terminal para testar esses
fluxos localmente.

Sem `BLOB_READ_WRITE_TOKEN` configurado, o upload de foto de perfil falha com um erro tratado em
vez de quebrar — configure um Blob store na Vercel para habilitar o upload real.

## Deploy (Vercel)
1. Suba este repositório no GitHub e importe na Vercel.
2. Configure as variáveis de ambiente no projeto da Vercel: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL` (sua URL de produção), `BLOB_READ_WRITE_TOKEN` (criado em Storage > Blob no
   dashboard da Vercel), `RESEND_API_KEY`, `EMAIL_FROM`.
3. Rode as migrações contra o banco de produção: `npx drizzle-kit migrate` com `DATABASE_URL`
   apontando para a branch de produção do Neon.
4. Deploy.

## Testes
```bash
npm test
```
