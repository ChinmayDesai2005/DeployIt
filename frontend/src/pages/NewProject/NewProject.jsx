import React, { useEffect, useRef, useState } from "react";
import "./NewProject.css";
import axios from "axios";
import { toast } from "react-toastify";

const NewProject = () => {
  const [gitUrl, setGitUrl] = useState("");
  const [customDir, setCustomDir] = useState("");
  const [response, setResponse] = useState();

  const responseRef = useRef(null);

  const handleGitChange = (e) => {
    setResponse();
    setGitUrl(e.target.value);
  };

  const handleDirChange = (e) => {
    setResponse();
    setCustomDir(e.target.value);
  };

  const handleDeploy = async () => {
    try {
      const response = await axios.post(
        "https://chinmaydesai.site/deploy-it-api/deploy",
        {
          gitURL: gitUrl,
          customDir,
        }
      );
      console.log(response);
      setResponse(response.data.data);
      if (response.data.status === "queued") {
        toast.success("Project Queued and Building...");
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.ERROR || "Error sending request");
    }
    console.log(gitUrl, customDir);
  };

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [response]);

  return (
    <>
      <div className="not-found-footer">
        <div className="deployit-title" onClick={() => navigate("/")}>
          D
        </div>
      </div>
      <div className="project-wrapper">
        <div className="form-div">
          <div className="title">New Project</div>

          <div className="input-wrapper">
            <label htmlFor="git">GitHub URL</label>
            <input
              placeholder="https://github.com/deployit/testProject"
              name="git"
              type="text"
              className="form-input"
              onChange={(e) => handleGitChange(e)}
            />
          </div>
          <div className="input-wrapper">
            <label htmlFor="customDir">Frontend Directory</label>
            <input
              placeholder="./frontend"
              name="customDir"
              type="text"
              className="form-input"
              onChange={(e) => handleDirChange(e)}
            />
          </div>
          <button type="submit" className="form-submit" onClick={handleDeploy}>
            Deploy
          </button>
        </div>
        {response && (
          <div className="response-wrapper" ref={responseRef}>
            <div className="title">Deployment Details</div>
            <div className="info-wrapper">
              <div className="github-info info-section">
                <div className="info-title">Github Link:</div>
                <div className="info-content">
                  <a className="response-link" target="_blank" href={gitUrl}>
                    {gitUrl}
                  </a>
                </div>
              </div>
              <div className="custom-dir-info info-section">
                <div className="info-title">Frontend Directory: </div>
                <div className="info-content">{customDir}</div>
              </div>
              <div className="project-slug info-section">
                <div className="info-title">Project ID / Slug </div>
                <div className="info-content">{response.projectSlug}</div>
              </div>
              <div className="project-link info-section">
                <div className="info-title">Deployed Link</div>
                <div className="info-content ">
                  <a
                    className="response-link"
                    target="_blank"
                    href={response.url}
                  >
                    {response.url}
                  </a>
                </div>
              </div>
              <div className="note-wrapper">
                Note: Allow DeployIt alteast 1 minute to build and deploy your
                project before retrying.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewProject;
