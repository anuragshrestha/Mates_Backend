const { followUser, unfollowUser } = require("../models/followModel");
const redisClient = require("../utils/redis");
const { getAllFollowees } = require("../models/homeFeedModel");

/**
 * Calls the followUser model and tries to follow the followee_id
 * @param {String} followee_id
 * @param {*} res
 * @returns {Object}  {success: bool, message: String}
 */
const follow = async (req, res) => {
  //retrives the follower_id from jwt
  const follower_id = req.user?.username;

  const followee_id = req.body.followee_id;

  //checks if both the follower_id and followee_id are provided
  if (!follower_id || !followee_id) {
    console.log("Both follower and followe ids are required");
    return res
      .status(400)
      .json({
        success: false,
        error: "Both follower and followee id's are required",
      });
  }

  //checks if the user tries to follow themself
  if (follower_id === followee_id) {
    console.log("User canot follow themself");
    return res
      .status(400)
      .json({ success: false, error: "User can't follow themself" });
  }

  try {
    const response = await followUser(follower_id, followee_id);
    if (response.success) {

       const followeeKey = `followee:${follower_id}`;
   
       //delete the cached if exits
        await redisClient.del(followeeKey);

        const updatedlist = await getAllFollowees(follower_id);

        //cahced the updated followee list
        if (updatedlist != undefined) {
          await redisClient.set(
            followeeKey,
            JSON.stringify(updatedlist),
            "EX",
            86400
          );
      }

      return res
        .status(200)
        .json({ success: true, message: "Successfully followed" });
    } else {
      return res.status(500).json({ success: false, error: response.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};





/**
 *
 * @param {*} req
 * @param {*} res
 * @returns {Object} {success: bool, message: String}
 */

const unfollow = async (req, res) => {
  //extracts follower_id from jwt
  const follower_id = req.user?.username;

  const followee_id = req.body.followee_id;

  //checks if both follower id and followee id are provided
  if (!follower_id || !followee_id) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Both follower and followee id's are required",
      });
  }

  //checks if user is trying to unfollown themself
  if (follower_id === followee_id) {
    return res
      .status(400)
      .json({ success: false, error: "User can't unfollow them self" });
  }

  try {
    const response = await unfollowUser(follower_id, followee_id);
    if (response.success) {

       const followeeKey = `followee:${follower_id}`;

       //delete the cached followee list if exits
       await redisClient.del(followeeKey);

       const updatedList = await getAllFollowees(follower_id);

       //cached the updated lists if exits
       if(updatedList != undefined){
          await redisClient.set(followeeKey, JSON.stringify(updatedList), 'EX', 86400);
       }

      console.log("Successfully unfollowed the user");
      return res
        .status(200)
        .json({ success: true, message: "Successfully unfollowed the user" });
    } else {
      console.log("Failed to unfollow the user");
      return res.status(500).json({ success: false, error: response.error });
    }
  } catch (error) {
    console.log("failed to unfollow user while catching");
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  follow,
  unfollow,
};
