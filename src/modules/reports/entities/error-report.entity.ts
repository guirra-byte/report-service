import { randomUUID } from 'crypto';

export class ErrorReportEntity<T> {
  private at: string;
  private id: string;
  private parentId: number;
  private parentQueueKey: string;

  private failAttempts?: number;
  private errLogMessage?: string;
  private deps: T;

  constructor(
    props: T,
    parentId: number,
    parentQueueKey: string,
    repeatAttempts?: number,
  ) {
    this.id = randomUUID();
    this.at = new Date().toISOString();
    this.failAttempts = repeatAttempts ?? 3;
    this.deps = props;
    this.parentId = parentId;
    this.parentQueueKey = parentQueueKey;
  }

  get _id(): string {
    return this.id;
  }

  get _failAttempts(): number {
    return this.failAttempts;
  }

  get _deps(): T {
    return this.deps;
  }

  get _failAt(): string {
    return this.at;
  }

  get _errorMessage(): string {
    return this.errLogMessage;
  }

  get _parent(): number {
    return this.parentId;
  }

  get _queueKey(): string {
    return this.parentQueueKey;
  }

  set _fail(attempts: number) {
    this.failAttempts = attempts + 1;
  }
}
