import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, ClipboardCheck, Monitor, Clock, FileText, Image, ExternalLink, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function EquipmentHistory() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const equipmentId = urlParams.get("id");

  const { data: equipment } = useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: async () => {
      const list = await base44.entities.Equipment.filter({ id: equipmentId });
      return list[0] || null;
    },
    enabled: !!equipmentId,
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["workOrders-history", equipmentId],
    queryFn: () => base44.entities.WorkOrder.filter({ equipment_id: equipmentId }, "-created_date"),
    enabled: !!equipmentId,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections-history", equipmentId],
    queryFn: () => base44.entities.Inspection.filter({ equipment_id: equipmentId }, "-created_date"),
    enabled: !!equipmentId,
  });

  if (!equipment) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Equipamento não encontrado
      </div>
    );
  }

  // Build timeline
  const timeline = [
    ...workOrders.map(wo => ({
      type: "os",
      date: wo.open_date || wo.created_date,
      title: `OS ${wo.order_number || ""} - ${wo.type}`,
      description: wo.description,
      status: wo.status,
      downtime: wo.downtime_hours,
      data: wo,
    })),
    ...inspections.map(ins => ({
      type: "inspection",
      date: ins.inspection_date || ins.created_date,
      title: `Inspeção ${ins.type}`,
      description: ins.observations,
      status: ins.result,
      data: ins,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDowntime = workOrders.reduce((sum, wo) => sum + (wo.downtime_hours || 0), 0);
  const totalCorrectivas = workOrders.filter(wo => wo.type === "Corretiva").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-slate-500">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Equipment Header */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/20">
            <Monitor className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{equipment.tag} - {equipment.name}</h1>
            <p className="text-slate-400 text-sm">{equipment.technology} • {equipment.sector || "Sem setor"}</p>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-2xl font-bold text-slate-800">{workOrders.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total de OS</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <p className="text-2xl font-bold text-red-600">{totalCorrectivas}</p>
              <p className="text-xs text-slate-500 mt-1">Corretivas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50">
              <p className="text-2xl font-bold text-orange-600">{Math.round(totalDowntime)}h</p>
              <p className="text-xs text-slate-500 mt-1">Parada Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{inspections.length}</p>
              <p className="text-xs text-slate-500 mt-1">Inspeções</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Attachments */}
      {equipment.attachments?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Documentos & Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {equipment.attachments.map((att, idx) => {
                const isImage = att.url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || att.name?.match(/\.(jpg|jpeg|png|gif|webp)/i);
                return (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                  >
                    {isImage
                      ? <Image className="w-4 h-4 text-blue-500" />
                      : <FileText className="w-4 h-4 text-orange-500" />
                    }
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">{att.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{att.type}</span>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-700">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {timeline.map((event, idx) => (
              <div key={idx} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    event.type === "os" ? "bg-blue-100" : "bg-emerald-100"
                  }`}>
                    {event.type === "os"
                      ? <Wrench className="w-4 h-4 text-blue-600" />
                      : <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    }
                  </div>
                  {idx < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{event.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {event.date ? format(new Date(event.date), "dd/MM/yyyy HH:mm") : "-"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{event.status}</Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-500 mt-2">{event.description}</p>
                  )}
                  {event.downtime > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                      <Clock className="w-3 h-3" /> {event.downtime}h de parada
                    </div>
                  )}
                </div>
              </div>
            ))}

            {timeline.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Nenhum registro encontrado para este equipamento
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}