// --- CTE Esport Map 核心逻辑 (v3.7) ---
// 移除了文件路径依赖，使用全局 API 确保稳定性

const extensionName = "cte-esport-map";

const CTEEscape = {
    settings: {
        theme: 0, 
    },
    panelLoaded: false,

    async init() {
        console.log("🏆 [CTE Esport] 插件正在启动...");
        
        // 1. 第一步：先强行把按钮显示出来，不管其他报不报错
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
        // 防止重复创建
        if (document.getElementById("cte-esport-toggle-btn")) return;

        console.log("🏆 [CTE Esport] 正在注入图标...");
        const btn = document.createElement("div");
        btn.id = "cte-esport-toggle-btn";
        btn.innerHTML = "🏆"; 
        btn.title = "打开 CTE 战队地图";
        
        // 使用内联样式确保图标一定可见，不依赖 CSS 文件
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
            // 动态获取同目录下的 map.html
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
        if (!panel) {
            // 如果面板没加载出来，再次尝试提示
            if (typeof toastr !== "undefined") toastr.warning("地图面板未加载，请刷新页面重试。");
            return;
        }

        const currentDisplay = window.getComputedStyle(panel).display;
        if (currentDisplay === "none") {
            panel.style.display = "flex";
            // 简单的淡入效果
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
        // 尝试从全局对象获取，兼容不同版本
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            return SillyTavern.getContext();
        }
        // 回退策略：检查 window 对象
        if (window.SillyTavern && window.SillyTavern.getContext) {
            return window.SillyTavern.getContext();
        }
        return null;
    },

    handleTravel(destination) {
        this.togglePanel();
        
        const context = this.getContext();
        // 尝试获取输入框
        const textarea = document.getElementById('send_textarea');
        
        if (textarea) {
            const userName = context ? context.name2 : "用户";
            // 插入系统提示
            const prompt = `\n[系统提示：${userName} 前往了“${destination}”。请描述该地点的环境。]\n`;
            
            // 简单的插入逻辑，避免复杂的光标操作导致报错
            textarea.value = prompt;
            
            // 触发 input 事件让 ST 知道内容变了
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.focus();
        }

        if (typeof toastr !== 'undefined') {
            toastr.success(`正在前往：${destination}`);
        }
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
                // 点击背景关闭弹窗
                if (e.target.id === "cte-map-canvas") this.closeAllPopups();
                
                // 点击地标
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
            
            // 前往逻辑
            const travelDest = target.getAttribute("data-travel") || target.closest("[data-travel]")?.getAttribute("data-travel");
            if (travelDest) this.handleTravel(travelDest);

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

        // 自定义前往按钮
        const customBtn = document.getElementById("cte-btn-custom-go");
        if (customBtn) {
            customBtn.onclick = () => {
                const input = document.getElementById("cte-custom-input");
                if (input && input.value.trim()) this.handleTravel(input.value.trim());
            };
        }
    },

    showPopup(id) {
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
        
        // 隐藏其他
        document.querySelectorAll(".cte-floor-panel").forEach(p => {
            if(p.id !== floorId) p.style.display = "none";
        });
        document.querySelectorAll(".cte-floor-btn").forEach(b => b.classList.remove("active"));

        // 切换当前
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

// 启动入口 (兼容性写法)
(function() {
    // 立即执行初始化
    CTEEscape.init();
})();
