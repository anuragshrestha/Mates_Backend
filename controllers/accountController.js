

/**
 * Fetches the posts of the user based on the user_id
 * @param {*} req 
 * @param {*} res 
 * @returns post with limit
 */
const getUserPost = async(req, res) => {

    const userId = req.user?.username;
    const {limit: 9, offset: 0} = req.query;
    
    if (!userId){
        return res.status(400).json({
            success: false,
            error: "user id is required"
        });
    }


    try{
          const posts = await fetchUserPost(userId, parseInt(limit), parseInt(offset));
          return res.status(200).json({success: true, message: "Successfully fetched post", posts: posts});
    }catch(error){
           console.log('failed to fetched posts: ', error.message);
           return res.status(500).json({success: false, error: error.message});
    }
} 