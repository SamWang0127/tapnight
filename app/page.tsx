"use client";

import { useEffect, useState } from "react";

type Tab = "home" | "routes" | "menu" | "profile";
type SeasonTheme = "spring" | "summer" | "autumn" | "winter";
type SeasonalMood = { theme: SeasonTheme; term: string; climate: string; glyph: string };

const solarTerms = [
  ["小寒", "大寒", 20], ["立春", "雨水", 19], ["惊蛰", "春分", 20], ["清明", "谷雨", 20],
  ["立夏", "小满", 21], ["芒种", "夏至", 21], ["小暑", "大暑", 22], ["立秋", "处暑", 23],
  ["白露", "秋分", 23], ["寒露", "霜降", 23], ["立冬", "小雪", 22], ["大雪", "冬至", 21],
] as const;

function getSeasonalMood(now = new Date()): SeasonalMood {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric", day: "numeric", timeZone: "Asia/Shanghai",
  }).formatToParts(now);
  const month = Number(parts.find((part) => part.type === "month")?.value || 1);
  const day = Number(parts.find((part) => part.type === "day")?.value || 1);
  const [earlyTerm, lateTerm, changeDay] = solarTerms[month - 1];
  const theme: SeasonTheme = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  const atmospheres = {
    spring: { climate: "细雨 · 花信风", glyph: "〆" }, summer: { climate: "湿热 · 晚风", glyph: "≈" },
    autumn: { climate: "微凉 · 桂香", glyph: "◇" }, winter: { climate: "薄雾 · 干冷", glyph: "✦" },
  };
  return { theme, term: day < changeDay ? earlyTerm : lateTerm, ...atmospheres[theme] };
}

const bars = [
  { id: 1, name: "Archive Room", logo: "AR", logoClass: "logo-archive", area: "陕西北路", crowd: 62, wait: "可直接入座", tone: "mint", left: "30%", top: "58%", tags: ["安静", "威士忌", "有猫"] },
  { id: 2, name: "NO. 17", logo: "17", logoClass: "logo-no17", area: "巨鹿路", crowd: 88, wait: "约等 15 分钟", tone: "coral", left: "59%", top: "36%", tags: ["热闹", "酸感", "新酒单"] },
  { id: 3, name: "Moss", logo: "M", logoClass: "logo-moss", area: "武定路", crowd: 36, wait: "座位充足", tone: "mint", left: "73%", top: "67%", tags: ["植物感", "金酒", "露台"] },
];

const drinks = [
  {
    name: "青梅雨",
    english: "PLUM RAIN",
    bar: "Archive Room · 2026 夏季酒单",
    formula: "青梅浸泡酒 / 干味美思 / 紫苏 / 海盐",
    price: 108,
    color: "#bff4d3",
    tags: ["酸甜", "草本", "低酒精"],
    taste: [74, 38, 22],
  },
  {
    name: "白噪音",
    english: "WHITE NOISE",
    bar: "NO. 17 · 2026 夏季酒单",
    formula: "椰子朗姆 / 澄清菠萝 / 白胡椒 / 苏打",
    price: 118,
    color: "#ebe9df",
    tags: ["清爽", "气泡", "热带"],
    taste: [48, 66, 18],
  },
  {
    name: "夜航船",
    english: "NIGHT FERRY",
    bar: "Moss · 2026 夏季酒单",
    formula: "波本 / 烟熏乌梅 / 黑糖 / 苦精",
    price: 128,
    color: "#c99d79",
    tags: ["烟熏", "厚重", "威士忌"],
    taste: [18, 35, 84],
  },
  {
    name: "晚风信箱",
    english: "NIGHT MAIL",
    bar: "Archive Room · 2026 夏季酒单",
    formula: "金酒 / 桂花 / 白葡萄 / 茉莉冷萃",
    price: 112,
    color: "#f4da8a",
    tags: ["花香", "干爽", "茶感"],
    taste: [32, 72, 30],
  },
];

const navItems: { id: Tab; label: string; glyph: string }[] = [
  { id: "home", label: "发现", glyph: "⌁" },
  { id: "routes", label: "路线", glyph: "↝" },
  { id: "menu", label: "酒单", glyph: "◒" },
  { id: "profile", label: "我的", glyph: "○" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [selectedBar, setSelectedBar] = useState(bars[0]);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [nfcDone, setNfcDone] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [routeLikes, setRouteLikes] = useState(326);
  const [routeDowns, setRouteDowns] = useState(12);
  const [liked, setLiked] = useState(false);
  const [downed, setDowned] = useState(false);
  const [ratedDrinks, setRatedDrinks] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState(["酸一点", "安静", "有小惊喜"]);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const updateTime = () => setTime(new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai",
    }).format(new Date()));
    updateTime();
    const timer = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNfc = () => {
    setNfcDone(true);
    flash("已记录到今晚的路线");
  };

  const handleLike = () => {
    setLiked((value) => !value);
    setRouteLikes((value) => value + (liked ? -1 : 1));
  };

  const handleDown = () => {
    setDowned((value) => !value);
    setRouteDowns((value) => value + (downed ? -1 : 1));
  };

  const rateDrink = (name: string) => {
    if (!ratedDrinks.includes(name)) setRatedDrinks((items) => [...items, name]);
    flash(`已把「${name}」加入今晚`);
  };

  const seasonalMood = getSeasonalMood();

  return (
    <div className={`app-shell season-${seasonalMood.theme}`}>
      <aside className="side-nav" aria-label="主导航">
        <button className="brand-mark" aria-label="8+1 首页" onClick={() => changeTab("home")}>
          <span>8</span><b>+1</b>
        </button>
        <div className="nav-stack">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => changeTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <button className="mini-avatar" onClick={() => changeTab("profile")} aria-label="打开个人主页">SW</button>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div>
            <p className="location-line"><span className="live-dot" />SHANGHAI · JING&apos;AN · {time}</p>
            <h1>{tab === "home" ? "晚上好，Sam。" : tab === "routes" ? "路线，是夜晚的手写体。" : tab === "menu" ? "从一杯开始认识它。" : "你的喝酒档案。"}</h1>
          </div>
          <div className="top-actions">
            <button className="status-pill" onClick={() => flash("城市热力数据刚刚更新")}><span className="live-dot" /> 2,847 人正在喝</button>
            <button className="icon-button" onClick={() => flash("今晚没有新提醒")} aria-label="查看通知">·</button>
          </div>
        </header>

        {tab === "home" && (
          <HomeView
            selectedBar={selectedBar}
            setSelectedBar={setSelectedBar}
            onNfc={() => { setNfcDone(false); setNfcOpen(true); }}
            onPlanner={() => setPlannerOpen(true)}
            onRoutes={() => changeTab("routes")}
            onMenu={() => changeTab("menu")}
            flash={flash}
            seasonalMood={seasonalMood}
          />
        )}
        {tab === "routes" && (
          <RoutesView
            likes={routeLikes}
            downs={routeDowns}
            liked={liked}
            downed={downed}
            onLike={handleLike}
            onDown={handleDown}
            onShare={() => { navigator.clipboard?.writeText(window.location.href); flash("分享链接已复制"); }}
            onNfc={() => { setNfcDone(false); setNfcOpen(true); }}
          />
        )}
        {tab === "menu" && <MenuView ratedDrinks={ratedDrinks} onRate={rateDrink} />}
        {tab === "profile" && <ProfileView onVerify={() => flash("认证申请入口已打开")}/>} 
      </main>

      <nav className="mobile-nav" aria-label="移动端主导航">
        {navItems.map((item) => (
          <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => changeTab(item.id)}>
            <span aria-hidden="true">{item.glyph}</span>{item.label}
          </button>
        ))}
      </nav>

      {nfcOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setNfcOpen(false)}>
          <section className="nfc-modal" role="dialog" aria-modal="true" aria-labelledby="nfc-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setNfcOpen(false)}>×</button>
            {!nfcDone ? (
              <>
                <p className="eyebrow">NFC CHECK-IN</p>
                <h2 id="nfc-title">碰一下，开始今晚。</h2>
                <p className="modal-copy">手机靠近店内的 8+1 感应牌，无需打开 App。原型中可点击下方模拟。</p>
                <button className="nfc-orb" onClick={handleNfc} aria-label="模拟 NFC 碰一下">
                  <span>8+1</span><small>靠近感应</small>
                </button>
                <button className="primary-button full" onClick={handleNfc}>模拟碰一下</button>
                <p className="privacy-note">仅记录门店、时间和匿名设备凭证 · 可随时删除</p>
              </>
            ) : (
              <div className="checkin-success">
                <div className="success-mark">✓</div>
                <p className="eyebrow">CHECKED IN · 21:06</p>
                <h2 id="nfc-title">Archive Room</h2>
                <p className="modal-copy">陕西北路 · 今晚第 1 站<br />实时客流 62% · 预计无需等位</p>
                <div className="success-route"><span>START</span><i /><b>01</b><i className="muted" /><span>NEXT</span></div>
                <button className="primary-button full" onClick={() => { setNfcOpen(false); changeTab("menu"); }}>选择刚喝过的酒</button>
                <button className="text-button" onClick={() => setNfcOpen(false)}>稍后再说</button>
              </div>
            )}
          </section>
        </div>
      )}

      {plannerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPlannerOpen(false)}>
          <section className="planner-modal" role="dialog" aria-modal="true" aria-labelledby="planner-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setPlannerOpen(false)}>×</button>
            <p className="eyebrow">8+1 AI · TONIGHT</p>
            <h2 id="planner-title">你想要一个怎样的夜晚？</h2>
            <p className="modal-copy">选你此刻在意的，路线会结合实时客流、酒单标签与过往偏好生成。</p>
            <div className="planner-section">
              <span>口味与感觉</span>
              <div className="choice-grid">
                {["酸一点", "清爽", "烟熏", "低酒精", "安静", "热闹", "有小惊喜", "能坐很久"].map((tag) => (
                  <button key={tag} className={activeTags.includes(tag) ? "selected" : ""} onClick={() => setActiveTags((items) => items.includes(tag) ? items.filter((item) => item !== tag) : [...items, tag])}>{tag}</button>
                ))}
              </div>
            </div>
            <label className="range-label"><span>今晚走多远</span><b>3.8 km</b><input type="range" min="1" max="8" defaultValue="4" /></label>
            <button className="primary-button full" onClick={() => { setPlannerOpen(false); changeTab("routes"); flash("已生成 1 条实时路线"); }}>生成今晚路线 <span>→</span></button>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </div>
  );
}

function HomeView({ selectedBar, setSelectedBar, onNfc, onPlanner, onRoutes, onMenu, flash, seasonalMood }: {
  selectedBar: typeof bars[number];
  setSelectedBar: (bar: typeof bars[number]) => void;
  onNfc: () => void;
  onPlanner: () => void;
  onRoutes: () => void;
  onMenu: () => void;
  flash: (message: string) => void;
  seasonalMood: SeasonalMood;
}) {
  return (
    <div className="home-layout">
      <section className="map-panel" aria-label="上海实时喝酒热力地图">
        <div className="map-head">
          <div><p className="eyebrow">CITY PULSE · 实时</p><h2>今晚的上海，正在发热。</h2></div>
          <button className="map-filter" onClick={() => flash("筛选：步行 20 分钟内")}>步行 20 min⌄</button>
        </div>
        <div className="city-map">
          <div className="map-grid" />
          <div className="road road-one" /><div className="road road-two" /><div className="road road-three" /><div className="road road-four" />
          <div className="district d1">静安寺</div><div className="district d2">新天地</div><div className="district d3">武定路</div>
          <div className="heat heat-one" /><div className="heat heat-two" /><div className="heat heat-three" />
          <div className={`climate-sky climate-${seasonalMood.theme}`} aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <i className={`climate-particle particle-${index + 1}`} key={index} />)}
          </div>
          <div className="led-guide guide-one" /><div className="led-guide guide-two" />
          <div className="led-flow flow-one" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="led-flow flow-two" aria-hidden="true"><i /><i /><i /></div>
          <div className="route-live-label"><i /> 推荐值越高 · 光流越快</div>
          {bars.map((bar) => (
            <button
              key={bar.id}
              className={`map-pin ${bar.logoClass} ${bar.id === 2 ? "trending" : ""} ${selectedBar.id === bar.id ? "selected" : ""}`}
              style={{ left: bar.left, top: bar.top }}
              onClick={() => setSelectedBar(bar)}
              aria-label={`${bar.name}，客流 ${bar.crowd}%`}
            >
              {bar.id === 2 && <span className="trend-rank">趋势 #1 <em>↑24%</em></span>}
              <span className="bar-logo-mark">{bar.logo}</span><b>{bar.crowd}%</b>
            </button>
          ))}
          <div className="map-legend"><span><i className="legend-mint" />舒适</span><span><i className="legend-coral" />较满</span><b>刚刚更新</b></div>
          <button className="climate-pill" onClick={() => flash(`${seasonalMood.term}气候图层 · ${seasonalMood.climate}`)} aria-label={`当前节气 ${seasonalMood.term}，${seasonalMood.climate}`}>
            <span>{seasonalMood.glyph}</span><b>{seasonalMood.term}</b><small>{seasonalMood.climate}</small>
          </button>
          <button className="nfc-fab" onClick={onNfc}><span>⌁</span><b>碰一下打卡</b><small>无需打开 App</small></button>
          <article className="map-bar-card">
            <div><span className={`occupancy-dot ${selectedBar.tone}`} /><p>{selectedBar.area}</p><h3>{selectedBar.name}</h3><div className="inline-tags">{selectedBar.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            <div className="bar-card-stat"><b>{selectedBar.crowd}%</b><span>{selectedBar.wait}</span><button onClick={onRoutes}>放进路线 →</button></div>
          </article>
        </div>
      </section>

      <aside className="tonight-panel">
        <p className="eyebrow">8+1 AI · FOR YOU</p>
        <h2>今晚，从清爽<br />走到微醺。</h2>
        <p className="panel-intro">按你的 18 次打卡、此刻客流和新酒单，找到一条不绕路的路线。</p>
        <div className="mood-chips"><span>酸感</span><span>安静</span><span>有猫</span><button onClick={onPlanner}>＋</button></div>
        <div className="route-preview">
          <div className="route-stop"><span>01</span><i /><div><p>20:30 · 陕西北路</p><b>Archive Room</b><small>青梅雨 · 从轻开始</small></div><em>62%</em></div>
          <div className="route-stop"><span>02</span><i /><div><p>22:00 · 巨鹿路</p><b>NO. 17</b><small>白噪音 · 今季新酒</small></div><em className="warm">88%</em></div>
          <div className="route-stop"><span>03</span><div><p>23:40 · 武定路</p><b>Moss</b><small>夜航船 · 最后一杯</small></div><em>36%</em></div>
        </div>
        <div className="route-summary"><div><b>3</b><span>站</span></div><div><b>3.8</b><span>km</span></div><div><b>92%</b><span>合你口味</span></div></div>
        <button className="primary-button full" onClick={onPlanner}>按我的感觉重新生成 <span>→</span></button>
        <button className="text-button" onClick={onRoutes}>看看大家正在走的路线</button>
      </aside>

      <DailyHub onMenu={onMenu} onRoutes={onRoutes} flash={flash} />

      <section className="section-block full-span">
        <div className="section-heading"><div><p className="eyebrow">NOW · 你附近</p><h2>别去等位，去喝酒。</h2></div><button className="text-link" onClick={() => flash("已按实时客流排序")}>按舒适度排序 ↕</button></div>
        <div className="occupancy-grid">
          {bars.map((bar) => (
            <button key={bar.id} className="occupancy-card" onClick={() => { setSelectedBar(bar); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <div className="card-index">0{bar.id}</div>
              <div className="occupancy-main"><p>{bar.area} · 1.{bar.id + 1} km</p><h3>{bar.name}</h3><div className="inline-tags">{bar.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              <div className="occupancy-level"><b>{bar.crowd}%</b><span>{bar.wait}</span><div className="capacity-track"><i style={{ width: `${bar.crowd}%` }} className={bar.tone} /></div></div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

type DailyFeature = "drink" | "brand" | "bartender" | "newbar";

function DailyHub({ onMenu, onRoutes, flash }: { onMenu: () => void; onRoutes: () => void; flash: (message: string) => void }) {
  const [feature, setFeature] = useState<DailyFeature>("drink");
  const tabs: { id: DailyFeature; label: string }[] = [
    { id: "drink", label: "每日一杯" },
    { id: "brand", label: "品牌半日" },
    { id: "bartender", label: "调酒师路线" },
    { id: "newbar", label: "今晚新店" },
  ];

  return (
    <section className="daily-hub full-span" aria-label="8+1 每日内容与品牌推荐">
      <header className="daily-hub-head">
        <div><p className="eyebrow">THE DAILY 8+1 · 每天更新</p><h2>今天值得喝的，也值得读。</h2></div>
        <span><i /> 今日 12:00 已更新</span>
      </header>
      <div className="daily-tabs" role="tablist" aria-label="每日内容分类">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={feature === tab.id} className={feature === tab.id ? "active" : ""} onClick={() => setFeature(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {feature === "drink" && (
        <article className="daily-feature daily-pour">
          <div className="daily-art drink-art"><span className="daily-glass"><i /></span><b>07 / 14</b><small>DAILY POUR</small></div>
          <div className="daily-copy">
            <div className="daily-kicker"><span>今日一杯</span><em>Archive Room · 夏季限定</em></div>
            <h3>青梅雨 <small>PLUM RAIN</small></h3>
            <p>青梅的酸先到，紫苏和海盐把甜味收住。酒精感很轻，适合今晚的第一杯。</p>
            <div className="daily-meta"><span>酸甜 74</span><span>草本 38</span><span>低酒精</span><b>4.8</b></div>
            <div className="daily-actions"><button className="daily-primary" onClick={onMenu}>查看配方与评价 →</button><button onClick={() => flash("「青梅雨」已收藏")}>＋ 收藏今天这杯</button></div>
          </div>
          <aside className="promo-note"><b>品牌合作位</b><p>可用于新品首发、品牌故事或门店限定酒推广。</p><small>合作内容不影响用户评分与热度</small></aside>
        </article>
      )}

      {feature === "brand" && (
        <article className="daily-feature daily-brand">
          <div className="daily-art bottle-art"><span className="mini-bottle">VERMOUTH</span><b>12H</b><small>BRAND STORY</small></div>
          <div className="daily-copy"><div className="daily-kicker"><span>品牌半日</span><em>每 12 小时换一个故事</em></div><h3>味美思，不只是配角。</h3><p>从都灵的草本配方，到一杯 Martini 里最安静的那一半。用四分钟认识它为什么值得被单独喝。</p><div className="daily-actions"><button className="daily-primary" onClick={() => flash("品牌故事已收藏")}>读完整故事 →</button><button onClick={() => flash("品牌合作资料入口已打开")}>品牌合作</button></div></div>
        </article>
      )}

      {feature === "bartender" && (
        <article className="daily-feature daily-bartender">
          <div className="daily-art bartender-art"><span>LY</span><b>VERIFIED</b><small>BARTENDER NOTES</small></div>
          <div className="daily-copy"><div className="daily-kicker"><span>调酒师路线</span><em>林野 · Moss 主理调酒师</em></div><h3>让路线保留一点没计划。</h3><p>三站、2.6 公里，从金酒到烟熏乌梅。他把最喜欢的雨夜走法留在这里。</p><div className="daily-meta"><span>3 家店</span><span>2.6 km</span><span>89% 推荐</span></div><div className="daily-actions"><button className="daily-primary" onClick={onRoutes}>走他的路线 →</button></div></div>
        </article>
      )}

      {feature === "newbar" && (
        <article className="daily-feature daily-newbar">
          <div className="daily-art newbar-art"><span>M+</span><b>NEW</b><small>OPEN THIS WEEK</small></div>
          <div className="daily-copy"><div className="daily-kicker"><span>今晚新店</span><em>武定路 · 本周试营业</em></div><h3>Moss Annex</h3><p>只有十二个座位，一张以植物蒸馏为核心的新酒单。今晚 21:30 后仍有空位。</p><div className="daily-meta"><span>植物感</span><span>安静</span><span>试营业</span></div><div className="daily-actions"><button className="daily-primary" onClick={() => flash("已加入今晚候选")}>加入今晚候选 →</button><button onClick={onRoutes}>查看附近路线</button></div></div>
        </article>
      )}
    </section>
  );
}

function RoutesView({ likes, downs, liked, downed, onLike, onDown, onShare, onNfc }: { likes: number; downs: number; liked: boolean; downed: boolean; onLike: () => void; onDown: () => void; onShare: () => void; onNfc: () => void; }) {
  return (
    <div className="routes-page">
      <section className="featured-route">
        <div className="featured-copy">
          <p className="eyebrow light">TRENDING #01 · 本周</p>
          <h2>从清爽到烟熏，<br />走过静安的后半夜。</h2>
          <p className="route-author"><span className="author-avatar">Y</span> Yoko 的路线 · 27 人走过 · 3 小时前更新</p>
          <div className="big-route-stats"><div><b>03</b><span>STOPS</span></div><div><b>4.2</b><span>KM</span></div><div><b>4h20</b><span>DURATION</span></div></div>
          <div className="route-actions">
            <button className={liked ? "selected" : ""} onClick={onLike}>↑ 推荐 {likes}</button>
            <button className={downed ? "negative selected" : "negative"} onClick={onDown}>↓ 拉踩 {downs}</button>
            <button onClick={onShare}>↗ 分享</button>
          </div>
        </div>
        <div className="featured-map" aria-label="路线图">
          <div className="night-grid" /><div className="route-curve" />
          <span className="route-node n1">01<small>Archive Room</small></span>
          <span className="route-node n2">02<small>NO. 17</small></span>
          <span className="route-node n3">03<small>Moss</small></span>
          <button className="start-route" onClick={onNfc}>碰一下开始路线 →</button>
        </div>
      </section>

      <section className="route-detail-grid">
        <article className="route-itinerary">
          <div className="section-heading"><div><p className="eyebrow">THE ROUTE</p><h2>每一站，都有理由。</h2></div><span className="route-score">4.7 <small>/ 5</small></span></div>
          {[
            ["01", "20:30", "Archive Room", "青梅雨", "先用酸甜和低酒精打开味觉。", "62%"],
            ["02", "22:00", "NO. 17", "白噪音", "气泡感把气氛带起来，店里刚换季酒单。", "88%"],
            ["03", "23:40", "Moss", "夜航船", "收在烟熏乌梅和波本，露台通常还有位置。", "36%"],
          ].map((stop, index) => (
            <div className="itinerary-stop" key={stop[0]}>
              <span className="stop-no">{stop[0]}</span><div className="stop-line"><i />{index < 2 && <b />}</div>
              <div className="stop-info"><p>{stop[1]} · {index ? `${index * 1.4 + 1.2} km` : "起点"}</p><h3>{stop[2]} <span>{stop[5]}</span></h3><b>{stop[3]}</b><small>{stop[4]}</small></div>
              <button>查看 →</button>
            </div>
          ))}
        </article>
        <aside className="route-comments">
          <div className="section-heading compact"><div><p className="eyebrow">ROUTE REVIEWS</p><h2>喝过的人说</h2></div><button>写评价</button></div>
          <div className="rating-bars"><b>4.7</b><div><span>氛围 <i><em style={{ width: "94%" }} /></i></span><span>不绕路 <i><em style={{ width: "88%" }} /></i></span><span>酒单匹配 <i><em style={{ width: "91%" }} /></i></span></div></div>
          <article className="review-card"><header><span className="review-avatar mint">S</span><div><b>shhh_</b><small>走过这条路线 · 昨天</small></div><em>4.8</em></header><p>第二站比预想中热闹，但三杯的节奏很好。Moss 的露台收尾很舒服。</p><div><span>#不绕路</span><span>#适合两个人</span></div></article>
          <article className="review-card bad"><header><span className="review-avatar coral">K</span><div><b>Kino</b><small>到访 2 / 3 站 · 周六</small></div><strong>恶评 · 不计分</strong></header><p>NO. 17 等位比地图显示久，周六不建议照这个时间去。</p><div><span>#客流延迟</span><span>#周末避开</span></div></article>
          <p className="review-rule">恶评会被醒目标记并接受事实核验，暂不进入路线平均分。</p>
        </aside>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">COMMUNITY PICKS</p><h2>这周，大家还在走。</h2></div><button className="text-link">全部路线 →</button></div>
        <div className="community-routes">
          {[
            ["雨天不淋湿路线", "淮海路", "2.1 km", "1,204", "安静 · 酒店吧 · 室内连廊"],
            ["三杯金酒散步", "武定路", "3.4 km", "986", "金酒 · 植物感 · 露台"],
            ["调酒师下班以后", "长乐路", "5.2 km", "821", "深夜 · 行家推荐 · 隐藏店"],
          ].map((route, index) => <article key={route[0]} className="community-card"><span>0{index + 1}</span><div className="mini-route-visual"><i /><i /><i /></div><p>{route[1]} · {route[2]}</p><h3>{route[0]}</h3><small>{route[4]}</small><footer><b>↑ {route[3]} 推荐</b><button>查看 →</button></footer></article>)}
        </div>
      </section>
    </div>
  );
}

function MenuView({ ratedDrinks, onRate }: { ratedDrinks: string[]; onRate: (name: string) => void }) {
  const [filter, setFilter] = useState("全部");
  const visible = filter === "全部" ? drinks : drinks.filter((drink) => drink.tags.includes(filter));
  return (
    <div className="menu-page">
      <section className="menu-hero">
        <div><p className="eyebrow">SEASONAL MENUS · 2026 SUMMER</p><h2>把“好喝”拆成<br />你说得出的感觉。</h2><p>每杯酒都有配方、风味与来自喝过的人的标签。今天喝了什么，直接记下来。</p></div>
        <div className="menu-count"><b>168</b><span>杯季节限定酒</span><small>来自上海 42 家酒吧</small></div>
      </section>
      <div className="filter-row"><span>按标签筛选</span>{["全部", "酸甜", "清爽", "烟熏", "花香", "低酒精"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}<button className="more-filter">更多筛选 ＋</button></div>
      <section className="drink-grid">
        {visible.map((drink, index) => (
          <article className="drink-card" key={drink.name}>
            <div className="drink-card-art" style={{ "--drink-color": drink.color } as React.CSSProperties}><span className="glass"><i /></span><b>0{index + 1}</b></div>
            <div className="drink-card-copy"><p>{drink.bar}</p><div className="drink-title"><h2>{drink.name}<small>{drink.english}</small></h2><b>¥{drink.price}</b></div><p className="formula">{drink.formula}</p><div className="inline-tags">{drink.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="taste-profile"><label>酸度 <i><em style={{ width: `${drink.taste[0]}%` }} /></i></label><label>香气 <i><em style={{ width: `${drink.taste[1]}%` }} /></i></label><label>酒感 <i><em style={{ width: `${drink.taste[2]}%` }} /></i></label></div><footer><span><b>4.{8 - index}</b> · {126 - index * 17} 人喝过</span><button className={ratedDrinks.includes(drink.name) ? "done" : ""} onClick={() => onRate(drink.name)}>{ratedDrinks.includes(drink.name) ? "✓ 已喝过" : "＋ 今天喝过"}</button></footer></div>
          </article>
        ))}
      </section>
      <section className="custom-tag-callout"><div><p className="eyebrow">YOUR TASTE LANGUAGE</p><h2>“像雨后的石头。”<br />标签也可以只属于你。</h2></div><p>自定义标签会先保存在你的私人风味档案中；被更多人使用后，会成为大家都能筛选的公共标签。</p><button>创建我的第一个标签 →</button></section>
    </div>
  );
}

function ProfileView({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">SW<span>LEVEL 07</span></div>
        <div className="profile-name"><p className="eyebrow">MEMBER SINCE 2024</p><h2>Sam Wang</h2><p>@after_eight · 上海</p><div className="profile-tags"><span>酸感猎人</span><span>夜行路线家</span><span>威士忌学徒</span></div></div>
        <div className="profile-stats"><div><b>86</b><span>打卡</span></div><div><b>34</b><span>酒吧</span></div><div><b>19</b><span>路线</span></div><div><b>128</b><span>杯酒</span></div></div>
      </section>

      <section className="profile-grid">
        <article className="badge-panel">
          <div className="section-heading compact"><div><p className="eyebrow">BADGES · 11 / 24</p><h2>你的酒鬼勋章</h2></div><button>查看全部 →</button></div>
          <div className="badge-grid">
            {[
              ["8", "第八杯之后", "累计打卡 80 次"], ["月", "月下常客", "夜间打卡 30 次"], ["酸", "酸感猎人", "评价 20 杯酸感酒"], ["↝", "路线家", "分享路线被推荐 100 次"], ["猫", "遇猫体质", "在 8 家有猫酒吧打卡"], ["?", "下一枚", "再去 2 家新酒吧"],
            ].map((badge, index) => <div className={`badge-item ${index === 5 ? "locked" : ""}`} key={badge[1]}><span>{badge[0]}</span><b>{badge[1]}</b><small>{badge[2]}</small></div>)}
          </div>
        </article>
        <article className="frequent-panel">
          <div className="section-heading compact"><div><p className="eyebrow">FREQUENT BARS</p><h2>总会再去的地方</h2></div></div>
          {[
            ["01", "Archive Room", "18 次", "酸甜 · 安静 · 低酒精"], ["02", "Moss", "12 次", "金酒 · 植物感 · 露台"], ["03", "NO. 17", "9 次", "清爽 · 新酒单 · 热闹"],
          ].map((bar) => <div className="frequent-row" key={bar[1]}><span>{bar[0]}</span><div><b>{bar[1]}</b><small>{bar[3]}</small></div><strong>{bar[2]}</strong><button>→</button></div>)}
        </article>
      </section>

      <section className="profile-grid lower">
        <article className="history-panel">
          <div className="section-heading compact"><div><p className="eyebrow">MY ROUTES</p><h2>走过的夜晚</h2></div><button>管理路线 →</button></div>
          {[
            ["07.12", "从清爽到烟熏", "3 站 · 4.2 km", "↑ 326"], ["06.28", "雨天不淋湿路线", "3 站 · 2.1 km", "↑ 204"], ["06.07", "两个人的低酒精散步", "4 站 · 3.6 km", "私密"],
          ].map((route) => <div className="history-row" key={route[0]}><time>{route[0]}</time><div><b>{route[1]}</b><small>{route[2]}</small></div><span>{route[3]}</span><button>↗</button></div>)}
        </article>
        <article className="verify-panel"><div className="verify-seal">B+<span>VERIFIED</span></div><div><p className="eyebrow light">FOR BARTENDERS</p><h2>你是调酒师吗？</h2><p>认证后可维护酒单、接受采访、发布署名路线，并获得专业身份标记。</p><button onClick={onVerify}>申请调酒师认证 →</button><small>需要在职证明与门店确认 · 通常 2 个工作日</small></div></article>
      </section>
    </div>
  );
}
