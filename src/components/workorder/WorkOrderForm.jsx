import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import FileAttachments from "@/components/common/FileAttachments";

const WO_ATTACHMENT_TYPES = ["Foto Antes", "Foto Depois", "Foto Reparo", "Relatório", "Outro"];

const TYPES = ["Corretiva", "Preventiva", "Preditiva", "Melhoria", "Emergencial"];
const PRIORITIES = ["Baixa", "Média", "Alta", "Urgente"];
const STATUSES = ["Aberta", "Em Andamento", "Aguardando Peça", "Concluída", "Cancelada"];
const TECHNOLOGIES = ["Mecânica", "Elétrica", "Pneumática", "Hidráulica", "Automação", "Instrumentação", "Refrigeração", "Civil"];

export default function WorkOrderForm({ open, onClose, onSave, workOrder, equipments }) {
  const [form, setForm] = useState(workOrder || {
    equipment_id: "",
    type: "Corretiva",
    priority: "Média",
    status: "Aberta",
    technology: "",
    description: "",
    cause: "",
    solution: "",
    requested_by: "",
    assigned_to: "",
    open_date: new Date().toISOString().slice(0, 16),
    start_date: "",
    end_date: "",
    downtime_hours: 0,
    repair_hours: 0,
    parts_used: "",
    cost: 0,
    failure_mode: "",
    notes: "",
    attachments: [],
  });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleEquipmentChange = (eqId) => {
    const eq = equipments.find(e => e.id === eqId);
    if (eq) {
      setForm(prev => ({
        ...prev,
        equipment_id: eqId,
        equipment_tag: eq.tag,
        equipment_name: eq.name,
        technology: eq.technology || prev.technology,
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const orderNumber = form.order_number || `OS-${Date.now().toString(36).toUpperCase()}`;
    await onSave({ ...form, order_number: orderNumber });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workOrder ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Equipamento *</Label>
            <Select value={form.equipment_id} onValueChange={handleEquipmentChange}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {equipments.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select value={form.type} onValueChange={v => update("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={form.priority} onValueChange={v => update("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tecnologia</Label>
            <Select value={form.technology} onValueChange={v => update("technology", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{TECHNOLOGIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Modo de Falha</Label>
            <Input value={form.failure_mode} onChange={e => update("failure_mode", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Descrição do Problema *</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Causa Raiz</Label>
            <Textarea value={form.cause} onChange={e => update("cause", e.target.value)} rows={2} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Solução Aplicada</Label>
            <Textarea value={form.solution} onChange={e => update("solution", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Solicitante</Label>
            <Input value={form.requested_by} onChange={e => update("requested_by", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Técnico Responsável</Label>
            <Input value={form.assigned_to} onChange={e => update("assigned_to", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data Abertura</Label>
            <Input type="datetime-local" value={form.open_date} onChange={e => update("open_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Início Atendimento</Label>
            <Input type="datetime-local" value={form.start_date} onChange={e => update("start_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Conclusão</Label>
            <Input type="datetime-local" value={form.end_date} onChange={e => update("end_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Horas de Parada</Label>
            <Input type="number" step="0.5" value={form.downtime_hours} onChange={e => update("downtime_hours", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Horas de Reparo</Label>
            <Input type="number" step="0.5" value={form.repair_hours} onChange={e => update("repair_hours", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Custo (R$)</Label>
            <Input type="number" step="0.01" value={form.cost} onChange={e => update("cost", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Peças Utilizadas</Label>
            <Textarea value={form.parts_used} onChange={e => update("parts_used", e.target.value)} rows={2} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} />
          </div>
          <div className="col-span-2">
            <Separator className="my-2" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-slate-700">📎 Fotos e Arquivos da OS</span>
            </div>
            <FileAttachments
              attachments={form.attachments || []}
              onChange={(files) => update("attachments", files)}
              typeOptions={WO_ATTACHMENT_TYPES}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.equipment_id || !form.description}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}