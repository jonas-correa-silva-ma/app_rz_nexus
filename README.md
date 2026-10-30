# NEXO

**Projetos conectados. Resultados integrados.**

Protótipo funcional de uma plataforma corporativa de gerenciamento integrado de projetos: dashboard executivo, projetos, tarefas (tabela e Kanban), portfólio, riscos e pendências, testes e homologação, documentos, atualizações e configurações.

> ⚠️ **Protótipo.** Os dados são simulados e ficam salvos apenas no navegador (`localStorage`). Esse armazenamento é provisório e **não é adequado** para uso corporativo multiusuário em produção. A tecnologia definitiva de dados (SharePoint Lists, PostgreSQL, Dataverse ou outra) ainda não foi escolhida.

## Requisitos

- Node.js 22.22 ou superior (testado com Node 24.22 e npm 11.19)
- Navegador moderno (Chrome, Edge, Firefox ou Safari)

## Como executar

```bash
npm run install:all   # instala as dependências do frontend
npm run dev           # inicia em http://localhost:5173
```

Outros comandos (na raiz ou dentro de `frontend/`):

| Comando | Descrição |
|---|---|
| `npm run build` | Checagem de tipos + build de produção em `frontend/dist` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Apenas checagem de tipos TypeScript |

Os dados de demonstração são criados automaticamente no primeiro acesso. Para restaurá-los, use **Configurações → Restaurar dados originais**.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · componentes no padrão shadcn/ui (Radix UI + CVA) · Lucide · React Router · Recharts · date-fns · Sonner.

## Estrutura

```
.
├── package.json          # atalhos para os comandos do frontend
├── docs/                 # arquitetura, regras de negócio, funcionalidades e limitações
└── frontend/
    └── src/
        ├── components/   # ui/ (base shadcn), common/ (compartilhados), charts/, layout/
        ├── config/       # rótulos, opções e cores de status; versão do app
        ├── domain/       # regras de negócio puras (progresso, atrasos, riscos, testes)
        ├── hooks/        # useQuery (reativo), useForm, useReferenceData
        ├── lib/          # utilitário cn()
        ├── mocks/        # dados de demonstração (datas relativas a hoje)
        ├── modules/      # funcionalidades reutilizáveis: projects, tasks, risks, tests, documents, updates
        ├── pages/        # telas (rotas)
        ├── routes/       # configuração do React Router (carregamento sob demanda)
        ├── services/     # contracts.ts (interfaces), local/ (implementação provisória), index.ts
        ├── types/        # tipos de domínio
        └── utils/        # datas e formatação
```

Não há pasta `backend/` nesta fase: nenhuma funcionalidade do protótipo depende de servidor. Veja a justificativa e o caminho de evolução em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Documentação

- [Arquitetura provisória](docs/ARQUITETURA.md)
- [Regras de negócio](docs/REGRAS_DE_NEGOCIO.md)
- [Funcionalidades implementadas, limitações e próximos passos](docs/FUNCIONALIDADES.md)
