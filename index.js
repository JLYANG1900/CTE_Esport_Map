
// --- CTE Esport Map 核心逻辑 (v3.0 最终修复版) ---

const extensionName = "cte-esport-map";
const defaultMapBg = "https://files.catbox.moe/hjurjz.png";
const defaultNationalMapBg = "https://files.catbox.moe/4p0d94.jpg";
const userPlaceholderAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c5a065'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const LOCATION_NPC_DEFAULTS = {
    "极光电竞馆": "粉丝、工作人员、其他团队成员",
    "万达广场": "粉丝",
    "百步街": "粉丝",
    "小吃街": "粉丝",
    "default": ""
};

// --- RPG 数据模型 ---
const RPG_STATE = {
    currentMode: 'TERMINAL', 
    resources: { funds: 2450900, fans: 824000, morale: 85 },
    roster: [
        { id: 'qin_shu', ign: 'Qshot', realName: '秦述', role: 'ADC', potential: 'S', isStar: true, stats: { mechanics: 96, macro: 90 }, status: { desire: 0, affection: 0 } },
        { id: 'si_luo', ign: 'SOLO', realName: '司洛', role: 'JUG', potential: 'S', isStar: true, stats: { mechanics: 98, macro: 85 }, status: { desire: 0, affection: 0 } },
        { id: 'lu_yan', ign: 'DeerYan', realName: '鹿言', role: 'MID', potential: 'S', isStar: true, stats: { mechanics: 90, macro: 95 }, status: { desire: 0, affection: 0 } },
        { id: 'zhou_jinning', ign: 'JinNa', realName: '周锦宁', role: 'TOP', potential: 'S', isStar: true, stats: { mechanics: 94, macro: 87 }, status: { desire: 0, affection: 0 } },
        { id: 'wei_xingze', ign: 'STARS', realName: '魏星泽', role: 'SUP', potential: 'S', isStar: true, stats: { mechanics: 93, macro: 88 }, status: { desire: 0, affection: 0 } },
        { id: 'chen_xu', ign: 'ChaseX', realName: '谌绪', role: 'MID', potential: 'A', isStar: false, stats: { mechanics: 92, macro: 80 }, status: { desire: 0, affection: 0 } },
        { id: 'meng_minghe', ign: 'Hades', realName: '孟明赫', role: 'ADC', potential: 'A', isStar: false, stats: { mechanics: 91, macro: 75 }, status: { desire: 0, affection: 0 } },
        { id: 'qi_xie', ign: 'KnifeQX', realName: '亓谢', role: 'JUG', potential: 'A', isStar: false, stats: { mechanics: 95, macro: 80 }, status: { desire: 0, affection: 0 } },
        { id: 'wei_yuehua', ign: 'Moon', realName: '魏月华', role: 'COACH', potential: 'S', isStar: false, stats: { mechanics: 90, macro: 99 }, status: { desire: 0, affection: 0 } },
        { id: 'sang_luofan', ign: 'Lovan', realName: '桑洛凡', role: 'COACH', potential: 'S', isStar: false, stats: { mechanics: 90, macro: 95 }, status: { desire: 0, affection: 0 } }
    ],
    leagueScheduleText: "暂无赛事安排..."
};

// --- Heartbeat Management Data ---
const HEARTBEAT_ACTIVITIES = [
    { name: "办公室的游戏", icon: "fa-couch", desc: "在落地窗前，享受一场禁忌的桌上盛宴。" },
    { name: "浴室水蒸气", icon: "fa-shower", desc: "在湿热的雾气中，探索彼此身体的每一寸。" },
    { name: "深夜卧室私语", icon: "fa-bed", desc: "用最温柔的方式，陪伴彼此度过漫漫长夜。" },
    { name: "角色扮演Play", icon: "fa-masks-theater", desc: "尝试不同的身份，解锁不一样的刺激体验。" },
    { name: "镜前诱惑", icon: "fa-wand-magic-sparkles", desc: "让他看清自己为你疯狂的模样，是最好的催情剂。" },
    { name: "专属女仆", icon: "fa-broom", desc: "换上女仆装，用羽毛轻轻挑逗他全身。" },
    { name: "厨房幻想", icon: "fa-utensils", desc: "将奶油涂满全身，让他用舌头为你清洁。" },
    { name: "深夜停车场车震", icon: "fa-car-side", desc: "在狭小的密闭空间里，你只能跨坐在他身上。" },
    { name: "落地窗前", icon: "fa-city", desc: "赤身裸体压在窗前看风景，好像让窗外的景色格外美。" },
    { name: "电竞桌下口交", icon: "fa-gamepad", desc: "他的手和眼都必须继续游戏哦。" },
    { name: "校园活动", icon: "fa-graduation-cap", desc: "和他一起穿上谌绪的高中校服吧！" },
    { name: "健身房的汗水游戏", icon: "fa-dumbbell", desc: "好像有人做卧推时没有穿内裤呢……" },
    { name: "按摩室SPA混浴", icon: "fa-hot-tub-person", desc: "在氤氲的热气中，肌肤相亲的触感格外清晰。" },
    { name: "私人影院", icon: "fa-film", desc: "昏暗的灯光下，屏幕上的画面远不如身边的你诱人。" },
    { name: "试衣间的秘密", icon: "fa-shirt", desc: "门帘之外是喧嚣的人群，门帘之内是压抑的喘息。" },
    { name: "豪华游艇", icon: "fa-ship", desc: "在无边无际的大海上，没有人能听见你的求救。" },
    { name: "图书馆角落", icon: "fa-book-open", desc: "要是被图书管理员听见会怎么样呢？" },
    { name: "摩天轮顶点", icon: "fa-dharmachakra", desc: "传说在最高点结合的恋人，会永远在一起。" },
    { name: "钢琴上的奏鸣曲", icon: "fa-music", desc: "凌乱的音符，用身体谱写出只属于今夜的乐章。" },
    { name: "露营帐篷", icon: "fa-campground", desc: "森林的虫鸣鸟叫，都成为了这场欢爱的伴奏。" },
    { name: "天台的夜风", icon: "fa-wind", desc: "城市的霓虹灯在脚下闪烁，我们在风中彻底沉沦。" },
    { name: "酒吧后巷", icon: "fa-wine-glass-empty", desc: "酒精麻痹了神经，却放大了感官的刺激。" },
    { name: "镜中双面", icon: "fa-clone", desc: "强迫你在镜前看着自己沉沦的模样，羞耻感爆棚。" },
    { name: "丝巾蒙眼", icon: "fa-eye-slash", desc: "剥夺了视觉后，每一次触碰都变成了未知的战栗。" },
    { name: "精油按摩", icon: "fa-bottle-droplet", desc: "温热的精油滑过肌肤，指尖的游走让理智瞬间蒸发。" },
    { name: "冰火两重天", icon: "fa-temperature-half", desc: "冰块的寒冷与口腔的温热交替，极致的感官刺激。" },
    { name: "领带束缚", icon: "fa-user-tie", desc: "那条平时系在颈间的领带，此刻成为了掌控的枷锁。" },
    { name: "甜蜜盛宴", icon: "fa-spoon", desc: "蜂蜜涂抹在敏感带上，成为一道待品尝的甜点。" },
    { name: "耳机隔离", icon: "fa-headphones", desc: "只有对方能听到指令，旁人看来只是一场静默的狂欢。" },
    { name: "高跟鞋女王", icon: "fa-shoe-prints", desc: "冰冷的鞋跟划过胸膛，让他臣服在你的脚下。" },
    { name: "私房摄影", icon: "fa-camera", desc: "镜头记录下每一个淫乱的瞬间，你们是彼此专属的模特。" },
    { name: "书房禁地", icon: "fa-book", desc: "在充满墨香的桌案上，进行一场背德的授课。" },
    { name: "楼梯激情", icon: "fa-stairs", desc: "利用台阶的高低差，探索前所未有的深入角度。" },
    { name: "红绳束缚", icon: "fa-link", desc: "错综复杂的红绳将对方悬在半空，像一只待宰的羔羊。" },
    { name: "泳池派对", icon: "fa-water", desc: "水波荡漾掩盖了水下的动作，清凉与燥热的碰撞。" },
    { name: "私人诊所", icon: "fa-user-doctor", desc: "“病人”需要接受全方位的身体检查，尤其是那里。" },
    { name: "引擎盖热度", icon: "fa-fire", desc: "刚刚熄火的引擎盖还发烫，正如现在的我们。" },
    { name: "你的礼物", icon: "fa-gift", desc: "除了红色的丝带，你身上一丝不挂，等他拆封。" },
    { name: "早安咬", icon: "fa-sun", desc: "在晨光中用口舌唤醒他，美好的一天从这里开始。" },
    { name: "电车痴汉", icon: "fa-train-subway", desc: "拥挤的车厢里，没人知道我们紧贴的身体间发生了什么。" },
    { name: "电梯惊魂", icon: "fa-elevator", desc: "在这几十秒的上升时间里，争分夺秒地索取。" },
    { name: "野外丛林", icon: "fa-tree", desc: "远离文明的束缚，回归最原始的野性本能，天为被地为床。" }
];

const HEARTBEAT_MEMBERS = [
    { name: '秦述', avatar: 'https://files.catbox.moe/c2khbl.jpeg' },
    { name: '司洛', avatar: 'https://files.catbox.moe/pohz52.jpeg' },
    { name: '鹿言', avatar: 'https://files.catbox.moe/parliq.jpeg' },
    { name: '周锦宁', avatar: 'https://files.catbox.moe/1loxsn.jpeg' },
    { name: '魏星泽', avatar: 'https://files.catbox.moe/syo0ze.jpeg' },
    { name: '孟明赫', avatar: 'https://files.catbox.moe/m446ro.jpeg' },
    { name: '亓谢', avatar: 'https://files.catbox.moe/ev2g1l.png' },
    { name: '谌绪', avatar: 'https://files.catbox.moe/9tnuva.png' },
    { name: '桑洛凡', avatar: 'https://files.catbox.moe/syudzu.png' },
    { name: '魏月华', avatar: 'https://files.catbox.moe/auqnct.jpeg' }
];

const CTE_CHARACTERS = {
    "wei_yuehua": { name: "魏月华", age: "27", role: "CTE战队教练", personality: "严肃、冷酷、认真、严谨", desc: "房间里堆满了战术复盘的录像带和笔记本，空气中弥漫着淡淡的咖啡香。这里是战队的大脑中枢，每一个战术决策都诞生于此。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/auqnct.jpeg", destination: "CTE基地-魏月华房间" },
    "qin_shu": { name: "秦述", age: "24", role: "CTE战队队长、ADC", personality: "沉默、清冷、内敛", desc: "极简风格的房间，除了必要的设备几乎没有杂物。书桌上摆着一本翻开的书，窗台上养着一盆生命力顽强的绿植，正如他本人一样沉稳可靠。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/c2khbl.jpeg", destination: "CTE基地-秦述房间" },
    "si_luo": { name: "司洛", age: "24", role: "CTE战队成员、打野", personality: "慵懒、随性、玩世不恭", desc: "房间略显凌乱，但乱中有序。昂贵的电竞外设随意摆放，懒人沙发上丢着几件潮牌外套，处处透着一股漫不经心的天才气息。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/pohz52.jpeg", destination: "CTE基地-司洛房间" },
    "lu_yan": { name: "鹿言", age: "23", role: "CTE战队成员、中单", personality: "温柔、谦逊、善良", desc: "温暖的色调，书架上摆满了粉丝送的玩偶和手写信。房间里总是收拾得一尘不染，让人感到无比的安心和舒适。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/parliq.jpeg", destination: "CTE基地-鹿言房间" },
    "wei_xingze": { name: "魏星泽", age: "20", role: "CTE战队成员、辅助", personality: "开朗、感性、大大咧咧", desc: "充满活力的房间，墙上贴着各种动漫海报。零食柜永远是满的，角落里还堆着几个还没拆封的游戏手办。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/syo0ze.jpeg", destination: "CTE基地-魏星泽房间" },
    "zhou_jinning": { name: "周锦宁", age: "20", role: "CTE战队成员、上单", personality: "傲娇、矜贵、毒舌", desc: "精致奢华的装修风格，甚至有一个专门的陈列柜用来展示他的限量版球鞋。每一处细节都彰显着主人的高傲与品味。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/1loxsn.jpeg", destination: "CTE基地-周锦宁房间" },
    "chen_xu": { name: "谌绪", age: "18", role: "CTE战队替补中单、高中生", personality: "腹黑、恶劣、隐藏病娇", desc: "表面看起来像个乖巧高中生的房间，书桌上摆着整齐的试卷。但抽屉深处似乎藏着一些不为人知的秘密，空气中带着一丝危险的气息。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/9tnuva.png", destination: "CTE基地-谌绪房间" },
    "meng_minghe": { name: "孟明赫", age: "20", role: "CTE战队ADC替补", personality: "阴郁、厌世、内向、大胆叛逆", desc: "窗帘常年拉着，光线昏暗。墙上有着涂鸦的痕迹，角落里放着一把旧吉他。这是一个属于孤独灵魂的避难所。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/m446ro.jpeg", destination: "CTE基地-孟明赫房间" },
    "qi_xie": { name: "亓谢", age: "18", role: "CTE战队打野替补", personality: "疯批、天才、毒舌、直白", desc: "房间凌乱但不脏乱差。桌子上布满了各种东西，有植物、鱼缸、盖了一半的乐高、研究了一半的线路板、分析了一半的战术，还有拆了一半的游戏手柄等……(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/ev2g1l.png", destination: "CTE基地-亓谢房间" },
    "sang_luofan": { name: "桑洛凡", age: "27", role: "CTE助教、豪门大少爷", personality: "慵懒随性、桀骜不驯、腹黑", desc: "低调奢华，红酒柜和定制西装占据了很大空间。他不一定每天住这里，但即便只是偶尔停留，也要保持绝对的享受。(头像图片来自角色卡原作者耶耶)", avatar: "https://files.catbox.moe/syudzu.png", destination: "CTE基地-桑洛凡房间" },
    "user": { name: "你", age: "??", role: "CTE战队新成员/访客", personality: "自定义", desc: "这是属于你的私人空间。你可以按照自己的喜好布置它。虽然现在还很空旷，但未来这里会充满你与CTE的故事。", avatar: userPlaceholderAvatar, destination: "CTE基地-你的房间" }
};

const NATIONAL_CITIES = [
    { id: 'jinggang', name: '京港', icon: 'fa-landmark-dome', top: '50%', left: '50%', info: '<strong><i class="fa-solid fa-crown"></i> 权力漩涡:</strong> 首都，政治经济文化中心，权贵聚集，国际化大都市，夜生活极度繁华。摩天大楼与历史建筑交错，霓虹灯下的金融街与老城区并存。', isCapital: true },
    { id: 'langjing', name: '琅京', icon: 'fa-gem', top: '80%', left: '20%', info: '<strong><i class="fa-solid fa-coins"></i> 豪门金库:</strong> 全国第二大城市，金融与地产重镇，豪门世家聚集。宽阔大道、豪宅林立，老钱家族与新贵共存。钰明珠宝总部所在地。' },
    { id: 'shenzhou', name: '深州', icon: 'fa-microchip', top: '80%', left: '75%', info: '<strong><i class="fa-solid fa-chart-line"></i> 科技前沿:</strong> 沿海经济特区，科技与贸易发达，外企众多，生活节奏快。高科技园区、港口码头、国际社区。' },
    { id: 'haizhou', name: '海洲', icon: 'fa-anchor', top: '20%', left: '80%', info: '<strong><i class="fa-solid fa-skull-crossbones"></i> 灰色地带:</strong> 港口城市，地下势力活跃，赌场、夜店、黑市盛行。霓虹闪烁的港口、老旧仓库与豪华赌场并存。' },
    { id: 'taihe', name: '台河', icon: 'fa-book-open', top: '20%', left: '50%', info: '<strong><i class="fa-solid fa-graduation-cap"></i> 学术之城:</strong> 历史文化名城，教育与艺术氛围浓厚，名校云集。古典建筑、博物馆、大学城。' },
    { id: 'huashao', name: '化邵', icon: 'fa-industry', top: '50%', left: '20%', info: '<strong><i class="fa-solid fa-wrench"></i> 工业心脏:</strong> 重工业城市，工人阶层为主，生活节奏慢，治安一般。工厂烟囱、老旧居民区、工业遗址。' },
    { id: 'yucheng', name: '玉城', icon: 'fa-martini-glass-citrus', top: '20%', left: '20%', info: '<strong><i class="fa-solid fa-sun"></i> 度假天堂:</strong> 旅游胜地，风景优美，度假产业发达，富人休闲首选。湖光山色、度假别墅、五星级酒店。' },
];

const CTEEscape = {
    settings: { theme: 0, buttonPos: null },
    panelLoaded: false,
    tempTripData: { destination: null, companion: null, npc: null },
    isSelectingForSchedule: false,
    currentScheduleItem: null,
    tempScheduleParticipants: [],
    isDraggingPin: false,
    isDraggingNationalCity: false,
    currentProfileId: null,
    currentView: 'city-map',
    nationalTripData: { cityId: null, cityName: null },
    currentHeartbeatActivity: null,

    async init() {
        console.log("🏆 [CTE Esport] 插件正在启动...");
        this.loadSettings();
        this.injectToggleButton();
        await this.loadHTML();
        if (this.panelLoaded) {
            this.bindEvents();
            this.bindRPGEvents();
            this.enablePinDragging();
            this.applyTheme(this.settings.theme);
            this.loadUserAvatar();
            this.initNationalMap();
            this.loadNationalMapBg();
            window.addEventListener('resize', () => {
                const btn = document.getElementById("cte-esport-toggle-btn");
                if (btn) this.constrainButtonToScreen(btn);
            });
        }
    },

    calculateSafePosition() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        if (this.settings.buttonPos && this.settings.buttonPos.top && this.settings.buttonPos.left) {
            return `top: ${this.settings.buttonPos.top}; left: ${this.settings.buttonPos.left}; right: auto;`;
        }
        return window.innerWidth <= 768 ? 
            `top: ${(winHeight/2)-20}px; left: ${(winWidth/2)-20}px; right: auto;` : 
            "top: 10px; right: 340px;";
    },

    constrainButtonToScreen(btn) {
        const rect = btn.getBoundingClientRect();
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        let newLeft = rect.left, newTop = rect.top, adjusted = false;
        if (rect.right > winWidth) { newLeft = winWidth - rect.width - 10; adjusted = true; }
        if (rect.bottom > winHeight) { newTop = winHeight - rect.height - 10; adjusted = true; }
        if (rect.left < 0) { newLeft = 10; adjusted = true; }
        if (rect.top < 0) { newTop = 10; adjusted = true; }
        if (adjusted) {
            btn.style.left = newLeft + 'px'; btn.style.top = newTop + 'px'; btn.style.right = 'auto';
            this.settings.buttonPos = { top: newTop + "px", left: newLeft + "px" };
            this.saveSettings();
        }
    },

    injectToggleButton() {
        if (document.getElementById("cte-esport-toggle-btn")) return;
        const btn = document.createElement("div");
        btn.id = "cte-esport-toggle-btn";
        btn.innerHTML = "🏆";
        btn.title = "打开 CTE 战队地图";
        const posStyle = this.calculateSafePosition();
        btn.style.cssText = `position: fixed; ${posStyle} z-index: 2147483647; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; filter: drop-shadow(0 0 2px black); transition: transform 0.2s; user-select: none; background: rgba(0,0,0,0.2); border-radius: 50%;`;
        
        let isButtonDragging = false;
        if (typeof $ !== "undefined" && $.fn.draggable) {
            $(btn).draggable({
                containment: "window", scroll: false,
                start: () => { isButtonDragging = true; btn.style.right = 'auto'; },
                stop: (event, ui) => {
                    this.settings.buttonPos = { top: ui.position.top + "px", left: ui.position.left + "px" };
                    this.saveSettings();
                    setTimeout(() => { isButtonDragging = false; }, 100);
                }
            });
        }
        btn.addEventListener("click", (e) => {
            if (!isButtonDragging) this.togglePanel();
        });
        document.body.appendChild(btn);
    },

    async loadHTML() {
        try {
            const panelUrl = new URL('./map.html', import.meta.url).href;
            const response = await fetch(panelUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const container = document.createElement("div");
            container.innerHTML = html;
            document.body.appendChild(container.firstElementChild);
            this.panelLoaded = true;
        } catch (e) {
            console.error("❌ HTML Load Failed:", e);
        }
    },

    fixPanelPosition(panel) {
        if (window.innerWidth <= 768) {
            panel.style.top = '10px'; panel.style.left = '10px';
            panel.style.width = (window.innerWidth - 20) + 'px';
            panel.style.height = (window.innerHeight - 20) + 'px';
            panel.style.transform = 'none';
        } else {
            panel.style.top = '50%'; panel.style.left = '50%';
            panel.style.width = '90vh'; panel.style.height = '90vh';
            panel.style.transform = 'translate(-50%, -50%)';
        }
    },

    togglePanel() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;
        if (window.getComputedStyle(panel).display === "none") {
            this.fixPanelPosition(panel);
            panel.style.display = "flex";
            panel.style.opacity = "0";
            this.toggleView('city-map');
            this.updateDynamicData(); 
            setTimeout(() => { panel.style.opacity = "1"; panel.style.transition = "opacity 0.2s"; }, 10);
        } else {
            panel.style.display = "none";
            this.isSelectingForSchedule = false;
            this.closeAllPopups();
        }
    },

    toggleView(viewName) {
        const layers = {
            'city-map': document.getElementById("cte-layer-map"),
            'national-map': document.getElementById("cte-layer-national-map"),
            'manager': document.getElementById("cte-layer-manager"),
            'heartbeat': document.getElementById("cte-layer-heartbeat")
        };
        
        Object.values(layers).forEach(el => { if(el) el.style.display = 'none'; });
        
        if (layers[viewName]) layers[viewName].style.display = (viewName === 'manager' ? 'flex' : 'block');
        this.currentView = viewName;
        
        if (viewName === 'manager') this.renderRPGView('TERMINAL');
        if (viewName === 'heartbeat') this.renderHeartbeatView();
    },

    bindRPGEvents() {
        const btnManager = document.getElementById("cte-btn-manager");
        if(btnManager) btnManager.onclick = () => this.toggleView('manager');

        const btnHeartbeat = document.getElementById("cte-btn-heartbeat");
        if(btnHeartbeat) btnHeartbeat.onclick = () => this.toggleView('heartbeat');

        document.querySelectorAll(".cte-rpg-nav-btn").forEach(btn => {
            btn.onclick = () => this.renderRPGView(btn.getAttribute("data-mode"));
        });
        
        const btnRefreshTerm = document.getElementById("cte-btn-refresh-schedule-term");
        if(btnRefreshTerm) btnRefreshTerm.onclick = () => this.refreshSchedule();
        
        const rosterGrid = document.getElementById("cte-rpg-roster-grid");
        if (rosterGrid) {
            rosterGrid.addEventListener("click", (e) => {
                // Heartbeat Shortcut Action
                const hbBtn = e.target.closest(".cte-heartbeat-shortcut");
                if (hbBtn) {
                    e.stopPropagation();
                    this.toggleView('heartbeat');
                    return;
                }

                // Standard Roster Actions
                const btn = e.target.closest(".cte-rpg-action-icon");
                if (btn) this.handleRosterAction(btn.getAttribute("data-action"), btn.getAttribute("data-name"));
            });
        }
        
        // Heartbeat Specific Events
        const hbCancel = document.getElementById("cte-hb-cancel-btn");
        if(hbCancel) hbCancel.onclick = () => this.closeHeartbeatModal();
        
        const hbConfirm = document.getElementById("cte-hb-confirm-btn");
        if(hbConfirm) hbConfirm.onclick = () => this.confirmHeartbeatAssignment();
    },
    
    // --- Heartbeat Logic ---
    renderHeartbeatView() {
        const grid = document.getElementById("cte-hb-activity-grid");
        if(!grid) return;
        grid.innerHTML = '';
        
        HEARTBEAT_ACTIVITIES.forEach(act => {
            const card = document.createElement("div");
            card.className = "cte-hb-activity-card";
            card.innerHTML = `
                <div class="cte-hb-activity-icon"><i class="fa-solid ${act.icon}"></i></div>
                <div class="cte-hb-activity-name">${act.name}</div>
                <div class="cte-hb-activity-description">${act.desc}</div>
                <button class="cte-hb-assign-button">安排成员</button>
            `;
            card.querySelector("button").onclick = () => this.openHeartbeatModal(act);
            grid.appendChild(card);
        });
    },

    openHeartbeatModal(activity) {
        this.currentHeartbeatActivity = activity;
        const modal = document.getElementById("cte-hb-modal");
        const title = document.getElementById("cte-hb-modal-title");
        const list = document.getElementById("cte-hb-member-list");
        
        if(!modal || !list) return;
        
        title.innerText = `为活动「${activity.name}」分配成员`;
        list.innerHTML = '';
        
        HEARTBEAT_MEMBERS.forEach(m => {
            const item = document.createElement("div");
            item.className = "cte-hb-member-item";
            item.setAttribute("data-name", m.name);
            item.innerHTML = `
                <div class="cte-hb-member-avatar" style="background-image: url('${m.avatar}')"></div>
                <div class="cte-hb-member-name">${m.name}</div>
            `;
            item.onclick = () => item.classList.toggle('selected');
            list.appendChild(item);
        });
        
        modal.classList.add("active");
    },

    closeHeartbeatModal() {
        document.getElementById("cte-hb-modal").classList.remove("active");
    },

    confirmHeartbeatAssignment() {
        const selected = document.querySelectorAll("#cte-hb-member-list .cte-hb-member-item.selected");
        if(selected.length === 0) {
            if(typeof toastr !== "undefined") toastr.warning("请至少选择一位成员！");
            return;
        }
        
        const names = Array.from(selected).map(el => el.getAttribute("data-name")).join("、");
        const act = this.currentHeartbeatActivity;
        
        // Construct injection text
        const msg = `{{user}}邀请 ${names} 做爱。玩法：${act.name}，${act.desc}`;
        
        this.closeHeartbeatModal();
        this.togglePanel(); // Close main panel
        
        const ta = document.getElementById('send_textarea');
        if (ta) { 
            ta.value = msg; 
            ta.dispatchEvent(new Event('input', { bubbles: true })); 
            ta.focus(); 
        }
        
        if(typeof toastr !== "undefined") toastr.success(`已安排：${act.name} (${names})`);
    },
    // --- End Heartbeat Logic ---

    handleRosterAction(action, name) {
        const msg = action === 'talk' ? `{{user}} 邀请 ${name} 找个地方聊聊。` : `{{user}} 邀请 ${name} 去单独训练。`;
        this.togglePanel();
        const ta = document.getElementById('send_textarea');
        if (ta) { ta.value = msg; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); }
    },

    renderRPGView(mode) {
        RPG_STATE.currentMode = mode;
        document.querySelectorAll(".cte-rpg-nav-btn").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
        });
        document.querySelectorAll(".cte-rpg-view").forEach(v => v.style.display = "none");
        const target = document.getElementById(`cte-rpg-view-${mode.toLowerCase()}`);
        if(target) target.style.display = (mode === 'TERMINAL') ? 'flex' : 'block';

        this.updateDynamicData();
        if(mode === 'TERMINAL') this.renderTerminal(); 
        if(mode === 'ROSTER') this.renderRoster();
        if(mode === 'LEAGUE') this.renderLeague();
    },

    // --- 核心修复：双轨制数据读取 + 数组遍历 ---
    updateDynamicData() {
        let chatContext = [];
        let ST = null;

        try {
            if (typeof window.SillyTavern !== 'undefined') ST = window.SillyTavern;
            else if (typeof window.parent !== 'undefined' && typeof window.parent.SillyTavern !== 'undefined') ST = window.parent.SillyTavern;
        } catch(e) { console.log("[CTE-DEBUG] ST access failed:", e); }

        if (!ST) return;

        try {
            const context = ST.getContext();
            chatContext = context.chat;
        } catch(e) {}

        // 1. 解析 Top 栏 (日程)
        if (chatContext && chatContext.length > 0) {
            for (let i = chatContext.length - 1; i >= 0; i--) {
                const mes = chatContext[i].mes || "";
                const match = mes.match(/<status_top>([\s\S]*?)<\/status_top>/i);
                if (match) { 
                    const scheduleMatch = match[1].match(/最近赛事安排[：:]\s*(.*?)(?:\s+[\|｜]|$|\n)/);
                    if (scheduleMatch) RPG_STATE.leagueScheduleText = scheduleMatch[1].trim();
                    break; 
                }
            }
        }

        // 2. 深度扫描 stat_data (MVU) - 处理数组结构
        let statDataRaw = null;
        let foundLocation = "None";

        try {
            // 优先检查 Extension Settings (最标准位置)
            const extSettings = ST.extension_settings || {};
            const extVars = extSettings.variables || {};
            if (extVars.global && extVars.global['stat_data']) statDataRaw = extVars.global['stat_data'];
            else if (extVars.local && extVars.local['stat_data']) statDataRaw = extVars.local['stat_data'];

            // 如果设置里没有，遍历消息历史 (Message Layer)
            if (!statDataRaw && chatContext && chatContext.length > 0) {
                console.log(`[CTE-DEBUG] Scanning ${chatContext.length} messages for variables...`);
                
                for (let i = chatContext.length - 1; i >= 0; i--) {
                    const msg = chatContext[i];
                    let candidateVars = null;

                    // 兼容不同版本的变量存储位置
                    if (msg.variables) candidateVars = msg.variables;
                    else if (msg.data && msg.data.variables) candidateVars = msg.data.variables;

                    if (candidateVars) {
                        // [重要修复] 检查是对象还是数组
                        if (Array.isArray(candidateVars)) {
                            // 遍历数组寻找 stat_data
                            for (const v of candidateVars) {
                                if (v && v['stat_data']) {
                                    statDataRaw = v['stat_data'];
                                    foundLocation = `Msg[${i}].Array`;
                                    break;
                                }
                            }
                        } else if (typeof candidateVars === 'object') {
                            // 是对象，直接检查属性
                            if (candidateVars['stat_data']) {
                                statDataRaw = candidateVars['stat_data'];
                                foundLocation = `Msg[${i}].Object`;
                            }
                        }
                    }
                    if (statDataRaw) break; // 找到了就退出循环
                }
            }

            // 如果找到了原始数据，解析并应用
            if (statDataRaw) {
                console.log(`[CTE-DEBUG] Success! Found stat_data in ${foundLocation}`);
                const statData = typeof statDataRaw === 'string' ? JSON.parse(statDataRaw) : statDataRaw;
                
                if (statData && statData.MainCharacters) {
                    RPG_STATE.roster.forEach(player => {
                        const charData = statData.MainCharacters[player.realName];
                        if (charData) {
                            if (charData['欲望'] !== undefined) player.status.desire = parseInt(charData['欲望']);
                            if (charData['好感'] !== undefined) player.status.affection = parseInt(charData['好感']);
                            else if (charData['好感度'] !== undefined) player.status.affection = parseInt(charData['好感度']);
                        }
                    });
                    return; // MVU 成功，不再执行文本回退
                }
            } else {
                console.log("[CTE-DEBUG] MVU scan finished. No stat_data found.");
            }

        } catch(e) {
            console.warn("[CTE-DEBUG] MVU Scan Error:", e);
        }

        // 3. 回退到文本解析 (Plan B)
        // 注意：MVU 模式下通常无效，因为文本被隐藏了
        console.log("[CTE-DEBUG] Attempting text fallback...");
        if (chatContext && chatContext.length > 0) {
            for (let i = chatContext.length - 1; i >= 0; i--) {
                const mes = chatContext[i].mes || "";
                const match = mes.match(/<status_bottom1>([\s\S]*?)<\/status_bottom1>/i);
                if (match) {
                    const bottomContent = match[1].trim();
                    RPG_STATE.roster.forEach(player => {
                        const charBlockRegex = new RegExp(`<${player.realName}>([\\s\\S]*?)<\\/${player.realName}>`, 'i');
                        const charMatch = bottomContent.match(charBlockRegex);
                        if (charMatch) {
                            const block = charMatch[1];
                            const desireMatch = block.match(/欲望[：:]\s*(\d+)%?/);
                            if (desireMatch) player.status.desire = parseInt(desireMatch[1]);
                            const affMatch = block.match(/好感度[：:]\s*(\d+)%?/);
                            if (affMatch) player.status.affection = parseInt(affMatch[1]);
                        }
                    });
                    console.log("[CTE-DEBUG] Text fallback success");
                    break;
                }
            }
        }
    },

    renderTerminal() { this.refreshSchedule(); },

    renderRoster() {
        const grid = document.getElementById("cte-rpg-roster-grid");
        if(!grid) return;
        grid.innerHTML = '';

        RPG_STATE.roster.forEach(player => {
            const charData = CTE_CHARACTERS[player.id];
            const avatarUrl = charData ? charData.avatar : userPlaceholderAvatar;
            
            // Logic for High Desire Warning
            let warningHTML = '';
            if (player.status.desire > 80) {
                warningHTML = `
                <div class="cte-rpg-warning-box">
                    <span><i class="fa-solid fa-triangle-exclamation"></i> 欲望值过高，请及时处理</span>
                    <button class="cte-heartbeat-shortcut" data-action="heartbeat" title="处理欲望"><i class="fa-solid fa-heart"></i></button>
                </div>
                `;
            }

            const card = document.createElement("div");
            card.className = "cte-rpg-card cte-rpg-player-card";
            card.innerHTML = `
                <div style="position:absolute; top:5px; right:5px; color:${player.potential === 'S' ? '#a855f7' : '#c5a065'}; font-size:12px; font-weight:bold;">${player.isStar ? '<i class="fa-solid fa-crown"></i>' : ''} POT: ${player.potential}</div>
                <div style="display:flex; gap:15px;">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <div class="cte-rpg-avatar-box" style="border: 2px solid ${player.potential === 'S' ? '#a855f7' : '#333'}; overflow:hidden;">
                            <img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">
                            <div class="cte-rpg-role-tag">${player.role}</div>
                        </div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:5px;">
                            <div><div style="font-family:'Cinzel', serif; font-size:16px; color:#fff; font-weight:bold;">${player.ign}</div><div style="font-size:12px; color:#888;">${player.realName}</div></div>
                            <div style="text-align:right;"><div style="font-size:18px; color:#c5a065; font-family:monospace;">${Math.floor((player.stats.mechanics + player.stats.macro)/2)}</div><div style="font-size:8px; color:#666;">OVR</div></div>
                        </div>
                        <div class="cte-rpg-stat-row">
                            <div class="cte-rpg-stat-bar-container"><div class="label" style="display:flex; justify-content:space-between;"><span>欲望</span> <span style="color:#ec4899;">${player.status.desire}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${player.status.desire}%; background:#ec4899; box-shadow:0 0 5px #ec4899;"></div></div></div>
                            <div class="cte-rpg-stat-bar-container"><div class="label" style="display:flex; justify-content:space-between;"><span>好感度</span> <span style="color:#c5a065;">${player.status.affection}%</span></div><div class="bar-bg"><div class="bar-fill" style="width:${player.status.affection}%; background:#c5a065; box-shadow:0 0 5px #c5a065;"></div></div></div>
                        </div>
                        ${warningHTML} 
                    </div>
                </div>
                <div class="cte-rpg-card-footer"><button class="cte-rpg-action-icon" data-action="talk" data-name="${player.realName}" title="Talk"><i class="fa-solid fa-comment"></i></button><button class="cte-rpg-action-icon" data-action="train" data-name="${player.realName}" title="Train"><i class="fa-solid fa-bolt"></i></button></div>`;
            grid.appendChild(card);
        });
    },

    renderLeague() {
        const container = document.getElementById("cte-league-content");
        if(container) container.innerHTML = `<div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;"><div style="width:60px; height:60px; background:var(--cte-bg-dark); border:1px solid var(--cte-accent-gold); display:flex; align-items:center; justify-content:center; font-size:24px;">🏆</div><div><h3 style="color:#fff; font-family:var(--cte-font-serif); font-size:18px;">NEXT MATCH</h3><p style="color:var(--cte-accent-gold); font-family:monospace; font-size:14px;">${RPG_STATE.leagueScheduleText}</p></div></div><div style="border-top:1px dashed #333; padding-top:10px; font-size:12px; color:#666;">> 战术分析组正在收集中...<br>> 胜率预测: 计算中...</div>`;
    },

    initNationalMap() {
        const mapContainer = document.getElementById("cte-national-map-canvas");
        if (!mapContainer) return;
        const citiesContainer = mapContainer.querySelector('.cte-national-cities');
        if (!citiesContainer) return;
        citiesContainer.innerHTML = '';
        NATIONAL_CITIES.forEach(city => {
            const cityEl = document.createElement('div');
            cityEl.className = 'cte-national-city' + (city.isCapital ? ' capital' : '');
            cityEl.id = `national-city-${city.id}`;
            cityEl.style.top = city.top; cityEl.style.left = city.left;
            cityEl.setAttribute('data-city-id', city.id);
            cityEl.innerHTML = `<i class="fa-solid ${city.icon}"></i><span class="cte-national-city-name">${city.name}</span>`;
            cityEl.addEventListener('click', () => { if (!this.isDraggingNationalCity) this.handleNationalCityClick(city); });
            citiesContainer.appendChild(cityEl);
        });
        this.enableNationalCityDragging();
    },
    
    enableNationalCityDragging() {
        const mapCanvas = document.getElementById("cte-national-map-canvas");
        if (!mapCanvas) return;
        let activeCity = null, startX, startY, startLeft, startTop;
        mapCanvas.addEventListener("mousedown", (e) => {
            const city = e.target.closest(".cte-national-city");
            if (!city) return;
            e.preventDefault(); activeCity = city; this.isDraggingNationalCity = false;
            startX = e.clientX; startY = e.clientY; startLeft = city.offsetLeft; startTop = city.offsetTop;
            activeCity.style.transition = 'none'; activeCity.classList.add("dragging");
            document.addEventListener("mousemove", onMouseMove); document.addEventListener("mouseup", onMouseUp);
        });
        const onMouseMove = (e) => {
            if (!activeCity) return;
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                this.isDraggingNationalCity = true;
                const rect = mapCanvas.getBoundingClientRect();
                activeCity.style.left = Math.max(0, Math.min(startLeft + dx, rect.width)) + 'px';
                activeCity.style.top = Math.max(0, Math.min(startTop + dy, rect.height)) + 'px';
            }
        };
        const onMouseUp = () => {
            if (activeCity) { activeCity.classList.remove("dragging"); activeCity.style.transition = ''; activeCity = null; }
            document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp);
            setTimeout(() => this.isDraggingNationalCity = false, 50);
        };
    },
    
    loadNationalMapBg() { const bg = localStorage.getItem("cte-national-map-bg"); const el = document.getElementById("cte-national-map-canvas"); if(el) el.style.backgroundImage = `url(${bg || defaultNationalMapBg})`; },
    handleNationalCityClick(city) {
        if (city.isCapital) { this.toggleView('city-map'); if (typeof toastr !== "undefined") toastr.info("已返回京港市地图"); return; }
        const info = document.getElementById("cte-national-info-content");
        if(info) info.innerHTML = `<h2><i class="fa-solid fa-scroll"></i> ${city.name} - 城市简述</h2><ul><li>${city.info}</li></ul>`;
        const btn = document.getElementById("cte-national-go-btn");
        if(btn) { btn.style.display = 'block'; btn.innerHTML = `🚀 前往${city.name}`; btn.onclick = () => this.prepareNationalTravel(city); }
        this.nationalTripData = { cityId: city.id, cityName: city.name };
    },
    
    prepareNationalTravel(city) {
        this.tempTripData = { destination: city.name, companion: null, npc: null };
        const title = document.getElementById("cte-travel-dest-name"); if(title) title.innerText = city.name;
        const npcInput = document.getElementById("cte-npc-input"); if(npcInput) { npcInput.style.display = "none"; npcInput.value = ""; }
        const ph = document.getElementById("cte-npc-placeholder-text"); if(ph) ph.innerText = "当地人";
        const noRad = document.getElementById("meet_no"); if(noRad) noRad.checked = true;
        
        const std = document.getElementById("cte-travel-mode-standard"), sch = document.getElementById("cte-travel-mode-schedule");
        if(std) std.style.display = "block"; if(sch) sch.style.display = "none";
        this.showPopup("cte-travel-modal");
    },
    
    handleNationalMapUpload(e) { const f = e.target.files[0]; if(!f)return; const r = new FileReader(); r.onload=(ev)=>{ const el=document.getElementById("cte-national-map-canvas"); if(el){ el.style.backgroundImage = `url(${ev.target.result})`; localStorage.setItem("cte-national-map-bg", ev.target.result); if(typeof toastr!=='undefined') toastr.success("背景更换成功"); }}; r.readAsDataURL(f); },
    handleResetNationalBg() { const el=document.getElementById("cte-national-map-canvas"); if(el){ el.style.backgroundImage = `url(${defaultNationalMapBg})`; localStorage.removeItem("cte-national-map-bg"); if(typeof toastr!=='undefined') toastr.info("恢复默认背景"); } },

    refreshSchedule() {
        const container = document.getElementById("cte-schedule-log-container");
        if (!container) return;
        container.innerHTML = '';
        
        let chatContext = [];
        try {
            if (typeof window.SillyTavern !== 'undefined') chatContext = window.SillyTavern.getContext().chat;
            else if (typeof window.parent !== 'undefined' && window.parent.SillyTavern) chatContext = window.parent.SillyTavern.getContext().chat;
        } catch(e) {}

        if (!chatContext || chatContext.length === 0) return; 

        let content = null;
        for (let i = chatContext.length - 1; i >= 0; i--) {
            const mes = chatContext[i].mes || "";
            const match = mes.match(/<status_top>([\s\S]*?)<\/status_top>/i);
            if (match) { content = match[1].trim(); break; }
        }

        if (!content) { container.innerHTML = '<div style="text-align:center; color:#666; margin-top:20px;">> NO SCHEDULE DATA FOUND</div>'; return; }

        let dateStr = "UNKNOWN DATE";
        const dMatch = content.match(/时间[:：]\s*(.*?)(?:\s+[\|｜]|$|\n)/);
        if (dMatch) dateStr = dMatch[1].trim();

        const kw = "今日安排";
        const idx = content.indexOf(kw);
        if (idx === -1) return;

        let sched = content.substring(idx + kw.length).replace(/^[:：\s]+/, '').trim();
        const header = document.createElement("div");
        header.style.marginBottom = "20px"; header.style.color = "var(--cte-accent-gold)"; header.style.fontFamily = "var(--cte-font-mono)";
        header.innerHTML = `> DATE: ${dateStr}<br>----------------------------------------`;
        container.appendChild(header);

        sched.split('\n').map(l=>l.trim()).filter(l=>l).forEach(line => {
            const m = line.match(/^(\d{1,2}:\d{2}(?:\s*-\s*(?:结束训练|\d{1,2}:\d{2}))?)\s+(.*)$/);
            if (m) {
                const item = document.createElement("div");
                item.className = "cte-timeline-item";
                // 修改：将硬编码的 #ddd 改为 var(--cte-text-main)，以适应浅色主题
                item.innerHTML = `<div class="cte-timeline-card"><div class="cte-timeline-content"><span style="font-weight:bold; margin-right:10px; color:var(--cte-accent-gold); font-family:monospace;">${m[1]}</span><span style="color:var(--cte-text-main);">${m[2]}</span></div><button class="cte-schedule-exec-btn">执行</button></div>`;
                item.querySelector("button").onclick = () => this.initiateScheduleExecution(`${m[1]} ${m[2]}`);
                container.appendChild(item);
            }
        });
    },

    initiateScheduleExecution(item) {
        this.currentScheduleItem = item;
        this.tempScheduleParticipants = [];
        const list = document.getElementById("cte-participant-list");
        if(list) {
            list.innerHTML = "";
            ["{{user}}", "秦述", "司洛", "鹿言", "魏星泽", "周锦宁", "谌绪", "孟明赫", "亓谢", "魏月华", "桑洛凡"].forEach(n => {
                const l = document.createElement("label"); l.className = "cte-participant-checkbox";
                l.innerHTML = `<input type="checkbox" value="${n}" ${n==="{{user}}"?'checked':''}> ${n==="{{user}}"?"我 ({{user}})":n}`;
                list.appendChild(l);
            });
        }
        this.showPopup("cte-participant-modal");
    },

    confirmParticipants() {
        const cbs = document.querySelectorAll("#cte-participant-list input:checked");
        const cust = document.getElementById("cte-custom-participant");
        this.tempScheduleParticipants = Array.from(cbs).map(c=>c.value);
        if(cust && cust.value.trim()) this.tempScheduleParticipants.push(cust.value.trim());
        
        if(this.tempScheduleParticipants.length === 0) { if(typeof toastr !== "undefined") toastr.warning("请选择人员"); return; }
        
        this.isSelectingForSchedule = true;
        this.closeAllPopups();
        this.toggleView('city-map');
        if(typeof toastr !== "undefined") toastr.info("请在地图上选择目的地");
    },

    prepareTravel(dest) {
        this.tempTripData = { destination: dest, companion: null, npc: null };
        const title = document.getElementById("cte-travel-dest-name"); if(title) title.innerText = dest;
        let defNPC = "";
        for(const k in LOCATION_NPC_DEFAULTS) if(dest.includes(k)) defNPC = LOCATION_NPC_DEFAULTS[k];
        
        const npcIn = document.getElementById("cte-npc-input");
        const ph = document.getElementById("cte-npc-placeholder-text");
        const noRad = document.getElementById("meet_no");
        if(noRad) noRad.checked = true;
        if(npcIn) { npcIn.style.display = "none"; npcIn.value = defNPC; }
        if(ph) ph.innerText = defNPC ? defNPC.split("、")[0] : "NPC";

        const std = document.getElementById("cte-travel-mode-standard");
        const sch = document.getElementById("cte-travel-mode-schedule");
        const prev = document.getElementById("cte-schedule-preview-text");

        if(this.isSelectingForSchedule) {
            if(std) std.style.display = "none";
            if(sch) sch.style.display = "block";
            if(prev) {
                const pp = this.tempScheduleParticipants.map(p=>p==="{{user}}"?"我":p).join(", ");
                prev.innerHTML = `<span style="color:var(--cte-accent-gold); font-weight:bold;">${pp}</span> -> ${dest}<br><span style="font-size:0.9em; opacity:0.8;">(${this.currentScheduleItem})</span>`;
            }
        } else {
            if(std) std.style.display = "block";
            if(sch) sch.style.display = "none";
        }
        this.showPopup("cte-travel-modal");
    },

    finalizeScheduleExecution() {
        const yes = document.getElementById("meet_yes");
        const npcIn = document.getElementById("cte-npc-input");
        let npcTxt = "";
        if(yes && yes.checked) npcTxt = `，在目的地遇见了${npcIn.value.trim()||"神秘人"}`;
        
        const msg = `${this.tempScheduleParticipants.join(", ")} 前往${this.tempTripData.destination}执行行程：${this.currentScheduleItem}${npcTxt}。`;
        this.togglePanel();
        const ta = document.getElementById('send_textarea');
        if(ta) { ta.value = msg; ta.dispatchEvent(new Event('input', {bubbles:true})); ta.focus(); }
        
        this.isSelectingForSchedule = false;
        this.tempScheduleParticipants = [];
        if(typeof toastr !== 'undefined') toastr.success("行程指令已生成");
    },

    showActivityPopup(comp=null) {
        this.tempTripData.companion = comp;
        const yes = document.getElementById("meet_yes");
        const npcIn = document.getElementById("cte-npc-input");
        this.tempTripData.npc = (yes && yes.checked) ? (npcIn.value.trim()||"神秘人") : null;
        this.showPopup("cte-activity-modal");
    },

    finalizeTrip(act) {
        this.togglePanel();
        const { destination, companion, npc } = this.tempTripData;
        let msg = companion ? `{{user}} 邀请 ${companion} 前往 ${destination}` : `{{user}} 决定独自前往${destination}`;
        msg += `，打算去${act}${npc ? "。在那里，意外遇见了"+npc : ""}。`;
        
        const ta = document.getElementById('send_textarea');
        if(ta) { ta.value = msg; ta.dispatchEvent(new Event('input', {bubbles:true})); ta.focus(); }
        if(typeof toastr !== 'undefined') toastr.success("行程已确认");
    },

    showCharacterProfile(id) {
        const d = CTE_CHARACTERS[id]; if(!d) return;
        this.currentProfileId = id;
        const isU = id==='user';
        ["name","age","role","personality","desc"].forEach(k=>document.getElementById(`cte-profile-${k}`).innerText = d[k]);
        
        const img = document.getElementById("cte-profile-img");
        const delBtn = document.getElementById("cte-avatar-delete-btn");
        const wrap = document.querySelector(".cte-profile-avatar-wrapper");
        
        if(isU) {
            const saved = localStorage.getItem("cte-user-avatar");
            img.src = saved || d.avatar;
            wrap.classList.add("cte-user-avatar-glow");
            delBtn.style.display = "block";
        } else {
            img.src = d.avatar;
            wrap.classList.remove("cte-user-avatar-glow");
            delBtn.style.display = "none";
        }
        
        const go = document.getElementById("cte-profile-go-btn");
        go.onclick = () => this.prepareTravel(d.destination);
        this.showPopup("cte-profile-modal");
    },

    handleAvatarUpload(e) {
        const f = e.target.files[0]; if(!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
            const b64 = ev.target.result;
            localStorage.setItem("cte-user-avatar", b64);
            document.getElementById("cte-profile-img").src = b64;
            document.getElementById("cte-avatar-delete-btn").style.display = "block";
            if(typeof toastr !== 'undefined') toastr.success("头像上传成功");
        };
        r.readAsDataURL(f);
    },

    deleteUserAvatar() {
        localStorage.removeItem("cte-user-avatar");
        document.getElementById("cte-profile-img").src = CTE_CHARACTERS['user'].avatar;
        document.getElementById("cte-avatar-delete-btn").style.display = "none";
        if(typeof toastr !== 'undefined') toastr.info("头像已重置");
    },
    loadUserAvatar() {}, 
    
    handleMapUpload(e) { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload=(ev)=>{ const el=document.getElementById("cte-map-canvas"); if(el){ el.style.backgroundImage=`url(${ev.target.result})`; if(typeof toastr!=='undefined') toastr.success("背景更换成功"); }}; r.readAsDataURL(f); },
    handleResetBackground() { const el=document.getElementById("cte-map-canvas"); if(el){ el.style.backgroundImage=`url(${defaultMapBg})`; if(typeof toastr!=='undefined') toastr.info("背景已重置"); } },
    
    enablePinDragging() {
        const cvs = document.getElementById("cte-map-canvas"); if(!cvs) return;
        let actPin=null, sx, sy, sl, st;
        cvs.addEventListener("mousedown", (e) => {
            const p = e.target.closest(".cte-esport-pin"); if(!p) return;
            e.preventDefault(); actPin=p; this.isDraggingPin=false;
            sx=e.clientX; sy=e.clientY; sl=parseInt(p.style.left||0); st=parseInt(p.style.top||0);
            p.classList.add("dragging");
            document.addEventListener("mousemove", mm); document.addEventListener("mouseup", mu);
        });
        const mm = (e) => {
            if(!actPin) return;
            const dx=e.clientX-sx, dy=e.clientY-sy;
            if(Math.abs(dx)>3 || Math.abs(dy)>3) {
                this.isDraggingPin=true;
                actPin.style.left = Math.max(0, Math.min(800, sl+dx))+'px';
                actPin.style.top = Math.max(0, Math.min(800, st+dy))+'px';
            }
        };
        const mu = () => {
            if(actPin){ actPin.classList.remove("dragging"); actPin=null; }
            document.removeEventListener("mousemove", mm); document.removeEventListener("mouseup", mu);
            setTimeout(()=>this.isDraggingPin=false, 50);
        };
    },

    showPopup(id) {
        const keep = (id==='cte-profile-modal');
        document.querySelectorAll(".cte-esport-popup").forEach(p => {
            if(keep) { if(p.id!=='popup-interior' && p.id!=='popup-cte') p.classList.remove("active"); }
            else p.classList.remove("active");
        });
        const p = document.getElementById(id);
        if(p) { p.classList.add("active"); p.style.zIndex = (id.includes('modal')) ? 2000 : 1000; }
    },
    closeAllPopups() { document.querySelectorAll(".cte-esport-popup").forEach(p => { p.classList.remove("active"); p.style.zIndex = ""; }); },
    toggleFloor(fid, btn) {
        const p = document.getElementById(fid); if(!p) return;
        document.querySelectorAll(".cte-floor-panel").forEach(x => { if(x.id!==fid) x.style.display="none"; });
        document.querySelectorAll(".cte-floor-btn").forEach(b => b.classList.remove("active"));
        if(p.style.display==="block") { p.style.display="none"; btn.classList.remove("active"); }
        else { p.style.display="block"; btn.classList.add("active"); }
    },

    applyTheme(t) {
        const r = document.getElementById("cte-esport-root"); if(!r) return;
        const th = [
            { bg:'#121212', p:'#1e1e1e', g:'#c5a065', t:'#e0e0e0', c:'rgba(255,255,255,0.05)', s:'#000000' },
            { bg:'#f4f7f6', p:'#ffffff', g:'#5d9cec', t:'#333333', c:'#ffffff', s:'#ffffff' },
            { bg:'#fff0f3', p:'#ffffff', g:'#f06292', t:'#4a2c36', c:'#ffffff', s:'#ffffff' }
        ][t] || th[0];
        
        r.style.setProperty('--cte-bg-dark', th.bg); r.style.setProperty('--cte-panel-bg', th.p);
        r.style.setProperty('--cte-accent-gold', th.g); r.style.setProperty('--cte-text-main', th.t);
        r.style.setProperty('--cte-card-bg', th.c); r.style.setProperty('--cte-scroll-layer-bg', th.s);

        // Update Input Area Background based on theme
        const inputArea = document.querySelector(".cte-rpg-input-area");
        if(inputArea) {
            if(t === 1) inputArea.style.backgroundColor = "rgba(225, 245, 254, 0.95)"; // Light blue
            else if(t === 2) inputArea.style.backgroundColor = "rgba(252, 228, 236, 0.95)"; // Light pink
            else inputArea.style.backgroundColor = "rgba(0,0,0,0.8)"; // Default dark
        }
    },

    saveSettings() { localStorage.setItem("cte-esport-settings", JSON.stringify(this.settings)); },
    loadSettings() { try { const d=localStorage.getItem("cte-esport-settings"); if(d) this.settings=JSON.parse(d); } catch(e){} },

    bindEvents() {
        const p = document.getElementById("cte-esport-panel"); if(!p) return;
        p.querySelector("#cte-btn-close").onclick = () => this.togglePanel();
        p.querySelector("#cte-btn-theme").onclick = () => { this.settings.theme=(this.settings.theme+1)%3; this.applyTheme(this.settings.theme); this.saveSettings(); };
        
        document.getElementById("cte-bg-upload").addEventListener("change", (e)=>this.handleMapUpload(e));
        document.getElementById("cte-btn-reset-bg").onclick = () => this.handleResetBackground();
        document.getElementById("cte-user-avatar-input").addEventListener("change", (e)=>this.handleAvatarUpload(e));
        document.getElementById("cte-avatar-delete-btn").onclick = () => this.deleteUserAvatar();
        
        p.querySelector("#cte-btn-map-home").onclick = () => this.toggleView('city-map');
        p.querySelector("#cte-btn-back-to-city").onclick = () => this.toggleView('city-map');
        p.querySelector("#cte-btn-go-national").onclick = () => this.toggleView('national-map');
        
        document.getElementById("cte-national-bg-upload").addEventListener("change", (e)=>this.handleNationalMapUpload(e));
        document.getElementById("cte-btn-reset-national-bg").onclick = () => this.handleResetNationalBg();

        const cvs = p.querySelector("#cte-map-canvas");
        if(cvs) cvs.onclick = (e) => {
            if(this.isDraggingPin) { e.stopPropagation(); return; }
            if(e.target.id==="cte-map-canvas") this.closeAllPopups();
            const pin = e.target.closest(".cte-esport-pin");
            if(pin) { e.stopPropagation(); this.showPopup(pin.getAttribute("data-popup")); }
        };

        p.onclick = (e) => {
            const t = e.target;
            if(t.matches(".cte-close-btn")) {
                t.closest(".cte-esport-popup").classList.remove("active");
                if(t.closest("#cte-travel-modal")) this.isSelectingForSchedule = false;
            }
            
            const pid = t.getAttribute("data-profile") || t.closest("[data-profile]")?.getAttribute("data-profile");
            if(pid) { this.showCharacterProfile(pid); return; }
            
            if(t.getAttribute("data-action")==="interior") this.showPopup("popup-interior");
            if(t.getAttribute("data-action")==="back-base") this.showPopup("popup-cte");
            
            const fb = t.closest(".cte-floor-btn");
            if(fb) this.toggleFloor(fb.getAttribute("data-target"), fb);
            
            const td = t.getAttribute("data-travel") || t.closest("[data-travel]")?.getAttribute("data-travel");
            if(td && !t.closest("#cte-travel-modal")) this.prepareTravel(td);
        };

        document.getElementById("cte-confirm-participants").onclick = () => this.confirmParticipants();
        document.getElementById("cte-travel-execute-schedule").onclick = () => this.finalizeScheduleExecution();
        
        const yr = document.getElementById("meet_yes"), nr = document.getElementById("meet_no"), ni = document.getElementById("cte-npc-input");
        if(yr) { yr.addEventListener("change", ()=>ni.style.display="block"); nr.addEventListener("change", ()=>ni.style.display="none"); }
        
        document.getElementById("cte-travel-alone").onclick = () => this.showActivityPopup(null);
        document.getElementById("cte-travel-companion").onclick = () => {
            const n = document.getElementById("cte-companion-input").value.trim();
            if(!n) { if(typeof toastr!=="undefined") toastr.warning("请输入名字"); return; }
            this.showActivityPopup(n);
        };
        
        document.querySelectorAll(".cte-activity-btn").forEach(b => b.onclick = (e) => this.finalizeTrip(e.target.getAttribute("data-act")));
        document.getElementById("cte-confirm-custom-act").onclick = () => {
            const v = document.getElementById("cte-custom-act-input").value.trim();
            if(v) this.finalizeTrip(v);
        };
        document.getElementById("cte-btn-custom-go").onclick = () => {
            const v = document.getElementById("cte-custom-input").value.trim();
            if(v) this.prepareTravel(v);
        };
    }
};

(function() { CTEEscape.init(); })();
