export type LogContext = {
  userId: number;
  username: string;
  resource: string;
  resourceId?: number;
};

export type LogError = {
  error: any;
  context: LogContext;
  operation: 'create' | 'read' | 'update' | 'delete' | 'list';
};
