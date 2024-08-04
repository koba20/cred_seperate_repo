import { Model } from 'mongoose';
import { Pagination } from '../database/plugins/paginate.plugin';

export default class BaseService {
  async getAll<T>(
    model: Model<T> & Pagination<T>,
    filter: Partial<T>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await model.find(filter)
      : await model.paginate(filter, options);
    return data;
  }

  async getOne<T>(
    model: Model<T> & Pagination<T>,
    filter: Partial<T>,
    load?: string,
    eagerLoad = true
  ) {
    load = load?.split(',').join(' ');
    const data = eagerLoad
      ? await model.findOne(filter).populate(load)
      : await model.findOne(filter);
    return data;
  }

  async create<T>(model: Model<T>, createBody: Partial<T>) {
    const data = await model.create(createBody);
    return data;
  }

  async update<T>(model: Model<T>, filter: Partial<T>, updateBody: Partial<T>) {
    const getRecord = await model.findOne(filter);
    if (!getRecord) {
      throw new Error(`Oops!, record does not exist`);
    }
    Object.assign(getRecord, updateBody);
    await getRecord.save();
    return getRecord;
  }

  async delete<T>(model: Model<T>, filter: Partial<T>) {
    const getRecord = await model.findOne(filter);
    if (!getRecord) {
      throw new Error(`Oops!, record does not exist`);
    }
    await getRecord.remove();
    return getRecord;
  }

  async findOneAndUpdate<T>(
    model: Model<T>,
    filter: Partial<T>,
    updateBody: Partial<T>
  ) {
    const data = await model.findOneAndUpdate(filter, updateBody, {
      new: true,
    });
    return data;
  }
}
