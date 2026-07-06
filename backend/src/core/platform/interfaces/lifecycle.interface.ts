export interface Lifecycle {
  install?(): Promise<void> | void;
  activate?(): Promise<void> | void;
  deactivate?(): Promise<void> | void;
  uninstall?(): Promise<void> | void;
}
