export default defineAppConfig({
  entryPagePath: 'pages/home/index',
  pages: [
    'pages/home/index',
    'pages/trends/index',
    'pages/publish/index',
    'pages/me/index',
    'pages/auth/index',
    'pages/project-detail/index',
    'pages/about/index',
    'pages/change-password/index'
  ],
  window: {
    navigationBarTitleText: '产品点子',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f7fb',
    backgroundTextStyle: 'light'
  },
  tabBar: {
    color: '#7a8499',
    selectedColor: '#111827',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: '/static/tabbar/home.svg',
        selectedIconPath: '/static/tabbar/home-active.svg'
      },
      {
        pagePath: 'pages/trends/index',
        text: '趋势',
        iconPath: '/static/tabbar/trend.svg',
        selectedIconPath: '/static/tabbar/trend-active.svg'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发布',
        iconPath: '/static/tabbar/publish.svg',
        selectedIconPath: '/static/tabbar/publish-active.svg'
      },
      {
        pagePath: 'pages/me/index',
        text: '我的',
        iconPath: '/static/tabbar/me.svg',
        selectedIconPath: '/static/tabbar/me-active.svg'
      }
    ]
  }
});
