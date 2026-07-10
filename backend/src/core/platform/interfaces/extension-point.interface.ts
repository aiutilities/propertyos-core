export interface ExtensionPoint<TContext = unknown, TResult = unknown> {
  name: string;
  description?: string;
  execute(context: TContext): Promise<TResult> | TResult;
}
