import { PageHeader } from '@/components/common'
import { UpdateTimeline } from '@/modules/updates/UpdateTimeline'

export function UpdatesPage() {
  return (
    <div>
      <PageHeader title="Atualizações" description="Registros periódicos de andamento dos projetos, do mais recente para o mais antigo." />
      <UpdateTimeline />
    </div>
  )
}
