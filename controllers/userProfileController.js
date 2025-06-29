const {getUserCounts, getFollowStatus, getUserPosts} = require("../models/userProfileModel");
const redisClient = require('../utils/redis');

const getUserData = async(req, res) => {

    const viewer_id = req.user?.username;
    console.log("userid ", req.user?.username);
    
    const targetUserId = req.params.targetUserId;

    //key for the targeted user
    const targetUserKey = `targetUser:${targetUserId}`;

    //usercounts includes: followers, following and posts counts for targetUser
    let userCounts;

    try{

        //checks the Redis Cache
        const cachedUserCounts = await redisClient.get(targetUserKey);

        if(cachedUserCounts){
           userCounts = JSON.parse(cachedUserCounts);
        } else{
            userCounts = await getUserCounts(targetUserId);

            if(userCounts != undefined){
                //cached the userCounts data for 10 minutes
               await redisClient.set(targetUserKey, JSON.stringify(userCounts), 'EX', 600);
            }
        }

        //followStatus includes isFollowing and isFollowed boolean
        const followStatus = await getFollowStatus(viewer_id, targetUserId);
         
        //posts craeted by the targetedUser
        const posts = await getUserPosts(viewer_id,targetUserId);

        return res.status(200).json({
            success: true,
            user_id: targetUserId,
            ...userCounts,
            ...followStatus,
            posts
        })

    }catch(error){
        console.log('error fetching user data ', error.message);
        return res.status(500).json({success: false, error: error.message})
        
    }
}


module.exports = {
    getUserData
}