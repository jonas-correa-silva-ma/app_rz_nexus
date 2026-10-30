import * as React from 'react'
import { useNavigate } from 'react-router'
import { FolderKanban, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/form-controls'
import { Progress } from '@/components/ui/progress'
import { compareValues, SortableTH, Table, TBody, TD, TH, THead, TR, useSort } from '@/components/ui/table'
import { ConfirmDialog, Deadline, EmptyState, FilterBar, OptionBadge, PageHeader, PersonChip, RiskLevelBadge, runAction } from '@/components/common'
import { AREAS, PRIORITIES, PROJECT_STATUSES } from '@/config/labels'
import { isProjectClosed } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { ProjectFormDialog } from '@/modules/projects/ProjectFormDialog'
import { services } from '@/services'
import type { Project, ProjectInsight } from '@/types'
import { formatDate } from '@/utils/dates'
import { matches } from '@/utils/format'

type SortKey = 'name' | 'code' | 'manager' | 'area' | 'priority' | 'status' | 'startDate' | 'endDate' | 'progress' | 'risk'
const PRIORITY_ORDER = { baixa: 1, media: 2, alta: 3, critica: 4 }
const RISK_ORDER = { baixo: 1, medio: 2, alto: 3 }
const STATUS_ORDER = Object.fromEntries(PROJECT_STATUSES.map((s, i) => [s.value, i]))

export function ProjectsPage() {
  const navigate = useNavigate()
  const ref = useReferenceData()
  const { data: insights = [], loading } = useQuery(() => services.projects.insights())
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [priority, setPriority] = React.useState('')
  const [area, setArea] = React.useState('')
  const [manager, setManager] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Project>()
  const [removing, setRemoving] = React.useState<Project>()
  const { sort, onSort } = useSort<SortKey>('endDate')

  const hasFilters = !!(query || status || priority || area || manager)
  const rows = React.useMemo(() => {
    const value = (i: ProjectInsight): string | number => {
      const p = i.project
      switch (sort.key) {
        case 'manager':
          return ref.personName(p.managerId)
        case 'priority':
          return PRIORITY_ORDER[p.priority]
        case 'status':
          return STATUS_ORDER[p.status]
        case 'progress':
          return i.progress
        case 'risk':
          return RISK_ORDER[i.riskLevel]
        default:
          return p[sort.key]
      }
    }
    return insights
      .filter(({ project: p }) => matches(query, p.name, p.code, p.description) && (!status || p.status === status) && (!priority || p.priority === priority) && (!area || p.area === area) && (!manager || p.managerId === manager))
      .sort((a, b) => compareValues(value(a), value(b), sort.dir))
  }, [insights, query, status, priority, area, manager, sort, ref])

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Projetos"
        description={`${insights.length} projeto(s) cadastrados`}
        actions={
          <Button onClick={openNew}>
            <Plus /> Novo projeto
          </Button>
        }
      />
      <FilterBar>
        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por nome ou código…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48" aria-label="Status">
          <option value="">Todos os status</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-40" aria-label="Prioridade">
          <option value="">Toda prioridade</option>
          {PRIORITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select value={area} onChange={(e) => setArea(e.target.value)} className="sm:w-52" aria-label="Área">
          <option value="">Todas as áreas</option>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
        <Select value={manager} onChange={(e) => setManager(e.target.value)} className="sm:w-48" aria-label="Responsável">
          <option value="">Todos os responsáveis</option>
          {ref.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              setStatus('')
              setPriority('')
              setArea('')
              setManager('')
            }}
          >
            <X /> Limpar filtros
          </Button>
        )}
      </FilterBar>

      {!loading && insights.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nenhum projeto cadastrado" description="Crie um projeto ou restaure os dados de demonstração em Configurações." action={<Button onClick={openNew}><Plus /> Novo projeto</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <SortableTH label="Projeto" column="name" sort={sort} onSort={onSort} />
                <SortableTH label="Código" column="code" sort={sort} onSort={onSort} />
                <SortableTH label="Responsável" column="manager" sort={sort} onSort={onSort} />
                <SortableTH label="Área" column="area" sort={sort} onSort={onSort} />
                <SortableTH label="Prioridade" column="priority" sort={sort} onSort={onSort} />
                <SortableTH label="Status" column="status" sort={sort} onSort={onSort} />
                <SortableTH label="Início" column="startDate" sort={sort} onSort={onSort} />
                <SortableTH label="Prazo final" column="endDate" sort={sort} onSort={onSort} />
                <SortableTH label="Progresso" column="progress" sort={sort} onSort={onSort} />
                <SortableTH label="Risco" column="risk" sort={sort} onSort={onSort} />
                <TH className="w-20" />
              </tr>
            </THead>
            <TBody>
              {rows.map((i) => {
                const p = i.project
                return (
                  <TR key={p.id} onClick={() => navigate(`/projetos/${p.id}`)}>
                    <TD className="min-w-56 max-w-72">
                      <p className="font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.category}</p>
                    </TD>
                    <TD className="whitespace-nowrap font-mono text-xs text-muted-foreground">{p.code}</TD>
                    <TD>
                      <PersonChip name={ref.personName(p.managerId)} />
                    </TD>
                    <TD className="whitespace-nowrap text-sm">{p.area}</TD>
                    <TD>
                      <OptionBadge options={PRIORITIES} value={p.priority} dot={false} />
                    </TD>
                    <TD>
                      <OptionBadge options={PROJECT_STATUSES} value={p.status} />
                    </TD>
                    <TD className="whitespace-nowrap">{formatDate(p.startDate)}</TD>
                    <TD>
                      <Deadline date={p.endDate} closed={isProjectClosed(p)} />
                    </TD>
                    <TD className="w-36">
                      <Progress value={i.progress} showLabel tone={p.status === 'concluido' ? 'green' : 'blue'} />
                    </TD>
                    <TD>
                      <RiskLevelBadge level={i.riskLevel} reasons={i.riskReasons} />
                    </TD>
                    <TD onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Editar"
                          onClick={() => {
                            setEditing(p)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => setRemoving(p)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum projeto corresponde aos filtros.
                  </td>
                </tr>
              )}
            </TBody>
          </Table>
        </Card>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editing} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title="Excluir projeto"
        description={`O projeto "${removing?.name}" e todos os registros vinculados (tarefas, riscos, testes, documentos, atualizações e histórico) serão excluídos.`}
        onConfirm={async () => {
          if (removing) await runAction(() => services.projects.remove(removing.id), 'Projeto excluído.')
        }}
      />
    </div>
  )
}
