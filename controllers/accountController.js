const { fetchUserPost, updateUserData, fetchUserData, fetchUserCounts } = require("../models/accountModel");
const redisClient = require('../utils/redis');


/**
 * Fetches the posts of the user based on the user_id
 * @param {*} req
 * @param {*} res
 * @returns post with limit
 */
const getUserInfo = async (req, res) => {
  const userId = req.user?.username;
  const limit = parseInt(req.query.limit) || 6;
  const offset = parseInt(req.query.offset) || 0;


  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "user id is required",
    });
  }


     const userKey = `user:${userId}`;
     const cachedUser = await redisClient.get(userKey);
     let userData;

  try {
    const posts = await fetchUserPost(userId, limit, offset);
    
    //checks if the user data is cached
    if(cachedUser){
      userData = JSON.parse(cachedUser);
    }else{
      userData = await fetchUserData(userId);

      if(userData != undefined){
          await redisClient.set(userKey, JSON.stringify(userData), 'EX', 604800);
      }
    }

    const userCounts = await fetchUserCounts(userId);

    console.log('user counts: ', userCounts);
    

    return res
      .status(200)
      .json({
        success: true,
        message: "Successfully fetched post",
        userData: userData,
        userCounts: userCounts,
        posts: posts,
      });
  } catch (error) {
    console.log("failed to fetched posts: ", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};



const updateUserProfile = async (req, res) => {

  const user_id = req.user?.username;

  const file = req.file;

  const { full_name, major, school_year} = req.body;

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heif",
    "image/heif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
  ];

  //checks if any of the field is empty
  if (!full_name || !major || !school_year) {
    return res.status(400).json({ success: false, error: "empty field" });
  }

  if(!file) {
    return res.status(400).json({success: false, error: 'Profile image is required'});
  }

  if(!allowedTypes.includes(file.mimetype)){
    return res.status(400).json({success: false, error: "unsupported image type"})
  }

  try {
    const result = await updateUserData(
      user_id,
      full_name,
      major,
      school_year,
      file
    );

    console.log("successfully updated user profile data");
    
    return res
      .status(200)
      .json({
        success: true,
        message: "successfully updated user profile data",
      });
  } catch (error) {
    console.log(`failed to update user profile data: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getUserInfo,
  updateUserProfile,
};
