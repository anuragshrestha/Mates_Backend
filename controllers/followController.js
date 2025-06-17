const { followUser, unfollowUser } = require("../models/followModel");
const redisClient = require("../utils/redis");
const { getAllFollowees, getPosts, getUserData } = require("../models/homeFeedModel");

/**
 * Calls the followUser model and tries to follow the followee_id
 * @param {String} followee_id
 * @param {*} res
 * @returns {Object}  {success: bool, message: String}
 */
const follow = async (req, res) => {

  //retrives the follower_id from jwt
  const follower_id = req.user?.username?.trim();
  const followee_id = req.body.followee_id?.trim();

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
       const postsKey = `feed:${follower_id}`;
       const userKey = `user:${follower_id}`;
   
       //delete the cached following list and posts if exits
        await redisClient.del(followeeKey);
        await redisClient.del(postsKey);

        const updatedlist = await getAllFollowees(follower_id);

        //cached the updated followee list
        if (updatedlist != undefined) {
          await redisClient.set(
            followeeKey,
            JSON.stringify(updatedlist),
            "EX",
            86400
          );
      };

      let userData = await redisClient.get(userKey);
    
      if(userData == undefined){
        userData = await getUserData(follower_id);
      }

      const updatedPost = await getPosts(updatedlist, userData.university_name, follower_id);
      
      if (updatedPost != undefined){
          //cached the posts with updated following list
          await redisClient.set(postsKey, JSON.stringify(updatedPost), 'EX', 60);
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
  const follower_id = req.user?.username?.trim();
  const followee_id = req.body.followee_id?.trim();

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
       const postKey = `feed:${follower_id}`;
       const userKey = `user:${follower_id}`;

       //delete the cached followee list and posts if exits
       await redisClient.del(followeeKey);
       await redisClient.del(postKey);

       const updatedFolloweeList = await getAllFollowees(follower_id);

       //cached the updated lists if exits
       if(updatedFolloweeList != undefined){
          await redisClient.set(followeeKey, JSON.stringify(updatedFolloweeList), 'EX', 86400);
       }

       let userData = await redisClient.get(userKey);

       if(userData == undefined){
         userData = await getUserData(follower_id);
       }

       const updatedPosts = await getPosts(updatedFolloweeList, userData.university_name, follower_id);

       if(updatedPosts != undefined){
           //cached the updated post with the new following list
           await redisClient.set(postKey, JSON.stringify(updatedPosts), 'EX', 60);
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
