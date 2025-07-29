const express = require("express");
const cors = require("cors");
// const { exec } = require("child_process");
const crypto = require("crypto");
const mongoose = require("mongoose");
// const util = require("util");
const { generateSlug } = require("random-word-slugs");
const {
  ECSClient,
  RunTaskCommand,
  DescribeTasksCommand,
} = require("@aws-sdk/client-ecs");
require("dotenv").config({ quiet: true });

// const execPromise = util.promisify(exec);
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 9000;
const ACCESSKEYID = process.env.AWS_ACCESS_ID;
const SECRETACCESSKEY = process.env.AWS_SECRET_ID;
const AWS_ECS_CLUSTER = process.env.AWS_ECS_CLUSTER;
const AWS_ECS_TASK = process.env.AWS_ECS_TASK;
const AWS_ECS_TASK_ARN_PREFIX = process.env.AWS_ECS_TASK_ARN_PREFIX;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((error) => console.error(error));

const projectSchema = new mongoose.Schema({
  gitURL: {
    type: String,
    required: true,
  },
  customDir: {
    type: String,
    required: true,
  },
  projectSlug: {
    type: String,
    required: true,
    unique: true,
  },
  userEnvs: [{ type: String }],
});

const Project = mongoose.model("project", projectSchema);

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

app.post("/checkURL", async (req, res) => {
  const { projectSlug } = req.body;
  console.log(projectSlug);
  if (!projectSlug) {
    return res.json({ ERROR: "Missing required Fields!" });
  }

  const result = await Project.find({ projectSlug: projectSlug.toLowerCase() });

  if (result.length > 0) {
    console.log(result);
    return res.status(200).json({ code: "409", status: "Already Exists" });
  } else {
    return res.status(200).json({ code: "200", status: "Available" });
  }
});

app.post("/deploy", async (req, res) => {
  const { gitURL, gitBranch, slug, customDir, envs: userEnvs } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  if (!gitURL && !gitBranch) {
    return res.json({ ERROR: "Missing required Fields!" });
  }

  baseEnvs = [
    { name: "GIT_REPOSITORY__URL", value: gitURL },
    { name: "GIT_REPOSITORY_BRANCH", value: gitBranch },
    { name: "PROJECT_ID", value: projectSlug },
    { name: "CUSTOM_DIR", value: customDir },
  ];

  console.log(baseEnvs.concat(userEnvs));

  try {
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
            environment: baseEnvs.concat(userEnvs),
          },
        ],
      },
    });

    const response = await ecsClient.send(command);
    console.log(response);

    const statusCallbackARN = response.tasks[0]?.taskArn.split("/");
    const statusCallbackID = statusCallbackARN[statusCallbackARN.length - 1];

    const result = await Project.insertOne({
      customDir,
      gitURL,
      projectSlug: projectSlug,
      gitBranch,
      userEnvs: userEnvs ? userEnvs.map((env) => env.name) : [],
    });

    console.log("New Project created in DB", result);

    return res.json({
      status: "QUEUED",
      statusCallback: `${statusCallbackID}`,
      data: {
        projectSlug,
        url: `https://${projectSlug}.deploy.chinmaydesai.site`,
      },
    });
  } catch (error) {
    console.error(error.message);
    return res.json({
      ERROR: "Some error has occured, please try again later.",
    });
  }
});

const getBuildStatusFromObject = (task) => {
  if (task.lastStatus === "PROVISIONING" || task.lastStatus === "PENDING") {
    return "QUEUED";
  } else if (task.lastStatus === "RUNNING") {
    return "BUILDING";
  } else if (
    task.lastStatus === "DEPROVISIONING" ||
    task.lastStatus === "STOPPED"
  ) {
    const buildStatus = task.containers[0].exitCode;
    if (buildStatus) {
      return "BUILD FAILED";
    } else {
      return "BUILD COMPLETE";
    }
  } else {
    return "UNKNOWN";
  }
};

app.post("/checkBuildStatus", async (req, res) => {
  const { taskARN } = req.body;

  if (!taskARN) {
    res.json({ ERROR: "Missing required fields!" });
  }

  const getBuildStatus = new DescribeTasksCommand({
    cluster: AWS_ECS_CLUSTER,
    tasks: [`${AWS_ECS_TASK_ARN_PREFIX + taskARN}`],
  });

  const response = await ecsClient.send(getBuildStatus);

  if (response?.failures[0]?.reason === "MISSING") {
    res.json({ ERROR: "No such task exists!" });
  }

  const status = getBuildStatusFromObject(response.tasks[0]);

  return res.json({ status });
});

app.listen(PORT, () => {
  console.log(`Deploy server listening on http://localhost:${PORT}`);
});
