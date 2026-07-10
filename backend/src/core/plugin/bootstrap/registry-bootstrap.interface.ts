export interface RegistryBootstrap<T = unknown> {
  load(): Promise<T[]> | T[];
  synchronize(items: T[]): Promise<void>;
}
