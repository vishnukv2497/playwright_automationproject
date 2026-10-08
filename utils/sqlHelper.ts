import sql from 'mssql';
import { dbConfig } from './dbConfig';

export class SqlHelper {

    static async executeQuery(query: string) {
        let pool;

        try {
            pool = await sql.connect(dbConfig);

            const result = await pool.request().query(query);

            return result.recordset;

        } catch (error) {
            console.error('Database Error:', error);
            throw error;
        } finally {
            if (pool) {
                await pool.close();
            }
        }
    }
}