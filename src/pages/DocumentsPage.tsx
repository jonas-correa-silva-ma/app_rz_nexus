import { Info } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { DocumentBoard } from '@/modules/documents/DocumentBoard'

export function DocumentsPage() {
  return (
    <div>
      <PageHeader title="Documentos" description="Termos, atas, especificações, planos e demais arquivos dos projetos." />
      <div className="mb-4 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Protótipo: não há armazenamento definitivo de arquivos. Arquivos pequenos ficam guardados apenas neste navegador; os demais (e os documentos de demonstração) têm a
          associação simulada, com nome e tamanho, sem o conteúdo.
        </p>
      </div>
      <DocumentBoard />
    </div>
  )
}
