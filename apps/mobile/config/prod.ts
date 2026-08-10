const clientApiOrigin = process.env.CLIENT_API_ORIGIN || '';
const clientWebOrigin = process.env.CLIENT_WEB_ORIGIN || '';

export default {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    CLIENT_API_ORIGIN: JSON.stringify(clientApiOrigin),
    CLIENT_WEB_ORIGIN: JSON.stringify(clientWebOrigin)
  },
  mini: {},
  h5: {
    publicPath: '/'
  }
};
