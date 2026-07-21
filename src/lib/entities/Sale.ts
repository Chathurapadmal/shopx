import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "sales" })
export class Sale {
  @PrimaryColumn({ name: "id", type: "varchar2", length: 64 })
  id!: string;

  @Column({ name: "receipt_number", type: "varchar2", length: 100, nullable: true })
  receiptNumber?: string;

  @Column({ name: "items_json", type: "clob", nullable: true })
  itemsJson?: string;

  @Column({ name: "subtotal", type: "number", nullable: true })
  subtotal?: number;

  @Column({ name: "tax", type: "number", nullable: true })
  tax?: number;

  @Column({ name: "discount", type: "number", nullable: true })
  discount?: number;

  @Column({ name: "total", type: "number", nullable: true })
  total?: number;

  @Column({ name: "payment_method", type: "varchar2", length: 20, nullable: true })
  paymentMethod?: string;

  @Column({ name: "customer_id", type: "varchar2", length: 255, nullable: true })
  customerId?: string;

  @Column({ name: "customer_name", type: "varchar2", length: 255, nullable: true })
  customerName?: string;

  @Column({ name: "cashier_id", type: "varchar2", length: 255, nullable: true })
  cashierId?: string;

  @Column({ name: "cashier_name", type: "varchar2", length: 255, nullable: true })
  cashierName?: string;

  @Column({ name: "created_at", type: "varchar2", length: 30, nullable: true })
  createdAt?: string;

  @Column({ name: "shop_id", type: "varchar2", length: 64, nullable: true })
  shopId?: string;
}
