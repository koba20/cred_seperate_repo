import mongoose from "mongoose";
import axios from "axios";
import config from "../../config/config";
import Admin from "../database/models/Admin.model";

export default class AdminService {
  async createAdmin(adminBody: Partial<Admin>): Promise<Admin> {
    const admin = await Admin.create(adminBody);
    return admin;
  }

  dormantCall() {
    return "TEST DORMANT";
  }
  async getAllAdmins(
    filter: Partial<Admin>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await Admin.find(filter)
      : await Admin.paginate(filter, options);
    return data;
  }

  async getAdminById(
    id: string,
    eagerLoad = true,
    load?: string
  ): Promise<mongoose.Document & Admin> {
    const data = eagerLoad
      ? await Admin.findById(id).populate(load)
      : Admin.findById(id);
    if (!data) new Error(`Admin with id: ${id} does not exist`);
    return data;
  }

  async updateAdminById(
    id: string,
    updateBody: Partial<Admin>
  ): Promise<Admin> {
    const Admin = await this.getAdminById(id);
    if (!Admin) {
      throw new Error(`Oops!, Admin does not exist`);
    }
    Object.assign(Admin, updateBody);
    await Admin.save();
    return Admin;
  }

  async deleteAdminById(id: string): Promise<Admin> {
    const data = await this.getAdminById(id);
    if (!data) {
      throw new Error(`Oops!, Admin does not exist`);
    }
    const deleteData = await Admin.findByIdAndDelete(id);
    return deleteData;
  }

  async getAdminByEmail(email: string): Promise<Admin> {
    const data = await Admin.findOne({ email });
    return data;
  }

  async getAdminByPhoneNumber(phoneNumber: string): Promise<Admin> {
    const data = await Admin.findOne({ phoneNumber });
    return data;
  }

  async getAdminByReferralCode(referralCode: string): Promise<Admin> {
    const data = await Admin.findOne({ referralCode });
    return data;
  }

  async getAdminDetail(filter: Partial<Admin>) {
    const data = await Admin.findOne(filter);
    return data;
  }

  async getStates() {
    const options = {
      method: "GET",
      url: `${config.slwpBaseUrl}/state`,
      "Content-type": "application/json",
      Accept: "application/json",
    };
    const data = await axios(options);
    return data.data;
  }

  async getLgas(stateId: string) {
    const options = {
      method: "GET",
      url: `${config.slwpBaseUrl}/lga/${stateId}`,
      "Content-type": "application/json",
      Accept: "application/json",
    };
    const data = await axios(options);
    return data.data;
  }

  async getWards(lgaId: string) {
    const options = {
      method: "GET",
      url: `${config.slwpBaseUrl}/ward/${lgaId}`,
      "Content-type": "application/json",
      Accept: "application/json",
    };
    const data = await axios(options);
    return data.data;
  }

  async getPollingUnits(wardId: string) {
    const options = {
      method: "GET",
      url: `${config.slwpBaseUrl}/polling-unit/${wardId}`,
      "Content-type": "application/json",
      Accept: "application/json",
    };
    const data = await axios(options);
    return data.data;
  }
}
