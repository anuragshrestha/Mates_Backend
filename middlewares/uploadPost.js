const multer = require('multer')
const storage = multer.memoryStorage();

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heif'];


//checking the type of the image
const filterFile = async(req, file, cb) => {
   
    try{
     if(allowedTypes.includes(file.mimetype)){
        console.log(`valid image type for post: , ${file.mimetype}`);
        cb(null, true)
     }else{
        console.log(`Invalid file type for post: ${file.mimetype}`);
        
        cb(new Error('Unsupported file type'), false);
     }
    }catch(error){
       console.log('Error checking file type ', error);
       throw new error;
    }
};

const upload = multer({
    storage: storage,
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter: filterFile
});

module.exports = upload;
