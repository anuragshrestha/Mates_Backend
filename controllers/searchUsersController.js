const {searchUser} = require('../models/searchUsersModel');

const searchName = async(req, res, next) => {

    const {query} = req.query;

    try{

       if(!query || query.trim() === ''){
        return res.status(400).json({success: false, error: 'Missing query parameter'});
       }

        const names = await searchUser(query);
        res.status(200).json({success: true, names});
    }catch(error){
        next(error)
    }
};

module.exports = {
    searchName
}