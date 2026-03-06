import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TECHNOLOGIES = ["Mecânica", "Elétrica", "Pneumática", "Hidráulica", "Automação", "Instrumentação", "Refrigeração", "Civil"];

function PlanForm({ open, onClose, onSave, equipments, plan }) {
  const [form, setForm] = useState(plan || {
    equipment_id: "",
    title: "",
    description: "",
    frequency_weeks: 4,
    technology: "",
    assigned_to: "",
    estimated_hours: 0,
    status: "Ativa",
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleEquipChange = (eqId) => {
    const eq = equipments.find(e => e.id === eqId);
    if (eq) {
      setForm(prev => ({ ...prev, equipment_id: eqId, equipment_tag: eq.tag, equipment_name: eq.name, technology: eq.technology || prev.technology }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const freq = form.frequency_weeks || 4;
    const weeks = [];
    for (let w = freq; w <= 52; w += freq) weeks.push(w);
    await onSave({ ...form, scheduled_weeks: weeks });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano" : "Novo Plano Preventivo"}</DialogTitle>
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
            <Label>Frequência (semanas) *</Label>
            <Input type="number" min={1} max={52} value={form.frequency_weeks} onChange={e => update("frequency_weeks", parseInt(e.target.value) || 1)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Tecnologia</Label>
            <Select value={form.technology} onValueChange={v => update("technology", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{TECHNOLOGIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Input value={form.assigned_to} onChange={e => update("assigned_to", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Horas Estimadas</Label>
            <Input type="number" step="0.5" value={form.estimated_hours} onChange={e => update("estimated_hours", parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.equipment_id || !form.title}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PreventiveCalendar() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedEquipmentId = urlParams.get("equipmentId");

  const { data: plans = [] } = useQuery({
    queryKey: ["preventivePlans"],
    queryFn: () => base44.entities.PreventivePlan.list("-created_date"),
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.PreventivePlan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["preventivePlans"] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PreventivePlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["preventivePlans"] }); setEditing(null); },
  });

  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
  const activePlans = plans.filter(p => p.status === "Ativa");

  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500",
    "bg-pink-500", "bg-cyan-500", "bg-yellow-500", "bg-red-500",
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{activePlans.length} planos ativos • Calendário de 52 semanas</p>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Novo Plano
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {activePlans.map((plan, idx) => (
          <button
            key={plan.id}
            onClick={() => setEditing(plan)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border hover:shadow-sm transition-shadow text-sm"
          >
            <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
            <span className="font-medium">{plan.equipment_tag}</span>
            <span className="text-slate-400">{plan.title}</span>
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Week headers */}
              <div className="flex gap-[2px] mb-2">
                <div className="w-32 shrink-0 text-xs font-semibold text-slate-400 px-2">Plano</div>
                {weeks.map(w => (
                  <div key={w} className="flex-1 min-w-[16px] text-[10px] text-center text-slate-400 font-medium">
                    {w % 4 === 0 ? w : ""}
                  </div>
                ))}
              </div>

              {/* Plan rows */}
              {activePlans.map((plan, idx) => (
                <div key={plan.id} className="flex gap-[2px] mb-[2px]">
                  <div className="w-32 shrink-0 px-2 py-1 text-xs font-medium text-slate-700 truncate">
                    {plan.equipment_tag}
                  </div>
                  {weeks.map(w => {
                    const isScheduled = plan.scheduled_weeks?.includes(w);
                    return (
                      <div
                        key={w}
                        className={`flex-1 min-w-[16px] h-7 rounded-sm transition-colors ${
                          isScheduled
                            ? `${colors[idx % colors.length]} opacity-80 hover:opacity-100`
                            : "bg-slate-100 hover:bg-slate-200"
                        }`}
                        title={isScheduled ? `Semana ${w} - ${plan.title}` : `Semana ${w}`}
                      />
                    );
                  })}
                </div>
              ))}

              {activePlans.length === 0 && (
                <div className="text-center py-16 text-slate-400 text-sm">
                  Nenhum plano preventivo cadastrado
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <PlanForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMut.mutate(data)}
          equipments={equipments}
          plan={preselectedEquipmentId ? { equipment_id: preselectedEquipmentId } : null}
        />
      )}

      {editing && (
        <PlanForm
          open={!!editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMut.mutate({ id: editing.id, data })}
          equipments={equipments}
          plan={editing}
        />
      )}
    </div>
  );
}