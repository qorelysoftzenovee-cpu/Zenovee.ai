export type RouteMeta = {
  title: string;
  description?: string;
};

export type TimestampedEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
