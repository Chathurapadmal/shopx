import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn({ name: "id", type: "varchar2", length: 64 })
  id!: string;

  @Column({ name: "email", type: "varchar2", length: 255 })
  email!: string;

  @Column({ name: "password_hash", type: "varchar2", length: 255 })
  passwordHash!: string;

  @Column({ name: "name", type: "varchar2", length: 255, nullable: true })
  name?: string;

  @Column({ name: "role", type: "varchar2", length: 20 })
  role!: string;

  @Column({ name: "shop_id", type: "varchar2", length: 64, nullable: true })
  shopId?: string;

  @Column({ name: "twofa_secret", type: "varchar2", length: 255, nullable: true })
  twofaSecret?: string;

  @Column({ name: "twofa_enabled", type: "number", default: 0 })
  twofaEnabled!: number;

  @Column({ name: "email_verified", type: "number", default: 0 })
  emailVerified!: number;

  @Column({ name: "email_verification_token", type: "varchar2", length: 255, nullable: true })
  emailVerificationToken?: string;

  @Column({ name: "reset_password_token", type: "varchar2", length: 255, nullable: true })
  resetPasswordToken?: string;

  @Column({ name: "reset_password_expires", type: "varchar2", length: 30, nullable: true })
  resetPasswordExpires?: string;

  @Column({ name: "is_active", type: "number", default: 1 })
  isActive!: number;

  @Column({ name: "created_at", type: "varchar2", length: 30, nullable: true })
  createdAt?: string;

  @Column({ name: "updated_at", type: "varchar2", length: 30, nullable: true })
  updatedAt?: string;
}
