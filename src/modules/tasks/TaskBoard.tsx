import * as React from 'react'
import { Link } from 'react-router'
import { AlertCircle, Columns3, ListChecks, Pencil, Plus, Rows3, Search, Trash2, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Input, Select } from '@/components/ui/form-controls'
import { Progress } from '@/components/ui/progress'
import { compareValues, SortableTH, Table, TBody, TD, TH, THead, TR, useSort } from '@/components/ui/table'
import { ConfirmDialog, Deadline, EmptyState, FilterBar, OptionBadge, PersonChip, runAction } from '@/components/common'
import { PRIORITIES, TASK_STATUSES } from '@/config/labels'
import { isTaskClosed, isTaskOverdue } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { cn } from '@/lib/utils'
import { services } from '@/services'
import type { ID, Task, TaskStatus } from '@/types'
import { matches } from '@/utils/format'
import { TaskFormDialog } from './TaskFormDialog'

type SortKey = 'name' | 'project' | 'assignee' | 'priority' | 'status' | 'dueDate' | 'progress'
const PRIORITY_ORDER = { baixa: 1, media: 2, alta: 3, critica: 4 }
const STATUS_ORDER = Object.fromEntries(TASK_STATUSES.map((s, i) => [s.value, i])) as Record<TaskStatus, number>

function readView(): 'tabela' | 'kanban' {
  try {
    return localStorage.getItem('nexo:ui:tasks-view') === 'kanban' ? 'kanban' : 'tabela'
  } catch {
    return 'tabela'
  }
}

/** Gestão de tarefas: usada na página de tarefas e na aba de tarefas do projeto. */
export function TaskBoard({ projectId, initialAssignee }: { projectId?: ID; initialAssignee?: ID }) {
  const { data: tasks = [], loading } = useQuery(() => services.tasks.list({ projectId }), [projectId])
  const ref = useReferenceData()
  const [view, setView] = React.useState(readView)
  const [query, setQuery] = React.useState('')
  const [project, setProject] = React.useState('')
  const [assignee, setAssignee] = React.useState(initialAssignee ?? '')
  const [status, setStatus] = React.useState('')
  const [onlyOverdue, setOnlyOverdue] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | undefined>()
  const [formOpen, setFormOpen] = React.useState(false)
  const [removing, setRemoving] = React.useState<Task | undefined>()
  const { sort, onSort } = useSort<SortKey>('dueDate')

  React.useEffect(() => {
    try {
      localStorage.setItem('nexo:ui:tasks-view', view)
    } catch {
      // preferência de interface apenas
    }
  }, [view])

  const filtered = React.useMemo(() => {
    const list = tasks.filter(
      (t) =>
        matches(query, t.name, t.description) &&
        (!project || t.projectId === project) &&
        (!assignee || t.assigneeId === assignee) &&
        (!status || t.status === status) &&
        (!onlyOverdue || isTaskOverdue(t)),
    )
    const value = (t: Task): string | number => {
      switch (sort.key) {
        case 'project':
          return ref.projectName(t.projectId)
        case 'assignee':
          return ref.personName(t.assigneeId)
        case 'priority':
          return PRIORITY_ORDER[t.priority]
        case 'status':
          return STATUS_ORDER[t.status]
        case 'progress':
          return t.progress
        default:
          return t[sort.key]
      }
    }
    return list.sort((a, b) => compareValues(value(a), value(b), sort.dir))
  }, [tasks, query, project, assignee, status, onlyOverdue, sort, ref])

  const overdueCount = tasks.filter(isTaskOverdue).length

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (t: Task) => {
    setEditing(t)
    setFormOpen(true)
  }
  const changeStatus = (t: Task, s: TaskStatus) => runAction(() => services.tasks.update(t.id, { status: s }), 'Status da tarefa atualizado.')

  return (
    <div>
      <FilterBar>
        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Pesquisar tarefas…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        {!projectId && (
          <Select value={project} onChange={(e) => setProject(e.target.value)} className="sm:w-56" aria-label="Filtrar por projeto">
            <option value="">Todos os projetos</option>
            {ref.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:w-48" aria-label="Filtrar por responsável">
          <option value="">Todos os responsáveis</option>
          {ref.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        {view === 'tabela' && (
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" aria-label="Filtrar por status">
            <option value="">Todos os status</option>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        )}
        <Checkbox label={`Somente atrasadas (${overdueCount})`} checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
        <div className="flex gap-2 sm:ml-auto">
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <button
              onClick={() => setView('tabela')}
              className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium', view === 'tabela' ? 'bg-muted text-foreground' : 'text-muted-foreground')}
            >
              <Rows3 className="size-3.5" /> Tabela
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium', view === 'kanban' ? 'bg-muted text-foreground' : 'text-muted-foreground')}
            >
              <Columns3 className="size-3.5" /> Kanban
            </button>
          </div>
          <Button onClick={openNew}>
            <Plus /> Nova tarefa
          </Button>
        </div>
      </FilterBar>

      {!loading && tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nenhuma tarefa cadastrada" description="Crie a primeira tarefa para acompanhar o andamento." action={<Button onClick={openNew}><Plus /> Nova tarefa</Button>} />
      ) : view === 'tabela' ? (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <SortableTH label="Tarefa" column="name" sort={sort} onSort={onSort} />
                {!projectId && <SortableTH label="Projeto" column="project" sort={sort} onSort={onSort} />}
                <SortableTH label="Responsável" column="assignee" sort={sort} onSort={onSort} />
                <SortableTH label="Prioridade" column="priority" sort={sort} onSort={onSort} />
                <SortableTH label="Status" column="status" sort={sort} onSort={onSort} />
                <SortableTH label="Vencimento" column="dueDate" sort={sort} onSort={onSort} />
                <SortableTH label="Progresso" column="progress" sort={sort} onSort={onSort} />
                <TH className="w-20" />
              </tr>
            </THead>
            <TBody>
              {filtered.map((t) => (
                <TR key={t.id}>
                  <TD className="min-w-56 max-w-72">
                    <p className="font-medium">{t.name}</p>
                    {t.sourceExecutionId && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-red-700">
                        <Wrench className="size-3" /> Correção de falha de teste
                      </span>
                    )}
                  </TD>
                  {!projectId && (
                    <TD className="min-w-44 max-w-56">
                      <Link to={`/projetos/${t.projectId}`} title={ref.projectName(t.projectId)} className="line-clamp-2 text-sm text-primary hover:underline">
                        {ref.projectName(t.projectId)}
                      </Link>
                    </TD>
                  )}
                  <TD>
                    <PersonChip name={ref.personName(t.assigneeId)} />
                  </TD>
                  <TD>
                    <OptionBadge options={PRIORITIES} value={t.priority} dot={false} />
                  </TD>
                  <TD>
                    <Select value={t.status} onChange={(e) => changeStatus(t, e.target.value as TaskStatus)} className="h-8 w-36 text-xs" aria-label="Alterar status">
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </TD>
                  <TD>
                    <Deadline date={t.dueDate} closed={isTaskClosed(t)} />
                  </TD>
                  <TD className="w-36">
                    <Progress value={t.progress} showLabel tone={t.status === 'concluida' ? 'green' : t.status === 'bloqueada' ? 'red' : 'blue'} />
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => openEdit(t)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => setRemoving(t)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma tarefa corresponde aos filtros.
                  </td>
                </tr>
              )}
            </TBody>
          </Table>
        </Card>
      ) : (
        <Kanban tasks={filtered} showProject={!projectId} projectName={ref.projectName} personName={ref.personName} onEdit={openEdit} onMove={changeStatus} />
      )}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editing} projectId={projectId} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title="Excluir tarefa"
        description={`A tarefa "${removing?.name}" será excluída. Os indicadores do projeto serão recalculados.`}
        onConfirm={async () => {
          if (removing) await runAction(() => services.tasks.remove(removing.id), 'Tarefa excluída.')
        }}
      />
    </div>
  )
}

function Kanban({
  tasks,
  showProject,
  projectName,
  personName,
  onEdit,
  onMove,
}: {
  tasks: Task[]
  showProject: boolean
  projectName: (id: ID) => string
  personName: (id: ID) => string
  onEdit: (t: Task) => void
  onMove: (t: Task, s: TaskStatus) => void
}) {
  const [dragOver, setDragOver] = React.useState<TaskStatus | undefined>()
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-2">
      {TASK_STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.value)
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(col.value)
            }}
            onDragLeave={() => setDragOver(undefined)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(undefined)
              const t = tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'))
              if (t && t.status !== col.value) onMove(t, col.value)
            }}
            className={cn('flex w-72 shrink-0 snap-start flex-col rounded-xl border border-border bg-muted/50 p-2', dragOver === col.value && 'border-blue-400 bg-blue-50/50')}
          >
            <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
              <OptionBadge options={TASK_STATUSES} value={col.value} />
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex min-h-24 flex-col gap-2">
              {items.map((t) => {
                const overdue = isTaskOverdue(t)
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                    onClick={() => onEdit(t)}
                    className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{t.name}</p>
                      <OptionBadge options={PRIORITIES} value={t.priority} dot={false} />
                    </div>
                    {showProject && <p className="mt-1 truncate text-xs text-muted-foreground">{projectName(t.projectId)}</p>}
                    <Progress value={t.progress} className="mt-3" showLabel />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{personName(t.assigneeId)}</span>
                      {overdue ? (
                        <Badge tone="red">
                          <AlertCircle className="size-3" /> Atrasada
                        </Badge>
                      ) : (
                        <span>{new Date(`${t.dueDate}T00:00:00`).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                    {/* Alternativa ao arrastar (toque/teclado) */}
                    <Select
                      value={t.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onMove(t, e.target.value as TaskStatus)}
                      className="mt-2 h-7 text-xs lg:hidden"
                      aria-label="Mover para"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
