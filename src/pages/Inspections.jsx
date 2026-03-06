import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, CheckCircle2, XCircle, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const INSPECTION_TYPES = ["Visual", "Funcional", "Segurança", "Lubrificação", "Completa"];
const RESULTS = ["Aprovado", "Reprovado", "Com Ressalvas"];

const DEFAULT_CHECKLIST = [
  { item: "Estado geral do equipamento", ok: false, observation: "" },
  { item: "Nível de vibração", ok: false, observation: "" },
  { item: "Temperatura de operação", ok: false, observation: "" },
  { item: "Ruídos anormais", ok: false, observation: "" },
  { item: "Vazamentos", ok: false, observation: "" },
  { item: "Fixações e parafusos", ok: false, observation: "" },
];

function InspectionForm({ open, onClose, onSave, equipments, inspection, preselectedEquipmentId }) {
  const [form, setForm] = useState(inspection || {
    equipment_id: preselectedEquipmentId || "",
    type: "Visual",
    result: "Aprovado",
    inspector: "",
    inspection_date: new Date().toISOString().slice(0, 16),
    observations: "",
    checklist: DEFAULT_CHECKLIST,
    requires_work_order: false,
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleEquipChange = (eqId) => {
    const eq = equipments.find(e => e.id === eqId);
    if (eq) {
      setForm(prev => ({ ...prev, equipment_id: eqId, equipment_tag: eq.tag, equipment_name: eq.name }));
    }
  };

  const updateChecklist = (index, field, value) => {
    const newChecklist = [...form.checklist];
    newChecklist[index] = { ...newChecklist[index], [field]: value };
    update("checklist", newChecklist);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inspection ? "Editar Inspeção" : "Nova Inspeção"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Equipamento *</Label>
            <Select value={form.equipment_id} onValueChange={handleEquipChange}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {equipments.map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.tag} - {eq.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de Inspeção *</Label>
            <Select value={form.type} onValueChange={v => update("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INSPECTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Inspetor</Label>
            <Input value={form.inspector} onChange={e => update("inspector", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data/Hora</Label>
            <Input type="datetime-local" value={form.inspection_date} onChange={e => update("inspection_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Resultado *</Label>
            <Select value={form.result} onValueChange={v => update("result", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.requires_work_order} onCheckedChange={v => update("requires_work_order", v)} />
              Requer abertura de OS
            </label>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <Label className="text-base font-semibold">Checklist</Label>
          {form.checklist.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
              <Checkbox
                checked={item.ok}
                onCheckedChange={v => updateChecklist(idx, "ok", v)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.item}</p>
                <Input
                  placeholder="Observação..."
                  value={item.observation}
                  onChange={e => updateChecklist(idx, "observation", e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mt-2">
          <Label>Observações Gerais</Label>
          <Textarea value={form.observations} onChange={e => update("observations", e.target.value)} rows={3} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.equipment_id || !form.type || !form.result}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Inspections() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedEquipmentId = urlParams.get("equipmentId");

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["inspections"],
    queryFn: () => base44.entities.Inspection.list("-created_date"),
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: () => base44.entities.Equipment.list(),
  });

  useEffect(() => {
    if (preselectedEquipmentId && equipments.length > 0) {
      setShowForm(true);
    }
  }, [preselectedEquipmentId, equipments.length]);

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Inspection.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inspections"] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Inspection.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inspections"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Inspection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });

  const resultIcons = {
    "Aprovado": <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    "Reprovado": <XCircle className="w-4 h-4 text-red-500" />,
    "Com Ressalvas": <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  };

  const resultColors = {
    "Aprovado": "bg-emerald-100 text-emerald-700",
    "Reprovado": "bg-red-100 text-red-700",
    "Com Ressalvas": "bg-yellow-100 text-yellow-700",
  };

  const filtered = inspections.filter(i =>
    i.equipment_tag?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por tag ou inspetor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white" />
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Nova Inspeção
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Equipamento</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Resultado</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Inspetor</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Data</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ins => (
                <TableRow key={ins.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <span className="font-mono text-sm text-orange-600">{ins.equipment_tag}</span>
                    <p className="text-xs text-slate-400">{ins.equipment_name}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{ins.type}</Badge></TableCell>
                  <TableCell>
                    <Badge className={`${resultColors[ins.result]} gap-1`}>
                      {resultIcons[ins.result]} {ins.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{ins.inspector || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                    {ins.inspection_date ? format(new Date(ins.inspection_date), "dd/MM/yy HH:mm") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(ins)}>
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(ins.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    {isLoading ? "Carregando..." : "Nenhuma inspeção encontrada"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showForm && (
        <InspectionForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMut.mutate(data)}
          equipments={equipments}
          preselectedEquipmentId={preselectedEquipmentId}
        />
      )}

      {editing && (
        <InspectionForm
          open={!!editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMut.mutate({ id: editing.id, data })}
          equipments={equipments}
          inspection={editing}
        />
      )}
    </div>
  );
}