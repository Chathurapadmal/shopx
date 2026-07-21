import { DataSource } from "typeorm";
import { Shop } from "./entities/Shop";
import { User } from "./entities/User";
import { Plu } from "./entities/Plu";
import { Department } from "./entities/Department";
import { Vip } from "./entities/Vip";
import { Sale } from "./entities/Sale";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource) return dataSource;

  dataSource = new DataSource({
    type: "oracle",
    username: process.env.ORACLE_USER || "shopx",
    password: process.env.ORACLE_PASSWORD || "shopx123",
    connectString: process.env.ORACLE_CONNECT_STRING || "localhost:1521/XEPDB1",
    entities: [Shop, User, Plu, Department, Vip, Sale],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}
