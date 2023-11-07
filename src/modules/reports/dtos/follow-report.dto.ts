import { $Enums } from '@prisma/client';

export interface FollowReportDTO {
  id: number;
  filename?: string;
  created_at: Date;
  status: $Enums.Status;
  scheduled: boolean;
  delivery_at?: Date;
}
