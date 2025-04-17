import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "semantic-ui-css/semantic.min.css";
import Dashboard from "./components/Dashboard";

function getUrlParams() {
  const params = {};
  window.location.search
    .substring(1)
    .split("&")
    .forEach((param) => {
      const [key, value] = param.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
  return params;
}

function App() {
  const [message, setMessage] = useState("🔐 Waiting for SMART Authorization Token...");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const urlParams = getUrlParams();
    const serviceUri = urlParams["iss"];
    const launch = urlParams["launch"];
    const code = urlParams["code"];
    const clientId = "5a63297c-5b19-11ef-8e85-0280bad11495";
    const scope = "launch openid fhirUser patient/*.read";
    const redirectUri = window.location.origin;

    if (code) {
      const tokenUri = sessionStorage.getItem("tokenUri");
      const data = `grant_type=authorization_code&code=${encodeURIComponent(
        code
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${encodeURIComponent(
        clientId
      )}`;

      fetch(tokenUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data,
      })
        .then((res) => res.json())
        .then((tokenResponse) => {
          sessionStorage.setItem("token", tokenResponse.access_token);
          sessionStorage.setItem("auth_response", JSON.stringify(tokenResponse));
          setIsAuthorized(true);
        })
        .catch((err) => {
          console.error("Token Exchange Error:", err);
          setMessage(`❌ Error exchanging code for token: ${err.message}`);
        });
    } else if (serviceUri) {
      // EHR or Standalone launch (depending on presence of `launch`)
      fetch(`${serviceUri}/metadata`)
        .then((res) => res.json())
        .then((metadata) => {
          const securityExt = metadata.rest?.[0]?.security?.extension || [];
          const oauthExt = securityExt.find(
            (ext) =>
              ext.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"
          );

          if (!oauthExt) throw new Error("No OAuth URIs found in metadata");

          const authUri = oauthExt.extension.find((e) => e.url === "authorize")?.valueUri;
          const tokenUri = oauthExt.extension.find((e) => e.url === "token")?.valueUri;

          if (!authUri || !tokenUri)
            throw new Error("Authorization or Token URI not found in metadata");

          sessionStorage.setItem("tokenUri", tokenUri);

          let authorizeUrl =
            `${authUri}?` +
            `response_type=code&` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=8600b31f-52d1-4dca-987c-386e3d8967e9&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `aud=${encodeURIComponent(serviceUri)}`;

          if (launch) {
            authorizeUrl += `&launch=${encodeURIComponent(launch)}`;
          }

          window.location.href = authorizeUrl;
        })
        .catch((err) => {
          console.error("SMART Launch Error:", err);
          setMessage(`❌ Error launching SMART app: ${err.message}`);
        });
    }
  }, []);

  return (
    <div style={{ padding: "2rem", fontSize: "1.2rem" }}>
      {isAuthorized ? <Dashboard /> : message}
    </div>
  );
}

export default App;
