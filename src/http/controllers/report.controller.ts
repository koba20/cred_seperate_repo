import { NextFunction, Response } from 'express';
import ReportService from '../../services/Report.service';
import { RequestType } from '../middlewares/auth.middleware';
import httpStatus from 'http-status';
import pick from '../../utils/pick';
import AppException from '../../exceptions/AppException';
import moment from 'moment';
export default class ReportController {
  constructor(private readonly reportService: ReportService) {}

  async getReports(req: RequestType, res: Response, next: NextFunction) {
    try {
      const filter = pick(req.query, ['status', 'user', 'category']);
      req.query.status
        ? Object.assign(filter, { status: { status: req.query.status } })
        : null;
      const options = pick(req.query, ['orderBy', 'limit', 'page', 'populate']);
      const report = await this.reportService.getReports(filter, options);
      res.status(httpStatus.OK).json({ report });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async createReport(req: RequestType, res: Response, next: NextFunction) {
    try {
      req.body.user = req.user.id;
      const report = await this.reportService.createReport(req.body);
      res.status(httpStatus.CREATED).json({ report });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async getReportById(req: RequestType, res: Response, next: NextFunction) {
    try {
      const report = await this.reportService.getReportById(
        req.params.reportId,
      );
      if (!report) {
        throw new Error('Report not found');
      }
      res.status(httpStatus.OK).json({ report });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }

  async updateReport(req: RequestType, res: Response, next: NextFunction) {
    try {
      req.body.updatedBy = req.admin.id;
      req.body.updatedAt = moment().utc().toDate();
      req.body.status = {
        status: req.body.status,
        resolvedBy: req.admin.id,
        reason: req.body.reason,
      };
      const report = await this.reportService.updateReport(
        req.body.reportId,
        req.body,
      );
      res.status(httpStatus.OK).json({ report });
    } catch (err: unknown) {
      if (err instanceof Error || err instanceof AppException) {
        next(new AppException(err.message, httpStatus.BAD_REQUEST));
      }
    }
  }
}
