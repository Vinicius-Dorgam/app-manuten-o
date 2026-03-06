import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Image, Trash2, ExternalLink, Loader2, Paperclip } from "lucide-react";

export default function FileAttachments({ attachments = [], onChange, typeOptions }) {
  const [uploading, setUploading] = useState(false);
  const [pendingType, setPendingType] = useState(typeOptions[0]);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    const newAttachments = [...attachments];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newAttachments.push({
        name: file.name,
        url: file_url,
        type: pendingType,
        uploaded_at: new Date().toISOString(),
      });
    }
    onChange(newAttachments);
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  };

  const getIcon = (att) => {
    const isImage = att.url?.match(/\.(jpg|jpeg|png|gif|webp)/i) || att.name?.match(/\.(jpg|jpeg|png|gif|webp)/i);
    if (isImage) return <Image className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-orange-500" />;
  };

  const typeColors = {
    "Manual": "bg-blue-100 text-blue-700",
    "Diagrama Elétrico": "bg-yellow-100 text-yellow-700",
    "Foto": "bg-emerald-100 text-emerald-700",
    "Procedimento": "bg-purple-100 text-purple-700",
    "Foto Antes": "bg-orange-100 text-orange-700",
    "Foto Depois": "bg-emerald-100 text-emerald-700",
    "Foto Reparo": "bg-blue-100 text-blue-700",
    "Relatório": "bg-slate-100 text-slate-700",
    "Outro": "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-3">
      {/* Upload Controls */}
      <div className="flex gap-2 flex-wrap">
        <Select value={pendingType} onValueChange={setPendingType}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 h-9"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          ) : (
            <><Upload className="w-4 h-4" /> Anexar Arquivo</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 group"
            >
              {getIcon(att)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{att.name}</p>
              </div>
              <Badge className={`text-xs shrink-0 ${typeColors[att.type] || "bg-slate-100"}`}>
                {att.type}
              </Badge>
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-500 transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-sm">
          <Paperclip className="w-4 h-4" />
          Nenhum arquivo anexado
        </div>
      )}
    </div>
  );
}