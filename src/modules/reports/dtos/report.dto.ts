export interface ReportDTO {
  filename?: string;
  scheduled: boolean;
  delivery_at?: Date;
  data_id: string[];
}
