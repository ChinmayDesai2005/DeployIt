const express = require("express");
const cors = require("cors");
// const { exec } = require("child_process");
const crypto = require("crypto");
// const util = require("util");
const { spawn } = require("child_process");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");

// const execPromise = util.promisify(exec);
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 9000;
const ACCESSKEYID = process.env.AWS_ACCESS_ID;
const SECRETACCESSKEY = process.env.AWS_SECRET_ID;
const AWS_ECS_CLUSTER = process.env.AWS_ECS_CLUSTER;
const AWS_ECS_TASK = process.env.AWS_ECS_TASK;

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: ACCESSKEYID,
    secretAccessKey: SECRETACCESSKEY,
  },
});

const config = {
  CLUSTER: AWS_ECS_CLUSTER,
  TASK: AWS_ECS_TASK,
};

app.use(express.json());

app.post("/deploy", async (req, res) => {
  const { gitURL, slug, customDir } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  if (!gitURL) {
    return res.json({ ERROR: "Missing required Fields!" });
  }
  // Spin the container
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          "subnet-012ab6c210cf72436",
          "subnet-0b3eb7b49c11b6ece",
          "subnet-051b297e138dc5f26",
        ],
        securityGroups: ["sg-036a970ce3582de3d"],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "build-image",
          environment: [
            { name: "GIT_REPOSITORY__URL", value: gitURL },
            { name: "PROJECT_ID", value: projectSlug },
            { name: "CUSTOM_DIR", value: customDir },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);

  return res.json({
    status: "queued",
    data: {
      projectSlug,
      url: `https://${projectSlug}.deploy.chinmaydesai.site`,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Deploy server listening on http://localhost:${PORT}`);
});
