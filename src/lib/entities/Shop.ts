import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";

@Entity({ name: "shops" })
export class Shop {
  @PrimaryColumn({ name: "id", type: "varchar2", length: 64 })
  id!: string;

  @Column({ name: "name", type: "varchar2", length: 255 })
  name!: string;

  @Column({ name: "email", type: "varchar2", length: 255, nullable: true })
  email?: string;

  @Column({ name: "phone", type: "varchar2", length: 50, nullable: true })
  phone?: string;

  @Column({ name: "address", type: "varchar2", length: 500, nullable: true })
  address?: string;

  @Column({ name: "is_active", type: "number", default: 1 })
  isActive!: number;

  @Column({ name: "created_at", type: "varchar2", length: 30, nullable: true })
  createdAt?: string;

  @Column({ name: "updated_at", type: "varchar2", length: 30, nullable: true })
  updatedAt?: string;
}
