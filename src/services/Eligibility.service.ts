import { User } from "../..";
import Eligibility from "../database/models/loan/loan.eligibility.module";

export default class WorkService {
  async createEligibility(
    loanBody: Partial<Eligibility>
  ): Promise<Eligibility> {
    const eligibility = await Eligibility.create(loanBody);
    return eligibility;
  }

  async getEligibilityByDetails(
    filter: Partial<Eligibility>
  ): Promise<Eligibility> {
    const data = await Eligibility.findOne({ ...filter });
    return data;
  }

  async getEligibilityById(id: any): Promise<Eligibility> {
    const data = await Eligibility.findOne({ _id: id });
    return data;
  }

  async getUserEligibility(user: User): Promise<Eligibility> {
    const data = await Eligibility.findOne({ user: user._id });
    return data;
  }

  async updateEligibilityById(
    user: string,
    updateBody: Partial<Eligibility>
  ): Promise<Eligibility> {
    const data = await Eligibility.findOneAndUpdate({ user: user }, updateBody);
    return data;
  }
}
