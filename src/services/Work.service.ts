import User from "../database/models/User.model";
import Work from "../database/models/Work.model";

export default class WorkService {
  async createWork(loanBody: Partial<Work>): Promise<Work> {
    const work = await Work.create(loanBody);
    return work;
  }

  async getWorkByDetails(filter: Partial<Work>): Promise<Work> {
    const data = await Work.findOne({ ...filter });
    return data;
  }

  async getWorkByUser(id: any): Promise<Work> {
    const user = await User.findById(id);
    if (!user) throw new Error("No such user");
    if (!user.work)
      throw new Error("User is not connected to any organization");

    const data = await Work.findById(user.work);
    if (!data) throw new Error("Work does not exist");
    return data;
  }

  async getWorkByID(id: any): Promise<Work> {
    const data = await Work.findOne(id);
    return data;
  }
  async findAndDelete(id: any): Promise<Work> {
    const data = await Work.findOneAndDelete(id);
    return data;
  }

  async getUserWorks(user: string) {
    const data = await Work.find({ user: user });
    return data;
  }

  async getAllWorks(
    filter: Partial<Work>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await Work.find(filter)
      : await Work.paginate(filter, options);
    return data;
  }

  async updateWorkById(work: string, updateBody: Partial<Work>) {
    const data = await Work.findByIdAndUpdate(work, updateBody);
    return data;
  }
}
