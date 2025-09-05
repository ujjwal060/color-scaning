import dotenv from "dotenv";
import multer from "multer";
import { S3 } from "@aws-sdk/client-s3";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

dotenv.config();

const secretsManagerClient = new SecretsManagerClient({
  region: "us-east-1", // Secrets Manager region
});

// ✅ Fetch AWS credentials and config
const getAwsCredentials = async () => {
  const command = new GetSecretValueCommand({
    SecretId: "alex-src",
  });

  const data = await secretsManagerClient.send(command);

  if (!data.SecretString) {
    throw new Error("No secret string returned from AWS Secrets Manager");
  }

  const secret = JSON.parse(data.SecretString);

  return {
    accessKeyId: secret.AWS_ACCESS_KEY_ID,
    secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
    bucketName: secret.AWS_S3_BUCKET_NAME,
    region: secret.AWS_REGION,
  };
};

const getS3Client = async () => {
  const credentials = await getAwsCredentials();

  const s3Client = new S3({
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    region: credentials.region,
  });

  return { s3Client, config: credentials };
};
const storage = multer.memoryStorage();

const upload = multer({ storage }).fields([
  { name: "files", maxCount: 10 }, // accept multiple files under "files"
]);


const uploadToS3 = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || !req.files.files || req.files.files.length === 0) {
      req.fileLocations = [];
      return next();
    }

    try {
      const { s3Client, config } = await getS3Client();
      const fileLocations = [];

      for (const file of req.files.files) {
        const fileKey = `${Date.now()}-${file.originalname}`;
        const params = {
          Bucket: config.bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await s3Client.putObject(params);

        const fileUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;
        fileLocations.push(fileUrl);
      }

      req.fileLocations = fileLocations;
      next();
    } catch (uploadError) {
      console.error("Upload Error:", uploadError);
      return res
        .status(500)
        .json({ success: false, error: uploadError.message });
    }
  });
};


export default uploadToS3;
