import mongoose from "mongoose";
import config from "../../config/config";

const connectDb = async () => {
  try {

    mongoose.set("strictQuery", true);
    await mongoose.connect(config.DATABASE_URL);
    console.log(`${config.appName} 🚀 Connected to Database Successfully`);
  } catch (error) {
    console.error(`${config.appName} ❌ Failed to Connect to Database`);
    console.error(error);
  }
};

export default connectDb;
