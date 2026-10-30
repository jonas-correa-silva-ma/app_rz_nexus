/**
 * Ponto único de troca da camada de dados.
 *
 * Hoje: implementações locais (dados simulados + localStorage).
 * Futuro: substituir cada item por uma implementação que chame a API definitiva
 * (ex.: `httpProjectService`), mantendo os mesmos contratos de services/contracts.ts.
 */
import type { Services } from './contracts'
import { localProjectService } from './local/projectService'
import { localTaskService } from './local/taskService'
import { localRiskService } from './local/riskService'
import { localTestService } from './local/testService'
import { localDocumentService, localUpdateService } from './local/documentService'
import { localDashboardService } from './local/dashboardService'
import { localFileService, localPersonService, localSettingsService } from './local/settingsService'

export const services: Services = {
  people: localPersonService,
  projects: localProjectService,
  tasks: localTaskService,
  risks: localRiskService,
  tests: localTestService,
  documents: localDocumentService,
  updates: localUpdateService,
  dashboard: localDashboardService,
  files: localFileService,
  settings: localSettingsService,
}

export type * from './contracts'
