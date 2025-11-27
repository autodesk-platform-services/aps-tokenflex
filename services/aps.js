const {
  AuthenticationClient,
  ResponseType,
} = require("@aps_sdk/authentication");
const {
  APS_CLIENT_ID,
  APS_CLIENT_SECRET,
  APS_CALLBACK_URL,
  INTERNAL_TOKEN_SCOPES,
  PUBLIC_TOKEN_SCOPES,
} = require("../config.js");

const authenticationClient = new AuthenticationClient();
const service = (module.exports = {});

service.getAuthorizationUrl = () =>
  authenticationClient.authorize(
    APS_CLIENT_ID,
    ResponseType.Code,
    APS_CALLBACK_URL,
    INTERNAL_TOKEN_SCOPES
  );

service.authCallbackMiddleware = async (req, res, next) => {
  const internalCredentials = await authenticationClient.getThreeLeggedToken(
    APS_CLIENT_ID,
    req.query.code,
    APS_CALLBACK_URL,
    {
      clientSecret: APS_CLIENT_SECRET,
    }
  );
  const publicCredentials = await authenticationClient.refreshToken(
    internalCredentials.refresh_token,
    APS_CLIENT_ID,
    {
      clientSecret: APS_CLIENT_SECRET,
      scopes: PUBLIC_TOKEN_SCOPES,
    }
  );
  req.session.public_token = publicCredentials.access_token;
  req.session.internal_token = internalCredentials.access_token;
  req.session.refresh_token = publicCredentials.refresh_token;
  req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
  next();
};

service.authRefreshMiddleware = async (req, res, next) => {
  const { refresh_token, expires_at } = req.session;
  if (!refresh_token) {
    res.status(401).end();
    return;
  }

  if (expires_at < Date.now()) {
    const internalCredentials = await authenticationClient.refreshToken(
      refresh_token,
      APS_CLIENT_ID,
      {
        clientSecret: APS_CLIENT_SECRET,
        scopes: INTERNAL_TOKEN_SCOPES,
      }
    );
    const publicCredentials = await authenticationClient.refreshToken(
      internalCredentials.refresh_token,
      APS_CLIENT_ID,
      {
        clientSecret: APS_CLIENT_SECRET,
        scopes: PUBLIC_TOKEN_SCOPES,
      }
    );
    req.session.public_token = publicCredentials.access_token;
    req.session.internal_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
  }
  req.internalOAuthToken = {
    access_token: req.session.internal_token,
    expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
  };
  req.publicOAuthToken = {
    access_token: req.session.public_token,
    expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
  };
  next();
};

service.getUserProfile = async (accessToken) => {
  const resp = await authenticationClient.getUserInfo(accessToken);
  return resp;
};
