import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DowntimeChart({ workOrders, equipments }) {
  const downtimeByEquip = {};
  workOrders.forEach(wo => {
    if (wo.downtime_hours && wo.downtime_hours > 0) {
      const key = wo.equipment_tag || wo.equipment_id;
      downtimeByEquip[key] = (downtimeByEquip[key] || 0) + wo.downtime_hours;
    }
  });

  const data = Object.entries(downtimeByEquip)
    .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Tempo de Parada por Máquina (h)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="hours" fill="#ef4444" radius={[0, 4, 4, 0]} name="Horas Parado" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            Sem dados de parada
          </div>
        )}
      </CardContent>
    </Card>
  );
}