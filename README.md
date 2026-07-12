# PTAH Recife

MVP de inteligência urbana que conecta relatos da população à operação da
Prefeitura do Recife. A interface simula conversas, cria ocorrências em tempo
real, atualiza indicadores e permite preparar alertas localizados por RPA e
bairro.

## Tecnologias

- Next.js 16 com App Router
- React 19 e TypeScript
- Leaflet com mapas do OpenStreetMap
- Tailwind CSS

## Desenvolvimento local

Requisitos: Node.js 22 e npm.

```bash
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Validação

```bash
npm run build
```

## Deploy na Vercel

### Pelo GitHub

1. Envie este projeto para um repositório no GitHub.
2. Acesse `vercel.com/new` e conecte sua conta do GitHub.
3. Selecione o repositório do PTAH.
4. Confirme o preset **Next.js**.
5. Mantenha os comandos detectados automaticamente e clique em **Deploy**.

A Vercel executará `npm install` e `npm run build`. Cada alteração enviada à
branch principal atualizará a produção; pull requests receberão URLs próprias
de preview.

### Pela linha de comando

```bash
npx vercel
npx vercel --prod
```

O primeiro comando cria um preview. O segundo publica em produção.

## Variáveis de ambiente

Esta versão do MVP não exige variáveis de ambiente, banco de dados ou chaves de
API. Quando as integrações reais forem adicionadas, registre as chaves em
**Project Settings → Environment Variables** na Vercel e em `.env.local` no
desenvolvimento local.
