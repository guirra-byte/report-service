import jsPDF from 'jspdf';
import { reportPDFOutDir } from '../../../modules/config/report-pdf-path.config';

export interface IReportPDFProvider {
  filename: string;
  content: string;
}

export const reportPDFProvider = async (
  report: IReportPDFProvider,
): Promise<jsPDF> => {
  const docReport = new jsPDF().text(report.content, 10, 10);
  const pathToSave = `${reportPDFOutDir}/${report.filename}`;
  docReport.save(pathToSave);

  return docReport;
};
