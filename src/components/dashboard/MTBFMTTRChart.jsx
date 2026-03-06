import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function MTBFMTTRChart({ workOrders, equipments }) {
  const data = equipments.map(eq => {
    const eqOrders = workOrders.filter(wo => wo.equipment_id === eq.id && wo.status === "Concluída");
    const totalDowntime = eqOrders.reduce((sum, wo) => sum + (wo.downtime_hours || 0), 0);
    const totalRepair = eqOrders.reduce((sum, wo) => sum + (wo.repair_hours || 0), 0);
    const failures = eqOrders.filter(wo => wo.type === "Corretiva").length;
    
    // MTBF = Total operating time / number of failures
    // Simplified: assuming 720h/month operating, minus downtime
    const operatingHours = 720 - totalDowntime;
    const mtbf = failures > 0 ? Math.round(operatingHours / failures) : 720;
    const mttr = failures > 0 ? Math.round(totalRepair / failures * 10) / 10 : 0;

    return {
      name: eq.tag || eq.name,
      MTBF: mtbf,
      MTTR: mttr,
    };
  }).filter(d => d.MTTR > 0).slice(0, 10);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">MTBF / MTTR por Equipamento</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="MTBF" fill="#3b82f6" radius={[4, 4, 0, 0]} name="MTBF (h)" />
              <Bar dataKey="MTTR" fill="#f97316" radius={[4, 4, 0, 0]} name="MTTR (h)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            Sem dados de manutenção concluída
          </div>
        )}
      </CardContent>
    </Card>
  );
}