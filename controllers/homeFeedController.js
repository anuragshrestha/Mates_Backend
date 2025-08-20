const {
  getUserData,
  getAllFollowees,
  getAroundYouPosts,
  addLikes,
  deleteLikes,
  getForYouPost,
} = require("../models/homeFeedModel");


/**
 * Fetched all the latest 6 post for the `Around you home feed`.
 * @param {*} req
 * @param {*} res
 * @returns latest 20 posts
 */
const getAroundYouFeed = async (req, res) => {
  try {
    //Retrives the user id.
    const userId = req.user?.username?.trim();
    let { limit = 6, page = 1 } = req.query;
    limit = parseInt(limit);
    page = parseInt(page);

    const offset = (page - 1) * limit;

    //checks if there is a userId in request. If not then returns 401 error.
    if (!userId) return res.status(401).json({ message: "Unauthorized user" });

    console.log(
      `Fetching feed - Page: ${page}, Limit: ${limit}, Offset: ${offset}`
    );


    let user, followees, posts;

  
      user = await getUserData(userId);

      followees = await getAllFollowees(userId);
    

    const result = await getAroundYouPosts(
      followees,
      user.university_name,
      userId,
      limit,
      offset
    );
    posts = result.posts;
    const totalPosts = result.totalCount;

    const hasMore = offset + posts.length < totalPosts;

    console.log("posts: ", posts);

    return res
      .status(200)
      .json({
        success: true,
        posts: posts,
        user_id: userId,
        currentPage: page,
        limit: limit,
        totalPosts: totalPosts,
        hasMore: hasMore,
      });
  } catch (error) {
    console.error("Error in fetching home feed: ", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


/**
 * Fetched all the latest 6 post for the `For You home feed`.
 * @param {*} req
 * @param {*} res
 * @returns latest 20 posts from different university students.
 */
const getForYouFeed = async (req, res) => {

  try {
    const userId = req.user?.username?.trim();
    let { limit = 6, page = 1 } = req.query;
    limit = parseInt(limit); page = parseInt(page);
    const offset = (page - 1) * limit;

    if (!userId) return res.status(401).json({ message: "Unauthorized user" });

  
    let user, followees;

   
    user = await getUserData(userId);
    followees = await getAllFollowees(userId);
   

    console.log("followees: ", followees);
    console.log('university name: ', user.university_name);

    
    
    const { posts, totalCount } = await getForYouPost(
      followees || [],
      user.university_name,
      userId,
      limit,
      offset
    );

    const hasMore = offset + posts.length < totalCount;

    return res.status(200).json({
      success: true,
      posts,
      user_id: userId,
      currentPage: page,
      limit,
      totalPosts: totalCount,
      hasMore,
    });
  } catch (error) {
    console.error("Error in fetching outside feed:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};



/**
 * Calls the addLikes to add a new like to a post
 * by the user.
 * @param {*} req
 * @param {*} res
 * @returns success: true else false
 */
const likePost = async (req, res) => {
  const user_id = req.user?.username?.trim();
  const post_id = req.params.postId;

  console.log("user id is: ", user_id);

  try {
    await addLikes(user_id, post_id);
    console.log("successfully liked the post, ", post_id);
    return res.status(200).json({ success: true, message: post_id });
  } catch (error) {
    console.log("failed to fetched the liked posts");
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Calls the deletedlikes and unlike the post.
 * @param {*} req
 * @param {*} res
 * @returns
 */

const unLikePost = async (req, res) => {
  const user_id = req.user?.username?.trim();
  const post_id = req.params.postId;

  try {
    await deleteLikes(user_id, post_id);
    console.log("successfully unliked the post, ", post_id);
    return res.status(200).json({ success: true, message: post_id });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAroundYouFeed,
  getForYouFeed,
  likePost,
  unLikePost,
};
