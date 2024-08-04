import mongoose from "mongoose";
import { Organization } from "../..";
import Oraganization from "../database/models/Organization.model";

export default class OraganizationService {
  async createOrganization(
    organizationBody: Partial<Organization>
  ): Promise<Organization> {
    const organization = await Oraganization.create(organizationBody);
    return organization;
  }

  async getOrganizationDetails(filter: any): Promise<Organization> {
    const data = await Oraganization.findOne({ ...filter });
    return data;
  }

  async getAllOrganization(
    filter: Partial<Organization>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const data = ignorePagination
      ? await Oraganization.find(filter)
      : await Oraganization.paginate(filter, options);
    return data;
  }

  async getOrganizationById(
    id: string,
    eagerLoad = true,
    load?: string
  ): Promise<mongoose.Document & Organization> {
    let data;
    try{   data = eagerLoad
      ? await Oraganization.findById(id).populate(load)
      : await Oraganization.findById(id);if (!data) new Error(`Organization with id: ${id} does not exist`);console.log('true');}catch(e){ console.log(`org:${e}`); }
 
   
    return data;
  }

  async updateOrganizationById(
    id: string,
    updateBody: Partial<Organization>
  ): Promise<Organization> {
    const Admin = await this.getOrganizationById(id);
    if (!Admin) {
      throw new Error(`Oops!, Organization does not exist`);
    }
    Object.assign(Admin, updateBody);
    await Admin.save();
    return Admin;
  }

  async deleteOrganizationById(id: string): Promise<Organization> {
    const data = await this.getOrganizationById(id);
    if (!data) {
      throw new Error(`Oops!, Admin does not exist`);
    }
    const deleteData = await Oraganization.findByIdAndDelete(id);
    return deleteData;
  }

}
