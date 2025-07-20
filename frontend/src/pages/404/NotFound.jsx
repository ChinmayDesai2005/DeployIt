import React, { useEffect, useState } from "react";
import "./NotFound.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [redirectLink, setRedirectLink] = useState();

  useEffect(() => {
    if (searchParams.get("link")) {
      setRedirectLink(
        `https://${searchParams.get("link")}.deploy.chinmaydesai.site`
      );
    }
  }, [searchParams]);

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
        {redirectLink && (
          <div className="try-again-wrapper">
            Try Again: <Link to={redirectLink}>{redirectLink}</Link>
          </div>
        )}
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
