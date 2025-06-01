import React, { useEffect, useRef, useState } from "react";
import "./NewProject.css";
import axios from "axios";
import { toast } from "react-toastify";
import { ImSpinner4, ImCross, ImMinus, ImCheckmark } from "react-icons/im";

const NewProject = () => {
  const [gitUrl, setGitUrl] = useState("");
  const [customDir, setCustomDir] = useState("");
  const [customURL, setCustomURL] = useState("");
  const [URLCheck, setURLCheck] = useState("none");
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

  const handleURLChange = async (e) => {
    setCustomURL(e.target.value);
    if (e.target.value === "") {
      setURLCheck("none");
    } else {
      setURLCheck("loading");
      try {
        const response = await axios.post(
          // "https://chinmaydesai.site/deploy-it-api/checkURL",
          "http://localhost:9000/checkURL",
          {
            projectSlug: e.target.value,
          }
        );
        console.log(response);
        if (response.data.code === "409") {
          setURLCheck("false");
        } else if (response.data.code === "200") {
          setURLCheck("true");
        }
      } catch (error) {
        console.log(error);
        toast.error(error?.response?.data?.ERROR || "Error sending request");
      }
    }
  };

  const handleDeploy = async () => {
    if ((!customDir, !gitUrl, !customDir)) {
      toast.error("Fill in all fields!");
      return;
    }
    if (URLCheck === "false") {
      toast.error("URL unavailable, please enter something else.");
      return;
    }
    try {
      const response = await axios.post(
        // "https://chinmaydesai.site/deploy-it-api/deploy",
        "http://localhost:9000/deploy",
        {
          gitURL: gitUrl,
          customDir,
          slug: customURL,
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
          DeployIt
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
          <div className="input-wrapper custom-url">
            <label htmlFor="customURL">Custom URL (Optional)</label>
            <div className="input-loader-wrapper">
              <input
                placeholder="something-unique"
                name="customURL"
                type="text"
                className="form-input"
                onChange={(e) => handleURLChange(e)}
              />
              {URLCheck === "none" && <ImMinus color="#ecc94b" />}
              {URLCheck === "true" && <ImCheckmark color="#ecc94b" />}
              {URLCheck === "false" && <ImCross color="#FF7F7F" />}
              {URLCheck === "loading" && (
                <ImSpinner4 className="loader" color="#ecc94b" />
              )}
            </div>
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
