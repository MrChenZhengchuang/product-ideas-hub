export function AboutPage() {
  return (
    <section className="publish-page">
      <div className="publish-page__hero">
        <p className="section-heading__eyebrow">About Product Ideas</p>
        <h1>一个帮助大家整理和发现产品机会的平台</h1>
        <p>我们希望把零散的灵感、经验和行业洞察沉淀成可以被讨论、被验证、被共创的项目想法。</p>
      </div>

      <div className="publish-layout">
        <div className="publish-panel__form publish-panel__form--page">
          <div className="publish-field">
            <label>我们在做什么</label>
            <div className="info-block">
              提供项目浏览、发布、筛选、趋势整理和详情查看，让好想法不只停留在聊天记录和脑海里。
            </div>
          </div>
          <div className="publish-field">
            <label>适合谁使用</label>
            <div className="info-block">
              独立开发者、产品经理、创业团队、运营同学，以及任何对新产品机会感兴趣的人。
            </div>
          </div>
        </div>

        <aside className="publish-panel__aside publish-panel__aside--page">
          <h3>平台原则</h3>
          <ul>
            <li>鼓励真实问题导向</li>
            <li>强调可执行和可验证</li>
            <li>支持公开讨论和协作</li>
            <li>让好点子更快被看到</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
