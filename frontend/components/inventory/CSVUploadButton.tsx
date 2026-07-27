"use client";

import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CSVUploadButton() {
  const [uploaded, setUploaded] = useState(false);

  const handleClick = () => {
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  };

  if (uploaded) {
    return (
      <Button variant="secondary" size="md" disabled>
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        Archivo cargado correctamente
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="md" onClick={handleClick}>
      <Upload className="w-4 h-4" />
      Simular Carga CSV
    </Button>
  );
}
