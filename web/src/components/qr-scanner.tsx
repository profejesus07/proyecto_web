"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

/** El QR de la constancia lleva la dirección de verificación; de ella solo se toma el código. */
const CODE_IN_TEXT = /UMB-[A-Z2-9]{4}-[A-Z2-9]{4}/;

type Decoder = (source: ImageData) => string | null;

/** Lector de QR (jsQR): la librería se descarga solo cuando alguien escanea. */
async function makeDecoder(): Promise<Decoder> {
  const { default: jsQR } = await import("jsqr");
  return (img) => jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

/**
 * Verifica una constancia escaneando su código QR con la cámara, o subiendo una foto o captura
 * del QR. Al leer un código válido lleva a /verificar/CÓDIGO; nunca abre otras direcciones.
 */
export function QrScanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setScanning(false);
  };
  useEffect(() => stop, []);

  function found(text: string | null): boolean {
    const code = text?.toUpperCase().match(CODE_IN_TEXT)?.[0];
    if (!code) return false;
    stop();
    setStatus({ tone: "info", text: `Código leído: ${code}. Verificando…` });
    router.push(`/verificar/${code}`);
    return true;
  }

  async function start() {
    setStatus(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ tone: "error", text: "Este navegador no permite usar la cámara. Sube una foto del código QR o escribe el código." });
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch {
      setStatus({ tone: "error", text: "No pudimos abrir la cámara. Revisa el permiso del navegador, o sube una foto del código QR." });
      return;
    }
    setScanning(true);
    const decode = await makeDecoder();
    const v = video.current!;
    v.srcObject = stream.current;
    await v.play().catch(() => {});
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const tick = () => {
      if (!stream.current) return;
      if (v.readyState >= 2 && v.videoWidth) {
        // Se lee a un tamaño moderado: más rápido y suficiente para un QR.
        const scale = Math.min(1, 640 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const text = decode(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (text && found(text)) return;
        if (text) setStatus({ tone: "error", text: "Ese código QR no es de una constancia de la Academia Virtual Umbral." });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function fromFile(file: File | undefined) {
    if (!file) return;
    setStatus({ tone: "info", text: "Leyendo la imagen…" });
    try {
      const [decode, bitmap] = await Promise.all([makeDecoder(), createImageBitmap(file)]);
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const text = decode(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (!found(text)) setStatus({ tone: "error", text: text ? "Ese código QR no es de una constancia de la Academia Virtual Umbral." : "No encontramos un código QR en la imagen. Prueba con una foto más cercana y nítida." });
    } catch {
      setStatus({ tone: "error", text: "No pudimos leer esa imagen." });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {scanning ? (
          <button type="button" onClick={stop} className="btn btn-secondary"><Icon name="plus" className="size-4 rotate-45" /> Cerrar la cámara</button>
        ) : (
          <button type="button" onClick={start} className="btn btn-primary"><Icon name="camera" className="size-4" /> Escanear con la cámara</button>
        )}
        <label className="btn btn-secondary cursor-pointer">
          <Icon name="qr" className="size-4" /> Subir foto del QR
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void fromFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
      <div className={`relative overflow-hidden rounded-2xl bg-[#15103f] ${scanning ? "" : "hidden"}`}>
        <video ref={video} playsInline muted className="aspect-square w-full object-cover sm:aspect-video" aria-label="Vista de la cámara" />
        {/* Marco guía para centrar el QR. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          <div className="qr-frame size-[min(60%,16rem)] rounded-2xl" />
        </div>
        <p className="absolute inset-x-0 bottom-3 text-center text-sm font-medium text-white/90">Centra el código QR de la constancia en el recuadro</p>
      </div>
      <p aria-live="polite" className={`min-h-5 text-sm ${status?.tone === "error" ? "text-err" : "text-muted"}`}>{status?.text}</p>
    </div>
  );
}
