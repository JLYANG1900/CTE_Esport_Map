// --- CTE Esport Map 核心逻辑 (v5.1) ---
// 修复：移动端面板上浮问题 - 使用 JS 动态定位

const extensionName = "cte-esport-map";
const defaultMapBg = "https://files.catbox.moe/b6p3mq.png";

const CTEEscape = {
    settings: {
        theme: 0, 
    },
    panelLoaded: false,
    currentDestination: null,
    isDraggingPin: false,

    async init() {
        console.log("🏆 [CTE Esport] 插件正在启动...");
        
        this.injectToggleButton();
        this.loadSettings();
        await this.loadHTML();
        
        if (this.panelLoaded) {
            this.bindEvents();
            this.enablePinDragging();
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

    // 🔧 核心修复：使用 JS 动态计算面板位置
    fixPanelPosition(panel) {
        const isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
        
        if (isMobile) {
            // 移动端：使用 window.innerHeight 计算真实可视区域
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            const padding = 10;
            
            const panelWidth = vw - padding * 2;
            const panelHeight = vh - padding * 2;
            
            // 直接设置像素值，覆盖 CSS
            panel.style.top = padding + 'px';
            panel.style.left = padding + 'px';
            panel.style.right = padding + 'px';
            panel.style.bottom = padding + 'px';
            panel.style.width = panelWidth + 'px';
            panel.style.height = panelHeight + 'px';
            panel.style.maxWidth = 'none';
            panel.style.maxHeight = 'none';
            panel.style.transform = 'none';
        } else {
            // 桌面端：恢复 CSS 默认样式
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.width = '90vh';
            panel.style.height = '90vh';
            panel.style.maxWidth = '900px';
            panel.style.maxHeight = '900px';
            panel.style.transform = 'translate(-50%, -50%)';
        }
    },

    togglePanel() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;

        const currentDisplay = window.getComputedStyle(panel).display;
        if (currentDisplay === "none") {
            // 🔧 打开前先修复位置
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

    prepareTravel(destination) {
        this.currentDestination = destination;
        const modalTitle = document.getElementById("cte-travel-dest-name");
        if(modalTitle) modalTitle.innerText = destination;
        
        this.showPopup("cte-travel-modal");
    },

    executeTravel(companionName = null) {
        this.togglePanel();
        
        const destination = this.currentDestination;
        const userPlaceholder = "{{user}}"; 
        
        let outputText = "";
        
        if (companionName) {
            outputText = `${userPlaceholder} 邀请 ${companionName} 前往 ${destination}`;
        } else {
            outputText = `${userPlaceholder} 决定独自前往${destination}。`;
        }

        const textarea = document.getElementById('send_textarea');
        if (textarea) {
            textarea.value = outputText;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.focus();
        }

        if (typeof toastr !== 'undefined') {
            toastr.success(`已设置出发指令: ${destination}`);
        }
        
        this.currentDestination = null;
        const companionInput = document.getElementById("cte-companion-input");
        if(companionInput) companionInput.value = "";
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
            
            setTimeout(() => {
                this.isDraggingPin = false;
            }, 50);
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
        if (uploadInput) {
            uploadInput.addEventListener("change", (e) => this.handleMapUpload(e));
        }

        const resetBtn = document.getElementById("cte-btn-reset-bg");
        if (resetBtn) {
            resetBtn.onclick = () => this.handleResetBackground();
        }

        const mapCanvas = panel.querySelector("#cte-map-canvas");
        if(mapCanvas) {
            mapCanvas.onclick = (e) => {
                if (this.isDraggingPin) {
                    e.stopPropagation();
                    return;
                }

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

        const customBtn = document.getElementById("cte-btn-custom-go");
        if (customBtn) {
            customBtn.onclick = () => {
                const input = document.getElementById("cte-custom-input");
                if (input && input.value.trim()) this.prepareTravel(input.value.trim());
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
