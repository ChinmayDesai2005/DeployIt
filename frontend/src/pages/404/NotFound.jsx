import React from "react";
import "./NotFound.css";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="not-found-wrapper">
        <div className="not-found-content">
          <div className="not-found-text">
            <div>404</div>Not Found
          </div>
          <div className="help-text">
            We failed to find your page. This could be due to one of the
            following reasons:
            <ol>
              <li>
                The project might still be building.🚧
                <p>Please try refreshing the page after a few moments.</p>
              </li>
              <li>
                You may have entered an incorrect URL.🔍
                <p>Double-check the link and try again.</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <div className="not-found-footer">
        <div className="deployit-title" onClick={() => navigate("/")}>
          DeployIt
        </div>
        <div className="get-back" onClick={() => navigate("/")}>
          Deploy a new project.
        </div>
      </div>
    </>
  );
};

export default NotFound;
