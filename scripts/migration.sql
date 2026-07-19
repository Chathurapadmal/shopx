-- Migration: Multi-tenant with roles (shops, users, shop_id columns)

ALTER SESSION SET CONTAINER = XEPDB1;

-- 1. Create shops table
CREATE TABLE shops (
  id VARCHAR2(64) PRIMARY KEY,
  name VARCHAR2(255) NOT NULL,
  email VARCHAR2(255),
  phone VARCHAR2(50),
  address VARCHAR2(500),
  is_active NUMBER(1) DEFAULT 1,
  created_at VARCHAR2(30),
  updated_at VARCHAR2(30)
);

-- 2. Create users table
CREATE TABLE users (
  id VARCHAR2(64) PRIMARY KEY,
  email VARCHAR2(255) NOT NULL,
  password_hash VARCHAR2(255) NOT NULL,
  name VARCHAR2(255),
  role VARCHAR2(20) NOT NULL,
  shop_id VARCHAR2(64),
  twofa_secret VARCHAR2(255),
  twofa_enabled NUMBER(1) DEFAULT 0,
  email_verified NUMBER(1) DEFAULT 0,
  email_verification_token VARCHAR2(255),
  reset_password_token VARCHAR2(255),
  reset_password_expires VARCHAR2(30),
  is_active NUMBER(1) DEFAULT 1,
  created_at VARCHAR2(30),
  updated_at VARCHAR2(30)
);

-- 3. Add shop_id and audit columns to existing tables
ALTER TABLE plu ADD shop_id VARCHAR2(64);
ALTER TABLE plu ADD modified_by VARCHAR2(255);
ALTER TABLE plu ADD modified_at VARCHAR2(30);

ALTER TABLE department ADD shop_id VARCHAR2(64);

ALTER TABLE vip ADD shop_id VARCHAR2(64);
ALTER TABLE vip ADD added_by VARCHAR2(255);

ALTER TABLE sales ADD shop_id VARCHAR2(64);

ALTER TABLE cashier ADD shop_id VARCHAR2(64);
ALTER TABLE clerk ADD shop_id VARCHAR2(64);
ALTER TABLE condiment ADD shop_id VARCHAR2(64);
ALTER TABLE customkeyboard ADD shop_id VARCHAR2(64);
ALTER TABLE departmentgroup ADD shop_id VARCHAR2(64);
ALTER TABLE discount ADD shop_id VARCHAR2(64);
ALTER TABLE foodpackage ADD shop_id VARCHAR2(64);
ALTER TABLE foreigncurrency ADD shop_id VARCHAR2(64);
ALTER TABLE plustockin ADD shop_id VARCHAR2(64);
ALTER TABLE paymenttype ADD shop_id VARCHAR2(64);
ALTER TABLE receiptheaderfooter ADD shop_id VARCHAR2(64);
ALTER TABLE servicefee ADD shop_id VARCHAR2(64);
ALTER TABLE systempassword ADD shop_id VARCHAR2(64);
ALTER TABLE sytemparameter ADD shop_id VARCHAR2(64);
ALTER TABLE "TABLE" ADD shop_id VARCHAR2(64);
ALTER TABLE tax ADD shop_id VARCHAR2(64);
ALTER TABLE i18nparameter ADD shop_id VARCHAR2(64);

-- 4. Insert default shop for existing demo data
INSERT INTO shops (id, name, email, is_active, created_at)
VALUES ('shop_demo', 'Demo Shop', 'demo@shopx.local', 1, TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS'));

-- 5. Assign existing data to demo shop
UPDATE plu SET shop_id = 'shop_demo';
UPDATE department SET shop_id = 'shop_demo';
UPDATE vip SET shop_id = 'shop_demo';
UPDATE sales SET shop_id = 'shop_demo';
UPDATE cashier SET shop_id = 'shop_demo';
UPDATE clerk SET shop_id = 'shop_demo';
UPDATE condiment SET shop_id = 'shop_demo';
UPDATE customkeyboard SET shop_id = 'shop_demo';
UPDATE departmentgroup SET shop_id = 'shop_demo';
UPDATE discount SET shop_id = 'shop_demo';
UPDATE foodpackage SET shop_id = 'shop_demo';
UPDATE foreigncurrency SET shop_id = 'shop_demo';
UPDATE plustockin SET shop_id = 'shop_demo';
UPDATE paymenttype SET shop_id = 'shop_demo';
UPDATE receiptheaderfooter SET shop_id = 'shop_demo';
UPDATE servicefee SET shop_id = 'shop_demo';
UPDATE systempassword SET shop_id = 'shop_demo';
UPDATE sytemparameter SET shop_id = 'shop_demo';
UPDATE "TABLE" SET shop_id = 'shop_demo';
UPDATE tax SET shop_id = 'shop_demo';
UPDATE i18nparameter SET shop_id = 'shop_demo';

COMMIT;
