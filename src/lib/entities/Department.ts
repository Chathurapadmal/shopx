import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "department" })
export class Department {
  @PrimaryColumn({ name: "INDEX", type: "number" })
  id!: number;

  @Column({ name: "name", type: "varchar2", length: 255, nullable: true })
  name?: string;

  @Column({ name: "discount1_yes_2_no", type: "number", nullable: true })
  discount?: number;

  @Column({ name: "service_fee1_yes_2_no", type: "number", nullable: true })
  serviceFee?: number;

  @Column({ name: "zoom_in_print1_yes_2_no", type: "number", nullable: true })
  zoomInPrint?: number;

  @Column({ name: "stock_manage1_no_2_yes", type: "number", nullable: true })
  stockManage?: number;

  @Column({ name: "department_group", type: "number", nullable: true })
  departmentGroup?: number;

  @Column({ name: "tax_index", type: "number", nullable: true })
  taxIndex?: number;

  @Column({ name: "multi_price0_default_price_1_multi_price", type: "number", nullable: true })
  multiPrice?: number;

  @Column({ name: "get_weight_value0_no_1_yes", type: "number", nullable: true })
  getWeightValue?: number;

  @Column({ name: "shop_id", type: "varchar2", length: 64, nullable: true })
  shopId?: string;
}
