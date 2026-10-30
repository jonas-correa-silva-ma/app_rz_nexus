/**
 * Tipos de domínio do NEXO.
 * Independentes da tecnologia de armazenamento: datas em ISO (yyyy-MM-dd ou ISO completo),
 * referências entre entidades por id.
 */

export type ID = string

export type Priority = 'baixa' | 'media' | 'alta' | 'critica'

export interface Person {
  id: ID
  name: string
  role: string
  area: string
  email: string
}

export type ProjectStatus =
  | 'planejamento'
  | 'em_andamento'
  | 'pausado'
  | 'aguardando_homologacao'
  | 'concluido'
  | 'cancelado'

export interface TestConfig {
  testType: string
  coordinatorId?: ID
  testerIds: ID[]
  approverId?: ID
  plannedDate?: string
  approvalCriteria: string
}

export interface Project {
  id: ID
  code: string
  name: string
  description: string
  objective: string
  category: string
  area: string
  sponsorId?: ID
  managerId: ID
  memberIds: ID[]
  priority: Priority
  status: ProjectStatus
  startDate: string
  endDate: string
  requiresTests: boolean
  testConfig?: TestConfig
  dependencyIds: ID[]
  notes: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'nao_iniciada' | 'em_andamento' | 'bloqueada' | 'concluida' | 'cancelada'

export interface Task {
  id: ID
  projectId: ID
  name: string
  description: string
  assigneeId: ID
  priority: Priority
  status: TaskStatus
  startDate: string
  dueDate: string
  progress: number
  notes: string
  /** Quando a tarefa foi criada como correção de uma falha de teste. */
  sourceExecutionId?: ID
  createdAt: string
  updatedAt: string
}

export type RiskType = 'risco' | 'problema' | 'impedimento' | 'pendencia'
export type RiskStatus = 'aberto' | 'em_tratamento' | 'resolvido' | 'cancelado'
export type Severity = 'baixa' | 'media' | 'alta' | 'critica'
/** Escala de 1 (muito baixa) a 5 (muito alta). */
export type Scale = 1 | 2 | 3 | 4 | 5

export interface Risk {
  id: ID
  projectId: ID
  type: RiskType
  description: string
  category: string
  ownerId: ID
  priority: Priority
  probability: Scale
  impact: Scale
  dueDate: string
  status: RiskStatus
  actionPlan: string
  createdAt: string
  updatedAt: string
}

export type TestStatus = 'nao_iniciado' | 'em_andamento' | 'aprovado' | 'reprovado' | 'bloqueado' | 'cancelado'

export interface TestCase {
  id: ID
  code: string
  projectId: ID
  system: string
  feature: string
  name: string
  description: string
  objective: string
  scenario: string
  preconditions: string
  steps: string
  expectedResult: string
  ownerId: ID
  priority: Priority
  createdAt: string
  updatedAt: string
}

export interface TestExecution {
  id: ID
  testCaseId: ID
  attempt: number
  executorId: ID
  date: string
  expectedResult: string
  actualResult: string
  status: TestStatus
  comments: string
  needsRetest: boolean
  correctiveTaskId?: ID
  createdAt: string
}

export type EvidenceKind = 'captura' | 'planilha' | 'documento' | 'resultado' | 'comentario' | 'registro'

/** Arquivo anexado (ou simulado). `dataUrl` só existe para arquivos pequenos guardados localmente. */
export interface FileRef {
  fileName: string
  size: number
  mimeType: string
  dataUrl?: string
  simulated: boolean
}

export interface Evidence {
  id: ID
  executionId?: ID
  homologationId?: ID
  kind: EvidenceKind
  note: string
  file?: FileRef
  createdAt: string
}

export type HomologationResult = 'aprovada' | 'aprovada_com_ressalvas' | 'reprovada'

export interface Homologation {
  id: ID
  projectId: ID
  approverId: ID
  date: string
  result: HomologationResult
  comments: string
  reservations: string
  blockingIssues: string
  createdAt: string
}

export interface DocumentRecord {
  id: ID
  projectId: ID
  type: string
  title: string
  description: string
  ownerId: ID
  file?: FileRef
  createdAt: string
}

export type Health = 'verde' | 'amarelo' | 'vermelho'

export interface ProjectUpdate {
  id: ID
  projectId: ID
  date: string
  authorId: ID
  health: Health
  summary: string
  deliveries: string
  nextSteps: string
  risks: string
  impediments: string
  supportNeeded: string
  createdAt: string
}

export interface HistoryEntry {
  id: ID
  projectId: ID
  date: string
  actorId?: ID
  action: string
  detail: string
}

export type ProgressRule = 'media_simples' | 'ponderada_prioridade' | 'tarefas_concluidas'

export interface AppSettings {
  progressRule: ProgressRule
  currentUserId: ID
  /** Diferença (em pontos percentuais) entre o progresso esperado e o real para considerar o projeto em risco. */
  scheduleGapThreshold: number
}

/** Conjunto completo de dados mantidos pelo protótipo. */
export interface Database {
  version: number
  people: Person[]
  projects: Project[]
  tasks: Task[]
  risks: Risk[]
  testCases: TestCase[]
  executions: TestExecution[]
  evidences: Evidence[]
  homologations: Homologation[]
  documents: DocumentRecord[]
  updates: ProjectUpdate[]
  history: HistoryEntry[]
  settings: AppSettings
}

// ---- Tipos derivados (calculados pelas regras de negócio) ----

export type RiskLevel = 'baixo' | 'medio' | 'alto'

export type ProjectTestStatus = 'nao_aplicavel' | 'nao_iniciado' | 'em_execucao' | 'com_falhas' | 'testes_concluidos'

export type HomologationStatus =
  | 'nao_aplicavel'
  | 'pendente'
  | 'aguardando'
  | 'aprovada'
  | 'aprovada_com_ressalvas'
  | 'reprovada'

export interface ProjectInsight {
  project: Project
  progress: number
  expectedProgress: number
  delayed: boolean
  overdueTasks: number
  openRisks: number
  criticalRisks: number
  riskLevel: RiskLevel
  riskReasons: string[]
  testStatus: ProjectTestStatus
  homologationStatus: HomologationStatus
}

export interface TestCaseView {
  testCase: TestCase
  executions: TestExecution[]
  latest?: TestExecution
  status: TestStatus
  retestPending: boolean
}

export interface TestMetrics {
  total: number
  byStatus: Record<TestStatus, number>
  executionRate: number
  approvalRate: number
  openFailures: number
  pendingRetests: number
}
