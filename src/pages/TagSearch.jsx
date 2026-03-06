import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, QrCode, ClipboardList, Calendar, ClipboardCheck,
  Monitor, ArrowRight, FileText, Image, ExternalLink, Paperclip, Camera
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import QRScanner from "@/components/common/QRScanner";

export default function TagSearch() {
  const [tagInput, setTagInput] = useState("");
  const [equipment, setEquipment] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (tag) => {
    const value = (tag || tagInput).trim();
    if (!value) return;
    setTagInput(value);
    setSearching(true);
    setNotFound(false);
    setEquipment(null);

    const results = await base44.entities.Equipment.filter({ tag: value });
    if (results.length > 0) {
      setEquipment(results[0]);
    } else {
      setNotFound(true);
    }
    setSearching(false);
  };

  const handleScan = (value) => {
    setShowScanner(false);
    handleSearch(value);
  };

  const statusColors = {
    "Operando": "bg-emerald-100 text-emerald-700",
    "Parado": "bg-red-100 text-red-700",
    "Em Manutenção": "bg-orange-100 text-orange-700",
    "Desativado": "bg-slate-100 text-slate-700",
  };

  const attachmentTypeColors = {
    "Manual": "bg-blue-100 text-blue-700",
    "Diagrama Elétrico": "bg-yellow-100 text-yellow-700",
    "Foto": "bg-emerald-100 text-emerald-700",
    "Procedimento": "bg-purple-100 text-purple-700",
    "Outro": "bg-slate-100 text-slate-600",
  };

  const getAttachmentIcon = (att) => {
    const isImage = att.url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || att.name?.match(/\.(jpg|jpeg|png|gif|webp)/i);
    return isImage
      ? <Image className="w-4 h-4 text-blue-500" />
      : <FileText className="w-4 h-4 text-orange-500" />;
  };

  return (
    <>
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Search Section */}
        <div className="text-center space-y-4 pt-8">
          <div className="inline-flex p-4 rounded-2xl bg-orange-500/10 mb-2">
            <QrCode className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Buscar por Tag</h1>
          <p className="text-slate-500 text-sm">Digite, escaneie ou fotografe a tag do equipamento</p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ex: CMP-001"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 text-lg font-mono bg-white border-slate-200"
          />
          <Button
            variant="outline"
            onClick={() => setShowScanner(true)}
            className="h-12 px-4 border-orange-300 text-orange-600 hover:bg-orange-50"
            title="Escanear QR Code / Código de Barras"
          >
            <Camera className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => handleSearch()}
            disabled={searching}
            className="h-12 px-6 bg-orange-500 hover:bg-orange-600"
          >
            {searching ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
        </div>

        {notFound && (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum equipamento encontrado com esta tag.</p>
            <Button
              variant="link"
              className="text-orange-500 mt-2"
              onClick={() => navigate(createPageUrl("Equipments") + "?newTag=" + tagInput)}
            >
              Cadastrar novo equipamento
            </Button>
          </div>
        )}

        {equipment && (
          <Card className="border-0 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-orange-400" />
                <span className="font-mono text-white font-bold text-lg">{equipment.tag}</span>
              </div>
              <Badge className={statusColors[equipment.status] || "bg-slate-100"}>
                {equipment.status}
              </Badge>
            </div>

            <CardContent className="p-6 space-y-5">
              {/* Equipment Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Nome</p>
                  <p className="font-semibold text-slate-800 mt-1">{equipment.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Tecnologia</p>
                  <p className="font-semibold text-slate-800 mt-1">{equipment.technology}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Setor</p>
                  <p className="font-semibold text-slate-800 mt-1">{equipment.sector || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Criticidade</p>
                  <p className="font-semibold text-slate-800 mt-1">{equipment.criticality || "-"}</p>
                </div>
                {equipment.manufacturer && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Fabricante</p>
                    <p className="font-semibold text-slate-800 mt-1">{equipment.manufacturer}</p>
                  </div>
                )}
                {equipment.model && (
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Modelo</p>
                    <p className="font-semibold text-slate-800 mt-1">{equipment.model}</p>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {equipment.attachments?.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-700">
                        Documentos & Fotos ({equipment.attachments.length})
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {equipment.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
                        >
                          {getAttachmentIcon(att)}
                          <span className="flex-1 text-sm font-medium text-slate-700 truncate">{att.name}</span>
                          <Badge className={`text-xs shrink-0 ${attachmentTypeColors[att.type] || "bg-slate-100"}`}>
                            {att.type}
                          </Badge>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white gap-2 h-12"
                  onClick={() => navigate(createPageUrl("WorkOrders") + "?equipmentId=" + equipment.id)}
                >
                  <ClipboardList className="w-4 h-4" />
                  Abrir OS
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2 h-12"
                  onClick={() => navigate(createPageUrl("PreventiveCalendar") + "?equipmentId=" + equipment.id)}
                >
                  <Calendar className="w-4 h-4" />
                  Preventiva
                </Button>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-12"
                  onClick={() => navigate(createPageUrl("Inspections") + "?equipmentId=" + equipment.id)}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Inspeção
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full text-slate-500 gap-2"
                onClick={() => navigate(createPageUrl("EquipmentHistory") + "?id=" + equipment.id)}
              >
                Ver Histórico Completo <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}