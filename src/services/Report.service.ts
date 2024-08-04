import Report from '../database/models/reports/Report.model';

export default class ReportService {
  async getReports(
    filter: Partial<Report>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false,
  ) {
    const data = ignorePagination
      ? await Report.find(filter)
      : await Report.paginate(filter, options);
    return data;
  }

  async createReport(createBody: Report): Promise<Report> {
    const report = await Report.create(createBody);
    return report;
  }

  async getReportById(reportId: string) {
    const report = await Report.findById(reportId);
    return report;
  }

  async updateReport(reportId: string, updateBody: Partial<Report>) {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    Object.assign(report, updateBody);
    await report.save();
    return report;
  }
}
