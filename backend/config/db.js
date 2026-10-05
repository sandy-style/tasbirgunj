import mongoose from "mongoose";

const connectDb = async () => {
  mongoose.connection.on("connected", () => {
    console.log("Mongodb configured ✅");
  });
  await mongoose.connect(`${process.env.MONGODB_URL}/TasbirGunj`);
};
export default connectDb;
