const { fetchUserPost, updateUserData } = require("../models/accountModel");

/**
 * Fetches the posts of the user based on the user_id
 * @param {*} req
 * @param {*} res
 * @returns post with limit
 */
const getUserPost = async (req, res) => {
  const userId = req.user?.username;
  const limit = parseInt(req.query.limit) || 9;
  const offset = parseInt(req.query.offset) || 0;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "user id is required",
    });
  }

  try {
    const posts = await fetchUserPost(userId, limit, offset);
    return res
      .status(200)
      .json({
        success: true,
        message: "Successfully fetched post",
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
  getUserPost,
  updateUserProfile,
};
