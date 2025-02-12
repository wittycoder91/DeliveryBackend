const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Double } = require("bson");
const {
  getUserCollection,
  getAdminCollection,
  getIndustryCollection,
} = require("../helpers/db-conn");

const AuthCtrl = () => {
  const checkExist = async (email) => {
    const collection = getUserCollection();
    const user = await collection.findOne({ email: email });
    if (user) return user;
    return false;
  };
  const checkExistUser = async (username) => {
    const collection = getUserCollection();
    const user = await collection.findOne({ name: username });
    if (user) return user;
    return false;
  };
  const checkAdminExist = async (userid) => {
    const collection = getAdminCollection();
    const user = await collection.findOne({ userid: userid });
    if (user) return user;
    return false;
  };

  // User Login & Register
  const login = async (emailOrName, password) => {
    const collection = getUserCollection();

    let user = await collection.findOne({ email: emailOrName });
    if (!user) {
      user = await collection.findOne({ name: emailOrName });
    }

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: "Invalid password" };
      }

      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      return {
        success: true,
        message: "Logged in successfully",
        token: token,
        user: user,
      };
    } else {
      return { success: false, message: "User doesn't exist" };
    }
  };
  const register = async (
    name,
    contact,
    email,
    password,
    address,
    city,
    state,
    zipcode,
    phonenumber,
    industry,
    avatarPath
  ) => {
    if (await checkExist(email)) {
      return { success: false, message: "Email already exists" };
    }
    if (await checkExistUser(name)) {
      return { success: false, message: "User already exists" };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const collection = getUserCollection();
    const user = await collection.insertOne({
      name,
      contact,
      email,
      address,
      city,
      state,
      zipcode,
      password: hashedPassword,
      phonenumber,
      industry,
      avatarPath,
      w9Path: "",
      loyalty: 0,
      trust: 0,
      price: 0,
      totalweight: new Double(0.0),
    });
    if (user) {
      return { success: true, message: "Registered successfully" };
    } else {
      return { success: false, message: "MongoDB API error" };
    }
  };
  const forgetPassword = async (email) => {
    if (await checkExist(email)) {
      const collectiionUser =  getUserCollection();

      await collectiionUser.updateOne(
        { email: email },
        {
          $set: {
            forgetflag: 1,
          },
        }
      );

      return {
        success: true,
        message: "The status of forget password flag has been updated.",
      };
    } else {
      return { success: false, message: "Email is not exists" };
    }
  };
  const changePassword = async (email, password) => {
    if (await checkExist(email)) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const collection = getUserCollection();
      const updateFields = { password: hashedPassword, forgetflag: 0 };

      updateData = await collection.findOneAndUpdate(
        { email: email, forgetflag: 1 },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      if (updateData) {
        return {
          success: true,
          message: "Your password changed successfully.",
        };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } else {
      return { success: false, message: "Email is not exists" };
    }
  };

  // Admin Login
  const adminLogin = async (userId, password) => {
    const collection = getAdminCollection();
    if (!(await checkAdminExist(userId))) {
      return { success: false, message: "User doesn't exists in the database" };
    }

    const user = await collection.findOne({ userid: userId });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return { success: false, message: "Invalid userId or password" };
      }

      // const token = await user.generateAuthtoken();
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      return {
        success: true,
        message: "Logged in successfully",
        token: token,
        user: user,
      };
    } else {
      return { success: false, message: "User doesn't exists" };
    }
  };

  // Industry Management
  const getAllIndustry = async () => {
    try {
      const collection = getIndustryCollection();
      const industry = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: industry,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  return {
    login,
    register,
    forgetPassword,
    changePassword,
    adminLogin,
    checkExist,
    getAllIndustry,
  };
};

module.exports = AuthCtrl();
