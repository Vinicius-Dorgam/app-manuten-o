import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle, Clock, Wrench, Monitor } from "lucide-react";
import KPICard from "../components/dashboard/KPICard";
import MTBFMTTRChart from "../components/dashboard/MTBFMTTRChart";
import BreakdownByTechChart from "../components/dashboard/BreakdownByTechChart";
import DowntimeChart from "../components/dashboard/DowntimeChart";
import OrdersByStatusChart from "../components/dashboard/OrdersByStatusChart";

export default function Dashboard() {
  const { data: workOrders = [] } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => base44.entities.WorkOrder.list("-created_date", 500),
    staleTime: 30000,
    gcTime: 60000,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: () => base44.entities.Equipment.list(),
    staleTime: 60000,
    gcTime: 120000,
  });

  const openOrders = workOrders.filter(wo => wo.status === "Aberta" || wo.status === "Em Andamento");
  const completedOrders = workOrders.filter(wo => wo.status === "Concluída");
  const correctiveOrders = workOrders.filter(wo => wo.type === "Corretiva");
  const totalDowntime = workOrders.reduce((sum, wo) => sum + (wo.downtime_hours || 0), 0);
  const totalRepair = completedOrders.reduce((sum, wo) => sum + (wo.repair_hours || 0), 0);
  const avgMTTR = correctiveOrders.length > 0 ? (totalRepair / correctiveOrders.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <KPICard title="Equipamentos" value={equipments.length} icon={Monitor} color="blue" />
        <KPICard title="OS Abertas" value={openOrders.length} icon={AlertTriangle} color="orange" />
        <KPICard title="OS Concluídas" value={completedOrders.length} icon={CheckCircle} color="green" />
        <KPICard title="Corretivas" value={correctiveOrders.length} icon={Wrench} color="red" />
        <KPICard title="MTTR Médio" value={avgMTTR} unit="h" icon={Clock} color="purple" />
        <KPICard title="Parada Total" value={Math.round(totalDowntime)} unit="h" icon={Activity} color="slate" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MTBFMTTRChart workOrders={workOrders} equipments={equipments} />
        <BreakdownByTechChart workOrders={workOrders} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DowntimeChart workOrders={workOrders} equipments={equipments} />
        <OrdersByStatusChart workOrders={workOrders} />
      </div>
    </div>
  );
}