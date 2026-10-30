import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { runAction } from '@/components/common'
import { PRIORITIES } from '@/config/labels'
import { required, useForm } from '@/hooks/useForm'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type TestCaseInput } from '@/services'
import type { ID, TestCase } from '@/types'

const empty = (projectId = '', ownerId = ''): TestCaseInput => ({
  code: '',
  projectId,
  system: '',
  feature: '',
  name: '',
  description: '',
  objective: '',
  scenario: '',
  preconditions: '',
  steps: '',
  expectedResult: '',
  ownerId,
  priority: 'media',
})

export function TestCaseFormDialog({ open, onOpenChange, testCase, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; testCase?: TestCase; projectId?: ID }) {
  const { people, projects } = useReferenceData()
  const testProjects = projects.filter((p) => p.requiresTests)
  const [saving, setSaving] = React.useState(false)
  const form = useForm<TestCaseInput>(empty(), (v) => ({
    name: required(v.name),
    projectId: required(v.projectId, 'Selecione o projeto.'),
    expectedResult: required(v.expectedResult, 'Informe o resultado esperado.'),
    ownerId: required(v.ownerId, 'Selecione o responsável.'),
    steps: required(v.steps, 'Descreva os passos.'),
  }))
  const { values: v, set, errors } = form

  React.useEffect(() => {
    if (!open) return
    if (testCase) {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = testCase
      form.reset(rest)
    } else {
      services.settings.get().then((s) => form.reset(empty(projectId, s.currentUserId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, testCase, projectId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.check()) return
    setSaving(true)
    const ok = testCase
      ? await runAction(() => services.tests.updateCase(testCase.id, v), 'Caso de teste atualizado.')
      : await runAction(() => services.tests.createCase(v), 'Caso de teste cadastrado.')
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const text = (key: keyof TestCaseInput, label: string, opts: { rows?: number; required?: boolean; span?: boolean } = {}) => (
    <Field label={label} required={opts.required} error={errors[key]} className={opts.span ? 'sm:col-span-2' : undefined}>
      {opts.rows ? (
        <Textarea rows={opts.rows} value={String(v[key] ?? '')} onChange={(e) => set(key, e.target.value)} aria-invalid={!!errors[key]} />
      ) : (
        <Input value={String(v[key] ?? '')} onChange={(e) => set(key, e.target.value)} aria-invalid={!!errors[key]} />
      )}
    </Field>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title={testCase ? `Editar caso ${testCase.code}` : 'Novo caso de teste'} description="O identificador é gerado automaticamente quando não informado." />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Projeto" required error={errors.projectId}>
              <Select value={v.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!projectId && !testCase} aria-invalid={!!errors.projectId}>
                <option value="">Selecione…</option>
                {testProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Identificador">
              <Input value={v.code ?? ''} onChange={(e) => set('code', e.target.value)} placeholder="Automático (ex.: CT-017)" disabled={!!testCase} />
            </Field>
            {text('name', 'Nome', { required: true, span: true })}
            {text('system', 'Sistema ou processo')}
            {text('feature', 'Funcionalidade')}
            {text('description', 'Descrição', { rows: 2, span: true })}
            {text('objective', 'Objetivo', { rows: 2 })}
            {text('scenario', 'Cenário', { rows: 2 })}
            {text('preconditions', 'Pré-condições', { rows: 2, span: true })}
            {text('steps', 'Passos', { rows: 4, required: true, span: true })}
            {text('expectedResult', 'Resultado esperado', { rows: 2, required: true, span: true })}
            <Field label="Responsável" required error={errors.ownerId}>
              <Select value={v.ownerId} onChange={(e) => set('ownerId', e.target.value)} aria-invalid={!!errors.ownerId}>
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={v.priority} onChange={(e) => set('priority', e.target.value as TestCaseInput['priority'])}>
                {PRIORITIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              O status do caso é definido pela execução mais recente. Para alterá-lo, registre uma execução.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {testCase ? 'Salvar alterações' : 'Cadastrar caso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
