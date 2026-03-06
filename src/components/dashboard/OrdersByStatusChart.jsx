import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const STATUS_COLORS = {
  "Aberta": "#3b82f6",
  "Em Andamento": "#f97316",
  "Aguardando Peça": "#eab308",
  "Concluída": "#10b981",
  "Cancelada": "#94a3b8",
};

export default function OrdersByStatusChart({ workOrders }) {
  const statusCount = {};
  workOrders.forEach(wo => {
    const s = wo.status || "Aberta";
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  const data = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">OS por Status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
            Sem ordens de serviço
          </div>
        )}
      </CardContent>
    </Card>
  );
}