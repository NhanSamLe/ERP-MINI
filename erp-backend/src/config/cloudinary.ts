import { v2 as cloudinary } from "cloudinary";
import {env} from  "./env"
cloudinary.config({
  cloud_name: env.cloudinary.name,
  api_key: env.cloudinary.key,
  api_secret: env.cloudinary.secret,
});

export default cloudinary;
