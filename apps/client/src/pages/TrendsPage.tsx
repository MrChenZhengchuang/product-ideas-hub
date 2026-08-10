export function TrendsPage() {
  return (
    <section className="publish-page">
      <div className="publish-page__hero">
        <p className="section-heading__eyebrow">Trends Ranking</p>
        <h1>近期值得关注的产品方向</h1>
        <p>从项目热度、讨论频率和实际落地场景出发，整理当前更值得优先关注的产品趋势。</p>
      </div>

      <div className="publish-layout">
        <div className="publish-panel__form publish-panel__form--page">
          <div className="publish-field">
            <label>TOP 1</label>
            <div className="info-block">
              AI 垂直助手：更聚焦具体角色、具体动作、具体交付结果，而不是泛化问答。
            </div>
          </div>
          <div className="publish-field">
            <label>TOP 2</label>
            <div className="info-block">
              电商增长工具：围绕选品、素材、投放和转化优化的轻量工作台仍然很有机会。
            </div>
          </div>
          <div className="publish-field">
            <label>TOP 3</label>
            <div className="info-block">
              创作者生产力：选题池、内容拆解、账号协作、知识沉淀等方向会持续增长。
            </div>
          </div>
        </div>

        <aside className="publish-panel__aside publish-panel__aside--page">
          <h3>判断标准</h3>
          <ul>
            <li>问题是否高频刚需</li>
            <li>用户是否愿意持续付费</li>
            <li>能否快速验证 MVP</li>
            <li>是否存在清晰的获客路径</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
