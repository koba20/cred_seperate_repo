import DojahClient from "./dojah/client";
import User from "../database/models/User.model";
import apiGatewayConfig from "../../config/config";
import axios from "axios";
import config from "../../config/config";
import mongoose from "mongoose";
import { ValidateBVNResponse, ValidateNINResponse } from "../..";
import RedisClient from "../utils/redis";

export default class UserService {

  private async _initDojahSdk() {
    return new DojahClient()
      .setApiKey(apiGatewayConfig.dojah.privateKey)
      .setProduction(Boolean(apiGatewayConfig.dojah.production))
      .setAppId(apiGatewayConfig.dojah.appId)
      .build();
  }

  async createUser(userBody: Partial<User>): Promise<User> {
    const user = await User.create(userBody);
    return user;
  }
  async getAllUsers(
    filter: Partial<User>,
    options: {
      orderBy?: string;
      page?: string;
      limit?: string;
      populate?: string;
    } = {},
    ignorePagination = false
  ) {
    const user = ignorePagination
      ? await User.find(filter)
      : await User.paginate(filter, options);
    return user;
  }

  async getUserById(
    id: string,
    eagerLoad = true,
    load?: string
  ): Promise<mongoose.Document & User> {
    const data = eagerLoad
      ? await User.findById(id).populate(load)
      : User.findById(id);
    if (!data) new Error(`User with id: ${id} does not exist`);
    return data;
  }

  async getUserByusername(
    username: string,
    eagerLoad = true,
    load?: string
  ): Promise<mongoose.Document & User> {
    const data = eagerLoad
      ? await User.findOne({ username }).populate(load)
      : User.findOne({ username });
    if (!data) new Error(`User with id: ${username} does not exist`);
    return data;
  }

  async updateUserById(id: string, updateBody: Partial<User>): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error(`Oops!, user does not exist`);
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
  }

  async deleteUserById(id: string): Promise<User> {
    const data = await User.findByIdAndDelete(id);
    return data;
  }

  async getUserByEmail(email: string): Promise<User> {
    const data = await User.findOne({ email });
    return data;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User> {
    const data = await User.findOne({ phoneNumber });
    return data;
  }

  async getUserByReferralCode(referralCode: string): Promise<User> {
    const data = await User.findOne({ referralCode });
    return data;
  }

  async getUserDetail(filter: any) {
    const data = await User.findOne(filter);
    return data;
  }

  async searchUsers(searchQuery: string): Promise<User[]> {
    const data = await User.find({
      $or: [
        { firstName: { $regex: searchQuery, $options: "i" } },
        { lastName: { $regex: searchQuery, $options: "i" } },
        { username: { $regex: searchQuery, $options: "i" } },
      ],
    });

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

  async saveUserDeviceInfo(data: typeof Map, actor: User) {
    const user = await User.findByIdAndUpdate(
      actor.id,
      {
        $push: {
          "settings.deviceInfo": data,
        },
      },
      { new: true }
    );
    return user;
  }

  async queryAllUserDetails(filter: Partial<User>) {
    const user = await User.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "user",
          as: "walletInfo",
        },
      },
      {
        $lookup: {
          from: "followers",
          let: { actorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$actorUser", "$$actorId"],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "followerDetails",
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $arrayElemAt: ["$followerDetails", 0],
                },
              },
            },
          ],
          as: "followers",
        },
      },
      {
        $lookup: {
          from: "followers",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$user", "$$userId"],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "actorUser",
                foreignField: "_id",
                as: "followingDetails",
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $arrayElemAt: ["$followingDetails", 0],
                },
              },
            },
          ],
          as: "followings",
        },
      },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "owner",
          as: "shop",
        },
      },
      {
        $lookup: {
          from: "artisans",
          localField: "_id",
          foreignField: "user",
          as: "artisanProfile",
        },
      },
      // populate the users inside the array ob blockedUsers
      {
        $lookup: {
          from: "users",
          localField: "settings.blockedUsers",
          foreignField: "_id",
          as: "blockedUsers",
        },
      },
      {
        $unwind: {
          path: "$walletInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$shop",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$artisanProfile",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    const userObj = user.reduce((acc, cur) => {
      acc = cur;
      return acc;
    }, {});
    return userObj;
  }

  async validateNin(nin: string): Promise<ValidateNINResponse> {
    if (apiGatewayConfig.environment === "production") {

      console.log(await RedisClient.instance.exists(nin))

      if ((await RedisClient.instance.exists(nin)) == 1) {
        const cahtched = await RedisClient.instance.get(nin);
        return JSON.parse(cahtched) as ValidateNINResponse;
      }

      const dojah = await this._initDojahSdk();
      const response = await dojah.validateNIN(nin);
      RedisClient.instance.set(nin, JSON.stringify(response));
      return response;
    }
    return {
      first_name: "John",
      middle_name: "Doe",
      last_name: "Alamutu",
      employment_status: "WXABCD-1234",
      gender: "f",
      phone_number: "08012345678",
      date_of_birth: "01-01-1982",
      photo: "/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgc...",
    } as ValidateNINResponse;
  }

  async validateBvn(bvn: string): Promise<ValidateBVNResponse> {
    if ((await RedisClient.instance.exists(bvn)) == 1) {
      const cahtched = await RedisClient.instance.get(bvn);
      return JSON.parse(cahtched) as ValidateBVNResponse;
    }

    if (apiGatewayConfig.environment === "production") {
      const dojah = await this._initDojahSdk();
      const response = await dojah.validateBVN(bvn);
      RedisClient.instance.set(bvn, JSON.stringify(response));
      return response;
    }

    return {
      error: false,
      message: "BVN validation successful",
      bvn: "12345678901",
      first_name: "John",
      last_name: "Doe",
      middle_name: "Doe",
      gender: "male",
      date_of_birth: "1990-01-01",
      phone_number1: "08012345678",
      image: "https://link-to-image",
      phone_number2: "08012345678",
    } as ValidateBVNResponse;
  }
}
