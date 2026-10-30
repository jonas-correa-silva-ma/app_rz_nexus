# Funcionalidades, limitações e próximos passos

Versão do protótipo: **0.1.0**

## Funcionalidades implementadas

### Geral
- Menu lateral fixo e recolhível (desktop) e menu em gaveta (mobile).
- Layout responsivo, validado sem rolagem horizontal a 390 px de largura.
- Persistência local entre sessões, com restauração e limpeza dos dados de demonstração.
- Usuário simulado (selecionável), usado como padrão nos cadastros e no histórico.
- Notificações de sucesso e erro para todas as operações.
- Páginas carregadas sob demanda (code splitting).

### Dashboard
- 11 indicadores calculados: total de projetos, em andamento, concluídos, atrasados, em risco, total de tarefas, tarefas atrasadas, tarefas concluídas, testes pendentes, testes reprovados e projetos aguardando homologação.
- 6 gráficos: projetos por status, projetos por prioridade, evolução (12 meses), tarefas por status, distribuição de riscos (severidade × tipo) e situação dos testes. Cada gráfico pode ser alternado para visualização em tabela.
- Lista de projetos que exigem atenção, com responsável, status, progresso real × esperado, prazo, nível de risco e motivos.
- Filtros por período, responsável e status.

### Projetos
- Listagem com pesquisa, filtros (status, prioridade, área, responsável), ordenação por coluna, criação, edição e exclusão.
- Cadastro com todos os campos solicitados, incluindo a equipe, as dependências e a configuração de testes.
- Detalhe com 9 abas: visão geral, tarefas, cronograma (Gantt), riscos, atualizações, documentos, testes, indicadores e histórico. Tudo é filtrado automaticamente pelo projeto.
- Alteração rápida de status no cabeçalho do projeto.

### Tarefas
- Visualizações em tabela e em Kanban (arrastar e soltar; em telas de toque, um seletor de status no cartão).
- Criação, edição, exclusão, alteração de status, de responsável e de progresso.
- Filtros por projeto, responsável, status e "somente atrasadas", além de pesquisa e ordenação.
- Identificação de atrasos e de tarefas corretivas originadas de falhas de teste.

### Riscos e pendências
- Registro de riscos, problemas, impedimentos e pendências, com severidade calculada (P × I).
- Matriz de criticidade 5×5 clicável e indicadores de registros críticos, impedimentos, pendências e prazos vencidos.
- Agrupamento por criticidade, projeto ou responsável e filtros por tipo, severidade, status, projeto e responsável.

### Testes e homologação
- Testes opcionais por projeto, com configuração de tipo, coordenador, responsáveis, aprovador, data planejada e critérios.
- Casos de teste com todos os campos solicitados e identificador automático.
- Execuções com número da tentativa, executor, data, resultado esperado e obtido, status, comentários, evidências e necessidade de reteste. Todas as tentativas anteriores são preservadas.
- Evidências: capturas, planilhas, documentos, arquivos de resultado, comentários e registros de execução. Podem ser incluídas na execução ou depois dela.
- Reprovação: criação de tarefa corretiva (responsável, prazo, prioridade) ou vínculo com tarefa existente, e reteste.
- Homologação com responsável, data, resultado, comentários, ressalvas, pendências impeditivas e evidências, podendo concluir o projeto.
- Indicadores: casos cadastrados, não iniciados, em andamento, aprovados, reprovados, bloqueados, % de execução, % de aprovação, falhas abertas, retestes pendentes e projetos aguardando homologação.
- Visões de casos, de todas as execuções e de homologações.

### Documentos
- Inclusão com seleção de arquivo real, associação ao projeto, tipo, descrição, responsável e data de inclusão.
- Abertura do arquivo quando ele estiver armazenado. Arquivos maiores aparecem como simulados.

### Atualizações
- Registro de projeto, data, responsável, situação geral, resumo, entregas, próximos passos, riscos, impedimentos e apoio necessário.
- Linha do tempo cronológica, com filtro por projeto.

### Portfólio
- Distribuição por status e matriz prioridade × nível de risco.
- Tabela consolidada com responsável, prioridade, status, progresso real × esperado, prazo, riscos abertos, dependências e nível de risco.
- Linha do tempo (Gantt) dos projetos, carga de trabalho por responsável e dependências que podem causar impacto.

### Configurações
- Regra de progresso configurável e limite de atraso de cronograma.
- Restaurar e limpar dados, uso do armazenamento, versão, regras de referência e cadastro de pessoas.

## Validação realizada

Foi executado um roteiro automatizado no Chrome (headless), com 45 verificações aprovadas e nenhum erro ou aviso no console. O roteiro cobriu:
- as 10 rotas e as 9 abas do projeto;
- a coerência dos indicadores com os dados e os filtros do dashboard;
- a validação de formulário, a criação e a edição de projeto e a criação de tarefa vinculada;
- o recálculo do progresso, a reprovação com tarefa corretiva e o reteste preservando a tentativa anterior;
- a homologação concluindo o projeto e o upload de documento;
- a persistência após recarregar a página, a exclusão em cascata, a troca da regra de progresso e a restauração dos dados;
- a ausência de rolagem horizontal em 6 telas no celular.

## Limitações conhecidas

- **Armazenamento provisório** (`localStorage`): um único navegador, cerca de 5 MB, sem multiusuário, concorrência, backup ou controle de acesso.
- **Arquivos:** só arquivos de até 512 KB têm o conteúdo guardado. Os demais, e os arquivos dos dados de demonstração, são associações simuladas, sem conteúdo.
- **Sem autenticação nem permissões:** o "usuário atual" é apenas simulado.
- O histórico do projeto é uma auditoria simplificada, gerada no cliente.
- O Gantt é simplificado: não edita datas por arraste e não modela dependências entre tarefas.
- Dependências são registradas apenas entre projetos.
- A interface é somente em português e somente no tema claro.

## Funcionalidades futuras (fora do escopo desta fase)

- Banco de dados definitivo (SharePoint Lists, PostgreSQL, Dataverse ou outro, a definir) e backend (NestJS/Express).
- Autenticação corporativa (Microsoft Entra ID) e permissões por perfil.
- Armazenamento definitivo de documentos e evidências.
- Integrações com Microsoft Graph, Power BI, e-mail e Teams (notificações e automações).
- Infraestrutura de produção, auditoria completa e exportações (PDF/Excel).
