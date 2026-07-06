export abstract class BasePostgresRepository {
  protected mapRow<T>(row: unknown): T {
    return row as T;
  }

  protected mapRows<T>(rows: unknown[]): T[] {
    return rows.map((row) => this.mapRow<T>(row));
  }
}
