import { Ban, ListTodo, PlayCircle, TimerOff } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/common'
import { isTaskOverdue } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { TaskBoard } from '@/modules/tasks/TaskBoard'
import { services } from '@/services'

export function TasksPage() {
  const { data: tasks = [] } = useQuery(() => services.tasks.list())
  return (
    <div>
      <PageHeader title="Tarefas" description="Atividades de todos os projetos. Arraste os cartões no Kanban para atualizar o status." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total de tarefas" value={tasks.length} icon={ListTodo} tone="slate" />
        <StatCard label="Em andamento" value={tasks.filter((t) => t.status === 'em_andamento').length} icon={PlayCircle} tone="blue" />
        <StatCard label="Atrasadas" value={tasks.filter(isTaskOverdue).length} icon={TimerOff} tone="red" />
        <StatCard label="Bloqueadas" value={tasks.filter((t) => t.status === 'bloqueada').length} icon={Ban} tone="amber" />
      </div>
      <TaskBoard />
    </div>
  )
}
