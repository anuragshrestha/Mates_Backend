const pool = require('../database/db');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }

});

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heif']


exports.uploadProfileImage = async(req, res) => {

    const file = req.file;

    const {
        email,
        full_name,
        university_name,
        major,
        school_year
    } = req.body;


    if(!file || !email || !full_name || !university_name || !major || !school_year){
        return res.status(400).json({success: false, error: 'All fields and image are required'});
    }

    if(!allowedTypes.includes(file.mimetype)){
        return res.status(400).json({success: false, error: "Unsupported image type"});
    }

    const key = `profile_images/${email}.jpg`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    });

    try{
        const upload = await s3.send(command);
        const imageUrl =  upload.Location;

        const query = `
        UPDATE users
        SET profile_image_url = $1
        WHERE email = $2
        `;

        await pool.query(query, [imageUrl, email]);

        return res.status(200).json({success: true, imageUrl});
    }catch(error){
        console.error('S3 upload error:', error);
        res.status(500).json({success: false, error: 'Image upload failed'});
    }

};