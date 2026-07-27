import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface ReorderAlertProps {
  currentStock: number;
  reorderPoint: number;
  productName: string;
}

export function ReorderAlert({
  currentStock,
  reorderPoint,
  productName,
}: ReorderAlertProps) {
  if (currentStock > reorderPoint) return null;

  const deficit = reorderPoint - currentStock;
  const isCritical = currentStock <= reorderPoint * 0.5;

  return (
    <Card
      className={`border ${
        isCritical
          ? "border-red-200 bg-red-50/50"
          : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <CardContent>
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
              isCritical ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${
                isCritical ? "text-red-600" : "text-amber-600"
              }`}
            />
          </div>
          <div>
            <h4
              className={`text-sm font-semibold ${
                isCritical ? "text-red-800" : "text-amber-800"
              }`}
            >
              {isCritical ? "Stock Crítico" : "Stock en Punto de Reorden"}
            </h4>
            <p
              className={`text-sm mt-0.5 ${
                isCritical ? "text-red-700" : "text-amber-700"
              }`}
            >
              <span className="font-medium">{productName}</span> tiene{" "}
              <span className="font-bold">{currentStock}</span> unidades
              disponibles. El punto de reorden es{" "}
              <span className="font-bold">{reorderPoint}</span>.
              {deficit > 0 && (
                <>
                  {" "}
                  Faltan{" "}
                  <span className="font-bold">{deficit}</span> unidades para
                  alcanzar el nivel mínimo.
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
