import { $Enums } from '@prisma/client';
import { randomUUID } from 'crypto';

interface IReportProps {
  filename?: string;
  scheduled: boolean;
  delivery_at?: Date;
}

export class Report {
  private id: number;
  private filename?: string;
  private created_at: Date;
  private status: $Enums.Status;
  private scheduled: boolean;
  private delivery_at?: Date;

  constructor(props: IReportProps) {
    this.filename = props.filename;
    this.created_at = new Date();

    if (props.scheduled) {
      this.scheduled = props.scheduled;
      this.delivery_at = props.delivery_at;
    }
  }

  get _status(): $Enums.Status {
    return this.status;
  }

  get _id(): number {
    return this.id;
  }

  get createdAt(): Date {
    return this.created_at;
  }

  get deliveryAt(): Date {
    return this.delivery_at;
  }

  get _scheduled(): boolean {
    return this.scheduled;
  }

  get _filename(): string {
    return this.filename;
  }
}
