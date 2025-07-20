const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("oci-objectstorage");
const common = require("oci-common");
const mime = require("mime-types");
require("dotenv").config({ quiet: true });

const configurationFilePath = "./config.oci";
const configProfile = "DEFAULT";
const provider = new common.ConfigFileAuthenticationDetailsProvider(
  configurationFilePath,
  configProfile
);

const client = new os.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const PROJECT_ID = process.env.PROJECT_ID;
const CUSTOM_DIR = process.env.CUSTOM_DIR || "";
const BUCKET_NAMESPACE = process.env.BUCKET_NAMESPACE;
const BUCKET_NAME = process.env.BUCKET_NAME;

async function init() {
  console.log("Executing script.js");
  const outDirPath = path.join(__dirname, "output", CUSTOM_DIR);

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error", data.toString());
  });

  p.on("close", async function () {
    console.log("Build Complete");
    const distFolderPath = path.join(__dirname, "output", CUSTOM_DIR, "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);
      const namespace = BUCKET_NAMESPACE;
      const bucket = BUCKET_NAME;

      const putObjectRequest = {
        namespaceName: namespace,
        bucketName: bucket,
        putObjectBody: fs.createReadStream(filePath),
        objectName: `__outputs/${PROJECT_ID}/${file}`,
        contentType: mime.lookup(filePath),
      };
      await client.putObject(putObjectRequest);

      console.log("Uploaded", filePath);
    }
    console.log("Done...");
  });
}

init();
