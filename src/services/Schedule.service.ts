import Schedule from '../database/models/wallet/schedule.model';
import { ScheduleInterface } from '../../index';
import moment from 'moment';

export default class ScheduleService {
  async createSchedule(data: ScheduleInterface) {
    const schedule = await Schedule.create(data);
    return schedule;
  }

  async getAllSchedule(
    filter: Partial<ScheduleInterface>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    Object.assign(filter, { deletedAt: null });
    const data = ignorePagination
      ? await Schedule.find(filter).populate(options.populate)
      : await Schedule.paginate(filter, options);
    return data;
  }

  async querySchedule(
    filter: Partial<ScheduleInterface>,
    eagerLoadField?: string,
    eagerLoad = true
  ) {
    Object.assign(filter, { deletedAt: null });
    const data = eagerLoad
      ? await Schedule.findOne({ ...filter }).populate(eagerLoadField)
      : await Schedule.findOne({ ...filter });
    return data;
  }

  async updateScheduleById(
    id: string,
    updateBody: Partial<ScheduleInterface>
  ): Promise<ScheduleInterface> {
    const schedule = await this.querySchedule({ _id: id });
    if (!schedule) {
      throw new Error(`Oops!, schedule does not exist`);
    }
    Object.assign(schedule, updateBody);
    await schedule.save();
    return schedule;
  }

  async deleteScheduleById(id: string) {
    const schedule = await this.querySchedule({ _id: id });
    if (!schedule) {
      throw new Error(`Oops!, schedule does not exist`);
    }
    Object.assign(schedule, { deletedAt: moment().utc().toDate() });
    await schedule.save();
    return schedule;
  }
}
