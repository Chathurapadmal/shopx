import oracledb from "oracledb";
import bcrypt from "bcryptjs";

async function main() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER || "shopx",
    password: process.env.ORACLE_PASSWORD || "shopx123",
    connectString: process.env.ORACLE_CONNECT_STRING || "localhost:1521/XEPDB1",
  });

  const hash = await bcrypt.hash("chathura@1234", 12);
  const now = new Date().toISOString();

  const existing = await conn.execute(
    `SELECT id FROM users WHERE email = :1`,
    ["chathurapadmal3@gmail.com"]
  );

  if (existing.rows?.length) {
    console.log("Super admin already exists, updating password...");
    await conn.execute(
      `UPDATE users SET password_hash = :1 WHERE email = :2`,
      [hash, "chathurapadmal3@gmail.com"],
      { autoCommit: true }
    );
  } else {
    await conn.execute(
      `INSERT INTO users (id, email, password_hash, name, role, shop_id, email_verified, is_active, created_at, updated_at)
       VALUES (:1, :2, :3, :4, :5, NULL, 1, 1, :6, :7)`,
      [
        "super_admin",
        "chathurapadmal3@gmail.com",
        hash,
        "Chathura",
        "super_admin",
        now,
        now,
      ],
      { autoCommit: true }
    );
    console.log("Super admin created");
  }

  await conn.close();
  console.log("Done");
}

main().catch(console.error);
