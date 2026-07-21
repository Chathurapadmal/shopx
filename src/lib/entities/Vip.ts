import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "vip" })
export class Vip {
  @PrimaryColumn({ name: "vip_card", type: "varchar2", length: 255 })
  vipCard!: string;

  @Column({ name: "vip_name", type: "varchar2", length: 255, nullable: true })
  vipName?: string;

  @Column({ name: "vip_phone", type: "varchar2", length: 255, nullable: true })
  vipPhone?: string;

  @Column({ name: "vip_address", type: "varchar2", length: 255, nullable: true })
  vipAddress?: string;

  @Column({ name: "sex1_male_2_female", type: "varchar2", length: 255, nullable: true })
  sex?: string;

  @Column({ name: "birthdaymonthday", type: "varchar2", length: 255, nullable: true })
  birthday?: string;

  @Column({ name: "fixed_discount", type: "varchar2", length: 255, nullable: true })
  fixedDiscount?: string;

  @Column({ name: "member_points", type: "varchar2", length: 255, nullable: true })
  memberPoints?: string;

  @Column({ name: "residual_money", type: "varchar2", length: 255, nullable: true })
  residualMoney?: string;

  @Column({ name: "status0_invalid_1_valid", type: "varchar2", length: 255, nullable: true })
  status?: string;

  @Column({ name: "shop_id", type: "varchar2", length: 64, nullable: true })
  shopId?: string;

  @Column({ name: "added_by", type: "varchar2", length: 255, nullable: true })
  addedBy?: string;
}
