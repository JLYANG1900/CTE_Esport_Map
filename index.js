// --- CTE Esport Map 核心逻辑 (v4.0) ---
// 更新内容：增强地点信息，Travel 逻辑弹窗化，UI 1:1锁定

const extensionName = "cte-esport-map";

const CTEEscape = {
    settings: {
        theme: 0, 
    },
    panelLoaded: false,
    currentDestination: null, // 存储当前选中的目的地

    async init() {
        console.log("🏆 [CTE Esport] 插件正在启动...");
        
        // 1. 注入开关按钮
        this.injectToggleButton();
        
        // 2. 加载设置
        this.loadSettings();
        
        // 3. 加载 HTML
        await this.loadHTML();
        
        // 4. 绑定事件
        if (this.panelLoaded) {
            this.bindEvents();
            this.applyTheme(this.settings.theme);
            console.log("✅ [CTE Esport] 初始化成功。");
        }
    },

    injectToggleButton() {
        if (document.getElementById("cte-esport-toggle-btn")) return;

        const btn = document.createElement("div");
        btn.id = "cte-esport-toggle-btn";
        btn.innerHTML = "🏆"; 
        btn.title = "打开 CTE 战队地图";
        
        btn.style.cssText = `
            position: fixed; 
            top: 10px; 
            right: 340px; 
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
        
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
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

    togglePanel() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;

        const currentDisplay = window.getComputedStyle(panel).display;
        if (currentDisplay === "none") {
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

    // 获取 ST 上下文的辅助函数
    getContext() {
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            return SillyTavern.getContext();
        }
        if (window.SillyTavern && window.SillyTavern.getContext) {
            return window.SillyTavern.getContext();
        }
        return null;
    },

    // 1. 触发旅行弹窗 (第一步)
    prepareTravel(destination) {
        this.currentDestination = destination;
        const modalTitle = document.getElementById("cte-travel-dest-name");
        if(modalTitle) modalTitle.innerText = destination;
        
        // 显示确认弹窗
        this.showPopup("cte-travel-modal");
    },

    // 2. 执行旅行 (第二步：发送到聊天框)
    executeTravel(companionName = null) {
        this.togglePanel(); // 关闭地图
        
        const context = this.getContext();
        const userName = context ? context.name2 : "{{user}}"; // 获取当前用户名
        const destination = this.currentDestination;
        
        let outputText = "";
        
        if (companionName) {
            // 邀请模式
            outputText = `${userName} 邀请 ${companionName} 前往 ${destination}`;
        } else {
            // 独行模式
            outputText = `${userName} 前往 ${destination}`;
        }

        // 插入到 ST 输入框
        const textarea = document.getElementById('send_textarea');
        if (textarea) {
            textarea.value = outputText;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.focus();
        }

        if (typeof toastr !== 'undefined') {
            toastr.success(`已设置出发指令: ${destination}`);
        }
        
        // 清空状态
        this.currentDestination = null;
        const companionInput = document.getElementById("cte-companion-input");
        if(companionInput) companionInput.value = "";
    },

    bindEvents() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;

        // 关闭
        const closeBtn = panel.querySelector("#cte-btn-close");
        if(closeBtn) closeBtn.onclick = () => this.togglePanel();

        // 主题
        const themeBtn = panel.querySelector("#cte-btn-theme");
        if(themeBtn) themeBtn.onclick = () => {
            this.settings.theme = (this.settings.theme + 1) % 3;
            this.applyTheme(this.settings.theme);
            this.saveSettings();
        };

        // 地图点击
        const mapCanvas = panel.querySelector("#cte-map-canvas");
        if(mapCanvas) {
            mapCanvas.onclick = (e) => {
                if (e.target.id === "cte-map-canvas") this.closeAllPopups();
                
                const pin = e.target.closest(".cte-esport-pin");
                if (pin) {
                    e.stopPropagation();
                    const popupId = pin.getAttribute("data-popup");
                    this.showPopup(popupId);
                }
            };
        }

        // 统一处理面板内的点击 (弹窗、按钮)
        panel.onclick = (e) => {
            const target = e.target;
            
            // 关闭小弹窗
            if (target.matches(".cte-close-btn")) {
                target.closest(".cte-esport-popup").classList.remove("active");
            }
            
            // 点击含有 data-travel 的元素 (准备出发)
            const travelDest = target.getAttribute("data-travel") || target.closest("[data-travel]")?.getAttribute("data-travel");
            if (travelDest) {
                // 如果是在 Travel Modal 里的按钮，不要递归触发，直接return
                if (!target.closest("#cte-travel-modal")) {
                    this.prepareTravel(travelDest);
                }
            }

            // 内部功能
            if (target.getAttribute("data-action") === "interior") this.showPopup("popup-interior");
            if (target.getAttribute("data-action") === "back-base") this.showPopup("popup-cte");

            // 楼层切换
            const floorBtn = target.closest(".cte-floor-btn");
            if (floorBtn) {
                const floorId = floorBtn.getAttribute("data-target");
                this.toggleFloor(floorId, floorBtn);
            }
        };

        // 绑定旅行确认弹窗的具体按钮
        const btnAlone = document.getElementById("cte-travel-alone");
        const btnCompanion = document.getElementById("cte-travel-companion");
        const inputCompanion = document.getElementById("cte-companion-input");

        if (btnAlone) {
            btnAlone.onclick = () => this.executeTravel(null);
        }

        if (btnCompanion) {
            btnCompanion.onclick = () => {
                const name = inputCompanion.value.trim();
                if (!name) {
                    if (typeof toastr !== "undefined") toastr.warning("请输入同伴名字");
                    return;
                }
                this.executeTravel(name);
            };
        }

        // 自定义前往按钮 (输入框 -> 准备出发)
        const customBtn = document.getElementById("cte-btn-custom-go");
        if (customBtn) {
            customBtn.onclick = () => {
                const input = document.getElementById("cte-custom-input");
                if (input && input.value.trim()) this.prepareTravel(input.value.trim());
            };
        }
    },

    showPopup(id) {
        // 关闭所有其他，打开指定
        this.closeAllPopups();
        const popup = document.getElementById(id);
        if (popup) popup.classList.add("active");
    },

    closeAllPopups() {
        document.querySelectorAll(".cte-esport-popup").forEach(p => p.classList.remove("active"));
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
