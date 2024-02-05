import jsPDF from 'jspdf';
import { reportOutDir } from '../../../modules/config/report-path.config';

export interface IReportPDFProvider {
  filename: string;
  content: string;
}

export const reportPDFProvider = async (
  report: IReportPDFProvider,
): Promise<jsPDF> => {
  const docReport = new jsPDF().text(report.content, 10, 10);
  const pathToSave = `${reportOutDir}/${report.filename}`;
  docReport.save(pathToSave);

  return docReport;
};
