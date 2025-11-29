// --- CTE Esport Map 核心逻辑 (v7.0 NPC & Activity Update) ---
// 更新日志：
// 1. 在“确认行程”界面新增 NPC 偶遇逻辑（是/否开关 + 动态默认值）
// 2. 新增二级弹窗“选择活动”，支持点击预设活动或自定义输入
// 3. 优化文本生成逻辑，合并地点、人物、NPC和活动信息

const extensionName = "cte-esport-map";
const defaultMapBg = "https://files.catbox.moe/hjurjz.png";
const userPlaceholderAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c5a065'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// --- 新增：地点对应的默认 NPC 列表 ---
const LOCATION_NPC_DEFAULTS = {
    "极光电竞馆": "粉丝、工作人员、其他团队成员",
    "万达广场": "粉丝",
    "百步街": "粉丝",
    "小吃街": "粉丝",
    "default": "" // 默认空（如宿舍），由用户填写
};

const CTE_CHARACTERS = {
    "wei_yuehua": {
        name: "魏月华",
        age: "27",
        role: "CTE战队教练",
        personality: "严肃、冷酷、认真、严谨",
        desc: "房间里堆满了战术复盘的录像带和笔记本，空气中弥漫着淡淡的咖啡香。这里是战队的大脑中枢，每一个战术决策都诞生于此。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/auqnct.jpeg",
        destination: "CTE基地-魏月华房间"
    },
    "qin_shu": {
        name: "秦述",
        age: "24",
        role: "CTE战队队长、ADC",
        personality: "沉默、清冷、内敛",
        desc: "极简风格的房间，除了必要的设备几乎没有杂物。书桌上摆着一本翻开的书，窗台上养着一盆生命力顽强的绿植，正如他本人一样沉稳可靠。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/c2khbl.jpeg",
        destination: "CTE基地-秦述房间"
    },
    "si_luo": {
        name: "司洛",
        age: "24",
        role: "CTE战队成员、打野",
        personality: "慵懒、随性、玩世不恭",
        desc: "房间略显凌乱，但乱中有序。昂贵的电竞外设随意摆放，懒人沙发上丢着几件潮牌外套，处处透着一股漫不经心的天才气息。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/pohz52.jpeg",
        destination: "CTE基地-司洛房间"
    },
    "lu_yan": {
        name: "鹿言",
        age: "23",
        role: "CTE战队成员、中单",
        personality: "温柔、谦逊、善良",
        desc: "温暖的色调，书架上摆满了粉丝送的玩偶和手写信。房间里总是收拾得一尘不染，让人感到无比的安心和舒适。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/parliq.jpeg",
        destination: "CTE基地-鹿言房间"
    },
    "wei_xingze": {
        name: "魏星泽",
        age: "20",
        role: "CTE战队成员、辅助",
        personality: "开朗、感性、大大咧咧",
        desc: "充满活力的房间，墙上贴着各种动漫海报。零食柜永远是满的，角落里还堆着几个还没拆封的游戏手办。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/syo0ze.jpeg",
        destination: "CTE基地-魏星泽房间"
    },
    "zhou_jinning": {
        name: "周锦宁",
        age: "20",
        role: "CTE战队成员、上单",
        personality: "傲娇、矜贵、毒舌",
        desc: "精致奢华的装修风格，甚至有一个专门的陈列柜用来展示他的限量版球鞋。每一处细节都彰显着主人的高傲与品味。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/1loxsn.jpeg",
        destination: "CTE基地-周锦宁房间"
    },
    "chen_xu": {
        name: "谌绪",
        age: "18",
        role: "CTE战队替补中单、高中生",
        personality: "腹黑、恶劣、隐藏病娇",
        desc: "表面看起来像个乖巧高中生的房间，书桌上摆着整齐的试卷。但抽屉深处似乎藏着一些不为人知的秘密，空气中带着一丝危险的气息。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/9tnuva.png",
        destination: "CTE基地-谌绪房间"
    },
    "meng_minghe": {
        name: "孟明赫",
        age: "20",
        role: "CTE战队ADC替补",
        personality: "阴郁、厌世、内向、大胆叛逆",
        desc: "窗帘常年拉着，光线昏暗。墙上有着涂鸦的痕迹，角落里放着一把旧吉他。这是一个属于孤独灵魂的避难所。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/m446ro.jpeg",
        destination: "CTE基地-孟明赫房间"
    },
    "qi_xie": {
        name: "亓谢",
        age: "18",
        role: "CTE战队打野替补",
        personality: "疯批、天才、毒舌、直白",
        desc: "房间里充满了科技感，多块屏幕闪烁着复杂的数据流。这里更像是一个黑客的实验室，而不是一个普通的电竞选手宿舍。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/ev2g1l.png",
        destination: "CTE基地-亓谢房间"
    },
    "sang_luofan": {
        name: "桑洛凡",
        age: "27",
        role: "CTE助教、豪门大少爷",
        personality: "慵懒随性、桀骜不驯、腹黑",
        desc: "低调奢华，红酒柜和定制西装占据了很大空间。他并不常住这里，但即便只是偶尔停留，也要保持绝对的享受。(头像图片来自角色卡原作者耶耶)",
        avatar: "https://files.catbox.moe/syudzu.png",
        destination: "CTE基地-桑洛凡房间"
    },
    "user": {
        name: "你",
        age: "??",
        role: "CTE战队新成员/访客",
        personality: "自定义",
        desc: "这是属于你的私人空间。你可以按照自己的喜好布置它。虽然现在还很空旷，但未来这里会充满你与CTE的故事。",
        avatar: userPlaceholderAvatar, 
        destination: "CTE基地-你的房间"
    }
};

const CTEEscape = {
    settings: {
        theme: 0,
        buttonPos: null 
    },
    panelLoaded: false,
    
    // 修改：使用 tempTripData 暂存行程信息，而不是只存 currentDestination
    tempTripData: {
        destination: null,
        companion: null,
        npc: null
    },

    isDraggingPin: false,
    currentProfileId: null,

    async init() {
        console.log("🏆 [CTE Esport] 插件正在启动...");
        this.loadSettings();
        this.injectToggleButton();
        await this.loadHTML();
        
        if (this.panelLoaded) {
            this.bindEvents();
            this.enablePinDragging();
            this.applyTheme(this.settings.theme);
            this.loadUserAvatar();
            
            window.addEventListener('resize', () => {
                const btn = document.getElementById("cte-esport-toggle-btn");
                if (btn) this.constrainButtonToScreen(btn);
            });

            console.log("✅ [CTE Esport] 初始化成功。");
        }
    },

    calculateSafePosition() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        if (this.settings.buttonPos && this.settings.buttonPos.top && this.settings.buttonPos.left) {
            const left = parseInt(this.settings.buttonPos.left);
            const top = parseInt(this.settings.buttonPos.top);

            if (left >= 0 && left < (winWidth - 20) && top >= 0 && top < (winHeight - 20)) {
                return `top: ${top}px; left: ${left}px; right: auto;`;
            } else {
                console.warn("🏆 [CTE Map] 保存的图标位置超出当前屏幕，已重置。");
            }
        }

        const isMobile = winWidth <= 768;
        if (isMobile) {
            const centerX = (winWidth / 2) - 20;
            const centerY = (winHeight / 2) - 20;
            return `top: ${centerY}px; left: ${centerX}px; right: auto;`; 
        } else {
            return "top: 10px; right: 340px;";
        }
    },

    constrainButtonToScreen(btn) {
        const rect = btn.getBoundingClientRect();
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        let newLeft = rect.left;
        let newTop = rect.top;
        let adjusted = false;

        if (rect.right > winWidth) {
            newLeft = winWidth - rect.width - 10;
            adjusted = true;
        }
        if (rect.bottom > winHeight) {
            newTop = winHeight - rect.height - 10;
            adjusted = true;
        }
        if (rect.left < 0) {
            newLeft = 10;
            adjusted = true;
        }
        if (rect.top < 0) {
            newTop = 10;
            adjusted = true;
        }

        if (adjusted) {
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
            btn.style.right = 'auto'; 
            
            this.settings.buttonPos = {
                top: newTop + "px",
                left: newLeft + "px"
            };
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

        btn.style.cssText = `
            position: fixed; 
            ${posStyle}
            z-index: 2147483647; 
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px; 
            cursor: pointer; 
            filter: drop-shadow(0 0 2px black);
            transition: transform 0.2s;
            user-select: none;
            background: rgba(0,0,0,0.2);
            border-radius: 50%;
        `;
        
        let isButtonDragging = false;

        if (typeof $ !== "undefined" && $.fn.draggable) {
            $(btn).draggable({
                containment: "window",
                scroll: false,
                start: () => {
                    isButtonDragging = true;
                    btn.style.right = 'auto'; 
                },
                stop: (event, ui) => {
                    this.settings.buttonPos = {
                        top: ui.position.top + "px",
                        left: ui.position.left + "px"
                    };
                    this.saveSettings();
                    setTimeout(() => { isButtonDragging = false; }, 100);
                }
            });
        }

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (isButtonDragging) { e.preventDefault(); return; }
            this.togglePanel();
        });
        
        btn.addEventListener("mouseover", () => btn.style.transform = "scale(1.1)");
        btn.addEventListener("mouseout", () => btn.style.transform = "scale(1)");
        
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
            console.error("❌ [CTE Esport] HTML 加载失败:", e);
            if (typeof toastr !== "undefined") {
                toastr.error("地图文件加载失败，请检查 map.html 是否存在。", "CTE Map Error");
            }
        }
    },

    fixPanelPosition(panel) {
        const isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
        if (isMobile) {
            const padding = 10;
            panel.style.top = padding + 'px';
            panel.style.left = padding + 'px';
            panel.style.width = (window.innerWidth - padding * 2) + 'px';
            panel.style.height = (window.innerHeight - padding * 2) + 'px';
            panel.style.transform = 'none';
        } else {
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.width = '90vh';
            panel.style.height = '90vh';
            panel.style.transform = 'translate(-50%, -50%)';
        }
    },

    togglePanel() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;
        const currentDisplay = window.getComputedStyle(panel).display;
        if (currentDisplay === "none") {
            this.fixPanelPosition(panel);
            panel.style.display = "flex";
            panel.style.opacity = "0";
            setTimeout(() => {
                panel.style.opacity = "1"; 
                panel.style.transition = "opacity 0.2s"; 
            }, 10);
        } else {
            panel.style.display = "none";
        }
    },

    // --- 修改：准备行程逻辑 ---
    prepareTravel(destination) {
        // 1. 初始化临时数据
        this.tempTripData = {
            destination: destination,
            companion: null,
            npc: null
        };

        // 2. 更新 UI 标题
        const modalTitle = document.getElementById("cte-travel-dest-name");
        if(modalTitle) modalTitle.innerText = destination;
        
        // 3. NPC 偶遇逻辑：根据地点匹配默认NPC
        let defaultNPC = "";
        
        if (destination.includes("极光电竞馆")) {
            defaultNPC = LOCATION_NPC_DEFAULTS["极光电竞馆"];
        } else if (destination.includes("万达广场")) {
            defaultNPC = LOCATION_NPC_DEFAULTS["万达广场"];
        } else if (destination.includes("百步街")) {
            defaultNPC = LOCATION_NPC_DEFAULTS["百步街"];
        } else if (destination.includes("小吃街")) {
            defaultNPC = LOCATION_NPC_DEFAULTS["小吃街"];
        }
        
        // 4. 更新 NPC UI 状态
        const npcInput = document.getElementById("cte-npc-input");
        const placeholderText = document.getElementById("cte-npc-placeholder-text");
        const noRadio = document.getElementById("meet_no");

        // 默认设置为“否”，隐藏输入框
        if (noRadio) noRadio.checked = true;
        if (npcInput) {
            npcInput.style.display = "none";
            npcInput.value = defaultNPC; // 预填默认值，方便用户直接改
        }

        // 提示文案：显示该地点可能遇到的 NPC
        if (placeholderText) {
            placeholderText.innerText = defaultNPC ? defaultNPC.split("、")[0] : "NPC";
        }

        this.showPopup("cte-travel-modal");
    },

    // --- 新增：第一步，点击出发后显示活动选择 ---
    showActivityPopup(companionName = null) {
        // 1. 保存同伴信息
        this.tempTripData.companion = companionName;

        // 2. 获取并保存 NPC 设置
        const yesRadio = document.getElementById("meet_yes");
        const npcInput = document.getElementById("cte-npc-input");
        
        if (yesRadio && yesRadio.checked) {
            // 如果选了是，获取输入框的值
            const val = npcInput.value.trim();
            this.tempTripData.npc = val || "神秘人"; 
        } else {
            this.tempTripData.npc = null;
        }

        // 3. 切换弹窗：保持 Panel 打开，只切换内部 Popup
        this.showPopup("cte-activity-modal");
    },

    // --- 新增：第二步，确定活动并生成最终文本 ---
    finalizeTrip(activity) {
        this.togglePanel(); // 关闭大地图
        
        const { destination, companion, npc } = this.tempTripData;
        const userPlaceholder = "{{user}}"; 
        
        let outputText = "";
        
        // 构建句子：人物 + 地点
        if (companion) {
            outputText = `${userPlaceholder} 邀请 ${companion} 前往 ${destination}`;
        } else {
            outputText = `${userPlaceholder} 决定独自前往${destination}`;
        }

        // 追加：活动
        outputText += `，打算去${activity}`;

        // 追加：NPC 偶遇
        if (npc) {
            outputText += `。在那里，意外遇见了${npc}。`;
        } else {
            outputText += `。`;
        }

        // 输出到输入框
        const textarea = document.getElementById('send_textarea');
        if (textarea) {
            textarea.value = outputText;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.focus();
        }

        if (typeof toastr !== 'undefined') {
            toastr.success(`行程已确认: ${activity} @ ${destination}`);
        }
        
        // 清理输入框
        const companionInput = document.getElementById("cte-companion-input");
        if(companionInput) companionInput.value = "";
        const customActInput = document.getElementById("cte-custom-act-input");
        if(customActInput) customActInput.value = "";
    },

    showCharacterProfile(charId) {
        const data = CTE_CHARACTERS[charId];
        if (!data) return;

        this.currentProfileId = charId;
        const isUser = charId === 'user';

        document.getElementById("cte-profile-name").innerText = data.name;
        document.getElementById("cte-profile-age").innerText = data.age;
        document.getElementById("cte-profile-role").innerText = data.role;
        document.getElementById("cte-profile-personality").innerText = data.personality;
        document.getElementById("cte-profile-desc").innerText = data.desc;

        const imgEl = document.getElementById("cte-profile-img");
        const avatarWrapper = document.querySelector(".cte-profile-avatar-wrapper");
        const deleteBtn = document.getElementById("cte-avatar-delete-btn");

        if (isUser) {
            const savedAvatar = localStorage.getItem("cte-user-avatar");
            imgEl.src = savedAvatar || data.avatar;
            avatarWrapper.classList.add("cte-user-avatar-glow");
            deleteBtn.style.display = savedAvatar ? "block" : "none";
        } else {
            imgEl.src = data.avatar;
            avatarWrapper.classList.remove("cte-user-avatar-glow");
            deleteBtn.style.display = "none";
        }

        const goBtn = document.getElementById("cte-profile-go-btn");
        goBtn.onclick = () => {
            this.prepareTravel(data.destination);
        };

        this.showPopup("cte-profile-modal");
    },

    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            localStorage.setItem("cte-user-avatar", base64);
            const imgEl = document.getElementById("cte-profile-img");
            if (imgEl) imgEl.src = base64;
            const deleteBtn = document.getElementById("cte-avatar-delete-btn");
            if (deleteBtn) deleteBtn.style.display = "block";
            if (typeof toastr !== 'undefined') toastr.success("头像上传成功！");
        };
        reader.readAsDataURL(file);
    },

    deleteUserAvatar() {
        localStorage.removeItem("cte-user-avatar");
        const imgEl = document.getElementById("cte-profile-img");
        if (imgEl) imgEl.src = CTE_CHARACTERS['user'].avatar;
        const deleteBtn = document.getElementById("cte-avatar-delete-btn");
        if (deleteBtn) deleteBtn.style.display = "none";
        if (typeof toastr !== 'undefined') toastr.info("头像已重置");
    },

    loadUserAvatar() {
        const saved = localStorage.getItem("cte-user-avatar");
        if (saved) console.log("Detected custom user avatar.");
    },

    handleMapUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const mapCanvas = document.getElementById("cte-map-canvas");
            if (mapCanvas) {
                mapCanvas.style.backgroundImage = `url(${event.target.result})`;
                if (typeof toastr !== 'undefined') toastr.success("地图背景更换成功！");
            }
        };
        reader.readAsDataURL(file);
    },

    handleResetBackground() {
        const mapCanvas = document.getElementById("cte-map-canvas");
        if (mapCanvas) {
            mapCanvas.style.backgroundImage = `url(${defaultMapBg})`;
            if (typeof toastr !== 'undefined') toastr.info("已恢复原始地图背景。");
        }
    },

    enablePinDragging() {
        const mapCanvas = document.getElementById("cte-map-canvas");
        if (!mapCanvas) return;

        let activePin = null;
        let startX, startY, startLeft, startTop;
        let hasMoved = false;

        mapCanvas.addEventListener("mousedown", (e) => {
            const pin = e.target.closest(".cte-esport-pin");
            if (!pin) return;

            e.preventDefault();
            activePin = pin;
            hasMoved = false;
            
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(activePin.style.left || 0);
            startTop = parseInt(activePin.style.top || 0);

            activePin.classList.add("dragging");
            
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!activePin) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
                this.isDraggingPin = true;
                let newLeft = startLeft + dx;
                let newTop = startTop + dy;
                newLeft = Math.max(0, Math.min(newLeft, 800));
                newTop = Math.max(0, Math.min(newTop, 800));
                activePin.style.left = `${newLeft}px`;
                activePin.style.top = `${newTop}px`;
            }
        };

        const onMouseUp = () => {
            if (activePin) {
                activePin.classList.remove("dragging");
                activePin = null;
            }
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            setTimeout(() => { this.isDraggingPin = false; }, 50);
        };
    },

    bindEvents() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;

        const closeBtn = panel.querySelector("#cte-btn-close");
        if(closeBtn) closeBtn.onclick = () => this.togglePanel();

        const themeBtn = panel.querySelector("#cte-btn-theme");
        if(themeBtn) themeBtn.onclick = () => {
            this.settings.theme = (this.settings.theme + 1) % 3;
            this.applyTheme(this.settings.theme);
            this.saveSettings();
        };

        const uploadInput = document.getElementById("cte-bg-upload");
        if (uploadInput) uploadInput.addEventListener("change", (e) => this.handleMapUpload(e));

        const resetBtn = document.getElementById("cte-btn-reset-bg");
        if (resetBtn) resetBtn.onclick = () => this.handleResetBackground();

        const avatarInput = document.getElementById("cte-user-avatar-input");
        if (avatarInput) avatarInput.addEventListener("change", (e) => this.handleAvatarUpload(e));
        
        const deleteAvatarBtn = document.getElementById("cte-avatar-delete-btn");
        if (deleteAvatarBtn) deleteAvatarBtn.onclick = () => this.deleteUserAvatar();

        const mapCanvas = panel.querySelector("#cte-map-canvas");
        if(mapCanvas) {
            mapCanvas.onclick = (e) => {
                if (this.isDraggingPin) { e.stopPropagation(); return; }
                if (e.target.id === "cte-map-canvas") this.closeAllPopups();
                
                const pin = e.target.closest(".cte-esport-pin");
                if (pin) {
                    e.stopPropagation();
                    const popupId = pin.getAttribute("data-popup");
                    this.showPopup(popupId);
                }
            };
        }

        panel.onclick = (e) => {
            const target = e.target;
            
            if (target.matches(".cte-close-btn")) {
                target.closest(".cte-esport-popup").classList.remove("active");
            }
            
            const profileTarget = target.getAttribute("data-profile") || target.closest("[data-profile]")?.getAttribute("data-profile");
            if (profileTarget) {
                this.showCharacterProfile(profileTarget);
                return; 
            }

            const travelDest = target.getAttribute("data-travel") || target.closest("[data-travel]")?.getAttribute("data-travel");
            if (travelDest) {
                if (!target.closest("#cte-travel-modal")) {
                    this.prepareTravel(travelDest);
                }
            }

            if (target.getAttribute("data-action") === "interior") this.showPopup("popup-interior");
            if (target.getAttribute("data-action") === "back-base") this.showPopup("popup-cte");

            const floorBtn = target.closest(".cte-floor-btn");
            if (floorBtn) {
                const floorId = floorBtn.getAttribute("data-target");
                this.toggleFloor(floorId, floorBtn);
            }
        };

        // --- 更新：绑定 NPC 开关逻辑 ---
        const yesRadio = document.getElementById("meet_yes");
        const noRadio = document.getElementById("meet_no");
        const npcInput = document.getElementById("cte-npc-input");
        
        if (yesRadio && noRadio && npcInput) {
            yesRadio.addEventListener("change", () => {
                if (yesRadio.checked) npcInput.style.display = "block";
            });
            noRadio.addEventListener("change", () => {
                if (noRadio.checked) npcInput.style.display = "none";
            });
        }

        // --- 更新：绑定行程按钮逻辑（指向 Activity Popup）---
        const btnAlone = document.getElementById("cte-travel-alone");
        const btnCompanion = document.getElementById("cte-travel-companion");
        const inputCompanion = document.getElementById("cte-companion-input");

        if (btnAlone) btnAlone.onclick = () => this.showActivityPopup(null);

        if (btnCompanion) {
            btnCompanion.onclick = () => {
                const name = inputCompanion.value.trim();
                if (!name) {
                    if (typeof toastr !== "undefined") toastr.warning("请输入同伴名字");
                    return;
                }
                this.showActivityPopup(name);
            };
        }

        // --- 新增：绑定活动选择按钮逻辑 ---
        const actBtns = document.querySelectorAll(".cte-activity-btn");
        actBtns.forEach(btn => {
            btn.onclick = (e) => {
                const act = e.target.getAttribute("data-act");
                this.finalizeTrip(act);
            };
        });

        // 绑定自定义活动确认按钮
        const confirmCustomAct = document.getElementById("cte-confirm-custom-act");
        const customActInput = document.getElementById("cte-custom-act-input");
        if (confirmCustomAct && customActInput) {
            confirmCustomAct.onclick = () => {
                const val = customActInput.value.trim();
                if (val) this.finalizeTrip(val);
            };
        }

        // 自定义地点出发按钮（保持原样，但也指向 prepareTravel）
        const customBtn = document.getElementById("cte-btn-custom-go");
        if (customBtn) {
            customBtn.onclick = () => {
                const input = document.getElementById("cte-custom-input");
                if (input && input.value.trim()) this.prepareTravel(input.value.trim());
            };
        }
    },

    showPopup(id) {
        const keepInteriorOpen = (id === 'cte-profile-modal');
        
        document.querySelectorAll(".cte-esport-popup").forEach(p => {
            if (keepInteriorOpen) {
                if (p.id !== 'popup-interior' && p.id !== 'popup-cte') {
                    p.classList.remove("active");
                }
            } else {
                p.classList.remove("active");
            }
        });
        
        const popup = document.getElementById(id);
        if (popup) {
            popup.classList.add("active");
            if (id === 'cte-profile-modal') {
                popup.style.zIndex = 2000;
            } else {
                popup.style.zIndex = 1000;
            }
        }
    },

    closeAllPopups() {
        document.querySelectorAll(".cte-esport-popup").forEach(p => {
            p.classList.remove("active");
            p.style.zIndex = "";
        });
    },

    toggleFloor(floorId, btn) {
        const panel = document.getElementById(floorId);
        if(!panel) return;
        
        document.querySelectorAll(".cte-floor-panel").forEach(p => {
            if(p.id !== floorId) p.style.display = "none";
        });
        document.querySelectorAll(".cte-floor-btn").forEach(b => b.classList.remove("active"));

        if (panel.style.display === "block") {
            panel.style.display = "none";
            btn.classList.remove("active");
        } else {
            panel.style.display = "block";
            btn.classList.add("active");
        }
    },

    applyTheme(theme) {
        const root = document.getElementById("cte-esport-root");
        if (!root) return;
        const themes = [
            { bg: '#121212', panel: '#1e1e1e', gold: '#c5a065', text: '#e0e0e0' },
            { bg: '#f4f7f6', panel: '#ffffff', gold: '#5d9cec', text: '#333333' },
            { bg: '#fff0f3', panel: '#ffffff', gold: '#f06292', text: '#4a2c36' }
        ];
        const t = themes[theme] || themes[0];
        root.style.setProperty('--cte-bg-dark', t.bg);
        root.style.setProperty('--cte-panel-bg', t.panel);
        root.style.setProperty('--cte-accent-gold', t.gold);
        root.style.setProperty('--cte-text-main', t.text);
    },

    saveSettings() {
        localStorage.setItem("cte-esport-settings", JSON.stringify(this.settings));
    },

    loadSettings() {
        try {
            const data = localStorage.getItem("cte-esport-settings");
            if (data) this.settings = JSON.parse(data);
        } catch(e) {}
    }
};

(function() {
    CTEEscape.init();
})();
