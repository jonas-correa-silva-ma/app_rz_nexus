import * as React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { runAction } from '@/components/common'
import { AREAS, PRIORITIES, PROJECT_CATEGORIES, PROJECT_STATUSES, TEST_TYPES } from '@/config/labels'
import { required, useForm } from '@/hooks/useForm'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type ProjectInput } from '@/services'
import type { Project, TestConfig } from '@/types'
import { daysFromToday, today } from '@/utils/dates'
import { MultiChecklist } from '@/modules/shared/PeopleChecklist'

function emptyProject(currentUserId?: string): ProjectInput {
  return {
    name: '',
    description: '',
    objective: '',
    category: PROJECT_CATEGORIES[0],
    area: AREAS[0],
    sponsorId: undefined,
    managerId: currentUserId ?? '',
    memberIds: [],
    priority: 'media',
    status: 'planejamento',
    startDate: today(),
    endDate: daysFromToday(90),
    requiresTests: false,
    testConfig: undefined,
    dependencyIds: [],
    notes: '',
  }
}

const emptyTestConfig = (): TestConfig => ({ testType: TEST_TYPES[0], testerIds: [], approvalCriteria: '' })

export function ProjectFormDialog({ open, onOpenChange, project }: { open: boolean; onOpenChange: (o: boolean) => void; project?: Project }) {
  const navigate = useNavigate()
  const { people, projects } = useReferenceData()
  const form = useForm<ProjectInput>(emptyProject(), (v) => ({
    name: required(v.name),
    managerId: required(v.managerId, 'Informe o gerente.'),
    startDate: required(v.startDate),
    endDate: required(v.endDate) ?? (v.endDate < v.startDate ? 'O término deve ser posterior ao início.' : undefined),
  }))
  const [saving, setSaving] = React.useState(false)
  const { values: v, set, errors } = form

  React.useEffect(() => {
    if (!open) return
    if (project) {
      const { id: _id, createdAt: _c, updatedAt: _u, completedAt: _d, ...rest } = project
      form.reset(rest)
    } else {
      services.settings.get().then((s) => form.reset(emptyProject(s.currentUserId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.check()) return
    setSaving(true)
    const payload: ProjectInput = { ...v, testConfig: v.requiresTests ? (v.testConfig ?? emptyTestConfig()) : v.testConfig }
    const result = project
      ? await runAction(() => services.projects.update(project.id, payload), 'Projeto atualizado.')
      : await runAction(() => services.projects.create(payload), 'Projeto criado.')
    setSaving(false)
    if (result) {
      onOpenChange(false)
      if (!project) navigate(`/projetos/${result.id}`)
    }
  }

  const tc = v.testConfig ?? emptyTestConfig()
  const setTc = (patch: Partial<TestConfig>) => set('testConfig', { ...tc, ...patch })
  const personOptions = people.map((p) => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title={project ? `Editar projeto ${project.code}` : 'Novo projeto'} description="Campos com * são obrigatórios." />
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome" required error={errors.name} className="sm:col-span-2">
              <Input value={v.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoFocus />
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <Textarea value={v.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label="Objetivo" className="sm:col-span-2">
              <Textarea rows={2} value={v.objective} onChange={(e) => set('objective', e.target.value)} />
            </Field>
            <Field label="Categoria">
              <Select value={v.category} onChange={(e) => set('category', e.target.value)}>
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Área">
              <Select value={v.area} onChange={(e) => set('area', e.target.value)}>
                {AREAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Patrocinador">
              <Select value={v.sponsorId ?? ''} onChange={(e) => set('sponsorId', e.target.value || undefined)}>
                <option value="">Não definido</option>
                {personOptions}
              </Select>
            </Field>
            <Field label="Gerente" required error={errors.managerId}>
              <Select value={v.managerId} onChange={(e) => set('managerId', e.target.value)} aria-invalid={!!errors.managerId}>
                <option value="">Selecione…</option>
                {personOptions}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={v.priority} onChange={(e) => set('priority', e.target.value as ProjectInput['priority'])}>
                {PRIORITIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={v.status} onChange={(e) => set('status', e.target.value as ProjectInput['status'])}>
                {PROJECT_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data de início" required error={errors.startDate}>
              <Input type="date" value={v.startDate} onChange={(e) => set('startDate', e.target.value)} aria-invalid={!!errors.startDate} />
            </Field>
            <Field label="Data de término" required error={errors.endDate}>
              <Input type="date" value={v.endDate} onChange={(e) => set('endDate', e.target.value)} aria-invalid={!!errors.endDate} />
            </Field>
            <Field label="Responsáveis (equipe)" className="sm:col-span-2">
              <MultiChecklist items={people.map((p) => ({ id: p.id, label: p.name, hint: p.area }))} value={v.memberIds} onChange={(ids) => set('memberIds', ids)} />
            </Field>
            <Field label="Dependências (projetos predecessores)" className="sm:col-span-2">
              <MultiChecklist
                items={projects.filter((p) => p.id !== project?.id).map((p) => ({ id: p.id, label: p.name, hint: p.code }))}
                value={v.dependencyIds}
                onChange={(ids) => set('dependencyIds', ids)}
              />
            </Field>

            <div className="rounded-lg border border-border bg-muted/30 p-4 sm:col-span-2">
              <Checkbox label="Este projeto exige testes e homologação" checked={v.requiresTests} onChange={(e) => set('requiresTests', e.target.checked)} />
              {v.requiresTests && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Tipo de teste">
                    <Select value={tc.testType} onChange={(e) => setTc({ testType: e.target.value })}>
                      {TEST_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Data planejada">
                    <Input type="date" value={tc.plannedDate ?? ''} onChange={(e) => setTc({ plannedDate: e.target.value || undefined })} />
                  </Field>
                  <Field label="Coordenador dos testes">
                    <Select value={tc.coordinatorId ?? ''} onChange={(e) => setTc({ coordinatorId: e.target.value || undefined })}>
                      <option value="">Não definido</option>
                      {personOptions}
                    </Select>
                  </Field>
                  <Field label="Aprovador (homologação)">
                    <Select value={tc.approverId ?? ''} onChange={(e) => setTc({ approverId: e.target.value || undefined })}>
                      <option value="">Não definido</option>
                      {personOptions}
                    </Select>
                  </Field>
                  <Field label="Responsáveis pelos testes" className="sm:col-span-2">
                    <MultiChecklist items={people.map((p) => ({ id: p.id, label: p.name, hint: p.area }))} value={tc.testerIds} onChange={(ids) => setTc({ testerIds: ids })} />
                  </Field>
                  <Field label="Critérios de aprovação" className="sm:col-span-2">
                    <Textarea rows={2} value={tc.approvalCriteria} onChange={(e) => setTc({ approvalCriteria: e.target.value })} />
                  </Field>
                </div>
              )}
            </div>

            <Field label="Observações" className="sm:col-span-2">
              <Textarea rows={2} value={v.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {project ? 'Salvar alterações' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
