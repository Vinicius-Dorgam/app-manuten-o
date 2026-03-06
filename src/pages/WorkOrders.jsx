import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WorkOrderForm from "../components/workorder/WorkOrderForm";
import { format } from "date-fns";

const statusColors = {
  "Aberta": "bg-blue-100 text-blue-700",
  "Em Andamento": "bg-orange-100 text-orange-700",
  "Aguardando Peça": "bg-yellow-100 text-yellow-700",
  "Concluída": "bg-emerald-100 text-emerald-700",
  "Cancelada": "bg-slate-100 text-slate-500",
};

const priorityColors = {
  "Baixa": "bg-slate-100 text-slate-600",
  "Média": "bg-blue-100 text-blue-600",
  "Alta": "bg-orange-100 text-orange-600",
  "Urgente": "bg-red-100 text-red-600",
};

export default function WorkOrders() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedEquipmentId = urlParams.get("equipmentId");

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => base44.entities.WorkOrder.list("-created_date"),
    staleTime: 30000,
    gcTime: 60000,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: () => base44.entities.Equipment.list(),
    staleTime: 60000,
    gcTime: 120000,
  });

  useEffect(() => {
    if (preselectedEquipmentId && equipments.length > 0) {
      setShowForm(true);
    }
  }, [preselectedEquipmentId, equipments.length]);

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workOrders"] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["workOrders"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.WorkOrder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workOrders"] }),
  });

  const filtered = workOrders.filter(wo => {
    const matchSearch = search === "" ||
      wo.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.equipment_tag?.toLowerCase().includes(search.toLowerCase()) ||
      wo.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || wo.status === filterStatus;
    const matchType = filterType === "all" || wo.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const defaultWO = preselectedEquipmentId ? {
    equipment_id: preselectedEquipmentId,
    equipment_tag: equipments.find(e => e.id === preselectedEquipmentId)?.tag || "",
    equipment_name: equipments.find(e => e.id === preselectedEquipmentId)?.name || "",
    technology: equipments.find(e => e.id === preselectedEquipmentId)?.technology || "",
    type: "Corretiva",
    priority: "Média",
    status: "Aberta",
    description: "",
    open_date: new Date().toISOString().slice(0, 16),
    downtime_hours: 0,
    repair_hours: 0,
    cost: 0,
  } : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar OS..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="Aberta">Aberta</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Aguardando Peça">Aguardando Peça</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="Corretiva">Corretiva</SelectItem>
              <SelectItem value="Preventiva">Preventiva</SelectItem>
              <SelectItem value="Preditiva">Preditiva</SelectItem>
              <SelectItem value="Melhoria">Melhoria</SelectItem>
              <SelectItem value="Emergencial">Emergencial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Nova OS
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Nº OS</TableHead>
                <TableHead className="font-semibold">Equipamento</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Tipo</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Prioridade</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Data</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(wo => (
                <TableRow key={wo.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono font-bold text-sm">{wo.order_number || "-"}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs text-orange-600">{wo.equipment_tag}</span>
                      <p className="text-sm text-slate-600 truncate max-w-[200px]">{wo.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{wo.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={priorityColors[wo.priority] || "bg-slate-100"}>{wo.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[wo.status] || "bg-slate-100"}>{wo.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                    {wo.open_date ? format(new Date(wo.open_date), "dd/MM/yy") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(wo)}>
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(wo.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    {isLoading ? "Carregando..." : "Nenhuma ordem de serviço encontrada"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showForm && (
        <WorkOrderForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMut.mutate(data)}
          equipments={equipments}
          workOrder={defaultWO}
        />
      )}

      {editing && (
        <WorkOrderForm
          open={!!editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMut.mutate({ id: editing.id, data })}
          equipments={equipments}
          workOrder={editing}
        />
      )}
    </div>
  );
}