import { extension_settings, getContext } from "../../../extensions.js";

const extensionName = "cte-esport-map";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// 独立的命名空间对象
const CTEEscape = {
    settings: {
        theme: 0, // 0:黑金, 1:蓝白, 2:粉白
    },

    async init() {
        console.log("[CTE Esport] 正在初始化独立地图插件...");
        
        // 1. 加载 HTML
        await this.loadHTML();
        
        // 2. 加载设置
        this.loadSettings();
        
        // 3. 注入独立的 Toggle 按钮 (位置设为 right: 60px 避免重叠)
        this.injectToggleButton();
        
        // 4. 绑定事件
        this.bindEvents();
        
        // 5. 应用初始主题
        this.applyTheme(this.settings.theme);
        
        console.log("[CTE Esport] 初始化完成。");
    },

    async loadHTML() {
        try {
            const response = await fetch(`${extensionFolderPath}/map.html`);
            if (!response.ok) throw new Error("无法加载 map.html");
            const html = await response.text();
            
            // 将 HTML 注入到 body
            const container = document.createElement("div");
            container.innerHTML = html;
            document.body.appendChild(container.firstElementChild);
        } catch (e) {
            console.error("[CTE Esport] HTML 加载失败:", e);
        }
    },

    injectToggleButton() {
        // 检查是否已存在
        if (document.getElementById("cte-esport-toggle-btn")) return;

        const btn = document.createElement("div");
        btn.id = "cte-esport-toggle-btn";
        btn.innerHTML = "🏆"; // 使用不同的图标区分
        btn.title = "打开 CTE 战队地图";
        // 样式：固定在右上角，但在原版地图按钮的左边或下边
        btn.style.cssText = `
            position: fixed; 
            top: 10px; 
            right: 340px; /* 调整位置避免重叠 */
            z-index: 20001; 
            font-size: 24px; 
            cursor: pointer; 
            filter: drop-shadow(0 0 2px black);
            transition: transform 0.2s;
        `;
        btn.onmouseover = () => btn.style.transform = "scale(1.1)";
        btn.onmouseout = () => btn.style.transform = "scale(1)";
        btn.onclick = () => this.togglePanel();
        
        document.body.appendChild(btn);
    },

    togglePanel() {
        const panel = document.getElementById("cte-esport-panel");
        if (panel) {
            const isVisible = panel.style.display === "flex";
            panel.style.display = isVisible ? "none" : "flex";
        }
    },

    bindEvents() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;

        // 关闭按钮
        panel.querySelector("#cte-btn-close").addEventListener("click", () => {
            panel.style.display = "none";
        });

        // 主题切换
        panel.querySelector("#cte-btn-theme").addEventListener("click", () => {
            this.settings.theme = (this.settings.theme + 1) % 3;
            this.applyTheme(this.settings.theme);
            this.saveSettings();
        });

        // 点击地图背景关闭所有弹窗
        panel.querySelector("#cte-map-canvas").addEventListener("click", (e) => {
            if (e.target.id === "cte-map-canvas") {
                this.closeAllPopups();
            }
        });

        // 地标点击事件 (事件委托)
        panel.querySelector("#cte-map-canvas").addEventListener("click", (e) => {
            const pin = e.target.closest(".cte-esport-pin");
            if (pin) {
                const popupId = pin.getAttribute("data-popup");
                this.showPopup(popupId);
                e.stopPropagation(); // 防止冒泡关闭弹窗
            }
        });

        // 弹窗内部关闭按钮
        panel.addEventListener("click", (e) => {
            if (e.target.matches(".cte-close-btn")) {
                e.target.closest(".cte-esport-popup").classList.remove("active");
            }
        });

        // 功能按钮逻辑
        panel.addEventListener("click", (e) => {
            const target = e.target;
            
            // 1. 前往地点 (Travel)
            const travelDest = target.getAttribute("data-travel") || target.closest("[data-travel]")?.getAttribute("data-travel");
            if (travelDest) {
                this.handleTravel(travelDest);
            }

            // 2. 内部按钮 (Show Interior)
            if (target.getAttribute("data-action") === "interior") {
                this.showPopup("popup-interior");
            }

            // 3. 返回按钮 (Back)
            if (target.getAttribute("data-action") === "back-base") {
                this.showPopup("popup-cte");
            }

            // 4. 楼层切换 (Floor Toggle)
            const floorBtn = target.closest(".cte-floor-btn");
            if (floorBtn) {
                const floorId = floorBtn.getAttribute("data-target");
                this.toggleFloor(floorId, floorBtn);
            }
        });

        // 自定义前往
        const customBtn = document.getElementById("cte-btn-custom-go");
        if (customBtn) {
            customBtn.addEventListener("click", () => {
                const val = document.getElementById("cte-custom-input").value.trim();
                if (val) this.handleTravel(val);
            });
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
        // 关闭其他楼层
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

    handleTravel(destination) {
        this.togglePanel(); // 关闭地图
        
        // 获取上下文并发送指令
        const context = getContext();
        const charName = context.characterId ? context.characters[context.characterId].name : "System";
        
        // 发送给 SillyTavern 输入框
        const textarea = document.getElementById('send_textarea');
        if (textarea) {
            textarea.value = `[系统提示：用户已移动至地点“${destination}”。请描述该地点的环境、氛围以及可能发生的事件。]`;
            // 触发输入事件以便 ST 检测到变化
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 可选：自动点击发送 (如果需要自动发送，取消下面注释)
            // const sendBtn = document.getElementById('send_but');
            // if (sendBtn) sendBtn.click();
        }

        if (typeof toastr !== 'undefined') {
            toastr.success(`正在前往：${destination}`);
        }
    },

    applyTheme(theme) {
        const root = document.getElementById("cte-esport-root");
        if (!root) return;
        
        if (theme === 0) { // 黑金
            root.style.setProperty('--cte-bg-dark', '#121212');
            root.style.setProperty('--cte-panel-bg', '#1e1e1e');
            root.style.setProperty('--cte-accent-gold', '#c5a065');
            root.style.setProperty('--cte-text-main', '#e0e0e0');
        } else if (theme === 1) { // 蓝白
            root.style.setProperty('--cte-bg-dark', '#f4f7f6');
            root.style.setProperty('--cte-panel-bg', '#ffffff');
            root.style.setProperty('--cte-accent-gold', '#5d9cec');
            root.style.setProperty('--cte-text-main', '#333');
        } else { // 粉白
            root.style.setProperty('--cte-bg-dark', '#fff0f3');
            root.style.setProperty('--cte-panel-bg', '#ffffff');
            root.style.setProperty('--cte-accent-gold', '#f06292');
            root.style.setProperty('--cte-text-main', '#4a2c36');
        }
    },

    saveSettings() {
        localStorage.setItem("cte-esport-settings", JSON.stringify(this.settings));
    },

    loadSettings() {
        const data = localStorage.getItem("cte-esport-settings");
        if (data) this.settings = JSON.parse(data);
    }
};

// 启动插件
jQuery(async () => {
    await CTEEscape.init();
});
