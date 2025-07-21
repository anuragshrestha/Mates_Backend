const {
  fetchUserPost,
  updateUserData,
  fetchUserData,
  fetchUserCounts,
} = require("../models/accountModel");
const redisClient = require("../utils/redis");

/**
 * Fetches the posts of the user based on the user_id
 * @param {*} req
 * @param {*} res
 * @returns post with limit
 */
const getUserInfo = async (req, res) => {
  const userId = req.user?.username;
  const limit = parseInt(req.query.limit) || 2;
  const offset = parseInt(req.query.offset) || 0;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "user id is required",
    });
  }

  const userKey = `user:${userId}`;
  let userData;
  let fetchedUserDatapromise;
  let shouldCache = false;

  try {
    const cachedUser = await redisClient.get(userKey);

    //checks if the user data is cached
    if (cachedUser) {
      const cachedUserData = JSON.parse(cachedUser);
      fetchedUserDatapromise = Promise.resolve(cachedUserData);
    } else {
      fetchedUserDatapromise = fetchUserData(userId);
      shouldCache = true;
    }

    let [userData, userCounts, posts] = await Promise.all([
      fetchedUserDatapromise,
      fetchUserCounts(userId),
      fetchUserPost(userId, limit, offset),
    ]);

    if (shouldCache) {
      console.log("caching the user account profile data");

      await redisClient.set(userKey, JSON.stringify(userData), "EX", 604800);
    }

    console.log("user counts: ", userCounts);

    // combine them here
    const userProfile = {
      ...userData,
      ...userCounts,
    };

    posts = posts
      .map((post) => {
        try {
          return {
            ...post,
            media_urls: JSON.parse(post.media_urls),
          };
        } catch (e) {
          console.error(
            `Failed to parse media_urls for post ${post.post_id}:`,
            post.media_urls
          );
          return null;
        }
      })
      .filter(Boolean);

    console.log("posts:", JSON.stringify(posts, null, 2));

    console.log("successfully fetched user account data: ", userProfile);

    return res.status(200).json({
      success: true,
      message: "Successfully fetched post",
      userProfile: userProfile,
      posts: posts,
    });
  } catch (error) {
    console.log("failed to fetched posts: ", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Checks if the field is non empty and then
 * calls the model to update the data
 * @param {*} req the data to be updated
 * @param {*} res
 * @returns success: True or False
 */

const updateUserProfile = async (req, res) => {
  const user_id = req.user?.username;

  const file = req.file;

  const { full_name, bio, major, school_year } = req.body;

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

  if (file) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ success: false, error: "unsupported image type" });
    }
  }

  try {
    const result = await updateUserData(
      user_id,
      full_name,
      bio,
      major,
      school_year,
      file
    );

    console.log("successfully updated user profile data");

    const userKey = `user:${user_id}`;

    try {
      await redisClient.del(userKey);
      console.log('successfully deleted the user profile cache');
      
    } catch (err) {
      console.log(`failed to delete the cache: ${err}`);
    }

    return res.status(200).json({
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
