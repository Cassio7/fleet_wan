export type LogContext = {
  userId: number;
  username: string;
  resource: string;
  resourceId?: number;
  resourceKey?: string;
};

export type LogError = {
  error: any;
  context: LogContext;
  operation: 'create' | 'read' | 'update' | 'delete' | 'list';
};
