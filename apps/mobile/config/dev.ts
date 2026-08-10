export default {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    CLIENT_API_ORIGIN: '"http://127.0.0.1:8080"',
    CLIENT_WEB_ORIGIN: '"http://127.0.0.1:5173"'
  },
  mini: {},
  h5: {
    devServer: {
      port: 10086,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8080',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://127.0.0.1:8080',
          changeOrigin: true
        }
      }
    }
  }
};
