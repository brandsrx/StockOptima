import SupplierNode from "./SupplierNode";
import ProductNode from "./ProductNode";
import WarehouseNode from "./WarehouseNode";
import ReorderNode from "./ReorderNode";
import OrderNode from "./OrderNode";

export const nodeTypes = {
  supplier: SupplierNode,
  product: ProductNode,
  warehouse: WarehouseNode,
  reorder: ReorderNode,
  order: OrderNode,
};

export type { SupplierNodeData } from "./SupplierNode";
export type { ProductNodeData } from "./ProductNode";
export type { WarehouseNodeData } from "./WarehouseNode";
export type { ReorderNodeData } from "./ReorderNode";
export type { OrderNodeData } from "./OrderNode";
