const multer = require("multer");
const storage = multer.memoryStorage();

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
  'video/mp4',        
   'video/quicktime',
   'video/x-msvideo',   
   'video/x-matroska',  
   'video/webm',        
   'video/mpeg',       
   'video/x-flv',     
   'video/3gpp',       
   'video/3gpp2'
];

//checking the type of the image
const filterFile = async (req, file, cb) => {
  try {
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`valid media type for post: , ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`Invalid file type for post: ${file.mimetype}`);

      cb(new Error("Unsupported file type"), false);
    }
  } catch (error) {
    console.log("Error checking file type ", error);
    throw new error();
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: filterFile,
});

module.exports = upload;
