# Painel Rafael — configuração inicial (fazer uma vez)

## 1. Instalar o Git
No terminal do VS Code (PowerShell):

```
winget install --id Git.Git -e
```

Feche e reabra o VS Code depois.

## 2. Supabase (banco + login)
1. Acesse https://supabase.com → **Start your project** → entre com o GitHub.
2. **New project**: nome `painel-rafael`, região **South America (São Paulo)**.
   Anote a senha do banco num lugar seguro (quase nunca será usada).
3. Menu **SQL Editor** → **New query** → cole todo o conteúdo de
   `supabase/migrations/001_schema.sql` → **Run**. Deve aparecer "Success".
4. Menu **Authentication → Users → Add user → Create new user**:
   seu e-mail + uma senha, marcando **Auto Confirm User**.
5. Menu **Authentication → Sign In / Providers**: desligue
   **Allow new users to sign up** → Save. (Ninguém mais consegue criar conta.)
6. Menu **Project Settings → API Keys**: copie a **Publishable key**.
   Em **Project Settings → Data API** copie a **Project URL**.

## 3. Rodar no computador
Na pasta do projeto, crie o arquivo `.env.local` (modelo em `.env.example`):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=sb_publishable_xxxx
```

Depois: `npm run dev` e abra http://localhost:5173.

## 4. Publicar (Vercel)
1. Crie um repositório **privado** no GitHub chamado `painel-rafael` e envie o
   código (o Claude Code faz os comandos `git` para você).
2. Acesse https://vercel.com → entre com o GitHub → **Add New → Project** →
   importe `painel-rafael`.
3. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env.local`.
4. **Deploy**. Você recebe um endereço tipo `painel-rafael.vercel.app`.
   A partir daí, todo `git push` publica sozinho.

## 5. Instalar no Android
Abra o endereço no **Chrome** → menu ⋮ → **Instalar app**
(ou "Adicionar à tela inicial"). Faça login uma vez; a sessão fica salva.

## Observação: pausa do plano gratuito
O Supabase gratuito pausa projetos após 7 dias **sem nenhum uso**. Com uso
diário isso não acontece; se acontecer, basta clicar em "Restore" no painel —
nenhum dado é perdido.
