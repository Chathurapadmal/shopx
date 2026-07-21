import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "plu" })
export class Plu {
  @PrimaryColumn({ name: "plu_code", type: "varchar2", length: 255 })
  pluCode!: string;

  @Column({ name: "plu_name", type: "varchar2", length: 255, nullable: true })
  pluName?: string;

  @Column({ name: "default_price", type: "number", nullable: true })
  defaultPrice?: number;

  @Column({ name: "vip_price", type: "number", nullable: true })
  vipPrice?: number;

  @Column({ name: "department", type: "number", nullable: true })
  department?: number;

  @Column({ name: "stock", type: "number", nullable: true })
  stock?: number;

  @Column({ name: "bottom_stock", type: "number", nullable: true })
  bottomStock?: number;

  @Column({ name: "purchase_price", type: "number", nullable: true })
  purchasePrice?: number;

  @Column({ name: "cost_price", type: "number", nullable: true })
  costPrice?: number;

  @Column({ name: "commission", type: "number", nullable: true })
  commission?: number;

  @Column({ name: "tax_rate", type: "number", nullable: true })
  taxRate?: number;

  @Column({ name: "valid1_yes_2_no_3_special_price", type: "number", nullable: true })
  valid?: number;

  @Column({ name: "barcode_print1_yes_2_no", type: "number", nullable: true })
  barcodePrint?: number;

  @Column({ name: "large_price", type: "number", nullable: true })
  largePrice?: number;

  @Column({ name: "medium_price", type: "number", nullable: true })
  mediumPrice?: number;

  @Column({ name: "kitchen_print", type: "number", nullable: true })
  kitchenPrint?: number;

  @Column({ name: "special_price", type: "number", nullable: true })
  specialPrice?: number;

  @Column({ name: "kitchen_name", type: "varchar2", length: 255, nullable: true })
  kitchenName?: string;

  @Column({ name: "shop_id", type: "varchar2", length: 64, nullable: true })
  shopId?: string;

  @Column({ name: "modified_by", type: "varchar2", length: 255, nullable: true })
  modifiedBy?: string;

  @Column({ name: "modified_at", type: "varchar2", length: 30, nullable: true })
  modifiedAt?: string;
}
