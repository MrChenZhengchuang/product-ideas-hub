import path from 'node:path';
import { defineConfig } from '@tarojs/cli';

export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig = {
    projectName: 'product-ideas-mobile',
    date: '2025-02-14',
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    cache: {
      enable: true
    },
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
      '@tarojs/plugin-framework-react': path.resolve(__dirname, '..', 'node_modules/@tarojs/plugin-framework-react'),
      '@tarojs/router': path.resolve(__dirname, '..', '..', '..', 'node_modules/@tarojs/taro-h5/node_modules/@tarojs/router')
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false
        }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false
        }
      }
    }
  };

  if (command === 'build') {
    const envConfig = mode === 'production' ? require('./prod').default : require('./dev').default;
    return merge({}, baseConfig, envConfig);
  }

  return merge({}, baseConfig, require('./dev').default);
});
