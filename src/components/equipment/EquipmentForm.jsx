import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Paperclip } from "lucide-react";
import FileAttachments from "@/components/common/FileAttachments";

const EQUIPMENT_ATTACHMENT_TYPES = ["Manual", "Diagrama Elétrico", "Foto", "Procedimento", "Outro"];

const TECHNOLOGIES = ["Mecânica", "Elétrica", "Pneumática", "Hidráulica", "Automação", "Instrumentação", "Refrigeração", "Civil"];
const CRITICALITIES = ["A - Crítico", "B - Importante", "C - Normal"];
const STATUSES = ["Operando", "Parado", "Em Manutenção", "Desativado"];

export default function EquipmentForm({ open, onClose, onSave, equipment, defaultTag }) {
  const [form, setForm] = useState(equipment || {
    tag: defaultTag || "",
    name: "",
    technology: "",
    sector: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    installation_date: "",
    criticality: "",
    status: "Operando",
    notes: "",
    attachments: [],
  });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipment ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tag *</Label>
            <Input value={form.tag} onChange={e => update("tag", e.target.value.toUpperCase())} placeholder="TAG-001" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Nome do equipamento" />
          </div>
          <div className="space-y-1.5">
            <Label>Tecnologia *</Label>
            <Select value={form.technology} onValueChange={v => update("technology", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {TECHNOLOGIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Setor</Label>
            <Input value={form.sector} onChange={e => update("sector", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fabricante</Label>
            <Input value={form.manufacturer} onChange={e => update("manufacturer", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Input value={form.model} onChange={e => update("model", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nº Série</Label>
            <Input value={form.serial_number} onChange={e => update("serial_number", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data Instalação</Label>
            <Input type="date" value={form.installation_date} onChange={e => update("installation_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Criticidade</Label>
            <Select value={form.criticality} onValueChange={v => update("criticality", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {CRITICALITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
          </div>
          <div className="col-span-2">
            <Separator className="my-2" />
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="w-4 h-4 text-slate-500" />
              <Label className="text-sm font-semibold text-slate-700">Anexos (Manuais, Diagramas, Fotos)</Label>
            </div>
            <FileAttachments
              attachments={form.attachments || []}
              onChange={(files) => update("attachments", files)}
              typeOptions={EQUIPMENT_ATTACHMENT_TYPES}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.tag || !form.name || !form.technology}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}