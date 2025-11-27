// --- CTE Esport Map 核心逻辑 (v5.1 Mobile Fix) ---
// 更新内容：修复移动端 100vh 溢出问题

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
        
        // 1. 注入开关按钮
        this.injectToggleButton();
        
        // 2. 加载设置
        this.loadSettings();
        
        // 3. 加载 HTML
        await this.loadHTML();
        
        // 4. 绑定事件
        if (this.panelLoaded) {
            this.bindEvents();
            this.enablePinDragging();
            this.applyTheme(this.settings.theme);
            
            // 🔧 新增：初始化移动端视口修复
            this.initMobileViewportFix();
            
            console.log("✅ [CTE Esport] 初始化成功。");
        }
    },

    // 🔧 新增：移动端视口高度修复
    initMobileViewportFix() {
        const panel = document.getElementById("cte-esport-panel");
        if (!panel) return;

        const updatePanelHeight = () => {
            // 使用 window.innerHeight 获取真实可视高度
            const realHeight = window.innerHeight;
            panel.style.setProperty('--cte-panel-height', `${realHeight}px`);
            
            // 同时更新 CSS 变量到 root
            const root = document.getElementById("cte-esport-root");
            if (root) {
                root.style.setProperty('--cte-real-vh', `${realHeight * 0.01}px`);
            }
        };

        // 初始设置
        updatePanelHeight();

        // 监听 resize 和 orientationchange
        window.addEventListener('resize', updatePanelHeight);
        window.addEventListener('orientationchange', () => {
            // orientationchange 后需要延迟执行，等待浏览器完成重排
            setTimeout(updatePanelHeight, 100);
        });

        // 🔧 iOS Safari 特殊处理：监听滚动导致的地址栏变化
        let lastHeight = window.innerHeight;
        const checkHeightChange = () => {
            if (window.innerHeight !== lastHeight) {
                lastHeight = window.innerHeight;
                updatePanelHeight();
            }
        };
        
        // 使用 requestAnimationFrame 轮询检测（仅在面板可见时）
        const pollHeight = () => {
            const panel = document.getElementById("cte-esport-panel");
            if (panel && window.getComputedStyle(panel).display !== 'none') {
                checkHeightChange();
            }
            requestAnimationFrame(pollHeight);
        };
        
        // 启动轮询（对性能影响很小）
        requestAnimationFrame(pollHeight);
    },

    injectToggleButton() {
        if (document.getElementById("cte-esport-toggle-btn")) return;

        const btn = document.createElement("div");
        btn.id = "cte-esport-toggle-btn";
        btn.innerHTML = "🏆"; 
        btn.title = "打开 CTE 战队地图";
        
        // 🔧 修复：移动端按钮位置调整
        btn.style.cssText = `
            position: fixed; 
            top: 10px; 
            right: 10px; 
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
            background: rgba(0,0,0,0.5);
            border-radius: 50%;
            -webkit-tap-highlight-color: transparent;
        `;
        
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
        
        btn.addEventListener("mouseover", () => btn.style.transform = "scale(1.1)");
        btn.addEventListener("mouseout", () => btn.style.transform = "scale(1)");
        
        // 🔧 触摸设备支持
        btn.addEventListener("touchstart", () => btn.style.transform = "scale(1.1)", { passive: true });
        btn.addEventListener("touchend", () => btn.style.transform = "scale(1)", { passive: true });
        
        document.body.appendChild(btn);
        
        // 🔧 检测 SillyTavern 布局，动态调整按钮位置
        this.adjustToggleButtonPosition(btn);
    },

    // 🔧 新增：根据 SillyTavern 布局调整按钮位置
    adjustToggleButtonPosition(btn) {
        // 检查是否有右侧面板
        const rightPanel = document.getElementById("right-nav-panel") || 
                          document.querySelector(".right-nav-panel") ||
                          document.querySelector("#sheld");
        
        if (rightPanel) {
            const rightPanelWidth = rightPanel.offsetWidth || 340;
            btn.style.right = `${rightPanelWidth + 10}px`;
        }
        
        // 监听窗口变化重新调整
        const resizeObserver = new ResizeObserver(() => {
            if (rightPanel && rightPanel.offsetWidth > 0) {
                btn.style.right = `${rightPanel.offsetWidth + 10}px`;
            }
        });
        
        if (rightPanel) {
            resizeObserver.observe(rightPanel);
        }
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
            // 🔧 打开前先更新高度
            const realHeight = window.innerHeight;
            panel.style.setProperty('--cte-panel-height', `${realHeight}px`);
            
            panel.style.display = "flex";
            panel.style.opacity = "0";
            
            // 🔧 强制重排后再显示，确保尺寸正确
            requestAnimationFrame(() => {
                panel.style.opacity = "1"; 
                panel.style.transition = "opacity 0.2s"; 
            });
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

        // 🔧 同时支持鼠标和触摸事件
        const getEventPos = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        const onStart = (e) => {
            const pin = e.target.closest(".cte-esport-pin");
            if (!pin) return;

            e.preventDefault();
            activePin = pin;
            hasMoved = false;
            
            const pos = getEventPos(e);
            startX = pos.x;
            startY = pos.y;
            startLeft = parseInt(activePin.style.left || 0);
            startTop = parseInt(activePin.style.top || 0);

            activePin.classList.add("dragging");
            
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onEnd);
            document.addEventListener("touchmove", onMove, { passive: false });
            document.addEventListener("touchend", onEnd);
        };

        const onMove = (e) => {
            if (!activePin) return;
            
            const pos = getEventPos(e);
            const dx = pos.x - startX;
            const dy = pos.y - startY;

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

        const onEnd = () => {
            if (activePin) {
                activePin.classList.remove("dragging");
                activePin = null;
            }
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onEnd);
            document.removeEventListener("touchmove", onMove);
            document.removeEventListener("touchend", onEnd);
            
            setTimeout(() => {
                this.isDraggingPin = false;
            }, 50);
        };

        // 绑定鼠标和触摸事件
        mapCanvas.addEventListener("mousedown", onStart);
        mapCanvas.addEventListener("touchstart", onStart, { passive: false });
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
