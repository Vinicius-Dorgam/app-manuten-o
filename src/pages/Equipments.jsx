import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import EquipmentForm from "../components/equipment/EquipmentForm";

export default function Equipments() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const defaultTag = urlParams.get("newTag") || "";

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ["equipments"],
    queryFn: () => base44.entities.Equipment.list("-created_date"),
    staleTime: 60000,
    gcTime: 120000,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipments"] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["equipments"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipments"] }),
  });

  const filtered = equipments.filter(eq =>
    (eq.tag?.toLowerCase().includes(search.toLowerCase())) ||
    (eq.name?.toLowerCase().includes(search.toLowerCase())) ||
    (eq.sector?.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColors = {
    "Operando": "bg-emerald-100 text-emerald-700",
    "Parado": "bg-red-100 text-red-700",
    "Em Manutenção": "bg-orange-100 text-orange-700",
    "Desativado": "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por tag, nome ou setor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Novo Equipamento
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Tag</TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Tecnologia</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Setor</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Criticidade</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(eq => (
                <TableRow key={eq.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono font-bold text-slate-800">{eq.tag}</TableCell>
                  <TableCell>{eq.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{eq.technology}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{eq.sector || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{eq.criticality || "-"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[eq.status] || "bg-slate-100"}>{eq.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(eq)}>
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(eq.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    {isLoading ? "Carregando..." : "Nenhum equipamento encontrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showForm && (
        <EquipmentForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSave={(data) => createMut.mutate(data)}
          defaultTag={defaultTag}
        />
      )}

      {editing && (
        <EquipmentForm
          open={!!editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMut.mutate({ id: editing.id, data })}
          equipment={editing}
        />
      )}
    </div>
  );
}