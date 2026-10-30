# Regras de negócio

As regras estão implementadas em `src/domain/rules.ts` (funções puras) e, quando envolvem gravação, nos serviços em `src/services/local/`. Todos os indicadores são calculados a partir dos registros, sem valores fixos.

## Progresso do projeto (configurável)

Definido em **Configurações → Regra de progresso**. Em todas as regras:

- tarefas **canceladas** não entram no cálculo;
- tarefa **concluída** conta como 100%;
- projeto sem tarefas válidas: 100% se estiver concluído, senão 0%.

| Regra | Cálculo |
|---|---|
| Média simples (padrão) | Média do percentual de conclusão das tarefas |
| Ponderada pela prioridade | Média ponderada: baixa 1, média 2, alta 3, crítica 4 |
| Tarefas concluídas | Tarefas concluídas ÷ total de tarefas |

**Progresso esperado** = percentual do prazo do projeto já decorrido (início → término).

## Atrasos

- **Projeto atrasado:** prazo final vencido e status diferente de *Concluído* ou *Cancelado*.
- **Tarefa atrasada:** vencimento passado e status diferente de *Concluída* ou *Cancelada*.
- Ao concluir uma tarefa, o percentual vai automaticamente para 100%.

## Riscos e pendências

- Probabilidade e impacto em escala de 1 a 5.
- **Severidade** = probabilidade × impacto: ≥ 15 crítica · ≥ 10 alta · ≥ 5 média · < 5 baixa.
- Registro **em aberto**: status *Aberto* ou *Em tratamento*.

## Nível de risco do projeto

Não se aplica a projetos concluídos ou cancelados, que ficam sempre como *Baixo*.

- **Alto:** projeto atrasado, ou risco aberto de severidade crítica, ou progresso esperado − real acima do limite configurado (padrão: 25 p.p.).
- **Atenção:** risco aberto de severidade alta, tarefa atrasada ou bloqueada, falhas de teste abertas, ou diferença de progresso acima da metade do limite.
- **Baixo:** demais casos.

"Projetos em risco" no dashboard = nível **Alto**. "Projetos que exigem atenção" = níveis **Alto** e **Atenção**.

## Testes e homologação

- Testes são **opcionais por projeto** (`Exige testes?`). Só projetos com a opção ativa aparecem no módulo.
- Um **caso de teste** pode ter várias **execuções** (tentativas numeradas). Nenhuma tentativa é apagada ou sobrescrita.
- O **status do caso** é o status da execução mais recente. Sem execuções, o caso fica *Não iniciado*.
- **Reteste pendente:** a última execução foi *Reprovada* ou *Bloqueada* e marcada como "necessita reteste".
- Na reprovação ou no bloqueio, é possível **criar uma tarefa corretiva** (com responsável, prazo e prioridade) vinculada à execução, ou relacionar uma tarefa existente.
- **Percentual de execução** = casos com resultado final (aprovado, reprovado, bloqueado) ÷ casos não cancelados.
- **Percentual de aprovação** = casos aprovados ÷ casos não cancelados.
- **Situação dos testes do projeto:** não iniciado → em execução → com falhas (qualquer caso reprovado) → testes aprovados (todos aprovados).

### Transições automáticas de status

| Evento | Efeito |
|---|---|
| Todos os casos ativos aprovados e projeto *Em andamento* | Projeto passa para *Aguardando homologação* |
| Nova falha com projeto *Aguardando homologação* | Projeto volta para *Em andamento* |
| Homologação *Aprovada* ou *Aprovada com ressalvas* com "concluir projeto" marcado | Projeto passa para *Concluído* |
| Homologação *Reprovada* com projeto *Aguardando homologação* | Projeto volta para *Em andamento* |

Todas as transições ficam registradas no histórico do projeto.

### Homologação

- **Testes aprovados não equivalem a homologação aprovada.** A homologação é o aceite formal do aprovador.
- Status de homologação: a última homologação registrada prevalece. Sem registro, o projeto fica *Aguardando homologação* quando todos os testes foram aprovados (ou quando o status do projeto já é *Aguardando homologação*). Caso contrário, fica *Pendente*.
- Ressalvas são obrigatórias quando o resultado é "aprovada com ressalvas". Pendências impeditivas são obrigatórias quando o resultado é "reprovada".

## Dashboard: filtros

- **Período:** inclui projetos cuja vigência (início–término) se sobrepõe à janela escolhida (30 dias, 90 dias, 12 meses ou ano atual).
- **Responsável:** gerente do projeto.
- **Status:** status do projeto.
- Tarefas, riscos e testes considerados são os dos projetos filtrados.
- **Evolução:** acumulado mensal (últimos 12 meses) de projetos iniciados (data de início) e concluídos (data de conclusão).

## Exclusões

Excluir um projeto remove em cascata as tarefas, riscos, casos, execuções, evidências, homologações, documentos, atualizações e histórico vinculados, além de retirá-lo das dependências de outros projetos.
