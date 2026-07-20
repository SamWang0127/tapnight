"use client";

import { useEffect, useRef, useState } from "react";

type Tab = "home" | "daily" | "routes" | "menu" | "community" | "profile";
type SeasonTheme = "spring" | "summer" | "autumn" | "winter";
type SeasonalMood = { theme: SeasonTheme; term: string; climate: string; glyph: string };
type DrinkPersonality = { type: string; name: string };
type DetailPage =
  | { kind: "bar"; barId: number }
  | { kind: "brand"; chapter: "day" | "night" }
  | { kind: "bartender" }
  | { kind: "routes" }
  | { kind: "review" }
  | { kind: "badges" }
  | { kind: "verify" }
  | { kind: "verifyApply" }
  | { kind: "studio" }
  | { kind: "barEditor" }
  | { kind: "city" };
type MapPoint = { label: string; left: string; top: string };
type MapSegment = { left: string; top: string; width: string; rotate: number };
type TravelMode = { glyph: string; label: string; kind: "walk" | "metro" | "drive" | "ride"; recommended?: boolean; segments?: MapSegment[]; via?: MapPoint };
type BarTravelGuide = {
  route: string;
  origin: MapPoint;
  next: MapPoint;
  segments: MapSegment[];
  modes: TravelMode[];
};
type GeoPoint = { latitude: number; longitude: number; accuracy: number };
type GpsStatus = "idle" | "locating" | "ready" | "denied";

function distanceInMeters(from: Pick<GeoPoint, "latitude" | "longitude">, to: { lat: number; lon: number }) {
  const earthRadius = 6_371_000;
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(to.lat - from.latitude);
  const longitudeDelta = radians(to.lon - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapPositionForLocation(location: GeoPoint) {
  const left = Math.min(92, Math.max(8, ((location.longitude - 121.425) / .045) * 84 + 8));
  const top = Math.min(82, Math.max(18, ((31.245 - location.latitude) / .035) * 64 + 18));
  return { left: `${left}%`, top: `${top}%` };
}

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
  { id: 1, name: "Archive Room", logo: "AR", logoClass: "logo-archive", area: "陕西北路", crowd: 62, wait: "可直接入座", tone: "mint", left: "27%", top: "57%", lat: 31.2345, lon: 121.4542, tags: ["安静", "威士忌", "有猫"] },
  { id: 2, name: "NO. 17", logo: "17", logoClass: "logo-no17", area: "巨鹿路", crowd: 88, wait: "约等 15 分钟", tone: "coral", left: "57%", top: "39%", lat: 31.2199, lon: 121.4558, tags: ["热闹", "酸感", "新酒单"] },
  { id: 3, name: "Moss", logo: "M", logoClass: "logo-moss", area: "武定路", crowd: 36, wait: "座位充足", tone: "mint", left: "77%", top: "56%", lat: 31.2368, lon: 121.4451, tags: ["植物感", "金酒", "露台"] },
];

const nearbyBars = [
  { id: 4, name: "ECHO", logo: "E", logoClass: "logo-nearby", area: "愚园路", crowd: 48, wait: "可直接入座", tone: "mint", left: "16%", top: "32%", lat: 31.2235, lon: 121.4338, tags: ["附近", "自然酒", "轻音乐"] },
  { id: 5, name: "FABLE", logo: "F", logoClass: "logo-nearby", area: "富民路", crowd: 71, wait: "少量空位", tone: "coral", left: "42%", top: "50%", lat: 31.2183, lon: 121.452, tags: ["附近", "经典鸡尾酒", "吧台"] },
  { id: 6, name: "HUSH", logo: "H", logoClass: "logo-nearby", area: "常熟路", crowd: 39, wait: "座位充足", tone: "mint", left: "89%", top: "42%", lat: 31.2149, lon: 121.4489, tags: ["附近", "安静", "低酒精"] },
];

const barTravelGuides: Record<number, BarTravelGuide> = {
  1: {
    route: "静安寺 → Archive Room → FABLE",
    origin: { label: "静安寺", left: "10%", top: "43%" }, next: { label: "FABLE", left: "42%", top: "50%" },
    segments: [{ left: "11%", top: "46%", width: "20%", rotate: 37 }, { left: "27%", top: "57%", width: "17%", rotate: -24 }],
    modes: [{ glyph: "步", label: "步行 9 min", kind: "walk", recommended: true }, { glyph: "地", label: "2号线 + 步行 14 min", kind: "metro", via: { label: "南京西路 · 2号线", left: "8%", top: "71%" }, segments: [{ left: "10%", top: "44%", width: "28%", rotate: 94 }, { left: "8%", top: "71%", width: "25%", rotate: -37 }, { left: "27%", top: "57%", width: "17%", rotate: -24 }] }],
  },
  2: {
    route: "陕西南路 → NO. 17 → Archive Room",
    origin: { label: "陕西南路", left: "52%", top: "22%" }, next: { label: "Archive", left: "27%", top: "57%" },
    segments: [{ left: "53%", top: "25%", width: "15%", rotate: 77 }, { left: "57%", top: "39%", width: "34%", rotate: 151 }],
    modes: [{ glyph: "步", label: "步行 8 min", kind: "walk", recommended: true }, { glyph: "车", label: "打车 6 min", kind: "drive", via: { label: "延安高架", left: "77%", top: "29%" }, segments: [{ left: "53%", top: "23%", width: "25%", rotate: 14 }, { left: "77%", top: "29%", width: "24%", rotate: 91 }, { left: "77%", top: "52%", width: "25%", rotate: -146 }, { left: "57%", top: "39%", width: "34%", rotate: 151 }] }],
  },
  3: {
    route: "昌平路 → Moss → Moss Annex",
    origin: { label: "昌平路", left: "31%", top: "27%" }, next: { label: "ANNEX", left: "90%", top: "69%" },
    segments: [{ left: "33%", top: "29%", width: "51%", rotate: 30 }, { left: "77%", top: "56%", width: "18%", rotate: 46 }],
    modes: [{ glyph: "步", label: "步行 5 min", kind: "walk", recommended: true }, { glyph: "骑", label: "骑行 8 min", kind: "ride", via: { label: "武定路骑行道", left: "58%", top: "24%" }, segments: [{ left: "32%", top: "27%", width: "28%", rotate: -7 }, { left: "59%", top: "24%", width: "31%", rotate: 27 }, { left: "86%", top: "38%", width: "22%", rotate: 111 }, { left: "77%", top: "56%", width: "18%", rotate: 46 }] }],
  },
  4: {
    route: "静安寺 → ECHO → Archive Room",
    origin: { label: "静安寺", left: "10%", top: "43%" }, next: { label: "Archive", left: "27%", top: "57%" },
    segments: [{ left: "11%", top: "42%", width: "18%", rotate: -39 }, { left: "16%", top: "32%", width: "21%", rotate: 53 }],
    modes: [{ glyph: "骑", label: "骑行 10 min", kind: "ride", recommended: true }, { glyph: "地", label: "2号线 + 步行 13 min", kind: "metro", via: { label: "南京西路 · 2号线", left: "8%", top: "71%" }, segments: [{ left: "10%", top: "43%", width: "29%", rotate: 94 }, { left: "8%", top: "71%", width: "42%", rotate: -79 }, { left: "16%", top: "32%", width: "21%", rotate: 53 }] }],
  },
  5: {
    route: "陕西南路 → FABLE → NO. 17",
    origin: { label: "陕西南路", left: "52%", top: "22%" }, next: { label: "NO. 17", left: "57%", top: "39%" },
    segments: [{ left: "53%", top: "24%", width: "25%", rotate: 119 }, { left: "42%", top: "50%", width: "19%", rotate: -47 }],
    modes: [{ glyph: "步", label: "步行 7 min", kind: "walk", recommended: true }, { glyph: "骑", label: "骑行 6 min", kind: "ride", via: { label: "巨鹿路骑行道", left: "70%", top: "61%" }, segments: [{ left: "53%", top: "23%", width: "22%", rotate: 87 }, { left: "53%", top: "45%", width: "22%", rotate: 46 }, { left: "70%", top: "61%", width: "34%", rotate: -69 }, { left: "42%", top: "50%", width: "19%", rotate: -47 }] }],
  },
  6: {
    route: "常熟路 → HUSH → Moss",
    origin: { label: "常熟路", left: "72%", top: "23%" }, next: { label: "Moss", left: "77%", top: "56%" },
    segments: [{ left: "73%", top: "25%", width: "23%", rotate: 41 }, { left: "89%", top: "42%", width: "22%", rotate: 142 }],
    modes: [{ glyph: "步", label: "步行 6 min", kind: "walk", recommended: true }, { glyph: "地", label: "7号线 + 步行 12 min", kind: "metro", via: { label: "昌平路 · 7号线", left: "31%", top: "27%" }, segments: [{ left: "72%", top: "23%", width: "42%", rotate: 174 }, { left: "31%", top: "27%", width: "62%", rotate: 18 }, { left: "89%", top: "42%", width: "22%", rotate: 142 }] }],
  },
};

const convenienceStores = [
  { name: "全家", mark: "全", className: "store-family", left: "10%", top: "55%", walk: "距 Archive Room 步行 3 min" },
  { name: "罗森", mark: "罗", className: "store-lawson", left: "82%", top: "31%", walk: "距 NO. 17 步行 4 min" },
  { name: "7-ELEVEN", mark: "7", className: "store-seven", left: "92%", top: "56%", walk: "距 Moss 步行 2 min" },
];

const COMMUNITY_TAG_THRESHOLD = 24;
const communityTagSignals: { tag: string; votes: Record<number, number> }[] = [
  { tag: "安静", votes: { 1: 84, 3: 28, 4: 35, 6: 71 } },
  { tag: "低酒精", votes: { 1: 27, 2: 31, 3: 35, 6: 59 } },
  { tag: "适合独饮", votes: { 1: 46, 4: 42, 6: 41 } },
  { tag: "酸感", votes: { 2: 67, 5: 37 } },
  { tag: "露台", votes: { 3: 45, 4: 29 } },
  { tag: "有猫", votes: { 1: 31 } },
];

const communityFilterOptions = communityTagSignals.map((signal) => ({
  ...signal,
  totalMarks: Object.values(signal.votes).filter((votes) => votes >= COMMUNITY_TAG_THRESHOLD).reduce((sum, votes) => sum + votes, 0),
}));

function getConsensusTags(barId: number) {
  return communityTagSignals.filter((signal) => (signal.votes[barId] || 0) >= COMMUNITY_TAG_THRESHOLD).map((signal) => signal.tag);
}

type DrinkSpec = [name: string, english: string, formula: string, price: number, color: string, tags: string[], taste: number[]];

const drinkMenuSpecs: Record<string, DrinkSpec[]> = {
  "Archive Room": [
    ["青梅雨", "PLUM RAIN", "青梅浸泡酒 / 干味美思 / 紫苏 / 海盐", 108, "#bff4d3", ["酸甜", "草本", "低酒精"], [74, 38, 22]],
    ["晚风信箱", "NIGHT MAIL", "金酒 / 桂花 / 白葡萄 / 茉莉冷萃", 112, "#f4da8a", ["花香", "干爽", "茶感"], [32, 72, 30]],
    ["旧书页", "OLD PAGES", "雪莉桶威士忌 / 无花果 / 可可 / 盐", 128, "#b89071", ["厚重", "坚果", "威士忌"], [18, 46, 82]],
    ["潮汐玻璃", "TIDAL GLASS", "伏特加 / 海盐葡萄 / 柠檬马鞭草 / 苏打", 116, "#cfe7e3", ["清爽", "气泡", "草本"], [56, 64, 26]],
  ],
  "NO. 17": [
    ["白噪音", "WHITE NOISE", "椰子朗姆 / 澄清菠萝 / 白胡椒 / 苏打", 118, "#ebe9df", ["清爽", "气泡", "热带"], [48, 66, 18]],
    ["红线", "RED LINE", "龙舌兰 / 洛神花 / 血橙 / 粉红胡椒", 122, "#ef9386", ["酸甜", "辛香", "龙舌兰"], [78, 58, 55]],
    ["十七号门", "DOOR 17", "黑麦威士忌 / 咖啡 / 苦艾 / 香草", 132, "#9f765d", ["苦甜", "咖啡", "厚重"], [22, 52, 88]],
    ["温差", "TEMPERATURE GAP", "金酒 / 青瓜 / 接骨木花 / 冷萃茶", 116, "#c9ebd7", ["花香", "清爽", "茶感"], [35, 73, 29]],
  ],
  Moss: [
    ["夜航船", "NIGHT FERRY", "波本 / 烟熏乌梅 / 黑糖 / 苦精", 128, "#c99d79", ["烟熏", "厚重", "威士忌"], [18, 35, 84]],
    ["苔痕", "MOSS TRACE", "金酒 / 青苔草本 / 苹果 / 茴香", 118, "#9fcf9c", ["草本", "清爽", "金酒"], [42, 72, 38]],
    ["温室雨", "GREENHOUSE RAIN", "白朗姆 / 番石榴 / 罗勒 / 椰子水", 114, "#c7e4c4", ["热带", "低酒精", "清爽"], [51, 67, 25]],
    ["绿闪", "GREEN FLASH", "梅斯卡尔 / 青椒 / 青柠 / 海盐", 126, "#b8d77d", ["烟熏", "酸感", "辛香"], [76, 45, 72]],
  ],
  ECHO: [
    ["回声室", "ECHO ROOM", "自然酒 / 白桃 / 紫苏 / 汤力", 108, "#efd6bb", ["自然酒", "清爽", "气泡"], [45, 69, 24]],
    ["黑胶边", "VINYL EDGE", "陈年朗姆 / 黑莓 / 可可豆 / 苦精", 126, "#a47972", ["厚重", "苦甜", "朗姆"], [25, 48, 81]],
    ["愚园风", "YUYUAN BREEZE", "金酒 / 桂花 / 黄瓜 / 苏打", 112, "#d8e8bd", ["花香", "低酒精", "清爽"], [37, 76, 22]],
    ["第二拍", "SECOND BEAT", "伏特加 / 柚子 / 生姜 / 起泡酒", 116, "#f3d49b", ["酸甜", "气泡", "辛香"], [68, 57, 39]],
  ],
  FABLE: [
    ["寓言结尾", "THE LAST FABLE", "干邑 / 杏仁 / 乌龙 / 橙皮", 132, "#c7a070", ["茶感", "坚果", "厚重"], [26, 61, 78]],
    ["白桃章节", "WHITE PEACH", "金酒 / 白桃 / 茉莉 / 香槟", 122, "#f0d7c9", ["花香", "气泡", "清爽"], [44, 82, 35]],
    ["反派", "ANTAGONIST", "梅斯卡尔 / 番茄 / 芹菜 / 黑胡椒", 128, "#d98771", ["烟熏", "咸鲜", "辛香"], [31, 47, 79]],
    ["月下页", "MOON PAGE", "伏特加 / 荔枝 / 月桂 / 柠檬", 116, "#dad8e8", ["酸甜", "花香", "低酒精"], [63, 75, 24]],
  ],
  HUSH: [
    ["静音键", "MUTE", "清酒 / 梨 / 白茶 / 柚子皮", 112, "#e6e0c9", ["茶感", "低酒精", "清爽"], [39, 62, 20]],
    ["夜灯", "NIGHT LIGHT", "波本 / 烤香蕉 / 黑糖 / 肉桂", 124, "#c89662", ["厚重", "甜香", "威士忌"], [19, 54, 83]],
    ["雾中花", "FLOWER IN FOG", "金酒 / 铃兰 / 白葡萄 / 酸奶澄清", 118, "#dce3d1", ["花香", "酸甜", "柔和"], [58, 81, 30]],
    ["归途", "WAY HOME", "低度苦艾 / 佛手柑 / 蜂蜜 / 苏打", 106, "#d6e1a7", ["低酒精", "草本", "气泡"], [42, 65, 18]],
  ],
};

const venueDrinkMenus = Object.fromEntries(Object.entries(drinkMenuSpecs).map(([bar, menu]) => [bar, menu.map(([name, english, formula, price, color, tags, taste]) => ({ name, english, formula, price, color, tags, taste, bar: `${bar} · 2026 夏季酒单` }))]));

const navItems: { id: Tab; label: string; glyph: string }[] = [
  { id: "home", label: "发现", glyph: "⌁" },
  { id: "daily", label: "今日", glyph: "✦" },
  { id: "routes", label: "路线", glyph: "↝" },
  { id: "menu", label: "酒单", glyph: "◒" },
  { id: "community", label: "酒友", glyph: "◎" },
  { id: "profile", label: "我的", glyph: "○" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [selectedBar, setSelectedBar] = useState(bars[0]);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [nfcDone, setNfcDone] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [geofenceOpen, setGeofenceOpen] = useState(false);
  const [geofenceDistance, setGeofenceDistance] = useState<number | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [routeLikes, setRouteLikes] = useState(326);
  const [routeDowns, setRouteDowns] = useState(12);
  const [liked, setLiked] = useState(false);
  const [downed, setDowned] = useState(false);
  const [ratedDrinks, setRatedDrinks] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState(["酸一点", "安静", "有小惊喜"]);
  const [drinkPersonality, setDrinkPersonality] = useState<DrinkPersonality | null>(null);
  const [detailPage, setDetailPage] = useState<DetailPage | null>(null);
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
    setDetailPage(null);
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDetail = (detail: DetailPage) => {
    setDetailPage(detail);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requestGps = () => new Promise<GeoPoint | null>((resolve) => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      resolve(null);
      return;
    }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition((position) => {
      const point = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      setCurrentLocation(point);
      setGpsStatus("ready");
      resolve(point);
    }, () => {
      setGpsStatus("denied");
      resolve(null);
    }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 });
  });

  const evaluateGeofence = (location: GeoPoint | null) => {
    if (!location) {
      setGeofenceDistance(null);
      setGeofenceOpen(true);
      return false;
    }
    const distance = Math.round(distanceInMeters(location, selectedBar));
    setGeofenceDistance(distance);
    if (distance > 20) {
      setGeofenceOpen(true);
      return false;
    }
    setGeofenceOpen(false);
    setNfcDone(false);
    setNfcOpen(true);
    return true;
  };

  const openNfcWithGeofence = async () => {
    const location = currentLocation || await requestGps();
    evaluateGeofence(location);
  };

  const retryGeofence = async () => {
    const location = await requestGps();
    evaluateGeofence(location);
  };

  const simulateInsideSelectedBar = () => {
    const location = { latitude: selectedBar.lat + .00004, longitude: selectedBar.lon, accuracy: 5 };
    setCurrentLocation(location);
    setGpsStatus("ready");
    setGeofenceDistance(Math.round(distanceInMeters(location, selectedBar)));
    setGeofenceOpen(false);
    setNfcDone(false);
    setNfcOpen(true);
  };

  const handleNfc = () => {
    if (!currentLocation || distanceInMeters(currentLocation, selectedBar) > 20) {
      setNfcOpen(false);
      evaluateGeofence(currentLocation);
      return;
    }
    setNfcDone(true);
    flash(`${selectedBar.name} · GPS 20 米内验证成功`);
    window.setTimeout(() => {
      setNfcOpen(false);
      changeTab("menu");
    }, 720);
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
        <button className="brand-mark" aria-label="TapNight 首页" onClick={() => changeTab("home")}>
          <span>TAP</span><b>NIGHT</b>
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
            <h1>{detailPage ? "继续往里看。" : tab === "home" ? "晚上好，Sam。" : tab === "daily" ? "今天，先认识一杯。" : tab === "routes" ? "路线，是夜晚的手写体。" : tab === "menu" ? "从一杯开始认识它。" : tab === "community" ? "同一间店，也许见过。" : "你的喝酒档案。"}</h1>
          </div>
          <div className="top-actions">
            <button className="status-pill" onClick={() => openDetail({ kind: "city" })}><span className="live-dot" /> 2,847 人正在喝</button>
            <button className="icon-button" onClick={() => flash("今晚没有新提醒")} aria-label="查看通知">·</button>
          </div>
        </header>

        {detailPage && <DetailPageView page={detailPage} onBack={() => setDetailPage(null)} onOpen={openDetail} onMenuForBar={(bar) => { setSelectedBar(bar); changeTab("menu"); }} onRoutes={() => changeTab("routes")} flash={flash} />}
        {!detailPage && tab === "home" && (
          <HomeView
            selectedBar={selectedBar}
            setSelectedBar={setSelectedBar}
            onNfc={openNfcWithGeofence}
            gpsStatus={gpsStatus}
            currentLocation={currentLocation}
            distanceToSelectedBar={currentLocation ? Math.round(distanceInMeters(currentLocation, selectedBar)) : null}
            onLocate={async () => {
              const location = await requestGps();
              if (location) flash(`GPS 已更新 · 精度约 ${Math.round(location.accuracy)} 米`);
              else flash("无法取得定位，请检查浏览器定位权限");
            }}
            onPlanner={() => setPlannerOpen(true)}
            onRoutes={() => changeTab("routes")}
            onMenu={() => changeTab("menu")}
            onBarDetail={(barId) => openDetail({ kind: "bar", barId })}
            flash={flash}
            seasonalMood={seasonalMood}
          />
        )}
        {!detailPage && tab === "daily" && <DailyPage onMenu={() => changeTab("menu")} onRoutes={() => changeTab("routes")} onOpenDetail={openDetail} flash={flash} />}
        {!detailPage && tab === "routes" && (
          <RoutesView
            likes={routeLikes}
            downs={routeDowns}
            liked={liked}
            downed={downed}
            onLike={handleLike}
            onDown={handleDown}
            onShare={() => { navigator.clipboard?.writeText(window.location.href); flash("分享链接已复制"); }}
            onNfc={openNfcWithGeofence}
            onOpenBar={(barId) => openDetail({ kind: "bar", barId })}
            onOpenDetail={openDetail}
          />
        )}
        {!detailPage && tab === "menu" && <MenuView selectedBar={selectedBar} onSelectBar={setSelectedBar} ratedDrinks={ratedDrinks} onRate={rateDrink} onNotify={flash} />}
        {!detailPage && tab === "community" && <CommunityPage
          personality={drinkPersonality}
          onGreet={(name) => flash(`已向 ${name} 发出一个轻松的招呼`)}
          onSavePersonality={(personality) => {
            setDrinkPersonality(personality);
            flash(`${personality.type} · ${personality.name} 已加到酒鬼勋章`);
          }}
        />}
        {!detailPage && tab === "profile" && <ProfileView onVerify={() => openDetail({ kind: "verify" })} onOpenBar={(barId) => openDetail({ kind: "bar", barId })} onOpenRoutes={() => openDetail({ kind: "routes" })} onOpenBadges={() => openDetail({ kind: "badges" })} />}
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
                <p className="modal-copy">GPS 已确认你在 {selectedBar.name} 20 米范围内。现在将手机靠近店内感应牌。</p>
                <button className="nfc-orb" onClick={handleNfc} aria-label="模拟 NFC 碰一下">
                  <span>TapNight</span><small>靠近感应</small>
                </button>
                <button className="primary-button full" onClick={handleNfc}>Developer · 模拟碰一下</button>
                <p className="privacy-note">GPS 仅用于本次 20 米到店校验 · 不保存连续轨迹</p>
              </>
            ) : (
              <div className="checkin-success">
                <div className="success-mark">✓</div>
                <p className="eyebrow">CHECKED IN · 21:06</p>
                <h2 id="nfc-title">{selectedBar.name}</h2>
                <p className="modal-copy">{selectedBar.area} · 今晚第 1 站<br />实时客流 {selectedBar.crowd}% · {selectedBar.wait}</p>
                <div className="success-route"><span>START</span><i /><b>01</b><i className="muted" /><span>NEXT</span></div>
                <button className="primary-button full" onClick={() => { setNfcOpen(false); changeTab("menu"); }}>打开 {selectedBar.name} 酒单</button>
                <button className="text-button" onClick={() => setNfcOpen(false)}>稍后再说</button>
              </div>
            )}
          </section>
        </div>
      )}

      {geofenceOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setGeofenceOpen(false)}>
          <section className="geofence-modal" role="dialog" aria-modal="true" aria-labelledby="geofence-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setGeofenceOpen(false)}>×</button>
            <p className="eyebrow">GPS · 20 M GEOFENCE</p>
            <h2 id="geofence-title">需要在店内才能打卡。</h2>
            <div className={`geofence-radar ${geofenceDistance !== null && geofenceDistance <= 20 ? "inside" : ""}`}><i /><span>20m</span><b>你</b></div>
            <div className="geofence-reading">
              <span>目标门店</span><b>{selectedBar.name}</b>
              <small>{geofenceDistance === null ? "尚未取得定位权限" : `当前距离约 ${geofenceDistance.toLocaleString()} 米 · 需 ≤ 20 米`}</small>
            </div>
            <button className="primary-button full" onClick={retryGeofence}>{gpsStatus === "locating" ? "正在获取 GPS…" : "重新定位"}</button>
            <button className="developer-location-button" onClick={simulateInsideSelectedBar}>Developer 测试 · 模拟进入 20 米</button>
            <p className="privacy-note">正式版只会在碰一下时读取一次定位；模拟入口上线前移除。</p>
          </section>
        </div>
      )}

      {plannerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPlannerOpen(false)}>
          <section className="planner-modal" role="dialog" aria-modal="true" aria-labelledby="planner-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setPlannerOpen(false)}>×</button>
            <p className="eyebrow">TAPNIGHT AI · TONIGHT</p>
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

function HomeView({ selectedBar, setSelectedBar, onNfc, gpsStatus, currentLocation, distanceToSelectedBar, onLocate, onPlanner, onRoutes, onMenu, onBarDetail, flash, seasonalMood }: {
  selectedBar: typeof bars[number];
  setSelectedBar: (bar: typeof bars[number]) => void;
  onNfc: () => void;
  gpsStatus: GpsStatus;
  currentLocation: GeoPoint | null;
  distanceToSelectedBar: number | null;
  onLocate: () => void;
  onPlanner: () => void;
  onRoutes: () => void;
  onMenu: () => void;
  onBarDetail: (barId: number) => void;
  flash: (message: string) => void;
  seasonalMood: SeasonalMood;
}) {
  const [communityFilters, setCommunityFilters] = useState<string[]>([]);
  const [navigationMode, setNavigationMode] = useState(false);
  const [activeTravelMode, setActiveTravelMode] = useState("");
  const [mapZoom, setMapZoom] = useState(1);
  const mapPinch = useRef({ pointers: new Map<number, { x: number; y: number }>(), startDistance: 0, startZoom: 1 });
  const tagDrag = useRef({ pointerId: -1, startX: 0, startScroll: 0, moved: false });
  const discoverableBars = [...bars, ...nearbyBars];
  const barMatchesFilters = (bar: typeof bars[number], filters = communityFilters) => !filters.length || filters.some((tag) => getConsensusTags(bar.id).includes(tag));
  const matchedBars = discoverableBars.filter((bar) => barMatchesFilters(bar));
  const suggestedRouteBars = (communityFilters.length ? matchedBars : bars).slice(0, 3);
  const selectedConsensusTags = getConsensusTags(selectedBar.id);
  const selectedDisplayTags = Array.from(new Set([...selectedConsensusTags, ...selectedBar.tags])).slice(0, 4);
  const selectedTravel = barTravelGuides[selectedBar.id];
  const activeMode = selectedTravel.modes.find((mode) => mode.label === activeTravelMode) || selectedTravel.modes[0];
  const activeNavigationSegments = activeMode.segments || selectedTravel.segments;
  const routeTimes = ["20:30", "21:45", "23:00"];

  useEffect(() => {
    setNavigationMode(false);
    setActiveTravelMode(selectedTravel.modes.find((mode) => mode.recommended)?.label || selectedTravel.modes[0].label);
  }, [selectedBar.id, selectedTravel]);

  function toggleMapNavigation() {
    setNavigationMode((active) => !active);
    flash(navigationMode ? "已退出地图指路" : `${selectedTravel.route} · 开始指路`);
  }

  function chooseTravelMode(label: string) {
    setActiveTravelMode(label);
    setNavigationMode(true);
    flash(`${selectedBar.name} · ${label} · 地图指路中`);
  }

  const clampMapZoom = (value: number) => Math.min(1.8, Math.max(.75, Math.round(value * 100) / 100));

  function adjustMapZoom(delta: number) {
    setMapZoom((value) => clampMapZoom(value + delta));
  }

  function beginMapPinch(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") return;
    const gesture = mapPinch.current;
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (gesture.pointers.size === 2) {
      const [first, second] = Array.from(gesture.pointers.values());
      gesture.startDistance = Math.hypot(first.x - second.x, first.y - second.y);
      gesture.startZoom = mapZoom;
    }
  }

  function moveMapPinch(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = mapPinch.current;
    if (!gesture.pointers.has(event.pointerId)) return;
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.pointers.size !== 2 || !gesture.startDistance) return;
    const [first, second] = Array.from(gesture.pointers.values());
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    setMapZoom(clampMapZoom(gesture.startZoom * distance / gesture.startDistance));
  }

  function endMapPinch(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = mapPinch.current;
    gesture.pointers.delete(event.pointerId);
    if (gesture.pointers.size < 2) gesture.startDistance = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function toggleCommunityFilter(tag: string) {
    if (tagDrag.current.moved) {
      tagDrag.current.moved = false;
      return;
    }
    const nextFilters = communityFilters.includes(tag) ? communityFilters.filter((item) => item !== tag) : [...communityFilters, tag];
    const nextMatches = discoverableBars.filter((bar) => barMatchesFilters(bar, nextFilters));
    setCommunityFilters(nextFilters);
    if (nextFilters.length && !barMatchesFilters(selectedBar, nextFilters) && nextMatches[0]) setSelectedBar(nextMatches[0]);
    flash(nextFilters.length ? `已按 ${nextFilters.map((item) => `#${item}`).join(" · ")} 重排推荐` : "已显示全部推荐");
  }

  function beginTagDrag(event: React.PointerEvent<HTMLDivElement>) {
    tagDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveTagDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (tagDrag.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - tagDrag.current.startX;
    if (Math.abs(delta) > 4) tagDrag.current.moved = true;
    event.currentTarget.scrollLeft = tagDrag.current.startScroll - delta;
  }

  function endTagDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (tagDrag.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    tagDrag.current.pointerId = -1;
  }

  return (
    <div className="home-layout">
      <section className="map-panel" aria-label="上海实时喝酒热力地图">
        <div className="map-head">
          <div><p className="eyebrow">CITY PULSE · 实时</p><h2>今晚的上海，正在发热。</h2></div>
          <button className="map-filter" onClick={() => flash("筛选：步行 20 分钟内")}>步行 20 min⌄</button>
        </div>
        <div className={`city-map ${navigationMode ? "navigating" : ""}`}>
          <div
            className="map-zoom-layer"
            style={{ "--map-zoom": mapZoom } as React.CSSProperties}
            onPointerDown={beginMapPinch}
            onPointerMove={moveMapPinch}
            onPointerUp={endMapPinch}
            onPointerCancel={endMapPinch}
            aria-label="可缩放地图，支持双指缩放"
          >
          <div className={`map-camera ${navigationMode ? `route-overview camera-${activeMode.kind}` : ""}`}>
          <div className="map-grid" />
          <div className="road road-one" /><div className="road road-two" /><div className="road road-three" /><div className="road road-four" />
          <div className="district d1">南京西路</div><div className="district d2">巨鹿路</div><div className="district d3">武定路</div>
          <div className="metro-stop station-nanjing"><span><i className="line-2">2</i><i className="line-12">12</i><i className="line-13">13</i></span><b>南京西路</b><small>距 AR 6 min</small></div>
          <div className="metro-stop station-shaanxi"><span><i className="line-1">1</i><i className="line-10">10</i><i className="line-12">12</i></span><b>陕西南路</b><small>距 17 8 min</small></div>
          <div className="metro-stop station-changping"><span><i className="line-7">7</i></span><b>昌平路</b><small>距 Moss 5 min</small></div>
          <div className="map-sign sign-road"><span>→</span><b>延安高架</b></div>
          <div className="map-landmark landmark-temple"><span>寺</span><b>静安寺</b></div>
          <div className="heat heat-one" /><div className="heat heat-two" /><div className="heat heat-three" />
          <div className={`climate-sky climate-${seasonalMood.theme}`} aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <i className={`climate-particle particle-${index + 1}`} key={index} />)}
          </div>
          <div className="led-track track-one" aria-hidden="true"><i /></div>
          <div className="led-track track-two" aria-hidden="true"><i /></div>
          <div className="route-live-label"><i /> 推荐值越高 · 光流越快</div>
          {currentLocation && <div className="user-location-pin" style={mapPositionForLocation(currentLocation)} aria-label={`你的位置，精度约 ${Math.round(currentLocation.accuracy)} 米`}><i /><span>你在这里</span></div>}
          {navigationMode && (
            <div className={`map-navigation mode-${activeMode.kind}`} aria-label={`${selectedTravel.route}，${activeMode.label}，指路中`}>
              {activeNavigationSegments.map((segment, index) => (
                <i className="navigation-segment" style={{ left: segment.left, top: segment.top, width: segment.width, transform: `rotate(${segment.rotate}deg)` }} key={`${selectedBar.id}-${activeMode.label}-${index}`}><b /></i>
              ))}
              <span className="navigation-point navigation-origin" style={{ left: selectedTravel.origin.left, top: selectedTravel.origin.top }}><i>起</i><b>{selectedTravel.origin.label}</b></span>
              {activeMode.via && <span className="navigation-point navigation-via" style={{ left: activeMode.via.left, top: activeMode.via.top }}><i>{activeMode.glyph}</i><b>途经 · {activeMode.via.label}</b></span>}
              <span className="navigation-point navigation-destination" style={{ left: selectedBar.left, top: selectedBar.top }}><i>{selectedBar.logo}</i><b>当前 · {selectedBar.name}</b></span>
              <span className="navigation-point navigation-next" style={{ left: selectedTravel.next.left, top: selectedTravel.next.top }}><i>→</i><b>下一站 · {selectedTravel.next.label}</b></span>
            </div>
          )}
          {convenienceStores.map((store) => (
            <button
              key={store.name}
              className={`convenience-pin ${store.className}`}
              style={{ left: store.left, top: store.top }}
              onClick={() => flash(`${store.name} · 24h · ${store.walk}`)}
              aria-label={`${store.name}便利店，24小时，${store.walk}`}
            >
              <span>{store.mark}</span><b>{store.name}</b><small>24h</small>
            </button>
          ))}
          {nearbyBars.map((bar) => (
            <button
              key={bar.id}
              className={`nearby-bar-pin ${selectedBar.id === bar.id ? "selected" : ""} ${barMatchesFilters(bar) ? "" : "filtered-out"}`}
              style={{ left: bar.left, top: bar.top }}
              onClick={() => setSelectedBar(bar)}
              disabled={!barMatchesFilters(bar)}
              aria-label={`附近酒吧 ${bar.name}，客流 ${bar.crowd}%`}
            >
              <span>{bar.logo}</span><b>{bar.name}</b><small>{bar.crowd}%</small>
            </button>
          ))}
          {bars.map((bar) => (
            <button
              key={bar.id}
              className={`map-pin ${bar.logoClass} ${bar.id === 2 ? "trending" : ""} ${selectedBar.id === bar.id ? "selected" : ""} ${barMatchesFilters(bar) ? "" : "filtered-out"}`}
              style={{ left: bar.left, top: bar.top }}
              onClick={() => setSelectedBar(bar)}
              disabled={!barMatchesFilters(bar)}
              aria-label={`${bar.name}，客流 ${bar.crowd}%`}
            >
              {bar.id === 2 && <span className="trend-rank">趋势 #1 <em>↑24%</em></span>}
              <span className="bar-logo-mark">{bar.logo}</span><b>{bar.crowd}%</b>
            </button>
          ))}
          </div>
          </div>
          <div className="map-legend"><span><i className="legend-mint" />舒适</span><span><i className="legend-coral" />较满</span><span><i className="legend-nearby" />附近</span><span><i className="legend-store" />便利店</span><b>刚刚更新</b></div>
          <div className="map-zoom-controls" role="group" aria-label={`地图缩放 ${Math.round(mapZoom * 100)}%`}>
            <button onClick={() => adjustMapZoom(.25)} disabled={mapZoom >= 1.8} aria-label="放大地图">＋</button>
            <button className="zoom-reset" onClick={() => setMapZoom(1)} disabled={mapZoom === 1} aria-label="恢复地图默认大小">{Math.round(mapZoom * 100)}%</button>
            <button onClick={() => adjustMapZoom(-.25)} disabled={mapZoom <= .75} aria-label="缩小地图">−</button>
          </div>
          {navigationMode && <span className={`navigation-status navigation-status-overlay mode-${activeMode.kind}`} role="status" aria-live="polite"><i /> {activeMode.kind === "walk" ? "街区步行" : activeMode.kind === "metro" ? "地铁接驳" : activeMode.kind === "drive" ? "驾车路线" : "骑行路线"} · {activeMode.label}</span>}
          <button className="climate-pill" onClick={() => flash(`${seasonalMood.term}气候图层 · ${seasonalMood.climate}`)} aria-label={`当前节气 ${seasonalMood.term}，${seasonalMood.climate}`}>
            <span>{seasonalMood.glyph}</span><b>{seasonalMood.term}</b><small>{seasonalMood.climate}</small>
          </button>
          <button className={`gps-pill gps-${gpsStatus}`} onClick={onLocate} aria-label="更新 GPS 定位">
            <span>⌖</span><b>{gpsStatus === "locating" ? "定位中" : gpsStatus === "ready" ? "GPS 已定位" : gpsStatus === "denied" ? "定位未开启" : "开启 GPS"}</b>
            <small>{distanceToSelectedBar === null ? "20m 打卡校验" : `距店 ${distanceToSelectedBar.toLocaleString()}m`}</small>
          </button>
          <button className="nfc-fab" onClick={onNfc}><span>⌁</span><b>碰一下打卡</b><small>无需打开 App</small></button>
          <article className="map-bar-card">
            <div className="map-card-main"><span className={`occupancy-dot ${selectedBar.tone}`} /><p>{selectedBar.area}</p><h3>{selectedBar.name}</h3><div className="inline-tags">{selectedDisplayTags.map((tag) => <span className={selectedConsensusTags.includes(tag) ? "consensus-auto" : ""} key={tag}>{tag}</span>)}</div><small className="tag-source-note">✓ {selectedConsensusTags.length} 个标签由 ≥{COMMUNITY_TAG_THRESHOLD} 人共识自动加入</small></div>
            <div className="bar-card-stat"><b>{selectedBar.crowd}%</b><span>{selectedBar.wait}</span><div className="bar-card-actions"><button onClick={() => onBarDetail(selectedBar.id)}>详情</button><button onClick={onRoutes}>＋路线</button></div></div>
            <div className={`map-trip-suggestion ${navigationMode ? "active" : ""}`}>
              <button className="map-trip-route" aria-pressed={navigationMode} onClick={toggleMapNavigation}><span>{navigationMode ? "正在指路 · 点击退出" : "最近建议路线 · 点击指路"}</span><b>{selectedTravel.route}</b><i>{navigationMode ? "×" : "→"}</i></button>
              <div className="travel-modes">{selectedTravel.modes.map((mode) => <button className={`${mode.recommended ? "recommended" : ""} ${navigationMode && activeTravelMode === mode.label ? "active" : ""}`} key={mode.label} onClick={() => chooseTravelMode(mode.label)}><i>{mode.glyph}</i>{mode.label}</button>)}</div>
            </div>
          </article>
        </div>
      </section>

      <div className="home-secondary-rail" aria-label="标签筛选与今晚推荐">
      <aside className="tonight-panel">
        <p className="eyebrow">TAPNIGHT AI · FOR YOU</p>
        <h2>今晚路线，按标签重排。</h2>
        <p className="panel-intro">选择大家反复标记的感觉，地图和路线会一起变化。</p>
        <section className="consensus-filter" aria-label="大家共识标签筛选">
          <header><div><b>共识筛选</b><span>COMMUNITY SIGNAL</span></div><small>≥ {COMMUNITY_TAG_THRESHOLD} 次重合自动成为标签</small></header>
          <div
            className="consensus-tags"
            onPointerDown={beginTagDrag}
            onPointerMove={moveTagDrag}
            onPointerUp={endTagDrag}
            onPointerCancel={endTagDrag}
          >
            {communityFilterOptions.map((signal) => <button className={communityFilters.includes(signal.tag) ? "active" : ""} aria-pressed={communityFilters.includes(signal.tag)} key={signal.tag} onClick={() => toggleCommunityFilter(signal.tag)}><span>#{signal.tag}</span><small>{signal.totalMarks} 次标记</small></button>)}
          </div>
          <footer><span>{communityFilters.length ? `命中 ${matchedBars.length} 家 · 匹配任一已选标签` : "选择标签，地图与今晚路线会同步重排"}</span>{communityFilters.length > 0 && <button onClick={() => { setCommunityFilters([]); flash("已显示全部推荐"); }}>清除</button>}</footer>
        </section>
        <button className="discover-newbar-card" onClick={() => flash("Moss Annex 已加入今晚候选路线")}>
          <span><b>今日新店</b><small>NEW · 武定路试营业</small></span>
          <strong>Moss Annex</strong><em>21:30 后有位</em><i>＋ 路线</i>
        </button>
        <div className="route-preview">
          {suggestedRouteBars.map((bar, index) => {
            const matchedTags = getConsensusTags(bar.id).filter((tag) => !communityFilters.length || communityFilters.includes(tag));
            return <div className="route-stop" key={bar.id}><span>{String(index + 1).padStart(2, "0")}</span><i className={index === suggestedRouteBars.length - 1 ? "route-tail" : ""} /><div><p>{routeTimes[index]} · {bar.area}</p><b>{bar.name}</b><small>{matchedTags.slice(0, 2).map((tag) => `#${tag}`).join(" · ")} · 大家共识</small></div><em className={bar.crowd > 80 ? "warm" : ""}>{bar.crowd}%</em></div>;
          })}
        </div>
        <div className="route-summary"><div><b>{suggestedRouteBars.length}</b><span>站</span></div><div><b>{(1.2 + suggestedRouteBars.length * .85).toFixed(1)}</b><span>km</span></div><div><b>{communityFilters.length ? "LIVE" : "92%"}</b><span>{communityFilters.length ? "共识重排" : "合你口味"}</span></div></div>
        <button className="primary-button full" onClick={onPlanner}>按我的感觉重新生成 <span>→</span></button>
        <button className="text-button" onClick={onRoutes}>看看大家正在走的路线</button>
      </aside>
      </div>

    </div>
  );
}

type DailyFeature = "drink" | "brand" | "bartender";

function DailyPage({ onMenu, onRoutes, onOpenDetail, flash }: { onMenu: () => void; onRoutes: () => void; onOpenDetail: (detail: DetailPage) => void; flash: (message: string) => void }) {
  return <div className="daily-page"><DailyHub onMenu={onMenu} onRoutes={onRoutes} onOpenDetail={onOpenDetail} flash={flash} /></div>;
}

function DailyHub({ onMenu, onRoutes, onDaily, onOpenDetail, flash, compact = false }: { onMenu: () => void; onRoutes: () => void; onDaily?: () => void; onOpenDetail?: (detail: DetailPage) => void; flash: (message: string) => void; compact?: boolean }) {
  const [feature, setFeature] = useState<DailyFeature>("drink");
  const tabs: { id: DailyFeature; label: string }[] = [
    { id: "drink", label: "每日一杯" },
    { id: "brand", label: "品牌一日" },
    { id: "bartender", label: "调酒师怎么说" },
  ];

  return (
    <section className={`daily-hub full-span ${compact ? "daily-compact" : ""}`} aria-label="TapNight 每日内容与品牌推荐">
      <header className="daily-hub-head">
        <div><p className="eyebrow">THE DAILY TAPNIGHT · 每天更新</p><h2>今天值得喝的，也值得读。</h2></div>
        {compact ? <button className="daily-open" onClick={onDaily}>查看今日全部 →</button> : <span><i /> 今日 12:00 已更新</span>}
      </header>
      {!compact && <div className="daily-tabs" role="tablist" aria-label="每日内容分类">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={feature === tab.id} className={feature === tab.id ? "active" : ""} onClick={() => setFeature(tab.id)}>{tab.label}</button>
        ))}
      </div>}

      {feature === "drink" && (
        <article className="daily-feature daily-pour">
          <div className="daily-art drink-art"><span className="daily-glass"><i /></span><b>07 / 14</b><small>DAILY POUR</small></div>
          <div className="daily-copy daily-pour-copy">
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
          <div className="daily-art bottle-art"><span className="mini-bottle">VERMOUTH</span><b>24H</b><small>BRAND DAY</small></div>
          <div className="daily-copy brand-day-copy">
            <div className="daily-kicker"><span>品牌一日</span><em>白天 / 黑夜 · 上下两章</em></div>
            <div className="brand-period-stack" aria-label="品牌一日的日间与夜间内容">
              <section className="brand-period-block brand-period-day">
                <header><span>☀</span><div><small>DAY · 12:00</small><b>日间板块</b></div></header>
                <h3>先认识这一瓶。</h3>
                <p>都灵味美思 · 草本、微苦、适合单独喝</p>
                <button onClick={() => onOpenDetail?.({ kind: "brand", chapter: "day" })}>进入日间篇 →</button>
              </section>
              <section className="brand-period-block brand-period-night">
                <header><span>◐</span><div><small>NIGHT · 20:00</small><b>夜间板块</b></div></header>
                <h3>再读一个品牌故事。</h3>
                <p>从配方起源，到它在 Martini 里的安静角色</p>
                <button onClick={() => onOpenDetail?.({ kind: "brand", chapter: "night" })}>进入夜间篇 →</button>
              </section>
            </div>
          </div>
        </article>
      )}

      {feature === "bartender" && (
        <article className="daily-feature daily-bartender bartender-after-hours">
          <div className="daily-art bartender-art"><span>LY</span><b>COLUMN</b><small>BEYOND THE BAR</small></div>
          <div className="daily-copy bartender-column">
            <section className="bartender-interview-section">
              <div className="daily-kicker"><span>调酒师怎么说</span><em>采访专栏 · 林野 · Moss 主理调酒师</em></div>
              <h3>“一条路线，不该把夜晚写死。”</h3>
              <div className="bartender-interview-card"><small>Q · 你怎么决定一条路线的结束？</small><blockquote>“留一点意外，也留一点清醒。最后一杯应该让人愿意回家。”</blockquote><span>林野 · TapNight 本期调酒师访问</span><button onClick={() => onOpenDetail?.({ kind: "bartender" })}>读完整采访 →</button></div>
              <div className="bartender-quote-notes"><span><small>第一杯</small><b>先问今晚想不想醉</b></span><span><small>选店</small><b>用声音和座位决定</b></span><span><small>收尾</small><b>留清醒回家的余地</b></span></div>
            </section>
            <section className="bartender-route-pick"><div><small>BARTENDER ROUTE</small><b>林野今晚推荐的三站</b><span>Moss → NO. 17 → Archive Room</span></div><button onClick={onRoutes}>走这条路线 →</button></section>
          </div>
        </article>
      )}
    </section>
  );
}

function RoutesView({ likes, downs, liked, downed, onLike, onDown, onShare, onNfc, onOpenBar, onOpenDetail }: { likes: number; downs: number; liked: boolean; downed: boolean; onLike: () => void; onDown: () => void; onShare: () => void; onNfc: () => void; onOpenBar: (barId: number) => void; onOpenDetail: (detail: DetailPage) => void; }) {
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
          <div className="night-grid" />
          <div className="atlas-road atlas-road-one" /><div className="atlas-road atlas-road-two" /><div className="atlas-road atlas-road-three" />
          <div className="route-map-label label-jingan"><span>静安寺</span><b>JING&apos;AN</b></div>
          <div className="route-map-label label-julu"><span>巨鹿路</span><b>JULU RD.</b></div>
          <div className="route-compass">N <span>↑</span></div>
          <div className="route-curve" />
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
              <div className="stop-info"><p>{stop[1]} · {index ? `${(index * 1.4 + 1.2).toFixed(1)} km` : "起点"}</p><h3>{stop[2]} <span>{stop[5]}</span></h3><small><b>{stop[3]}</b> · {stop[4]}</small></div>
              <button onClick={() => onOpenBar([1, 2, 3][index])}>查看 →</button>
            </div>
          ))}
        </article>
        <aside className="route-comments">
          <div className="section-heading compact"><div><p className="eyebrow">ROUTE REVIEWS</p><h2>喝过的人说</h2></div><button onClick={() => onOpenDetail({ kind: "review" })}>写评价</button></div>
          <div className="rating-bars"><b>4.7</b><div><span>氛围 <i><em style={{ width: "94%" }} /></i></span><span>不绕路 <i><em style={{ width: "88%" }} /></i></span><span>酒单匹配 <i><em style={{ width: "91%" }} /></i></span></div></div>
          <article className="review-card"><header><span className="review-avatar mint">S</span><div><b>shhh_</b><small>走过这条路线 · 昨天</small></div><em>4.8</em></header><p>第二站比预想中热闹，但三杯的节奏很好。Moss 的露台收尾很舒服。</p><div><span>#不绕路</span><span>#适合两个人</span></div></article>
          <article className="review-card"><header><span className="review-avatar coral">K</span><div><b>Kino</b><small>到访 2 / 3 站 · 周六</small></div><em>3.8</em></header><p>NO. 17 等位比地图显示久，周六不建议照这个时间去。</p><div><span>#客流延迟</span><span>#周末避开</span></div></article>
          <div className="inline-route-picks"><header><b>本周另外两条</b><button onClick={() => onOpenDetail({ kind: "routes" })}>全部路线 →</button></header><button onClick={() => onOpenDetail({ kind: "routes" })}><span>雨天不淋湿路线</span><small>2.1 km · ↑ 1,204</small></button><button onClick={() => onOpenDetail({ kind: "routes" })}><span>三杯金酒散步</span><small>3.4 km · ↑ 986</small></button></div>
        </aside>
      </section>
    </div>
  );
}

function DetailPageView({ page, onBack, onOpen, onMenuForBar, onRoutes, flash }: {
  page: DetailPage;
  onBack: () => void;
  onOpen: (detail: DetailPage) => void;
  onMenuForBar: (bar: typeof bars[number]) => void;
  onRoutes: () => void;
  flash: (message: string) => void;
}) {
  const [reviewText, setReviewText] = useState("");
  const [reviewScore, setReviewScore] = useState(5);
  const [verifyInfoOpen, setVerifyInfoOpen] = useState(false);
  const [studioDrink, setStudioDrink] = useState("青梅雨");
  const [studioPublished, setStudioPublished] = useState(true);
  const [barIntro, setBarIntro] = useState("藏在陕西北路老建筑二层的安静酒吧。擅长威士忌、草本与低酒精创作，吧台旁偶尔会有邻居家的猫来访。");
  const allBars = [...bars, ...nearbyBars];
  const detailBar = page.kind === "bar" ? allBars.find((bar) => bar.id === page.barId) || bars[0] : bars[0];

  const detailTitles: Record<DetailPage["kind"], string> = {
    bar: "酒吧详情", brand: "品牌一日", bartender: "调酒师采访", routes: "路线库", review: "路线评价", badges: "勋章图鉴", verify: "调酒师认证", verifyApply: "认证申请", studio: "酒单工作台", barEditor: "酒吧介绍", city: "城市热力",
  };

  return (
    <div className={`detail-page detail-${page.kind}${page.kind === "brand" ? ` detail-brand-${page.chapter}` : ""}`}>
      <header className="detail-nav"><button onClick={onBack} aria-label="返回上一页">←</button><div><p className="eyebrow">TAPNIGHT · {detailTitles[page.kind]}</p><b>{detailTitles[page.kind]}</b></div><span>•••</span></header>

      {page.kind === "bar" && (
        <>
          <section className={`detail-hero bar-detail-hero tone-${detailBar.tone}`}>
            <div className="detail-bar-logo">{detailBar.logo}</div>
            <div><p>{detailBar.area} · 实时更新</p><h2>{detailBar.name}</h2><div className="detail-tag-row">{Array.from(new Set([...detailBar.tags, ...getConsensusTags(detailBar.id)])).slice(0, 5).map((tag) => <span key={tag}>#{tag}</span>)}</div></div>
            <aside><b>{detailBar.crowd}%</b><span>{detailBar.wait}</span><small>近 15 分钟</small></aside>
          </section>
          <section className="detail-grid detail-bar-grid">
            <article className="detail-card"><p className="eyebrow">WHY TONIGHT</p><h3>今晚为什么适合去</h3><ul><li>你的常选标签命中 {Math.max(2, getConsensusTags(detailBar.id).length)} 项</li><li>从最近地铁站步行约 6 分钟</li><li>当前客流低于同街区晚间均值</li></ul></article>
            <article className="detail-card detail-menu-preview"><p className="eyebrow">SEASONAL MENU</p><h3>本季先喝这三杯</h3>{(venueDrinkMenus[detailBar.name] || venueDrinkMenus["Archive Room"]).slice(0, 3).map((drink) => <div key={drink.name}><i style={{ background: drink.color }} /><span><b>{drink.name}</b><small>{drink.tags.slice(0, 2).join(" · ")}</small></span><em>¥{drink.price}</em></div>)}</article>
          </section>
          <footer className="detail-actions"><button onClick={() => onMenuForBar(detailBar)}>打开完整酒单</button><button className="detail-primary" onClick={onRoutes}>放进今晚路线 →</button></footer>
        </>
      )}

      {page.kind === "brand" && (
        <>
          <section className="detail-hero brand-detail-hero">
            <div className="detail-bottle">V</div>
            <div><p>{page.chapter === "day" ? "DAY · 12:00" : "NIGHT · 20:00"}</p><h2>{page.chapter === "day" ? "先认识这一瓶。" : "再读一个品牌故事。"}</h2><span>都灵味美思 · TapNight 品牌一日</span></div>
          </section>
          <section className="detail-grid brand-story-grid">
            <article className="detail-card detail-story"><p className="eyebrow">{page.chapter === "day" ? "BOTTLE NOTES" : "AFTER DARK"}</p><h3>{page.chapter === "day" ? "草本不是一种味道，是一整座花园。" : "它在 Martini 里，扮演安静却不能缺席的角色。"}</h3><p>{page.chapter === "day" ? "艾草、龙胆、橙皮和葡萄酒基底共同决定了这一瓶的轮廓。先冰镇单饮，再去理解它如何进入一杯鸡尾酒。" : "品牌从都灵小酒馆的餐前时刻出发，后来成为世界各地吧台上的共同语言。真正好的味美思，不只负责增加甜味。"}</p></article>
            <article className="detail-card detail-facts"><span><small>适饮温度</small><b>{page.chapter === "day" ? "6–8°C" : "8–10°C"}</b></span><span><small>建议喝法</small><b>{page.chapter === "day" ? "冰镇 / 加橙皮" : "Martini / Negroni"}</b></span><span><small>风味标签</small><b>草本 · 微苦 · 柑橘</b></span></article>
          </section>
          <footer className="detail-actions"><button onClick={() => onOpen({ kind: "brand", chapter: page.chapter === "day" ? "night" : "day" })}>切换到{page.chapter === "day" ? "夜间" : "日间"}篇</button><button className="detail-primary" onClick={() => flash("品牌一日已收藏")}>＋ 收藏这篇</button></footer>
        </>
      )}

      {page.kind === "bartender" && (
        <>
          <section className="detail-hero bartender-detail-hero"><div className="detail-portrait">LY</div><div><p>MOSS · 主理调酒师</p><h2>林野：路线要留一点意外。</h2><span>TapNight 采访专栏 · 8 min read</span></div></section>
          <section className="detail-grid bartender-story-grid">
            <article className="detail-card detail-interview"><p className="eyebrow">THE INTERVIEW</p><h3>“最后一杯应该让人愿意回家。”</h3><p><b>Q</b> 你怎么决定一条路线的结束？</p><p><b>A</b> 我不会用最重的一杯强行收尾。看同行的人是否还在认真说话，也看下一程回家是否轻松。留一点清醒，本身就是对夜晚的尊重。</p></article>
            <article className="detail-card detail-qa"><span><small>第一杯</small><b>先问今晚想不想醉</b></span><span><small>选店</small><b>用声音和座位决定</b></span><span><small>收尾</small><b>留清醒回家的余地</b></span></article>
          </section>
          <footer className="detail-actions"><button onClick={() => flash("采访已收藏")}>＋ 收藏采访</button><button className="detail-primary" onClick={onRoutes}>走林野推荐路线 →</button></footer>
        </>
      )}

      {page.kind === "routes" && (
        <>
          <section className="detail-hero routes-detail-hero"><div><p>CURATED FOR TONIGHT</p><h2>今晚可以直接走的路线。</h2><span>结合实时客流、天气和你常选的风味</span></div><b>03</b></section>
          <section className="route-library">
            {[
              ["01", "从清爽到烟熏", "Archive → NO. 17 → Moss", "4.2 km", "↑ 326", "最匹配"],
              ["02", "雨天不淋湿路线", "ECHO → FABLE → HUSH", "2.1 km", "↑ 1,204", "雨天友好"],
              ["03", "三杯金酒散步", "Moss → Archive → ECHO", "3.4 km", "↑ 986", "低客流"],
            ].map((route) => <button key={route[0]} onClick={onRoutes}><span>{route[0]}</span><div><small>{route[5]}</small><h3>{route[1]}</h3><p>{route[2]}</p></div><aside><b>{route[3]}</b><em>{route[4]}</em><i>→</i></aside></button>)}
          </section>
        </>
      )}

      {page.kind === "review" && (
        <section className="review-editor">
          <div className="review-editor-head"><p className="eyebrow">ROUTE REVIEW</p><h2>这条路线，实际走起来怎么样？</h2><span>评价路线整体，也可以单独提到某一家店。</span></div>
          <div className="review-score-picker" aria-label="路线评分">{[1, 2, 3, 4, 5].map((score) => <button className={score <= reviewScore ? "active" : ""} onClick={() => setReviewScore(score)} key={score}>★</button>)}</div>
          <div className="review-tag-picker">{["不绕路", "酒单匹配", "适合聊天", "客流准确", "收尾舒服", "周末避开"].map((tag) => <button key={tag} onClick={() => setReviewText((text) => `${text}${text ? " " : ""}#${tag}`)}>#{tag}</button>)}</div>
          <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="写下路线节奏、客流或某一杯酒的真实感受……" />
          <button className="review-submit" disabled={!reviewText.trim()} onClick={() => { flash(`${reviewScore}.0 分评价已发布`); onBack(); }}>发布评价 →</button>
        </section>
      )}

      {page.kind === "badges" && (
        <>
          <section className="detail-hero badge-detail-hero"><div><p>11 / 24 UNLOCKED</p><h2>你的酒鬼勋章图鉴。</h2><span>理性饮酒 · 只奖励多样探索与有帮助的记录</span></div><b>LEVEL 07</b></section>
          <section className="detail-badge-grid">{[
            ["8", "第八杯之后", "累计打卡 80 次", "已获得"], ["月", "月下常客", "夜间打卡 30 次", "已获得"], ["酸", "酸感猎人", "评价 20 杯酸感酒", "已获得"], ["↝", "路线家", "路线获推荐 100 次", "已获得"], ["猫", "遇猫体质", "在 8 家有猫酒吧打卡", "6 / 8"], ["清", "清醒收尾", "10 条路线选择低酒精收尾", "7 / 10"],
          ].map((badge) => <article className={badge[3] === "已获得" ? "unlocked" : ""} key={badge[1]}><span>{badge[0]}</span><b>{badge[1]}</b><small>{badge[2]}</small><em>{badge[3]}</em></article>)}</section>
        </>
      )}

      {page.kind === "verify" && (
        <>
          <section className="detail-hero verify-detail-hero"><div className="verify-mark">B+</div><div><p>BARTENDER VERIFICATION</p><h2>成为认证调酒师。</h2><span>认证后可维护酒单、接受采访并发布推荐路线</span></div></section>
          <section className="verify-steps">{[["01", "身份与从业信息", "姓名、所在门店与从业年限"], ["02", "门店或同行证明", "上传在职证明或邀请一位已认证同行"], ["03", "人工审核", "通常会在 2 个工作日内完成"]].map((step) => <article key={step[0]}><span>{step[0]}</span><div><b>{step[1]}</b><small>{step[2]}</small></div><i>✓</i></article>)}</section>
          <footer className="detail-actions"><button onClick={() => setVerifyInfoOpen(true)}>先看看说明</button><button className="detail-primary" onClick={() => onOpen({ kind: "verifyApply" })}>开始认证 →</button></footer>
        </>
      )}

      {page.kind === "verifyApply" && (
        <>
          <section className="detail-hero verify-apply-hero"><div><p>STEP 01 · PROFILE</p><h2>让我们确认你的从业身份。</h2><span>资料仅用于人工审核，不会展示在公开主页</span></div><b>1/3</b></section>
          <section className="verify-application-form">
            <label><span>真实姓名</span><input defaultValue="林野" /></label>
            <label><span>从业门店</span><input defaultValue="Archive Room" /></label>
            <label><span>从业年限</span><select defaultValue="5"><option value="1">1–2 年</option><option value="3">3–4 年</option><option value="5">5 年以上</option></select></label>
            <button className="verify-upload" onClick={() => flash("证明文件已选择 · Developer 模拟")}><i>＋</i><span><b>上传门店或同行证明</b><small>工作证、排班证明或认证同行邀请</small></span><em>选择文件</em></button>
            <label className="verify-consent"><input type="checkbox" defaultChecked /><span>我确认资料真实，并同意仅用于 TapNight 调酒师认证审核。</span></label>
          </section>
          <footer className="detail-actions"><button onClick={() => onOpen({ kind: "verify" })}>返回认证首页</button><button className="detail-primary" onClick={() => { flash("Developer：认证通过，已打开酒单工作台"); onOpen({ kind: "studio" }); }}>提交并预览认证后界面 →</button></footer>
        </>
      )}

      {page.kind === "studio" && (
        <>
          <section className="detail-hero studio-hero"><div><p>VERIFIED · ARCHIVE ROOM</p><h2>今晚的酒单，由你维护。</h2><span>林野 · 已认证调酒师 B+</span></div><aside><i />{studioPublished ? "线上酒单已发布" : "当前为草稿"}<small>更新于 2 min 前</small></aside></section>
          <section className="studio-grid">
            <article className="studio-menu-panel"><header><div><p className="eyebrow">SUMMER 2026</p><h3>本季酒单 · 4 杯</h3></div><button onClick={() => flash("已新建一杯空白酒款")}>＋ 新增酒款</button></header>{venueDrinkMenus["Archive Room"].map((drink, index) => <button className={studioDrink === drink.name ? "active" : ""} onClick={() => setStudioDrink(drink.name)} key={drink.name}><span style={{ background: drink.color }}>{String(index + 1).padStart(2, "0")}</span><div><b>{drink.name}</b><small>{drink.formula}</small></div><em>¥{drink.price}</em><i>编辑</i></button>)}</article>
            <aside className="studio-side-panel"><article><p className="eyebrow">SELECTED DRINK</p><h3>{studioDrink}</h3><div className="studio-field"><span>公开标签</span><b>#酸甜　#草本　#低酒精</b></div><div className="studio-field"><span>状态</span><b>酒单中 · 可供应</b></div><button onClick={() => flash(`「${studioDrink}」编辑器已打开`)}>编辑配方与标签 →</button></article><article><p className="eyebrow">VENUE PROFILE</p><h3>Archive Room</h3><span>酒吧介绍、营业时间、氛围与设施</span><button onClick={() => onOpen({ kind: "barEditor" })}>添加 / 编辑酒吧介绍 →</button></article></aside>
          </section>
          <footer className="detail-actions"><button onClick={() => onOpen({ kind: "barEditor" })}>维护酒吧介绍</button><button className="detail-primary" onClick={() => { setStudioPublished(true); flash("2026 夏季酒单已发布"); }}>发布本季酒单 →</button></footer>
        </>
      )}

      {page.kind === "barEditor" && (
        <>
          <section className="detail-hero bar-editor-hero"><div><p>VENUE PROFILE · ARCHIVE ROOM</p><h2>先让大家认识这家店。</h2><span>认证调酒师与门店管理员可共同维护</span></div><b>AR</b></section>
          <section className="bar-editor-form">
            <div className="bar-editor-row"><label><span>酒吧名称</span><input defaultValue="Archive Room" /></label><label><span>所在区域</span><input defaultValue="静安区 · 陕西北路" /></label></div>
            <label><span>一句话介绍</span><input defaultValue="安静喝一杯，也许会遇见猫。" maxLength={30} /></label>
            <label className="bar-intro-field"><span>完整介绍</span><textarea value={barIntro} onChange={(event) => setBarIntro(event.target.value)} maxLength={240} /><small>{barIntro.length} / 240</small></label>
            <div className="bar-amenities"><span>门店特点</span>{["安静吧台", "威士忌", "低酒精", "可独饮", "偶尔有猫", "近地铁"].map((item, index) => <button className={index < 5 ? "active" : ""} key={item}>#{item}</button>)}</div>
          </section>
          <footer className="detail-actions"><button onClick={() => onOpen({ kind: "studio" })}>返回酒单工作台</button><button className="detail-primary" onClick={() => { flash("酒吧介绍已保存并提交审核"); onOpen({ kind: "studio" }); }}>保存酒吧介绍 →</button></footer>
        </>
      )}

      {page.kind === "city" && (
        <>
          <section className="detail-hero city-detail-hero"><div><p>SHANGHAI · LIVE</p><h2>2,847 人正在喝。</h2><span>数据来自匿名到店打卡，约 2 分钟更新一次</span></div><i><span /></i></section>
          <section className="city-stat-grid"><article><small>当前最热街区</small><b>静安 · 82%</b><em>↑ 12%</em></article><article><small>最舒适时段</small><b>20:10–21:00</b><em>预计</em></article><article><small>低客流酒吧</small><b>18 家</b><em>步行 20 min</em></article><article><small>新酒单上线</small><b>7 家</b><em>今天</em></article></section>
          <section className="detail-card city-note"><p className="eyebrow">DATA NOTE</p><h3>实时，但不制造催促。</h3><p>热力只表示当前到店密度，不鼓励过量饮酒。离店后的匿名设备凭证会自动失效。</p></section>
        </>
      )}

      {verifyInfoOpen && (
        <div className="modal-backdrop verify-info-backdrop" role="presentation" onMouseDown={() => setVerifyInfoOpen(false)}>
          <section className="verify-info-modal" role="dialog" aria-modal="true" aria-labelledby="verify-info-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setVerifyInfoOpen(false)}>×</button>
            <p className="eyebrow">BEFORE YOU START</p><h2 id="verify-info-title">调酒师认证说明</h2>
            <div className="verify-info-list"><article><b>谁可以申请</b><span>现职调酒师、酒吧主理人，以及有可验证从业经历的行业人员。</span></article><article><b>需要准备</b><span>姓名、所在门店、从业年限，以及工作证 / 排班证明 / 已认证同行邀请之一。</span></article><article><b>审核与权限</b><span>通常 2 个工作日。通过后可维护门店酒单、酒吧介绍并发布调酒师推荐路线。</span></article><article><b>隐私与撤回</b><span>身份材料仅用于审核，不会公开；提交前可随时退出，认证后也可申请注销。</span></article></div>
            <button className="primary-button full" onClick={() => setVerifyInfoOpen(false)}>我知道了</button>
          </section>
        </div>
      )}
    </div>
  );
}

function MenuView({ selectedBar, onSelectBar, ratedDrinks, onRate, onNotify }: { selectedBar: typeof bars[number]; onSelectBar: (bar: typeof bars[number]) => void; ratedDrinks: string[]; onRate: (name: string) => void; onNotify: (message: string) => void }) {
  const [filter, setFilter] = useState("全部");
  const [tagOpen, setTagOpen] = useState(false);
  const [tagDrink, setTagDrink] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [customDrinkTags, setCustomDrinkTags] = useState<Record<string, string[]>>({});
  const menuBars = [...bars, ...nearbyBars];
  const activeMenu = venueDrinkMenus[selectedBar.name] || venueDrinkMenus["Archive Room"];
  const availableTags = ["全部", ...Array.from(new Set(activeMenu.flatMap((drink) => [...drink.tags, ...(customDrinkTags[drink.name] || [])])))].slice(0, 8);
  const visible = filter === "全部" ? activeMenu : activeMenu.filter((drink) => [...drink.tags, ...(customDrinkTags[drink.name] || [])].includes(filter));
  const suggestedTags = ["适合第一杯", "咸鲜", "约会", "拍照好看", "酒感轻", "隐藏款"];

  useEffect(() => {
    setFilter("全部");
    setTagDrink((venueDrinkMenus[selectedBar.name] || venueDrinkMenus["Archive Room"])[0].name);
    setTagDraft("");
  }, [selectedBar.id, selectedBar.name]);

  function saveCustomTag() {
    const tag = tagDraft.trim().replace(/^#/, "").slice(0, 12);
    if (!tag || !tagDrink) return;
    setCustomDrinkTags((current) => ({ ...current, [tagDrink]: Array.from(new Set([...(current[tagDrink] || []), tag])) }));
    setTagDraft("");
    setTagOpen(false);
    onNotify(`#${tag} 已贴到「${tagDrink}」`);
  }

  return (
    <div className="menu-page">
      <section className="menu-frame" aria-label={`${selectedBar.name} 完整季节酒单`}>
        <section className="menu-hero">
          <div><p className="eyebrow">NFC MENU · 当前到店</p><h2>{selectedBar.name}</h2><p>{selectedBar.area} · 碰一碰后自动定位本店酒单。每杯都有配方、风味与喝过的人的标签。</p><span className="menu-checkin-chip"><i /> 已定位本店 · 客流 {selectedBar.crowd}%</span></div>
          <div className="menu-count"><b>{String(activeMenu.length).padStart(2, "0")}</b><span>杯本季精选</span><small>2026 夏季酒单</small><button onClick={() => { setTagDrink(activeMenu[0].name); setTagOpen(true); }}>＋ 自定义标签</button></div>
        </section>
        <div className="menu-filter-stack">
          <div className="filter-row venue-filter-row" aria-label="切换酒吧"><span>酒吧</span>{menuBars.map((bar) => <button key={bar.id} className={`venue-filter ${selectedBar.id === bar.id ? "active" : ""}`} onClick={() => onSelectBar(bar)}>{bar.name}</button>)}</div>
          <div className="filter-row taste-filter-row" aria-label="按口味筛选"><span>口味</span>{availableTags.map((item) => <button key={item} className={`taste-filter ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
        </div>
        <section className="drink-grid">
          {visible.map((drink, index) => {
            const displayTags = Array.from(new Set([...drink.tags, ...(customDrinkTags[drink.name] || [])]));
            return <article className="drink-card" key={drink.name}>
              <div className="drink-card-art" style={{ "--drink-color": drink.color } as React.CSSProperties}><span className="drink-photo-frame"><span className="glass"><i /></span></span><b>0{index + 1}</b></div>
              <div className="drink-card-copy"><p>{drink.bar}</p><div className="drink-title"><h2>{drink.name}<small>{drink.english}</small></h2><b>¥{drink.price}</b></div><p className="formula">{drink.formula}</p><div className="inline-tags">{displayTags.map((tag) => <span className={(customDrinkTags[drink.name] || []).includes(tag) ? "custom" : ""} key={tag}>{tag}</span>)}</div><div className="taste-profile"><label>酸度 <i><em style={{ width: `${drink.taste[0]}%` }} /></i></label><label>香气 <i><em style={{ width: `${drink.taste[1]}%` }} /></i></label><label>酒感 <i><em style={{ width: `${drink.taste[2]}%` }} /></i></label></div><footer><span><b>4.{8 - index}</b> · {126 - index * 17} 人喝过</span><button className={ratedDrinks.includes(drink.name) ? "done" : ""} onClick={() => onRate(drink.name)}>{ratedDrinks.includes(drink.name) ? "✓ 已喝过" : "＋ 今天喝过"}</button></footer></div>
            </article>
          })}
        </section>
      </section>
      {tagOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setTagOpen(false)}>
          <section className="tag-modal" role="dialog" aria-modal="true" aria-labelledby="tag-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="关闭" onClick={() => setTagOpen(false)}>×</button>
            <p className="eyebrow">COMMUNITY TAG</p><h2 id="tag-modal-title">这杯酒，给你什么感觉？</h2>
            <p className="modal-copy">先选一杯，再用推荐标签或写下自己的词。相同标签达到门槛后会成为酒吧公开筛选项。</p>
            <div className="tag-drink-picker">{activeMenu.map((drink) => <button className={tagDrink === drink.name ? "active" : ""} onClick={() => setTagDrink(drink.name)} key={drink.name}><i style={{ background: drink.color }} />{drink.name}</button>)}</div>
            <div className="tag-suggestions">{suggestedTags.map((tag) => <button className={tagDraft === tag ? "active" : ""} onClick={() => setTagDraft(tag)} key={tag}>#{tag}</button>)}</div>
            <label className="tag-input"><span>#</span><input autoFocus maxLength={12} value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveCustomTag(); }} placeholder="自定义标签，最多 12 字" /></label>
            <button className="primary-button full" disabled={!tagDraft.trim()} onClick={saveCustomTag}>保存到「{tagDrink}」</button>
            <p className="privacy-note">标签会公开显示；此 Developer 版本先保存在当前会话。</p>
          </section>
        </div>
      )}
    </div>
  );
}

const drinkingPersonalityQuestions = [
  { axis: "E / I", prompt: "刚进酒吧，哪种状态让你更快进入今晚？", options: [
    { letter: "E", title: "先去吧台看看谁在", detail: "有互动，夜晚才真正开始" },
    { letter: "I", title: "先找一个舒服的位置", detail: "安静下来，才听得到自己的口味" },
  ] },
  { axis: "E / I", prompt: "朋友临时又带来两个人，你的第一反应是？", options: [
    { letter: "E", title: "人多一点更有意思", detail: "新面孔可能带来新的下一站" },
    { letter: "I", title: "希望还能好好说话", detail: "小桌和熟人更容易放松" },
  ] },
  { axis: "E / I", prompt: "喝到第二杯时，你通常在？", options: [
    { letter: "E", title: "和隔壁聊起隐藏酒单", detail: "聊天是今晚的另一种风味" },
    { letter: "I", title: "慢慢感受这一杯的变化", detail: "不急着把安静填满" },
  ] },
  { axis: "S / N", prompt: "面对一张完全陌生的酒单，你会？", options: [
    { letter: "S", title: "从熟悉的基酒开始", detail: "先抓住可判断的风味线索" },
    { letter: "N", title: "直接问本季最奇怪的一杯", detail: "未知比稳妥更让人兴奋" },
  ] },
  { axis: "S / N", prompt: "选择下一家店时，哪个信息更打动你？", options: [
    { letter: "S", title: "有位、好走、酒单稳定", detail: "真实体验比概念更重要" },
    { letter: "N", title: "新概念、隐藏门、限定夜", detail: "一个好故事值得绕点路" },
  ] },
  { axis: "S / N", prompt: "你更容易记住一家酒吧的什么？", options: [
    { letter: "S", title: "那杯酒具体的香气和口感", detail: "细节会留下可靠的坐标" },
    { letter: "N", title: "那个晚上整体的想象空间", detail: "氛围会继续长成故事" },
  ] },
  { axis: "T / F", prompt: "朋友问“今晚去哪喝”，你会先考虑？", options: [
    { letter: "T", title: "距离、客满和酒单匹配度", detail: "把有限的夜晚安排得更准" },
    { letter: "F", title: "大家此刻想要什么感觉", detail: "合适的气氛比最优解重要" },
  ] },
  { axis: "T / F", prompt: "一杯酒不太合口味时，你会？", options: [
    { letter: "T", title: "拆解配方，找到不喜欢的原因", detail: "判断清楚，下次推荐才更准" },
    { letter: "F", title: "记录它带来的感觉和场景", detail: "不喜欢也可能是独特记忆" },
  ] },
  { axis: "T / F", prompt: "评价一条路线时，你更在意？", options: [
    { letter: "T", title: "节奏、距离和风味递进", detail: "好路线应该经得起复走" },
    { letter: "F", title: "同行的人有没有被照顾到", detail: "每个人舒服才是好路线" },
  ] },
  { axis: "J / P", prompt: "出门前，你通常会把今晚安排到哪一步？", options: [
    { letter: "J", title: "三站和备用店都先排好", detail: "计划让夜晚更自由" },
    { letter: "P", title: "只定第一杯，之后再说", detail: "最好的下一站常在路上出现" },
  ] },
  { axis: "J / P", prompt: "计划中的店突然客满，你会？", options: [
    { letter: "J", title: "立刻切到收藏好的备用店", detail: "路线可以变，但节奏不能断" },
    { letter: "P", title: "顺着附近热度临时发现", detail: "意外就是今晚的新分支" },
  ] },
  { axis: "J / P", prompt: "什么时候你会觉得“今晚可以收尾了”？", options: [
    { letter: "J", title: "走完预想中的完整弧线", detail: "有开始，也要有漂亮的结尾" },
    { letter: "P", title: "感觉到了，自然就结束", detail: "不需要为了完成计划再喝一杯" },
  ] },
];

const drinkingTypeNames: Record<string, string> = {
  INTJ: "夜航策展人", INTP: "配方解谜者", ENTJ: "路线领航员", ENTP: "隐藏款猎手",
  INFJ: "深夜倾听者", INFP: "氛围收藏家", ENFJ: "酒桌连接者", ENFP: "即兴夜游家",
  ISTJ: "熟店守夜人", ISFJ: "安静照顾者", ESTJ: "高效组局人", ESFJ: "热场款待家",
  ISTP: "吧台观察员", ISFP: "风味感受家", ESTP: "续摊发动机", ESFP: "今晚主角",
};

function getDrinkingPersonality(type: string) {
  const energy = type[0] === "E" ? "你从人群和现场互动里获得能量" : "你在安静与少数熟人之间慢慢充电";
  const discovery = type[1] === "N" ? "总会为未知风味多走一段路" : "相信真实细节和稳定的好味道";
  const decision = type[2] === "T" ? "习惯用酒单、距离和节奏做判断" : "会先照顾当晚每个人的感觉";
  const pace = type[3] === "J" ? "喜欢让路线有清楚的起承转合" : "也愿意把下一站交给临场灵感";
  return {
    name: drinkingTypeNames[type] || "夜晚漫游者",
    summary: `${energy}，${discovery}；${decision}，${pace}。`,
    bar: type[0] === "I" ? "Archive Room · 安静吧台" : "NO. 17 · 开放式吧台",
    route: type[3] === "J" ? "适合：三站风味递进路线" : "适合：开放式附近热度路线",
    tags: [type[0] === "E" ? "社交充电" : "独处充电", type[1] === "N" ? "隐藏款猎手" : "熟味观察", type[2] === "T" ? "理性选酒" : "氛围优先", type[3] === "J" ? "路线规划" : "即兴续摊"],
  };
}

function CommunityPage({ personality, onGreet, onSavePersonality }: {
  personality: DrinkPersonality | null;
  onGreet: (name: string) => void;
  onSavePersonality: (personality: DrinkPersonality) => void;
}) {
  const [greeted, setGreeted] = useState<string[]>([]);
  const [testOpen, setTestOpen] = useState(false);
  const [testStep, setTestStep] = useState(0);
  const [testAnswers, setTestAnswers] = useState<string[]>([]);
  const [personalityType, setPersonalityType] = useState(personality?.type || "");
  const currentQuestion = drinkingPersonalityQuestions[testStep];
  const testResult = personalityType ? getDrinkingPersonality(personalityType) : null;

  const greet = (name: string) => {
    if (!greeted.includes(name)) setGreeted((people) => [...people, name]);
    onGreet(name);
  };

  const answerPersonalityQuestion = (letter: string) => {
    const nextAnswers = [...testAnswers, letter];
    setTestAnswers(nextAnswers);
    if (testStep < drinkingPersonalityQuestions.length - 1) {
      setTestStep((step) => step + 1);
      return;
    }
    const type = ["EI", "SN", "TF", "JP"].map((pair) => {
      const first = nextAnswers.filter((answer) => answer === pair[0]).length;
      const second = nextAnswers.filter((answer) => answer === pair[1]).length;
      return first > second ? pair[0] : pair[1];
    }).join("");
    setPersonalityType(type);
  };

  const restartPersonalityTest = () => {
    setTestStep(0);
    setTestAnswers([]);
    setPersonalityType("");
  };

  return (
    <div className="community-page">
      <section className="community-intro personality-intro">
        <div><p className="eyebrow">TAPNIGHT SOCIAL · 16 DRINKING TYPES</p><h2>先测酒格，<br />再碰酒友。</h2></div>
        <button className="personality-entry" onClick={() => setTestOpen(true)}>
          <span>类似 MBTI · 16 型喝酒人格</span>
          <strong>{personality ? `${personality.type} · ${personality.name}` : "12 题 · 约 2 分钟"}</strong>
          <small>社交能量 × 探索倾向 × 判断方式 × 路线节奏</small>
          <i>{personality ? "查看结果 / 重测 →" : "开始测试 →"}</i>
        </button>
      </section>
      <section className="social-profile-grid">
        <article className="leaderboard-panel">
          <div className="section-heading compact"><div><p className="eyebrow">BADGE LEADERBOARD · 上海</p><h2>酒鬼勋章榜</h2></div><span className="board-period">本月</span></div>
          <div className="responsible-note"><b>18+</b><div><strong>理性饮酒，喝得多不代表排名高。</strong><small>只计算安全打卡、路线多样性和有帮助的评价。</small></div></div>
          <div className="leaderboard-list">
            {[
              ["01", "Yoko", "路线策展人", "18 枚", "Y"], ["02", "Momo", "清醒收尾", "16 枚", "M"], ["03", "Kino", "风味记录者", "14 枚", "K"], ["04", "Sam Wang", "夜行路线家", "11 枚", "SW"],
            ].map((person) => {
              const isCurrent = person[1] === "Sam Wang";
              return <div className={`leaderboard-row ${isCurrent ? "current" : ""}`} key={person[1]}><span>{person[0]}</span><i>{person[4]}</i><div><b>{person[1]}{isCurrent && personality && <em className="personality-badge">{personality.type} · {personality.name}</em>}</b><small>{person[2]}</small></div><strong>{person[3]}</strong></div>;
            })}
          </div>
        </article>

        <article className="encounter-panel">
          <div className="section-heading compact"><div><p className="eyebrow">SAME BAR · SAME TIME</p><h2>今晚偶遇的酒友</h2></div><span className="encounter-live"><i /> 仅你可见</span></div>
          <p className="encounter-privacy">双方授权 · 同店重合 30 分钟以上 · 偶遇 4 次后可打招呼</p>
          <div className="encounter-list">
            {[
              { name: "Momo", avatar: "M", bar: "Archive Room", time: "21:10–21:42", count: 4 },
              { name: "林野", avatar: "林", bar: "Moss", time: "上周五 · 23:18", count: 3 },
              { name: "A-Yao", avatar: "A", bar: "NO. 17", time: "07.05 · 22:04", count: 2 },
            ].map((person) => {
              const canGreet = person.count > 3;
              const isGreeted = greeted.includes(person.name);
              return <div className="encounter-row" key={person.name}><span>{person.avatar}</span><div><b>{person.name}<em>偶遇 {person.count} 次</em></b><small>{person.bar} · {person.time}</small></div><button disabled={!canGreet} className={isGreeted ? "greeted" : ""} onClick={() => greet(person.name)}>{isGreeted ? "✓ 已打招呼" : canGreet ? "打个招呼" : `再遇 ${4 - person.count} 次`}</button></div>;
            })}
          </div>
        </article>
      </section>

      {testOpen && (
        <div className="personality-overlay" onClick={() => setTestOpen(false)}>
          <section className="personality-dialog" role="dialog" aria-modal="true" aria-label="16 型喝酒人格测试" onClick={(event) => event.stopPropagation()}>
            <header className="personality-dialog-head"><div><p className="eyebrow">TAPNIGHT DRINKING TYPE</p><b>16 型喝酒人格</b></div><button onClick={() => setTestOpen(false)} aria-label="关闭喝酒人格测试">×</button></header>
            {testResult ? (
              <div className="personality-result">
                <p>你的喝酒人格是</p>
                <div className="personality-code"><b>{personalityType}</b><span>{testResult.name}</span></div>
                <p className="personality-summary">{testResult.summary}</p>
                <div className="personality-dimensions">{testResult.tags.map((tag, index) => <span key={tag}><b>{personalityType[index]}</b>{tag}</span>)}</div>
                <div className="personality-recommendation"><span><small>推荐酒吧</small><b>{testResult.bar}</b></span><span><small>推荐走法</small><b>{testResult.route}</b></span></div>
                <div className="personality-result-actions"><button className="save-personality" disabled={personality?.type === personalityType} onClick={() => { onSavePersonality({ type: personalityType, name: testResult.name }); setTestOpen(false); }}>{personality?.type === personalityType ? "✓ 已加入酒鬼勋章" : "＋ 加到酒鬼勋章"}</button><button onClick={restartPersonalityTest}>重新测试</button></div>
              </div>
            ) : (
              <div className="personality-question">
                <div className="personality-progress"><span><b>{String(testStep + 1).padStart(2, "0")}</b> / {drinkingPersonalityQuestions.length}</span><em>{currentQuestion.axis}</em><i><b style={{ width: `${((testStep + 1) / drinkingPersonalityQuestions.length) * 100}%` }} /></i></div>
                <div className="personality-axis-row">{["E / I", "S / N", "T / F", "J / P"].map((axis) => <span className={currentQuestion.axis === axis ? "active" : ""} key={axis}>{axis}</span>)}</div>
                <h3>{currentQuestion.prompt}</h3>
                <div className="personality-options">{currentQuestion.options.map((option) => <button key={option.letter} onClick={() => answerPersonalityQuestion(option.letter)}><b>{option.letter}</b><span><strong>{option.title}</strong><small>{option.detail}</small></span><i>→</i></button>)}</div>
                <p className="personality-note">没有标准答案，只按你大多数夜晚的真实反应选择。</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ProfileView({ onVerify, onOpenBar, onOpenRoutes, onOpenBadges }: { onVerify: () => void; onOpenBar: (barId: number) => void; onOpenRoutes: () => void; onOpenBadges: () => void }) {

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">SW<span>LEVEL 07</span></div>
        <div className="profile-name"><p className="eyebrow">MEMBER SINCE 2024</p><h2>Sam Wang</h2><p>@after_eight · 上海</p><div className="profile-tags"><span>酸感猎人</span><span>夜行路线家</span><span>威士忌学徒</span></div><button className="profile-verify-chip" onClick={onVerify}>B+ 调酒师认证 →</button></div>
        <div className="profile-stats"><div><b>86</b><span>打卡</span></div><div><b>34</b><span>酒吧</span></div><div><b>19</b><span>路线</span></div><div><b>128</b><span>杯酒</span></div></div>
      </section>

      <section className="profile-grid profile-core-grid">
        <article className="badge-panel">
          <div className="section-heading compact"><div><p className="eyebrow">BADGES · 11 / 24</p><h2>你的酒鬼勋章</h2></div><button onClick={onOpenBadges}>查看全部 →</button></div>
          <div className="badge-grid">
            {[
              ["8", "第八杯之后", "累计打卡 80 次"], ["月", "月下常客", "夜间打卡 30 次"], ["酸", "酸感猎人", "评价 20 杯酸感酒"], ["↝", "路线家", "分享路线被推荐 100 次"], ["猫", "遇猫体质", "在 8 家有猫酒吧打卡"], ["?", "下一枚", "再去 2 家新酒吧"],
            ].slice(0, 4).map((badge) => <div className="badge-item" key={badge[1]}><span>{badge[0]}</span><b>{badge[1]}</b><small>{badge[2]}</small></div>)}
          </div>
        </article>
        <div className="profile-side-stack">
          <article className="frequent-panel">
            <div className="section-heading compact"><div><p className="eyebrow">FREQUENT BARS</p><h2>常去 · 记录</h2></div></div>
            {[
              ["01", "Archive Room", "18 次", "酸甜 · 安静"], ["02", "Moss", "12 次", "金酒 · 露台"], ["03", "NO. 17", "9 次", "清爽 · 热闹"],
            ].map((bar, index) => <div className="frequent-row" key={bar[1]}><span>{bar[0]}</span><div><b>{bar[1]}</b><small>{bar[3]}</small></div><strong>{bar[2]}</strong><button onClick={() => onOpenBar([1, 3, 2][index])} aria-label={`查看 ${bar[1]} 详情`}>→</button></div>)}
          </article>
          <article className="history-panel">
            <div className="section-heading compact"><div><p className="eyebrow">MY ROUTES</p><h2>最近路线</h2></div><button onClick={onOpenRoutes}>全部 →</button></div>
            {[
              ["07.12", "从清爽到烟熏", "3 站", "↑ 326"], ["06.28", "雨天不淋湿路线", "3 站", "↑ 204"],
            ].map((route) => <div className="history-row" key={route[0]}><time>{route[0]}</time><div><b>{route[1]}</b><small>{route[2]}</small></div><span>{route[3]}</span><button onClick={onOpenRoutes} aria-label={`查看路线 ${route[1]}`}>↗</button></div>)}
          </article>
        </div>
      </section>

    </div>
  );
}
