const  {getUserData, getAllFollowees, getPosts} = require("../models/homeFeedModel");
const redisClient = require('../utils/redis')

const getFeed = async(req, res) => {

    try{
       const userId = req.user?.username;
       

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
      }else{
        user = await getUserData(userId);

        if(user != undefined){
          //cache it for 1 week
          console.log('storing user in redis: ', user);
          
          await redisClient.set(userKey, JSON.stringify(user), 'EX', 604800);
        } 
      }

      if(cachedFollowees){
        followees = JSON.parse(cachedFollowees);
      }else{
        followees = await getAllFollowees(userId);
        if(followees != undefined){
          //cache it for 1 day.
           console.log('storing followees in redis: ', followees);
          await redisClient.set(followeeKey, JSON.stringify(followees), 'EX', 86400);
        }

      }

      if(cachedPosts){
        posts = JSON.parse(posts);
      }else{
        posts = await getPosts(followees, user.university_name);
        if(posts != undefined){
          //cache it for 2 minutes
          console.log('storing posts in redis: ', posts);
          await redisClient.set(postsKey, JSON.stringify(posts), 'EX', 120);
        }
      }

      return res.status(200).json({success: true, user, posts});

    } catch(error){
        console.error('Error in fetching home feed: ', error);
        return res.status(500).json({success: false, error: error.message})
    }

}


module.exports = {
  getFeed
};