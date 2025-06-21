const  {getUserData, getAllFollowees, getPosts, addLikes, deleteLikes} = require("../models/homeFeedModel");
const redisClient = require('../utils/redis')



/**
 * Fetched all the latest 20 post for the home feed.
 * @param {*} req 
 * @param {*} res 
 * @returns latest 20 posts
 */
const getFeed = async(req, res) => {

    try{

       //Retrives the user id.
       const userId = req.user?.username?.trim();
       

       //checks if there is a userId in request. If not then returns 401 error.
       if(!userId) return res.status(401).json({message: "Unauthorized user"})

      const userKey = `user:${userId}`;
      const followeeKey = `followee:${userId}`;
      const postsKey = `feed:${userId}`;
  
      
      //Try to get the cache from redis
      const [cachedUser, cachedFollowees, cachedPosts] = await Promise.all([
         redisClient.get(userKey),
         redisClient.get(followeeKey),
         redisClient.get(postsKey)
      ]);
     

      let user, followees, posts;


      /**
       * Checks if there is cached user, followees and posts. If there is already cache data in redis
       * then parses it in JSON and returns the user and posts at the end.
       * If any of the data is not cache then it calls the corresponding functions from model and queries
       * the data and cache it in redis.
       */

      if(cachedUser){
         user = JSON.parse(cachedUser);
         console.log('user is cached ', user);
         
      }else{
         user = await getUserData(userId);

        if(user != undefined){
          //cache it for 1 week
          console.log('storing user in redis: ', user);
          
          await redisClient.set(userKey, JSON.stringify(user), 'EX', 604800);
        } else{
          console.log('user is defined: ', user);
          
        }
      }

      if(cachedFollowees){
        followees = JSON.parse(cachedFollowees);
        console.log('followese is cached: ', followees);
        
      }else{
        followees = await getAllFollowees(userId);
        if(followees != undefined){
          //cache it for 1 day.
           console.log('storing followees in redis: ', followees);
          await redisClient.set(followeeKey, JSON.stringify(followees), 'EX', 86400);
        }else{
          console.log('followees is defined ', followees);
          
        }

      }

      if(cachedPosts){
        posts = JSON.parse(cachedPosts);
        console.log('posts are cached: ', posts);
        
      }else{
        console.log('university name is: ', user.university_name);
        console.log('userid is: ', userId);
        
        posts = await getPosts(followees, user.university_name, userId);
        if(posts != undefined){
          //cache it for 1 minutes
          console.log('storing posts in redis:');
          await redisClient.set(postsKey, JSON.stringify(posts), 'EX', 60);
        }else{
          console.log('posts is defined: ', posts);
          
        }
      }

      return res.status(200).json({success: true, user, posts});

    } catch(error){
        console.error('Error in fetching home feed: ', error);
        return res.status(500).json({success: false, error: error.message})
    }

}



/**
 * Calls the addLikes to add a new like to a post
 * by the user. 
 * @param {*} req 
 * @param {*} res 
 * @returns success: true else false
 */
const likePost = async(req, res) => {

  const user_id = req.user?.username?.trim();
  const post_id = req.body.post_id;

  console.log('user id is: ', user_id);
  
  try{
       await addLikes(user_id, post_id);
       console.log('successfully liked the post, ', post_id);    
       return res.status(200).json({success: true, post_id});
  }catch (error){
    console.log('failed to fetched the liked posts');
    return res.status(500).json({success: false, error: error.message});
    
  }
}



/**
 * Calls the deletedlikes and unlike the post.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */

const unLikePost = async(req, res) => {

  const user_id = req.user?.username?.trim();
  const post_id = req.body.post_id;


  try{

    await deleteLikes(user_id, post_id);
    console.log('successfully unliked the post, ', post_id);
    return res.status(200).json({success: true, post_id});

  }catch(error){
     return res.status(500).json({success: false, error: error.message});
  }
}







module.exports = {
  getFeed,
  likePost,
  unLikePost
};