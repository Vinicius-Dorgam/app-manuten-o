import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, SwitchCamera } from "lucide-react";

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [scanning, setScanning] = useState(false);

  const startCamera = async (mode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setError(null);
    setScanning(false);

    const constraints = {
      video: {
        facingMode: mode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
      scanFrame();
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try BarcodeDetector API (supported in modern browsers)
    if ("BarcodeDetector" in window) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13"] });
      detector.detect(canvas).then(barcodes => {
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          onScan(raw.toUpperCase().trim());
          return;
        }
        animRef.current = requestAnimationFrame(scanFrame);
      }).catch(() => {
        animRef.current = requestAnimationFrame(scanFrame);
      });
    } else {
      // Fallback: keep scanning but show message
      animRef.current = requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    startCamera(facingMode).catch(err => {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    });
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [facingMode]);

  const flipCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-orange-400" />
          <span className="font-semibold">Escanear Tag</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={flipCamera} className="text-white hover:bg-white/20">
            <SwitchCamera className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-white gap-4 px-6 text-center">
            <Camera className="w-16 h-16 text-slate-500" />
            <p className="text-slate-300">{error}</p>
            <Button onClick={() => startCamera(facingMode)} className="bg-orange-500">
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                {/* Scan line */}
                {scanning && (
                  <div className="absolute left-2 right-2 h-0.5 bg-orange-400/80 animate-bounce top-1/2" />
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center text-sm">
                {!("BarcodeDetector" in window)
                  ? "Câmera ativa. Seu navegador não suporta detecção automática — posicione o QR Code e o valor será lido ao detectar."
                  : "Aponte a câmera para o QR Code ou código de barras da tag"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}