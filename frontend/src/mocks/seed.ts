/**
 * Dados de demonstração do NEXO.
 *
 * As datas são geradas em relação ao dia atual, para que prazos, atrasos e cronogramas
 * continuem plausíveis independentemente de quando o protótipo for aberto.
 */
import type {
  Database,
  DocumentRecord,
  Evidence,
  HistoryEntry,
  Homologation,
  ID,
  Person,
  Priority,
  Project,
  ProjectUpdate,
  Risk,
  Task,
  TaskStatus,
  TestCase,
  TestExecution,
} from '@/types'
import { daysFromToday } from '@/utils/dates'

export const SEED_VERSION = 1

const d = daysFromToday
const iso = (offset: number, hour = 10) => `${d(offset)}T${String(hour).padStart(2, '0')}:00:00.000Z`
const year = new Date().getFullYear()
const code = (n: number) => `PRJ-${year}-${String(n).padStart(3, '0')}`

const people: Person[] = [
  { id: 'p1', name: 'Ana Beatriz Rocha', role: 'Gerente de Projetos', area: 'PMO', email: 'ana.rocha@empresa.com.br' },
  { id: 'p2', name: 'Carlos Eduardo Lima', role: 'Coordenador de Sistemas', area: 'Tecnologia da Informação', email: 'carlos.lima@empresa.com.br' },
  { id: 'p3', name: 'Fernanda Alves', role: 'Analista Financeira Sênior', area: 'Financeiro', email: 'fernanda.alves@empresa.com.br' },
  { id: 'p4', name: 'Rafael Monteiro', role: 'Gerente de Suprimentos', area: 'Suprimentos', email: 'rafael.monteiro@empresa.com.br' },
  { id: 'p5', name: 'Juliana Costa', role: 'Business Partner de RH', area: 'Recursos Humanos', email: 'juliana.costa@empresa.com.br' },
  { id: 'p6', name: 'Marcos Vinícius Teixeira', role: 'Engenheiro de Operações', area: 'Operações', email: 'marcos.teixeira@empresa.com.br' },
  { id: 'p7', name: 'Patrícia Nogueira', role: 'Advogada Corporativa', area: 'Jurídico', email: 'patricia.nogueira@empresa.com.br' },
  { id: 'p8', name: 'Lucas Andrade', role: 'Analista de Negócios', area: 'Comercial', email: 'lucas.andrade@empresa.com.br' },
  { id: 'p9', name: 'Camila Ferreira', role: 'Analista de Qualidade e Testes', area: 'Tecnologia da Informação', email: 'camila.ferreira@empresa.com.br' },
  { id: 'p10', name: 'Roberto Sampaio', role: 'Diretor de Operações', area: 'Diretoria', email: 'roberto.sampaio@empresa.com.br' },
  { id: 'p11', name: 'Helena Duarte', role: 'Diretora Financeira', area: 'Diretoria', email: 'helena.duarte@empresa.com.br' },
  { id: 'p12', name: 'Thiago Moreira', role: 'Desenvolvedor Sênior', area: 'Tecnologia da Informação', email: 'thiago.moreira@empresa.com.br' },
]

type ProjectSeed = Omit<Project, 'createdAt' | 'updatedAt' | 'notes' | 'dependencyIds' | 'memberIds'> &
  Partial<Pick<Project, 'notes' | 'dependencyIds' | 'memberIds'>>

function project(p: ProjectSeed): Project {
  const created = iso(Math.min(daysBetweenToday(p.startDate) - 10, -5))
  return { notes: '', dependencyIds: [], memberIds: [], ...p, createdAt: created, updatedAt: created }
}

function daysBetweenToday(date: string): number {
  return Math.round((new Date(`${date}T00:00:00`).getTime() - new Date(`${d(0)}T00:00:00`).getTime()) / 86_400_000)
}

const projects: Project[] = [
  project({
    id: 'pr1',
    code: code(1),
    name: 'Portal de Fornecedores',
    description: 'Portal web para cadastro, homologação e comunicação com fornecedores, integrado ao ERP.',
    objective: 'Reduzir em 40% o tempo de cadastro de fornecedores e eliminar trocas de pedidos por e-mail.',
    category: 'Sistemas',
    area: 'Suprimentos',
    sponsorId: 'p10',
    managerId: 'p4',
    memberIds: ['p12', 'p9', 'p1'],
    priority: 'alta',
    status: 'em_andamento',
    startDate: d(-120),
    endDate: d(45),
    requiresTests: true,
    testConfig: {
      testType: 'Teste de aceitação do usuário (UAT)',
      coordinatorId: 'p9',
      testerIds: ['p4', 'p9'],
      approverId: 'p10',
      plannedDate: d(25),
      approvalCriteria: '100% dos casos críticos aprovados e nenhuma falha de prioridade alta em aberto.',
    },
    dependencyIds: ['pr7'],
    notes: 'Piloto previsto com 15 fornecedores estratégicos.',
  }),
  project({
    id: 'pr2',
    code: code(2),
    name: 'Automação da Conciliação Bancária',
    description: 'Robô (RPA) para captura de extratos e conciliação automática com o contas a receber e a pagar.',
    objective: 'Concluir a conciliação diária até as 10h, com 95% de lançamentos conciliados automaticamente.',
    category: 'Automação',
    area: 'Financeiro',
    sponsorId: 'p11',
    managerId: 'p3',
    memberIds: ['p12', 'p9'],
    priority: 'alta',
    status: 'aguardando_homologacao',
    startDate: d(-150),
    endDate: d(10),
    requiresTests: true,
    testConfig: {
      testType: 'Teste de processo',
      coordinatorId: 'p9',
      testerIds: ['p3'],
      approverId: 'p11',
      plannedDate: d(5),
      approvalCriteria: 'Conciliação correta dos extratos dos três bancos principais por cinco dias úteis consecutivos.',
    },
  }),
  project({
    id: 'pr3',
    code: code(3),
    name: 'Migração do ERP para Nuvem',
    description: 'Migração do ERP on-premises para a versão em nuvem, incluindo interfaces fiscais e dados mestres.',
    objective: 'Desativar o datacenter local e reduzir custos de infraestrutura em 25%.',
    category: 'Infraestrutura',
    area: 'Tecnologia da Informação',
    sponsorId: 'p10',
    managerId: 'p2',
    memberIds: ['p12', 'p9', 'p3'],
    priority: 'critica',
    status: 'em_andamento',
    startDate: d(-240),
    endDate: d(-12),
    requiresTests: true,
    testConfig: {
      testType: 'Teste integrado',
      coordinatorId: 'p9',
      testerIds: ['p3', 'p9', 'p12'],
      approverId: 'p10',
      plannedDate: d(-15),
      approvalCriteria: 'Fechamento contábil simulado sem divergências e emissão fiscal validada.',
    },
    notes: 'Prazo original vencido. Nova data de virada em negociação com o fornecedor.',
  }),
  project({
    id: 'pr4',
    code: code(4),
    name: 'Reestruturação do Onboarding de Colaboradores',
    description: 'Revisão da jornada de admissão, com trilha de integração e checklist digital para gestores.',
    objective: 'Elevar a satisfação dos novos colaboradores no primeiro mês para acima de 85%.',
    category: 'Processos',
    area: 'Recursos Humanos',
    sponsorId: 'p10',
    managerId: 'p5',
    memberIds: ['p1'],
    priority: 'media',
    status: 'concluido',
    startDate: d(-200),
    endDate: d(-40),
    completedAt: iso(-42),
    requiresTests: false,
  }),
  project({
    id: 'pr5',
    code: code(5),
    name: 'Integração CRM x Faturamento',
    description: 'Integração dos pedidos fechados no CRM com o faturamento, eliminando a digitação manual.',
    objective: 'Zerar a redigitação de pedidos e reduzir em 70% os erros de faturamento.',
    category: 'Integração',
    area: 'Comercial',
    sponsorId: 'p11',
    managerId: 'p8',
    memberIds: ['p12', 'p9'],
    priority: 'alta',
    status: 'em_andamento',
    startDate: d(-60),
    endDate: d(75),
    requiresTests: true,
    testConfig: {
      testType: 'Teste integrado',
      coordinatorId: 'p9',
      testerIds: ['p8'],
      approverId: 'p11',
      plannedDate: d(55),
      approvalCriteria: 'Pedidos de todos os tipos faturados corretamente, sem reprocessamento manual.',
    },
    dependencyIds: ['pr3'],
  }),
  project({
    id: 'pr6',
    code: code(6),
    name: 'Programa de Eficiência Energética',
    description: 'Medição de consumo por unidade e plano de ações para redução do consumo de energia.',
    objective: 'Reduzir o consumo de energia das unidades fabris em 12% em 12 meses.',
    category: 'Melhoria operacional',
    area: 'Operações',
    sponsorId: 'p10',
    managerId: 'p6',
    memberIds: ['p4'],
    priority: 'media',
    status: 'planejamento',
    startDate: d(20),
    endDate: d(200),
    requiresTests: false,
  }),
  project({
    id: 'pr7',
    code: code(7),
    name: 'Revisão da Política de Compras',
    description: 'Atualização da política de compras, alçadas de aprovação e critérios de homologação de fornecedores.',
    objective: 'Padronizar alçadas e reduzir compras emergenciais sem cotação.',
    category: 'Conformidade',
    area: 'Suprimentos',
    sponsorId: 'p11',
    managerId: 'p1',
    memberIds: ['p4', 'p7'],
    priority: 'media',
    status: 'em_andamento',
    startDate: d(-45),
    endDate: d(40),
    requiresTests: false,
  }),
  project({
    id: 'pr8',
    code: code(8),
    name: 'Painel de Indicadores Logísticos',
    description: 'Painel com OTIF, custo de frete e ocupação de frota, atualizado diariamente.',
    objective: 'Dar visibilidade diária dos indicadores logísticos à gestão.',
    category: 'Sistemas',
    area: 'Logística',
    sponsorId: 'p10',
    managerId: 'p1',
    memberIds: ['p12', 'p9', 'p6'],
    priority: 'media',
    status: 'concluido',
    startDate: d(-180),
    endDate: d(-20),
    completedAt: iso(-25),
    requiresTests: true,
    testConfig: {
      testType: 'Teste de aceitação do usuário (UAT)',
      coordinatorId: 'p9',
      testerIds: ['p6'],
      approverId: 'p10',
      plannedDate: d(-30),
      approvalCriteria: 'Indicadores conferidos com a base oficial durante duas semanas.',
    },
  }),
  project({
    id: 'pr9',
    code: code(9),
    name: 'Adequação à LGPD — Mapeamento de Dados',
    description: 'Mapeamento das operações de tratamento de dados pessoais e plano de adequação.',
    objective: 'Concluir o registro das operações de tratamento (ROPA) e o plano de adequação.',
    category: 'Conformidade',
    area: 'Jurídico',
    sponsorId: 'p11',
    managerId: 'p7',
    memberIds: ['p1', 'p2'],
    priority: 'alta',
    status: 'em_andamento',
    startDate: d(-100),
    endDate: d(20),
    requiresTests: false,
  }),
  project({
    id: 'pr10',
    code: code(10),
    name: 'Aplicativo de Inspeção de Campo',
    description: 'Aplicativo móvel para inspeções de segurança e manutenção, com registro de fotos e assinatura.',
    objective: 'Eliminar formulários em papel e reduzir em 50% o tempo de consolidação das inspeções.',
    category: 'Sistemas',
    area: 'Operações',
    sponsorId: 'p10',
    managerId: 'p6',
    memberIds: ['p12', 'p9'],
    priority: 'alta',
    status: 'planejamento',
    startDate: d(10),
    endDate: d(150),
    requiresTests: true,
    testConfig: {
      testType: 'Teste piloto',
      coordinatorId: 'p9',
      testerIds: ['p6'],
      approverId: 'p10',
      plannedDate: d(120),
      approvalCriteria: 'Piloto em duas unidades sem perda de registros.',
    },
    dependencyIds: ['pr3'],
  }),
  project({
    id: 'pr11',
    code: code(11),
    name: 'Digitalização do Acervo de Contratos',
    description: 'Digitalização e indexação dos contratos físicos vigentes.',
    objective: 'Permitir consulta digital a 100% dos contratos vigentes.',
    category: 'Processos',
    area: 'Jurídico',
    sponsorId: 'p11',
    managerId: 'p7',
    memberIds: ['p1'],
    priority: 'baixa',
    status: 'pausado',
    startDate: d(-90),
    endDate: d(60),
    requiresTests: false,
    notes: 'Pausado até a aprovação do orçamento de digitalização.',
  }),
]

let taskSeq = 0
function task(
  projectId: ID,
  name: string,
  assigneeId: ID,
  priority: Priority,
  status: TaskStatus,
  start: number,
  due: number,
  progress: number,
  description = '',
  extra: Partial<Task> = {},
): Task {
  taskSeq++
  return {
    id: `t${taskSeq}`,
    projectId,
    name,
    description,
    assigneeId,
    priority,
    status,
    startDate: d(start),
    dueDate: d(due),
    progress: status === 'concluida' ? 100 : progress,
    notes: '',
    createdAt: iso(start - 3),
    updatedAt: iso(Math.min(0, due)),
    ...extra,
  }
}

const tasks: Task[] = [
  // Portal de Fornecedores
  task('pr1', 'Levantamento de requisitos com compradores', 'p4', 'alta', 'concluida', -120, -100, 100, 'Workshops com as equipes de compras diretas e indiretas.'),
  task('pr1', 'Definição do fluxo de cadastro e homologação', 'p4', 'alta', 'concluida', -100, -80, 100),
  task('pr1', 'Desenvolvimento do módulo de cadastro', 'p12', 'alta', 'concluida', -80, -35, 100),
  task('pr1', 'Integração com o ERP para envio de pedidos', 'p12', 'critica', 'em_andamento', -40, 10, 70),
  task('pr1', 'Ajuste da validação de CNPJ na consulta cadastral', 'p12', 'alta', 'nao_iniciada', -7, 5, 0, 'Correção da falha identificada no caso CT-002.', { sourceExecutionId: 'e2' }),
  task('pr1', 'Treinamento dos fornecedores piloto', 'p4', 'media', 'nao_iniciada', 20, 35, 0),
  task('pr1', 'Comunicação de lançamento do portal', 'p1', 'baixa', 'nao_iniciada', 30, 45, 0),
  // Conciliação bancária
  task('pr2', 'Mapeamento das regras de conciliação', 'p3', 'alta', 'concluida', -150, -125, 100),
  task('pr2', 'Configuração do robô de captura de extratos', 'p12', 'alta', 'concluida', -125, -80, 100),
  task('pr2', 'Parametrização das regras de correspondência', 'p3', 'alta', 'concluida', -80, -45, 100),
  task('pr2', 'Testes com extratos dos três bancos principais', 'p9', 'alta', 'concluida', -45, -10, 100),
  task('pr2', 'Elaboração do manual operacional', 'p3', 'media', 'em_andamento', -10, 5, 80),
  // ERP
  task('pr3', 'Inventário de customizações do ERP atual', 'p2', 'alta', 'concluida', -240, -200, 100),
  task('pr3', 'Provisionamento do ambiente em nuvem', 'p2', 'critica', 'concluida', -200, -150, 100),
  task('pr3', 'Migração de dados mestres', 'p3', 'critica', 'em_andamento', -150, -20, 60, 'Clientes, fornecedores, materiais e plano de contas.'),
  task('pr3', 'Reescrita das interfaces fiscais', 'p12', 'critica', 'bloqueada', -90, -5, 30, 'Bloqueada aguardando liberação de acesso do provedor.'),
  task('pr3', 'Teste integrado de fechamento contábil', 'p9', 'alta', 'nao_iniciada', -5, 10, 0),
  task('pr3', 'Plano de virada (cutover)', 'p2', 'critica', 'em_andamento', -30, 15, 40),
  // Onboarding
  task('pr4', 'Diagnóstico da jornada atual de admissão', 'p5', 'media', 'concluida', -200, -170, 100),
  task('pr4', 'Desenho da nova trilha de integração', 'p5', 'media', 'concluida', -170, -120, 100),
  task('pr4', 'Checklist digital para gestores', 'p1', 'media', 'concluida', -120, -70, 100),
  task('pr4', 'Piloto com turma de novos colaboradores', 'p5', 'alta', 'concluida', -70, -45, 100),
  // CRM x Faturamento
  task('pr5', 'Especificação do contrato de integração (API)', 'p8', 'alta', 'concluida', -60, -40, 100),
  task('pr5', 'Desenvolvimento do conector de pedidos', 'p12', 'alta', 'em_andamento', -40, 20, 55),
  task('pr5', 'Mapeamento das tabelas de preço e impostos', 'p8', 'media', 'em_andamento', -30, 15, 40),
  task('pr5', 'Tratamento de erros e reprocessamento', 'p12', 'media', 'nao_iniciada', 15, 45, 0),
  task('pr5', 'Validação com a equipe comercial', 'p8', 'media', 'nao_iniciada', 45, 70, 0),
  // Eficiência energética
  task('pr6', 'Elaboração do business case', 'p6', 'alta', 'em_andamento', -5, 15, 20),
  task('pr6', 'Diagnóstico de consumo por unidade', 'p6', 'media', 'nao_iniciada', 20, 50, 0),
  task('pr6', 'Cotação de sensores de medição', 'p4', 'media', 'nao_iniciada', 25, 45, 0),
  // Política de compras
  task('pr7', 'Benchmarking de políticas de mercado', 'p4', 'media', 'concluida', -45, -30, 100),
  task('pr7', 'Redação da minuta da nova política', 'p1', 'alta', 'em_andamento', -30, 10, 60),
  task('pr7', 'Revisão com Compliance e Jurídico', 'p7', 'alta', 'nao_iniciada', 10, 25, 0),
  task('pr7', 'Aprovação em comitê executivo', 'p11', 'alta', 'nao_iniciada', 25, 40, 0),
  task('pr7', 'Contratação de consultoria externa', 'p4', 'baixa', 'cancelada', -40, -20, 0, 'Cancelada: revisão será conduzida internamente.'),
  // Painel logístico
  task('pr8', 'Definição dos indicadores e fórmulas', 'p6', 'media', 'concluida', -180, -150, 100),
  task('pr8', 'Construção das cargas de dados', 'p12', 'alta', 'concluida', -150, -90, 100),
  task('pr8', 'Desenvolvimento do painel', 'p12', 'media', 'concluida', -90, -45, 100),
  task('pr8', 'Validação com a operação logística', 'p6', 'media', 'concluida', -45, -28, 100),
  // LGPD
  task('pr9', 'Inventário de sistemas que tratam dados pessoais', 'p2', 'alta', 'concluida', -100, -70, 100),
  task('pr9', 'Entrevistas com as áreas de negócio', 'p7', 'alta', 'em_andamento', -70, -10, 50),
  task('pr9', 'Revisão de contratos com operadores de dados', 'p7', 'alta', 'nao_iniciada', -20, -3, 0),
  task('pr9', 'Elaboração do registro das operações (ROPA)', 'p1', 'critica', 'em_andamento', -15, 10, 20),
  task('pr9', 'Plano de adequação e priorização', 'p7', 'alta', 'nao_iniciada', 5, 20, 0),
  // App de inspeção
  task('pr10', 'Definição do escopo do MVP', 'p6', 'alta', 'nao_iniciada', 10, 25, 0),
  task('pr10', 'Escolha da plataforma mobile', 'p2', 'media', 'nao_iniciada', 15, 30, 0),
  // Digitalização
  task('pr11', 'Triagem do acervo físico', 'p7', 'media', 'concluida', -90, -50, 100),
  task('pr11', 'Contratação do serviço de digitalização', 'p1', 'media', 'bloqueada', -50, -15, 30, 'Aguardando aprovação de orçamento.'),
]

let riskSeq = 0
function risk(
  projectId: ID,
  type: Risk['type'],
  description: string,
  category: string,
  ownerId: ID,
  priority: Priority,
  probability: Risk['probability'],
  impact: Risk['impact'],
  due: number,
  status: Risk['status'],
  actionPlan: string,
): Risk {
  riskSeq++
  return {
    id: `r${riskSeq}`,
    projectId,
    type,
    description,
    category,
    ownerId,
    priority,
    probability,
    impact,
    dueDate: d(due),
    status,
    actionPlan,
    createdAt: iso(due - 30),
    updatedAt: iso(Math.min(0, due - 5)),
  }
}

const risks: Risk[] = [
  risk('pr3', 'risco', 'Indisponibilidade da equipe do fornecedor de ERP na janela de virada', 'Fornecedor', 'p2', 'critica', 4, 5, 10, 'aberto', 'Formalizar janela de virada em aditivo contratual e garantir equipe de plantão.'),
  risk('pr3', 'problema', 'Divergência de saldos na migração de dados mestres', 'Qualidade', 'p3', 'critica', 5, 4, 5, 'em_tratamento', 'Rodar reconciliação por conta contábil e corrigir cargas com regras de de-para revisadas.'),
  risk('pr3', 'impedimento', 'Acesso do provedor de nuvem às interfaces fiscais ainda não liberado', 'Técnico', 'p2', 'alta', 4, 3, -2, 'aberto', 'Escalonar ao diretor de TI e abrir chamado prioritário no provedor.'),
  risk('pr1', 'risco', 'Baixa adesão dos fornecedores ao portal', 'Escopo', 'p4', 'media', 3, 3, 40, 'aberto', 'Plano de comunicação e suporte dedicado na primeira quinzena.'),
  risk('pr1', 'pendencia', 'Definir o termo de aceite de uso do portal com o Jurídico', 'Conformidade', 'p7', 'baixa', 2, 2, 15, 'aberto', 'Enviar minuta ao Jurídico e validar em reunião.'),
  risk('pr9', 'risco', 'Não cumprimento de prazo de resposta a solicitação da ANPD', 'Conformidade', 'p7', 'critica', 3, 5, 20, 'aberto', 'Priorizar sistemas com dados sensíveis e reforçar equipe com consultoria pontual.'),
  risk('pr9', 'pendencia', 'Áreas sem retorno do questionário de mapeamento', 'Recursos', 'p1', 'alta', 4, 3, 3, 'aberto', 'Cobrar diretores das áreas e agendar entrevistas presenciais.'),
  risk('pr5', 'risco', 'Mudança no layout da API do CRM pelo fornecedor', 'Técnico', 'p12', 'media', 2, 4, 50, 'aberto', 'Versionar o conector e monitorar notas de versão do fornecedor.'),
  risk('pr2', 'pendencia', 'Validar o manual operacional com a tesouraria', 'Qualidade', 'p3', 'baixa', 2, 2, 7, 'aberto', 'Reunião de validação com a tesouraria.'),
  risk('pr2', 'risco', 'Bancos sem extrato no padrão CNAB 240', 'Técnico', 'p12', 'media', 3, 3, -60, 'resolvido', 'Adotado leitor de extratos OFX como alternativa.'),
  risk('pr7', 'problema', 'Divergência entre áreas sobre as alçadas de aprovação', 'Escopo', 'p1', 'media', 3, 3, 12, 'em_tratamento', 'Levar proposta consolidada ao comitê executivo.'),
  risk('pr11', 'impedimento', 'Orçamento do serviço de digitalização não aprovado', 'Custo', 'p7', 'alta', 4, 3, -10, 'aberto', 'Reapresentar o business case com alternativa de digitalização em fases.'),
  risk('pr6', 'risco', 'Atraso na entrega dos sensores importados', 'Fornecedor', 'p4', 'media', 3, 2, 60, 'aberto', 'Avaliar fornecedor nacional como alternativa.'),
  risk('pr8', 'problema', 'Atraso na atualização da base de fretes', 'Técnico', 'p12', 'media', 2, 3, -60, 'resolvido', 'Carga incremental diária implantada.'),
]

let caseSeq = 0
function testCase(
  projectId: ID,
  system: string,
  feature: string,
  name: string,
  details: { objective: string; scenario: string; preconditions: string; steps: string; expected: string },
  ownerId: ID,
  priority: Priority,
  created: number,
): TestCase {
  caseSeq++
  return {
    id: `c${caseSeq}`,
    code: `CT-${String(caseSeq).padStart(3, '0')}`,
    projectId,
    system,
    feature,
    name,
    description: details.objective,
    objective: details.objective,
    scenario: details.scenario,
    preconditions: details.preconditions,
    steps: details.steps,
    expectedResult: details.expected,
    ownerId,
    priority,
    createdAt: iso(created),
    updatedAt: iso(created),
  }
}

const testCases: TestCase[] = [
  testCase('pr1', 'Portal de Fornecedores', 'Cadastro', 'Cadastro de fornecedor pessoa jurídica', {
    objective: 'Validar o cadastro completo de um fornecedor PJ.',
    scenario: 'Fornecedor novo acessa o portal pelo convite.',
    preconditions: 'Convite enviado ao e-mail do fornecedor.',
    steps: '1. Acessar o link do convite\n2. Preencher dados cadastrais e bancários\n3. Anexar contrato social\n4. Enviar para análise',
    expected: 'Cadastro enviado e status "Em análise" exibido ao comprador.',
  }, 'p9', 'alta', -30),
  testCase('pr1', 'Portal de Fornecedores', 'Cadastro', 'Bloqueio de CNPJ com situação cadastral irregular', {
    objective: 'Garantir que fornecedores com CNPJ irregular não sejam cadastrados.',
    scenario: 'Fornecedor informa CNPJ com situação "Inapta".',
    preconditions: 'CNPJ de teste com situação inapta disponível.',
    steps: '1. Iniciar cadastro\n2. Informar o CNPJ inapto\n3. Avançar para a próxima etapa',
    expected: 'Sistema bloqueia o avanço e exibe a mensagem de situação cadastral irregular.',
  }, 'p9', 'critica', -30),
  testCase('pr1', 'Portal de Fornecedores + ERP', 'Pedidos', 'Envio de pedido de compra ao fornecedor', {
    objective: 'Validar o envio automático do pedido aprovado no ERP para o portal.',
    scenario: 'Pedido aprovado no ERP para fornecedor ativo no portal.',
    preconditions: 'Fornecedor ativo e pedido aprovado no ERP.',
    steps: '1. Aprovar pedido no ERP\n2. Aguardar sincronização\n3. Consultar pedido no portal com o usuário do fornecedor',
    expected: 'Pedido disponível no portal em até 5 minutos, com itens e valores idênticos.',
  }, 'p9', 'critica', -30),
  testCase('pr1', 'Portal de Fornecedores', 'Pedidos', 'Aceite de pedido pelo fornecedor', {
    objective: 'Validar o aceite e o retorno do aceite ao ERP.',
    scenario: 'Fornecedor aceita o pedido com data de entrega.',
    preconditions: 'Pedido disponível no portal.',
    steps: '1. Abrir o pedido\n2. Informar data de entrega\n3. Confirmar aceite',
    expected: 'Status do pedido no ERP atualizado para "Aceito pelo fornecedor".',
  }, 'p4', 'alta', -20),
  testCase('pr1', 'Portal de Fornecedores', 'Relatórios', 'Relatório de desempenho de fornecedores', {
    objective: 'Validar indicadores de pontualidade e qualidade por fornecedor.',
    scenario: 'Comprador consulta o relatório mensal.',
    preconditions: 'Pedidos entregues no período.',
    steps: '1. Acessar Relatórios\n2. Selecionar o período\n3. Exportar em planilha',
    expected: 'Indicadores conferem com a base de recebimentos.',
  }, 'p4', 'media', -15),
  testCase('pr2', 'Robô de Conciliação', 'Captura', 'Captura de extrato do Banco A', {
    objective: 'Validar a captura diária do extrato.',
    scenario: 'Execução agendada às 7h.',
    preconditions: 'Credenciais do banco configuradas.',
    steps: '1. Executar o robô\n2. Verificar arquivo importado',
    expected: 'Extrato importado com todos os lançamentos do dia anterior.',
  }, 'p9', 'alta', -50),
  testCase('pr2', 'Robô de Conciliação', 'Conciliação', 'Conciliação automática de recebimentos', {
    objective: 'Validar a correspondência entre recebimentos e títulos.',
    scenario: 'Recebimentos por boleto e PIX.',
    preconditions: 'Títulos em aberto no contas a receber.',
    steps: '1. Importar extrato\n2. Executar conciliação\n3. Conferir relatório',
    expected: 'Pelo menos 95% dos recebimentos conciliados automaticamente.',
  }, 'p3', 'critica', -50),
  testCase('pr2', 'Robô de Conciliação', 'Conciliação', 'Tratamento de lançamentos não identificados', {
    objective: 'Validar o envio de pendências para análise manual.',
    scenario: 'Crédito sem título correspondente.',
    preconditions: 'Extrato com crédito não identificado.',
    steps: '1. Executar conciliação\n2. Abrir fila de pendências',
    expected: 'Lançamento listado na fila de análise com o motivo.',
  }, 'p3', 'alta', -50),
  testCase('pr2', 'Robô de Conciliação', 'Relatórios', 'Relatório diário de conciliação', {
    objective: 'Validar o relatório enviado à tesouraria.',
    scenario: 'Fim da execução diária.',
    preconditions: 'Conciliação executada.',
    steps: '1. Aguardar envio\n2. Conferir totais',
    expected: 'Relatório enviado até as 10h com totais corretos.',
  }, 'p3', 'media', -50),
  testCase('pr3', 'ERP em nuvem', 'Contabilidade', 'Fechamento contábil integrado', {
    objective: 'Validar o fechamento mensal no novo ambiente.',
    scenario: 'Simulação do fechamento do mês anterior.',
    preconditions: 'Dados mestres e saldos migrados.',
    steps: '1. Executar rotinas de fechamento\n2. Comparar balancete com o ambiente atual',
    expected: 'Balancete idêntico ao do ambiente atual.',
  }, 'p9', 'critica', -25),
  testCase('pr3', 'ERP em nuvem', 'Fiscal', 'Emissão de NF-e após migração', {
    objective: 'Validar a emissão de nota fiscal eletrônica.',
    scenario: 'Venda para cliente de outro estado.',
    preconditions: 'Interfaces fiscais configuradas em homologação.',
    steps: '1. Faturar pedido\n2. Transmitir NF-e\n3. Consultar autorização',
    expected: 'NF-e autorizada com impostos calculados corretamente.',
  }, 'p9', 'critica', -25),
  testCase('pr5', 'CRM + Faturamento', 'Pedidos', 'Envio de pedido padrão para faturamento', {
    objective: 'Validar a integração de pedido simples.',
    scenario: 'Pedido fechado no CRM com um item.',
    preconditions: 'Cliente cadastrado nos dois sistemas.',
    steps: '1. Fechar oportunidade\n2. Aguardar integração\n3. Consultar pedido no faturamento',
    expected: 'Pedido criado no faturamento com os mesmos valores.',
  }, 'p9', 'alta', -15),
  testCase('pr5', 'CRM + Faturamento', 'Pedidos', 'Pedido com desconto comercial', {
    objective: 'Validar a aplicação de descontos.',
    scenario: 'Pedido com 10% de desconto aprovado.',
    preconditions: 'Política de descontos parametrizada.',
    steps: '1. Fechar oportunidade com desconto\n2. Conferir pedido no faturamento',
    expected: 'Desconto refletido no pedido e nos impostos.',
  }, 'p8', 'media', -10),
  testCase('pr5', 'CRM + Faturamento', 'Reprocessamento', 'Reprocessamento de pedido rejeitado', {
    objective: 'Validar o reenvio após correção do cadastro.',
    scenario: 'Pedido rejeitado por cadastro incompleto.',
    preconditions: 'Cliente sem inscrição estadual.',
    steps: '1. Enviar pedido\n2. Corrigir cadastro\n3. Reprocessar',
    expected: 'Pedido integrado após o reprocessamento.',
  }, 'p9', 'media', -10),
  testCase('pr8', 'Painel Logístico', 'Indicadores', 'Cálculo do OTIF', {
    objective: 'Validar o indicador OTIF.',
    scenario: 'Entregas do mês anterior.',
    preconditions: 'Base de entregas carregada.',
    steps: '1. Abrir painel\n2. Comparar com o cálculo manual',
    expected: 'Diferença inferior a 0,5 p.p.',
  }, 'p9', 'alta', -40),
  testCase('pr8', 'Painel Logístico', 'Indicadores', 'Custo de frete por tonelada', {
    objective: 'Validar o custo de frete.',
    scenario: 'Fretes do mês anterior.',
    preconditions: 'Base de fretes atualizada.',
    steps: '1. Abrir painel\n2. Conferir com o relatório financeiro',
    expected: 'Valores idênticos ao relatório financeiro.',
  }, 'p6', 'media', -40),
]

let execSeq = 0
function execution(
  testCaseId: ID,
  attempt: number,
  executorId: ID,
  date: number,
  status: TestExecution['status'],
  actualResult: string,
  comments = '',
  needsRetest = false,
  correctiveTaskId?: ID,
): TestExecution {
  execSeq++
  const tc = testCases.find((c) => c.id === testCaseId)!
  return {
    id: `e${execSeq}`,
    testCaseId,
    attempt,
    executorId,
    date: d(date),
    expectedResult: tc.expectedResult,
    actualResult,
    status,
    comments,
    needsRetest,
    correctiveTaskId,
    createdAt: iso(date, 15),
  }
}

const correctiveTaskId = tasks.find((t) => t.sourceExecutionId === 'e2')?.id

const executions: TestExecution[] = [
  execution('c1', 1, 'p9', -20, 'aprovado', 'Cadastro enviado e exibido ao comprador como "Em análise".'),
  execution('c2', 1, 'p9', -8, 'reprovado', 'Cadastro avançou para a etapa seguinte mesmo com CNPJ inapto.', 'Consulta à situação cadastral retorna sucesso para qualquer situação.', true, correctiveTaskId),
  execution('c3', 1, 'p9', -25, 'reprovado', 'Pedido chegou ao portal sem o campo de condição de pagamento.', 'Mapeamento do campo ausente na integração.', true),
  execution('c3', 2, 'p4', -10, 'aprovado', 'Pedido disponível em 3 minutos com todos os campos corretos.', 'Reteste após correção do mapeamento.'),
  execution('c4', 1, 'p4', -2, 'em_andamento', '', 'Execução iniciada; aguardando retorno do ERP.'),
  execution('c6', 1, 'p3', -30, 'aprovado', 'Extrato importado com 1.284 lançamentos.'),
  execution('c7', 1, 'p3', -28, 'reprovado', '89% conciliados automaticamente.', 'Regra de tolerância de centavos não aplicada.', true),
  execution('c7', 2, 'p3', -18, 'aprovado', '96,4% conciliados automaticamente.', 'Reteste após ajuste da regra de tolerância.'),
  execution('c8', 1, 'p3', -16, 'aprovado', 'Lançamentos não identificados listados na fila com o motivo.'),
  execution('c9', 1, 'p9', -14, 'aprovado', 'Relatório enviado às 9h12 com totais corretos.'),
  execution('c10', 1, 'p9', -6, 'bloqueado', 'Não foi possível executar o fechamento.', 'Interfaces fiscais indisponíveis no ambiente de homologação.', true),
  execution('c11', 1, 'p3', -4, 'reprovado', 'NF-e rejeitada: alíquota interestadual de ICMS incorreta.', 'Tabela de alíquotas não migrada.', true),
  execution('c12', 1, 'p8', -9, 'aprovado', 'Pedido criado no faturamento com valores idênticos.'),
  execution('c14', 1, 'p9', -3, 'em_andamento', '', 'Aguardando cliente de teste sem inscrição estadual.'),
  execution('c15', 1, 'p6', -32, 'aprovado', 'Diferença de 0,2 p.p. em relação ao cálculo manual.'),
  execution('c16', 1, 'p6', -31, 'aprovado', 'Valores conferidos com o relatório financeiro.'),
]

const homologations: Homologation[] = [
  {
    id: 'h1',
    projectId: 'pr8',
    approverId: 'p10',
    date: d(-26),
    result: 'aprovada',
    comments: 'Painel validado pela operação logística durante duas semanas.',
    reservations: '',
    blockingIssues: '',
    createdAt: iso(-26, 16),
  },
]

const simulatedFile = (fileName: string, size: number, mimeType: string) => ({ fileName, size, mimeType, simulated: true })

const evidences: Evidence[] = [
  { id: 'ev1', executionId: 'e1', kind: 'captura', note: 'Tela de confirmação do cadastro.', file: simulatedFile('cadastro_confirmado.png', 248_000, 'image/png'), createdAt: iso(-20, 15) },
  { id: 'ev2', executionId: 'e2', kind: 'captura', note: 'Cadastro avançou com CNPJ inapto.', file: simulatedFile('erro_validacao_cnpj.png', 312_000, 'image/png'), createdAt: iso(-8, 15) },
  { id: 'ev3', executionId: 'e2', kind: 'comentario', note: 'Consulta à Receita retorna HTTP 200 mesmo para situação inapta; validar campo "situacao".', createdAt: iso(-8, 15) },
  { id: 'ev4', executionId: 'e3', kind: 'registro', note: 'Log da integração sem o campo de condição de pagamento.', file: simulatedFile('log_integracao_pedido.txt', 18_400, 'text/plain'), createdAt: iso(-25, 15) },
  { id: 'ev5', executionId: 'e4', kind: 'planilha', note: 'Comparativo de campos ERP x portal.', file: simulatedFile('comparativo_pedido.xlsx', 54_000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), createdAt: iso(-10, 15) },
  { id: 'ev6', executionId: 'e8', kind: 'resultado', note: 'Relatório da conciliação após ajuste.', file: simulatedFile('conciliacao_resultado.csv', 96_000, 'text/csv'), createdAt: iso(-18, 15) },
  { id: 'ev7', executionId: 'e12', kind: 'captura', note: 'Rejeição da SEFAZ.', file: simulatedFile('rejeicao_nfe_icms.png', 201_000, 'image/png'), createdAt: iso(-4, 15) },
  { id: 'ev8', homologationId: 'h1', kind: 'documento', note: 'Termo de homologação assinado.', file: simulatedFile('termo_homologacao_painel_logistico.pdf', 380_000, 'application/pdf'), createdAt: iso(-26, 16) },
]

let docSeq = 0
function doc(projectId: ID, type: string, title: string, description: string, ownerId: ID, created: number, fileName: string, size: number, mime: string): DocumentRecord {
  docSeq++
  return { id: `d${docSeq}`, projectId, type, title, description, ownerId, createdAt: iso(created), file: simulatedFile(fileName, size, mime) }
}

const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const documents: DocumentRecord[] = [
  doc('pr1', 'Termo de abertura', 'Termo de abertura — Portal de Fornecedores', 'Escopo, objetivos e patrocínio aprovados.', 'p4', -118, 'TAP_portal_fornecedores.pdf', 420_000, PDF),
  doc('pr1', 'Especificação funcional', 'Especificação do fluxo de cadastro', 'Regras de cadastro e homologação de fornecedores.', 'p4', -95, 'EF_cadastro_fornecedores.docx', 610_000, DOCX),
  doc('pr1', 'Plano de testes', 'Plano de testes UAT', 'Casos de teste e critérios de aceite.', 'p9', -32, 'plano_testes_portal.xlsx', 88_000, XLSX),
  doc('pr2', 'Especificação funcional', 'Regras de conciliação', 'Regras de correspondência e tolerâncias.', 'p3', -120, 'regras_conciliacao.docx', 230_000, DOCX),
  doc('pr2', 'Relatório de status', 'Resultado dos testes de conciliação', 'Consolidado das execuções com os três bancos.', 'p9', -12, 'resultado_testes_conciliacao.pdf', 510_000, PDF),
  doc('pr3', 'Cronograma', 'Cronograma de migração — revisão 4', 'Cronograma revisado após atraso nas interfaces fiscais.', 'p2', -15, 'cronograma_migracao_r4.xlsx', 145_000, XLSX),
  doc('pr3', 'Ata de reunião', 'Ata — comitê de crise da migração', 'Decisões sobre a nova data de virada.', 'p2', -6, 'ata_comite_migracao.docx', 74_000, DOCX),
  doc('pr3', 'Contrato', 'Aditivo contratual — fornecedor ERP', 'Minuta do aditivo de prazo e equipe de plantão.', 'p7', -3, 'aditivo_fornecedor_erp.pdf', 890_000, PDF),
  doc('pr4', 'Relatório de status', 'Relatório de encerramento do onboarding', 'Resultados do piloto e lições aprendidas.', 'p5', -42, 'encerramento_onboarding.pdf', 330_000, PDF),
  doc('pr7', 'Outro', 'Minuta da política de compras v0.6', 'Versão em revisão.', 'p1', -8, 'politica_compras_v06.docx', 120_000, DOCX),
  doc('pr8', 'Termo de homologação', 'Termo de homologação — Painel Logístico', 'Aceite formal da diretoria de operações.', 'p10', -26, 'termo_homologacao_painel.pdf', 380_000, PDF),
  doc('pr9', 'Ata de reunião', 'Ata — kickoff LGPD', 'Responsáveis por área e cronograma de entrevistas.', 'p7', -98, 'ata_kickoff_lgpd.docx', 66_000, DOCX),
]

let updSeq = 0
function update(projectId: ID, date: number, authorId: ID, health: ProjectUpdate['health'], summary: string, deliveries: string, nextSteps: string, risksText = '', impediments = '', supportNeeded = ''): ProjectUpdate {
  updSeq++
  return { id: `u${updSeq}`, projectId, date: d(date), authorId, health, summary, deliveries, nextSteps, risks: risksText, impediments, supportNeeded, createdAt: iso(date, 17) }
}

const updates: ProjectUpdate[] = [
  update('pr1', -35, 'p4', 'verde', 'Módulo de cadastro concluído e liberado para testes.', 'Módulo de cadastro; fluxo de homologação.', 'Iniciar integração de pedidos com o ERP.'),
  update('pr1', -7, 'p4', 'amarelo', 'UAT em andamento com falha crítica na validação de CNPJ.', 'Casos CT-001 e CT-003 aprovados.', 'Corrigir validação de CNPJ e retestar CT-002.', 'Falha de validação pode atrasar o piloto.', '', 'Apoio do Jurídico para o termo de aceite.'),
  update('pr2', -40, 'p3', 'verde', 'Robô em produção assistida nos três bancos.', 'Captura de extratos automatizada.', 'Executar testes de conciliação.'),
  update('pr2', -10, 'p3', 'verde', 'Todos os testes aprovados; aguardando homologação da diretoria financeira.', 'Testes de conciliação aprovados; relatório diário.', 'Concluir manual operacional e agendar homologação.'),
  update('pr3', -45, 'p2', 'amarelo', 'Migração de dados mestres com divergências de saldo.', 'Ambiente em nuvem provisionado.', 'Reconciliar saldos por conta contábil.', 'Divergência pode impactar o fechamento.'),
  update('pr3', -5, 'p2', 'vermelho', 'Prazo final vencido; interfaces fiscais bloqueadas.', 'Plano de virada em elaboração.', 'Negociar nova data de virada com o fornecedor.', 'Equipe do fornecedor indisponível na janela.', 'Acesso do provedor às interfaces fiscais.', 'Escalonamento à diretoria de operações.'),
  update('pr4', -42, 'p5', 'verde', 'Projeto encerrado com satisfação de 89% no piloto.', 'Nova trilha de integração e checklist digital.', 'Acompanhar indicadores por 3 meses.'),
  update('pr5', -14, 'p8', 'verde', 'Contrato de API aprovado e conector em desenvolvimento.', 'Especificação da API.', 'Concluir conector e mapear tabelas de preço.'),
  update('pr7', -12, 'p1', 'amarelo', 'Minuta em redação; divergência sobre alçadas.', 'Benchmarking concluído.', 'Consolidar proposta de alçadas para o comitê.'),
  update('pr8', -25, 'p1', 'verde', 'Painel homologado e em produção.', 'Painel com OTIF, frete e ocupação.', 'Encerramento do projeto.'),
  update('pr9', -20, 'p7', 'amarelo', 'Entrevistas atrasadas por falta de retorno das áreas.', 'Inventário de sistemas.', 'Agendar entrevistas presenciais.', 'Prazo regulatório.', 'Áreas sem retorno.', 'Cobrança dos diretores das áreas.'),
  update('pr11', -15, 'p7', 'amarelo', 'Projeto pausado aguardando orçamento.', 'Triagem do acervo físico.', 'Reapresentar business case.', '', 'Orçamento não aprovado.'),
]

function buildHistory(): HistoryEntry[] {
  const list: HistoryEntry[] = []
  let seq = 0
  const add = (projectId: ID, date: string, action: string, detail: string, actorId?: ID) =>
    list.push({ id: `hs${++seq}`, projectId, date, action, detail, actorId })

  projects.forEach((p) => {
    add(p.id, p.createdAt, 'Projeto criado', `Código ${p.code}`, p.managerId)
    if (p.completedAt) add(p.id, p.completedAt, 'Status alterado', 'Em andamento → Concluído', p.managerId)
  })
  executions.forEach((e) => {
    const tc = testCases.find((c) => c.id === e.testCaseId)!
    add(tc.projectId, e.createdAt, 'Execução de teste registrada', `${tc.code} — tentativa ${e.attempt}`, e.executorId)
  })
  homologations.forEach((h) => add(h.projectId, h.createdAt, 'Homologação registrada', 'Resultado: Aprovada', h.approverId))
  updates.forEach((u) => add(u.projectId, u.createdAt, 'Atualização de andamento registrada', u.summary, u.authorId))
  documents.forEach((x) => add(x.projectId, x.createdAt, 'Documento incluído', `${x.type}: ${x.title}`, x.ownerId))
  return list
}

export function createSeedDatabase(): Database {
  return structuredClone({
    version: SEED_VERSION,
    people,
    projects,
    tasks,
    risks,
    testCases,
    executions,
    evidences,
    homologations,
    documents,
    updates,
    history: buildHistory(),
    settings: { progressRule: 'media_simples', currentUserId: 'p1', scheduleGapThreshold: 25 },
  })
}
