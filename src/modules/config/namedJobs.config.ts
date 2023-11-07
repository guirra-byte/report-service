export interface INamedJobOptions {
  jobName: string;
  priority?: number;
  delay?: number;
  attempts?: number;
  lifo?: boolean;
}

export const namedJobs: Record<string, INamedJobOptions[]> = {
  ['logs']: [{ jobName: 'gen' }] as INamedJobOptions[],
};
