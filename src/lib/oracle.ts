import oracledb from "oracledb";

let pool: oracledb.Pool | null = null;

export async function getPool() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: "shopx",
    password: "shopx123",
    connectString: "localhost:1521/XEPDB1",
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });

  return pool;
}

export async function getConnection() {
  const p = await getPool();
  return p.getConnection();
}

export async function query(sql: string, params?: any[]) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params || [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result;
  } finally {
    await conn.close();
  }
}

export async function execute(sql: string, params?: any[]) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params || [], { autoCommit: true });
    return result;
  } finally {
    await conn.close();
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function mapRows(rows: any[] | undefined | null): any[] {
  if (!rows) return [];
  return rows.map((row: any) => {
    const mapped: any = {};
    for (const key of Object.keys(row)) {
      mapped[key.toLowerCase()] = row[key];
    }
    return mapped;
  });
}
