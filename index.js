import { extension_settings, getContext } from "../../../extensions.js";
import { loadExtensionSettings, saveExtensionSettings } from "../../../extensions.js";

const extensionName = "cte-esport-map";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Core Logic Controller
const CTEMap = {
    settings: {
        theme: 0, // 0: Dark, 1: Blue, 2: Pink
    },
    
    // Initialize the extension
    async init() {
        console.log("[CTE Map] Initializing...");
        
        // Load UI
        await this.loadHTML();
        await this.loadSettings();
        
        // Inject Toggle Button into ST
        this.injectToggleButton();
        
        // Bind Events
        this.bindEvents();
        
        // Apply Initial Theme
        this.applyTheme(this.settings.theme);
        
        console.log("[CTE Map] Ready.");
    },

    async loadHTML() {
        try {
            const response = await fetch(`${extensionFolderPath}/map.html`);
            if (!response.ok) throw new Error("Failed to load map.html");
            const html = await response.text();
            
            // Inject panel into body
            const div = document.createElement("div");
            div.innerHTML = html;
            document.body.appendChild(div.firstElementChild);
        } catch (e) {
            console.error("[CTE Map] HTML Load Error:", e);
        }
    },

    injectToggleButton() {
        // Find a suitable place in ST UI to add the button (e.g., Top Bar)
        const btn = document.createElement("div");
        btn.id = "cte-toggle-btn";
        btn.innerHTML = "🗺️";
        btn.title = "打开CTE战队地图";
        btn.style.cssText = `
            position: fixed; top: 10px; right: 280px; z-index: 2001; 
            font-size: 24px; cursor: pointer; filter: drop-shadow(0 0 2px black);
        `;
        btn.onclick = () => this.togglePanel();
        document.body.appendChild(btn);
    },

    togglePanel() {
        const panel = document.getElementById("cte-root-panel");
        if (panel) {
            panel.style.display = panel.style.display === "flex" ? "none" : "flex";
        }
    },

    bindEvents() {
        const panel = document.getElementById("cte-root-panel");
        if (!panel) return;

        // 1. Close Button
        panel.querySelector("#cte-close-main").addEventListener("click", () => {
            panel.style.display = "none";
        });

        // 2. Theme Toggle
        panel.querySelector("#cte-theme-toggle").addEventListener("click", () => {
            this.settings.theme = (this.settings.theme + 1) % 3;
            this.applyTheme(this.settings.theme);
            this.saveSettings();
        });

        // 3. Pin Clicks (Delegation)
        panel.querySelector("#cte-map-bg").addEventListener("click", (e) => {
            const pin = e.target.closest(".cte-pin");
            if (pin) {
                const popupId = pin.getAttribute("data-popup");
                this.showPopup(popupId);
            }
        });

        // 4. Popup Close Buttons
        panel.querySelectorAll(".cte-close-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                btn.closest(".cte-popup").classList.remove("active");
            });
        });

        // 5. Travel Actions (Go To...)
        panel.addEventListener("click", (e) => {
            // Handle Direct Travel Buttons
            if (e.target.matches("[data-travel]")) {
                const dest = e.target.getAttribute("data-travel");
                this.handleTravel(dest);
            }
            // Handle Interior Button
            if (e.target.matches('[data-action="show-interior"]')) {
                this.showPopup("popup-cte-interior");
            }
            // Handle Back Button
            if (e.target.matches('[data-action="back-to-cte"]')) {
                this.showPopup("popup-cte");
            }
            // Handle Floor Toggles
            const floorBtn = e.target.closest(".cte-floor-btn");
            if (floorBtn) {
                this.toggleFloor(floorBtn);
            }
        });

        // 6. Custom Travel
        const customBtn = document.getElementById("cte-custom-go");
        if (customBtn) {
            customBtn.addEventListener("click", () => {
                const input = document.getElementById("cte-custom-input");
                if (input.value.trim()) {
                    this.handleTravel(input.value.trim());
                    input.value = "";
                }
            });
        }
    },

    showPopup(id) {
        // Hide all popups first
        document.querySelectorAll(".cte-popup").forEach(p => p.classList.remove("active"));
        const target = document.getElementById(id);
        if (target) {
            target.classList.add("active");
        }
    },

    toggleFloor(btn) {
        const targetId = btn.getAttribute("data-target");
        const panel = document.getElementById(targetId);
        
        // Close others
        document.querySelectorAll(".cte-floor-panel").forEach(p => {
            if (p.id !== targetId) p.style.display = "none";
        });
        document.querySelectorAll(".cte-floor-btn").forEach(b => {
            if (b !== btn) b.classList.remove("active");
        });

        // Toggle current
        if (panel.style.display === "block") {
            panel.style.display = "none";
            btn.classList.remove("active");
        } else {
            panel.style.display = "block";
            btn.classList.add("active");
        }
    },

    handleTravel(destination) {
        // 1. Close UI
        this.togglePanel();

        // 2. Interact with SillyTavern
        const context = getContext();
        const userName = context.name2 || "我"; // Current User Name
        
        // Option A: Send command to chat input
        // const command = `/setinput ${userName}前往了${destination}，并观察周围的环境。`;
        
        // Option B: Directly trigger generation (Immersive)
        const prompt = `\n[系统提示: ${userName} 移动到了 ${destination}。请描述新的场景和环境。]`;
        
        // Use ST API to insert prompt or input
        if (context.chat && context.chat.length > 0) {
            // Using jQuery API commonly available in ST extensions or direct Input manipulation
            const textarea = document.getElementById('send_textarea');
            if (textarea) {
                textarea.value = `[前往地点：${destination}]`;
                // Trigger input event to resize/notify ST
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        
        console.log(`[CTE Map] Traveling to ${destination}`);
        toastr.info(`正在前往：${destination}`);
    },

    applyTheme(themeIndex) {
        const root = document.getElementById("cte-root-panel");
        if (!root) return;

        if (themeIndex === 0) { // Black Gold (Default)
            root.style.setProperty('--cte-bg-dark', '#121212');
            root.style.setProperty('--cte-panel-bg', '#1e1e1e');
            root.style.setProperty('--cte-accent-gold', '#c5a065');
            root.style.setProperty('--cte-text-main', '#e0e0e0');
        } else if (themeIndex === 1) { // Blue White
            root.style.setProperty('--cte-bg-dark', '#f4f7f6');
            root.style.setProperty('--cte-panel-bg', '#ffffff');
            root.style.setProperty('--cte-accent-gold', '#5d9cec');
            root.style.setProperty('--cte-text-main', '#333');
        } else if (themeIndex === 2) { // Pink White
            root.style.setProperty('--cte-bg-dark', '#fff0f3');
            root.style.setProperty('--cte-panel-bg', '#ffffff');
            root.style.setProperty('--cte-accent-gold', '#f06292');
            root.style.setProperty('--cte-text-main', '#4a2c36');
        }
    },

    async loadSettings() {
        // Mock setting load if direct ST extension API isn't fully exposed, 
        // or use localStorage as per requirement
        const data = localStorage.getItem("cte-map-settings");
        if (data) {
            this.settings = JSON.parse(data);
        }
    },

    saveSettings() {
        localStorage.setItem("cte-map-settings", JSON.stringify(this.settings));
    }
};

// Start
jQuery(async () => {
    await CTEMap.init();
});
