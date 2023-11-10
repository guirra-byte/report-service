import { randomUUID } from 'crypto';

export class LogEntity<T> {
  private id: string;
  private at: string;
  private parentDeps: T;

  constructor(props: T, id?: string) {
    this.parentDeps = props;
    this.id = id ?? randomUUID();
    this.at = new Date().toISOString();
  }

  get _id(): string {
    return this.id;
  }

  get _at(): string {
    return this.at;
  }

  get _deps(): T {
    return this.parentDeps;
  }
}
