# Arquitetura provisória do NEXO

## Objetivo

Validar estrutura, navegação, módulos e regras de negócio **sem decidir agora a tecnologia de dados**. A arquitetura foi organizada para que a troca da camada de dados não exija reconstruir a interface nem as regras.

## Visão em camadas

```
Páginas e módulos (React)
        │  usam apenas
        ▼
hooks/useQuery ──► services (contratos em services/contracts.ts)
                          │
                          ├── services/local/*   ← implementação ATUAL (mock + localStorage)
                          └── services/http/*    ← implementação FUTURA (API)
                          
domain/rules.ts  ← regras de negócio puras, usadas pelos serviços
```

| Camada | Responsabilidade | Arquivos |
|---|---|---|
| Tipos | Modelo de domínio, independente de armazenamento | `src/types/index.ts` |
| Regras | Funções puras: progresso, atraso, severidade, nível de risco, métricas de teste, homologação | `src/domain/rules.ts` |
| Contratos | Interfaces assíncronas de cada serviço | `src/services/contracts.ts` |
| Implementação local | Leitura/gravação no `localStorage`, histórico de auditoria e transições automáticas de status | `src/services/local/*` |
| Ponto de troca | Objeto `services` que a interface importa | `src/services/index.ts` |
| Reatividade | Após qualquer gravação, `notifyDataChanged()` faz as consultas ativas se recarregarem | `src/services/events.ts`, `src/hooks/useQuery.ts` |
| Interface | Páginas, módulos e componentes, sem acesso direto ao armazenamento | `src/pages`, `src/modules`, `src/components` |

### Serviços

`PersonService`, `ProjectService`, `TaskService`, `RiskService`, `TestService` (casos, execuções, evidências e homologações), `DocumentService`, `UpdateService`, `DashboardService`, `FileService` e `SettingsService`.

Todas as operações retornam `Promise`, como uma chamada HTTP retornaria.

## Armazenamento provisório

- `localStorage`, chave `nexo:prototype:db`, com um único documento JSON versionado (`SEED_VERSION`).
- Gravação atômica: a alteração é aplicada a uma cópia, persistida e só então adotada. Se a cota do navegador estourar, a operação falha com uma mensagem clara e nada é alterado.
- Leituras devolvem cópias (`structuredClone`), para que a interface nunca altere o estado diretamente.
- Arquivos de até **512 KB** são guardados como *data URL*. Acima disso, só os metadados (nome, tipo, tamanho) são registrados, e o arquivo aparece como "simulado". O limite total do `localStorage` é de cerca de 5 MB.
- Preferências de interface (menu recolhido, visão Kanban/tabela) usam chaves separadas e não interferem nos dados.

**Limitações:** os dados ficam em um único navegador, sem concorrência, controle de acesso, backup ou compartilhamento entre usuários.

## Por que não há backend nesta fase

Nenhuma funcionalidade do protótipo precisa de servidor. Criar uma API Express agora significaria escrever endpoints sem finalidade prática e, provavelmente, refazê-los quando o banco for definido. O Node.js é usado como ambiente de desenvolvimento e build (Vite).

## Como evoluir para a fonte de dados definitiva

1. Escolher a fonte (SharePoint Lists, PostgreSQL, Dataverse ou outra) e criar a API (por exemplo, NestJS ou Express em `backend/`), expondo operações equivalentes aos contratos.
2. Criar `src/services/http/` com implementações que chamam a API e respeitam as mesmas interfaces de `contracts.ts`.
3. Trocar as atribuições em `src/services/index.ts`. Páginas e módulos não mudam.
4. Mover para o servidor as regras que exigem garantia de consistência, como as transições automáticas de status, o histórico de auditoria e o cálculo de indicadores. `domain/rules.ts` é puro e pode ser reaproveitado no backend Node.
5. Após cada gravação, chamar `notifyDataChanged()`, ou substituir `useQuery` por uma biblioteca como TanStack Query, mantendo a mesma assinatura.
6. Substituir `FileService.prepare` por upload para o armazenamento definitivo (SharePoint/OneDrive via Graph, Blob Storage etc.), guardando apenas a URL em `FileRef`.

### Pontos de atenção para a modelagem futura

- Ids hoje são strings geradas no cliente. No servidor, devem ser gerados pela fonte de dados.
- `Project.testConfig` está embutido no projeto. Em um banco relacional ou em listas do SharePoint, provavelmente será uma tabela/lista própria.
- `HistoryEntry` é uma auditoria simplificada. Em produção, deve registrar o usuário autenticado e ser gravada no servidor.
- Pessoas são um cadastro simulado. Futuramente, serão vinculadas ao diretório corporativo (Entra ID).
