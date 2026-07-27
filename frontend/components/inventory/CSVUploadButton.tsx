"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadInventoryFile } from "@/services/apiService";

interface CSVUploadButtonProps {
  onUploadComplete?: () => void;
}

export function CSVUploadButton({ onUploadComplete }: CSVUploadButtonProps) {
  const [state, setState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("uploading");
    try {
      const result = await uploadInventoryFile(file);
      setState("success");
      setMessage(`${result.total_productos} productos procesados`);
      onUploadComplete?.();
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Error al subir archivo");
      setTimeout(() => setState("idle"), 4000);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  if (state === "success") {
    return (
      <Button variant="secondary" size="md" disabled>
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        {message}
      </Button>
    );
  }

  if (state === "error") {
    return (
      <Button variant="secondary" size="md" disabled>
        <AlertTriangle className="w-4 h-4 text-red-500" />
        {message}
      </Button>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="secondary"
        size="md"
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
      >
        <Upload className="w-4 h-4" />
        {state === "uploading" ? "Subiendo..." : "Subir CSV / Excel"}
      </Button>
    </>
  );
}
