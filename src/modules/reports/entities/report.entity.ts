import { $Enums } from '@prisma/client';
import { randomUUID } from 'crypto';

interface IReportProps {
  filename?: string;
  scheduled: boolean;
  delivery_at?: Date;
}

export class Report {
  private _id: number;
  private filename?: string;
  private created_at: Date;
  private _status: $Enums.Status;
  private _scheduled: boolean;
  private delivery_at?: Date;

  constructor(props: IReportProps) {
    this.filename = props.filename;
    this.created_at = new Date();

    if (props.scheduled) {
      this._scheduled = props.scheduled;
      this.delivery_at = props.delivery_at;
    }
  }

  get status(): $Enums.Status {
    return this.status;
  }

  get id(): number {
    return this._id;
  }

  get createdAt(): Date {
    return this.created_at;
  }

  get scheduled(): boolean {
    return this.scheduled;
  }
}
