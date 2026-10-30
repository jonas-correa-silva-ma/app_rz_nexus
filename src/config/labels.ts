import type {
  EvidenceKind,
  Health,
  HomologationResult,
  HomologationStatus,
  Priority,
  ProgressRule,
  ProjectStatus,
  ProjectTestStatus,
  RiskLevel,
  RiskStatus,
  RiskType,
  Severity,
  TaskStatus,
  TestStatus,
} from '@/types'

/** Tons visuais usados pelos badges. Mantidos em poucas cores para evitar poluição visual. */
export type Tone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate'

export interface Option<T extends string> {
  value: T
  label: string
  tone: Tone
}

function opts<T extends string>(list: [T, string, Tone][]): Option<T>[] {
  return list.map(([value, label, tone]) => ({ value, label, tone }))
}

export const PRIORITIES = opts<Priority>([
  ['baixa', 'Baixa', 'slate'],
  ['media', 'Média', 'blue'],
  ['alta', 'Alta', 'amber'],
  ['critica', 'Crítica', 'red'],
])

export const PROJECT_STATUSES = opts<ProjectStatus>([
  ['planejamento', 'Planejamento', 'slate'],
  ['em_andamento', 'Em andamento', 'blue'],
  ['pausado', 'Pausado', 'amber'],
  ['aguardando_homologacao', 'Aguardando homologação', 'violet'],
  ['concluido', 'Concluído', 'green'],
  ['cancelado', 'Cancelado', 'neutral'],
])

export const TASK_STATUSES = opts<TaskStatus>([
  ['nao_iniciada', 'Não iniciada', 'slate'],
  ['em_andamento', 'Em andamento', 'blue'],
  ['bloqueada', 'Bloqueada', 'red'],
  ['concluida', 'Concluída', 'green'],
  ['cancelada', 'Cancelada', 'neutral'],
])

export const RISK_TYPES = opts<RiskType>([
  ['risco', 'Risco', 'amber'],
  ['problema', 'Problema', 'red'],
  ['impedimento', 'Impedimento', 'violet'],
  ['pendencia', 'Pendência', 'blue'],
])

export const RISK_STATUSES = opts<RiskStatus>([
  ['aberto', 'Aberto', 'amber'],
  ['em_tratamento', 'Em tratamento', 'blue'],
  ['resolvido', 'Resolvido', 'green'],
  ['cancelado', 'Cancelado', 'neutral'],
])

export const SEVERITIES = opts<Severity>([
  ['baixa', 'Baixa', 'slate'],
  ['media', 'Média', 'blue'],
  ['alta', 'Alta', 'amber'],
  ['critica', 'Crítica', 'red'],
])

export const RISK_LEVELS = opts<RiskLevel>([
  ['baixo', 'Baixo', 'green'],
  ['medio', 'Atenção', 'amber'],
  ['alto', 'Alto', 'red'],
])

export const TEST_STATUSES = opts<TestStatus>([
  ['nao_iniciado', 'Não iniciado', 'slate'],
  ['em_andamento', 'Em andamento', 'blue'],
  ['aprovado', 'Aprovado', 'green'],
  ['reprovado', 'Reprovado', 'red'],
  ['bloqueado', 'Bloqueado', 'amber'],
  ['cancelado', 'Cancelado', 'neutral'],
])

export const PROJECT_TEST_STATUSES = opts<ProjectTestStatus>([
  ['nao_aplicavel', 'Não exige testes', 'neutral'],
  ['nao_iniciado', 'Testes não iniciados', 'slate'],
  ['em_execucao', 'Testes em execução', 'blue'],
  ['com_falhas', 'Testes com falhas', 'red'],
  ['testes_concluidos', 'Testes aprovados', 'green'],
])

export const HOMOLOGATION_STATUSES = opts<HomologationStatus>([
  ['nao_aplicavel', 'Não se aplica', 'neutral'],
  ['pendente', 'Pendente (testes em curso)', 'slate'],
  ['aguardando', 'Aguardando homologação', 'violet'],
  ['aprovada', 'Homologado', 'green'],
  ['aprovada_com_ressalvas', 'Homologado com ressalvas', 'amber'],
  ['reprovada', 'Homologação reprovada', 'red'],
])

export const HOMOLOGATION_RESULTS = opts<HomologationResult>([
  ['aprovada', 'Aprovada', 'green'],
  ['aprovada_com_ressalvas', 'Aprovada com ressalvas', 'amber'],
  ['reprovada', 'Reprovada', 'red'],
])

export const EVIDENCE_KINDS = opts<EvidenceKind>([
  ['captura', 'Captura de tela', 'blue'],
  ['planilha', 'Planilha', 'green'],
  ['documento', 'Documento', 'slate'],
  ['resultado', 'Arquivo de resultado', 'violet'],
  ['comentario', 'Comentário', 'neutral'],
  ['registro', 'Registro de execução', 'amber'],
])

export const HEALTH = opts<Health>([
  ['verde', 'No prazo', 'green'],
  ['amarelo', 'Atenção', 'amber'],
  ['vermelho', 'Crítico', 'red'],
])

export const PROGRESS_RULES: { value: ProgressRule; label: string; description: string }[] = [
  {
    value: 'media_simples',
    label: 'Média simples do percentual das tarefas',
    description:
      'Soma o percentual de conclusão de cada tarefa e divide pelo número de tarefas. Tarefas canceladas são ignoradas.',
  },
  {
    value: 'ponderada_prioridade',
    label: 'Média ponderada pela prioridade',
    description:
      'Cada tarefa pesa conforme a prioridade (baixa 1, média 2, alta 3, crítica 4). Tarefas canceladas são ignoradas.',
  },
  {
    value: 'tarefas_concluidas',
    label: 'Percentual de tarefas concluídas',
    description: 'Número de tarefas concluídas dividido pelo total de tarefas não canceladas.',
  },
]

export const PROJECT_CATEGORIES = [
  'Sistemas',
  'Processos',
  'Automação',
  'Integração',
  'Melhoria operacional',
  'Infraestrutura',
  'Conformidade',
  'Pessoas',
]

export const AREAS = [
  'Tecnologia da Informação',
  'Financeiro',
  'Suprimentos',
  'Recursos Humanos',
  'Operações',
  'Comercial',
  'Jurídico',
  'Logística',
]

export const RISK_CATEGORIES = ['Prazo', 'Escopo', 'Custo', 'Técnico', 'Recursos', 'Fornecedor', 'Conformidade', 'Qualidade']

export const DOCUMENT_TYPES = [
  'Termo de abertura',
  'Cronograma',
  'Especificação funcional',
  'Ata de reunião',
  'Plano de testes',
  'Termo de homologação',
  'Relatório de status',
  'Contrato',
  'Outro',
]

export const TEST_TYPES = ['Teste de aceitação do usuário (UAT)', 'Teste integrado', 'Teste funcional', 'Teste de processo', 'Teste piloto']

export function labelOf<T extends string>(list: Option<T>[], value: T | undefined): string {
  return list.find((o) => o.value === value)?.label ?? '—'
}

export function toneOf<T extends string>(list: Option<T>[], value: T | undefined): Tone {
  return list.find((o) => o.value === value)?.tone ?? 'neutral'
}
