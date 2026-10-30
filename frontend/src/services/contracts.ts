/**
 * Contratos da camada de serviços.
 *
 * A interface do NEXO depende somente destes contratos. A implementação atual
 * (services/local) usa dados simulados persistidos no navegador; uma implementação
 * futura poderá chamar uma API (Express/NestJS) conectada a SharePoint, PostgreSQL,
 * Dataverse ou outra fonte, sem alterar páginas e componentes.
 *
 * Todas as operações são assíncronas para que a troca por chamadas HTTP seja direta.
 */
import type {
  AppSettings,
  DocumentRecord,
  Evidence,
  EvidenceKind,
  FileRef,
  HistoryEntry,
  Homologation,
  ID,
  Person,
  Project,
  ProjectInsight,
  ProjectUpdate,
  Risk,
  Task,
  TestCase,
  TestCaseView,
  TestExecution,
  TestMetrics,
} from '@/types'

type Managed = 'id' | 'createdAt' | 'updatedAt'

export type ProjectInput = Omit<Project, Managed | 'code' | 'completedAt'> & { code?: string }
export type TaskInput = Omit<Task, Managed>
export type RiskInput = Omit<Risk, Managed>
export type TestCaseInput = Omit<TestCase, Managed | 'code'> & { code?: string }
export type DocumentInput = Omit<DocumentRecord, 'id' | 'createdAt'>
export type UpdateInput = Omit<ProjectUpdate, 'id' | 'createdAt'>

export interface EvidenceInput {
  kind: EvidenceKind
  note: string
  file?: FileRef
}

export interface ExecutionInput {
  testCaseId: ID
  executorId: ID
  date: string
  actualResult: string
  status: TestExecution['status']
  comments: string
  needsRetest: boolean
  evidences: EvidenceInput[]
  /** Na reprovação: cria uma tarefa corretiva vinculada à execução… */
  correctiveTask?: { name: string; assigneeId: ID; dueDate: string; priority: Task['priority'] }
  /** …ou relaciona uma tarefa existente. */
  relatedTaskId?: ID
}

export interface HomologationInput extends Omit<Homologation, 'id' | 'createdAt'> {
  evidences: EvidenceInput[]
  /** Quando aprovada, marca o projeto como concluído. */
  completeProject: boolean
}

export interface DashboardFilter {
  period: 'todos' | '30d' | '90d' | '12m' | 'ano'
  managerId?: ID
  status?: Project['status']
}

export interface DashboardData {
  insights: ProjectInsight[]
  kpis: {
    totalProjects: number
    inProgress: number
    completed: number
    delayed: number
    atRisk: number
    totalTasks: number
    overdueTasks: number
    completedTasks: number
    pendingTests: number
    failedTests: number
    awaitingHomologation: number
  }
  projectsByStatus: { key: string; value: number }[]
  projectsByPriority: { key: string; value: number }[]
  evolution: { month: string; iniciados: number; concluidos: number; emAberto: number }[]
  tasksByStatus: { key: string; value: number }[]
  risksBySeverity: { key: string; risco: number; problema: number; impedimento: number; pendencia: number }[]
  testsByStatus: { key: string; value: number }[]
  attention: ProjectInsight[]
}

export interface StorageInfo {
  usedBytes: number
  approxLimitBytes: number
  backend: string
  maxInlineFileBytes: number
}

export interface PersonService {
  list(): Promise<Person[]>
}

export interface ProjectService {
  list(): Promise<Project[]>
  get(id: ID): Promise<Project | undefined>
  create(input: ProjectInput): Promise<Project>
  update(id: ID, patch: Partial<ProjectInput>): Promise<Project>
  /** Exclui o projeto e todos os registros vinculados. */
  remove(id: ID): Promise<void>
  insights(): Promise<ProjectInsight[]>
  insight(id: ID): Promise<ProjectInsight | undefined>
  history(projectId: ID): Promise<HistoryEntry[]>
}

export interface TaskService {
  list(filter?: { projectId?: ID }): Promise<Task[]>
  create(input: TaskInput): Promise<Task>
  update(id: ID, patch: Partial<TaskInput>): Promise<Task>
  remove(id: ID): Promise<void>
}

export interface RiskService {
  list(filter?: { projectId?: ID }): Promise<Risk[]>
  create(input: RiskInput): Promise<Risk>
  update(id: ID, patch: Partial<RiskInput>): Promise<Risk>
  remove(id: ID): Promise<void>
}

export interface TestService {
  listCases(filter?: { projectId?: ID }): Promise<TestCaseView[]>
  createCase(input: TestCaseInput): Promise<TestCase>
  updateCase(id: ID, patch: Partial<TestCaseInput>): Promise<TestCase>
  removeCase(id: ID): Promise<void>
  /** Registra uma nova tentativa. Tentativas anteriores são sempre preservadas. */
  recordExecution(input: ExecutionInput): Promise<TestExecution>
  listEvidences(filter: { executionId?: ID; homologationId?: ID }): Promise<Evidence[]>
  addEvidence(target: { executionId?: ID; homologationId?: ID }, input: EvidenceInput): Promise<Evidence>
  removeEvidence(id: ID): Promise<void>
  listHomologations(filter?: { projectId?: ID }): Promise<Homologation[]>
  registerHomologation(input: HomologationInput): Promise<Homologation>
  metrics(filter?: { projectId?: ID }): Promise<TestMetrics>
}

export interface DocumentService {
  list(filter?: { projectId?: ID }): Promise<DocumentRecord[]>
  create(input: DocumentInput): Promise<DocumentRecord>
  update(id: ID, patch: Partial<DocumentInput>): Promise<DocumentRecord>
  remove(id: ID): Promise<void>
}

export interface UpdateService {
  list(filter?: { projectId?: ID }): Promise<ProjectUpdate[]>
  create(input: UpdateInput): Promise<ProjectUpdate>
  remove(id: ID): Promise<void>
}

export interface DashboardService {
  get(filter: DashboardFilter): Promise<DashboardData>
}

export interface FileService {
  /** Prepara um arquivo selecionado pelo usuário para associação a um registro. */
  prepare(file: File): Promise<FileRef>
}

export interface SettingsService {
  get(): Promise<AppSettings>
  update(patch: Partial<AppSettings>): Promise<AppSettings>
  resetDemoData(): Promise<void>
  clearAll(): Promise<void>
  storageInfo(): Promise<StorageInfo>
}

export interface Services {
  people: PersonService
  projects: ProjectService
  tasks: TaskService
  risks: RiskService
  tests: TestService
  documents: DocumentService
  updates: UpdateService
  dashboard: DashboardService
  files: FileService
  settings: SettingsService
}
