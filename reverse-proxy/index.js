const express = require("express");
const httpProxy = require("http-proxy");
const axios = require("axios");

const app = express();
const PORT = 8000;

const BASE_PATH = process.env.PATH_TO_BUCKET;
const ERROR_PATH = process.env.PATH_TO_ERROR;

const proxy = httpProxy.createProxy();

app.use(async (req, res) => {
  const hostname = req.hostname;
  console.log(req.hostname);
  const subdomain = hostname.split(".")[0];

  const resolvesTo = `${BASE_PATH}%2F${subdomain}`;
  console.log(resolvesTo);
  try {
    const folderCheckResponse = await axios.get(resolvesTo + "/index.html");
    // console.log(folderCheckResponse);

    if (folderCheckResponse.status === 200) {
      return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
    } else {
      return proxy.web(req, res, {
        target: ERROR_PATH,
        changeOrigin: true,
      });
    }
  } catch (error) {
    // console.log(error);
    res.redirect(ERROR_PATH);
  }
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`));
