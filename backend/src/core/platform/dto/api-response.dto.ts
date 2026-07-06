export interface ApiResponseDto<TData = unknown> {
  success: boolean;
  data?: TData;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
