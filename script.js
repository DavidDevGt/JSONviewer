
new Vue({
    el: '#jsonEditorApp',
    data: {
        jsonInput: '',
        error: null,
        formattedJSON: '',
        mode: 'light',
        showSuccess: false,
        successMessage: '',
        treeView: false,
        jsonTree: '',
        history: [],
        historyIndex: -1,
        maxHistory: 50,
        debounceTimeout: null,
        autoSave: true,
        lastSaved: null
    },
    computed: {
        modeButtonText() {
            return this.mode === 'light' ? 'Switch to Dark Realm' : 'Return to Light Realm';
        },
        lineCount() {
            return this.jsonInput.split('\n').length;
        },
        fileSize() {
            const bytes = new Blob([this.jsonInput]).size;
            return this.formatBytes(bytes);
        }
    },
    watch: {
        mode(newVal) {
            document.body.className = newVal;
            this.saveSettings();
        },
        jsonInput: {
            handler: function(newVal, oldVal) {
                if (newVal !== oldVal && this.debounceTimeout) {
                    clearTimeout(this.debounceTimeout);
                }
                
                this.debounceTimeout = setTimeout(() => {
                    this.validateJSON();
                    if (this.autoSave) {
                        this.saveToHistory();
                    }
                }, 300);
            },
            immediate: false
        }
    },
    methods: {
        // Core JSON Operations
        validateJSON() {
            if (!this.jsonInput.trim()) {
                this.error = null;
                this.formattedJSON = '';
                this.jsonTree = '';
                return;
            }

            try {
                const parsed = JSON.parse(this.jsonInput);
                this.error = null;
                
                // Auto-format if valid
                if (this.jsonInput.trim() && this.isValidJsonString(this.jsonInput)) {
                    this.updateFormattedOutput(parsed);
                }
            } catch (err) {
                // Enhanced error message with position information
                const match = err.message.match(/position (\d+)/i);
                let errorPosition = match ? parseInt(match[1]) : null;
                let errorContext = '';
                
                if (errorPosition !== null) {
                    const start = Math.max(0, errorPosition - 10);
                    const end = Math.min(this.jsonInput.length, errorPosition + 10);
                    errorContext = `...${this.jsonInput.substring(start, errorPosition)}⟨ERROR⟩${this.jsonInput.substring(errorPosition, end)}...`;
                }
                
                this.error = `Invalid JSON: ${err.message}${errorContext ? '\n' + errorContext : ''}`;
                this.formattedJSON = '';
                this.jsonTree = '';
            }
        },

        formatJSON() {
            try {
                const parsed = JSON.parse(this.jsonInput);
                this.formattedJSON = this.syntaxHighlight(JSON.stringify(parsed, null, 2));
                this.updateJsonTree(parsed);
                this.error = null;
                this.showSuccessMessage('✨ JSON spell successfully formatted!');
                this.saveToHistory();
            } catch (err) {
                this.error = `Formatting failed: ${err.message}`;
                this.showSuccessMessage('❌ Spell casting failed!', 'error');
            }
        },

        minimizeJSON() {
            try {
                const parsed = JSON.parse(this.jsonInput);
                this.formattedJSON = JSON.stringify(parsed);
                this.updateJsonTree(parsed);
                this.error = null;
                this.showSuccessMessage('⚡ JSON compressed to minimal form!');
            } catch (err) {
                this.error = `Compression failed: ${err.message}`;
                this.showSuccessMessage('❌ Compression spell failed!', 'error');
            }
        },

        updateFormattedOutput(parsed) {
            this.formattedJSON = this.syntaxHighlight(JSON.stringify(parsed, null, 2));
            this.updateJsonTree(parsed);
        },

        // Enhanced Copy Functionality
        async copyOutput() {
            if (!this.formattedJSON) {
                this.showSuccessMessage('❌ No loot to copy!', 'error');
                return;
            }

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(this.formattedJSON);
                } else {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = this.formattedJSON;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-999999px';
                    textarea.style.top = '-999999px';
                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                }
                this.showSuccessMessage('📋 Loot copied to inventory!');
            } catch (err) {
                this.showSuccessMessage('❌ Failed to copy loot!', 'error');
            }
        },

        // Clear with confirmation
        clearAll() {
            if (this.jsonInput.trim() && !confirm('🔥 Are you sure you want to reset your quest? This will clear all your progress!')) {
                return;
            }
            
            this.jsonInput = '';
            this.formattedJSON = '';
            this.jsonTree = '';
            this.error = null;
            this.showSuccessMessage('🆕 Quest reset! Ready for new adventures!');
        },

        // Sample Data Loader
        loadSample() {
            const samples = [
                {
                    name: "RPG Character",
                    data: {
                        character: {
                            name: "Aragorn the Brave",
                            class: "Warrior",
                            level: 45,
                            stats: {
                                strength: 18,
                                dexterity: 14,
                                intelligence: 12,
                                health: 100,
                                mana: 50
                            },
                            inventory: [
                                { item: "Legendary Sword", quantity: 1, enchanted: true },
                                { item: "Health Potion", quantity: 5, enchanted: false },
                                { item: "Magic Shield", quantity: 1, enchanted: true }
                            ],
                            location: {
                                world: "Middle Earth",
                                region: "Gondor",
                                coordinates: { x: 100, y: 200 }
                            },
                            isAlive: true,
                            lastLogin: "2024-05-27T10:30:00Z"
                        }
                    }
                },
                {
                    name: "Game Configuration",
                    data: {
                        gameSettings: {
                            title: "Epic RPG Adventure",
                            version: "2.1.0",
                            maxPlayers: 100,
                            serverSettings: {
                                host: "game.server.com",
                                port: 8080,
                                ssl: true,
                                regions: ["US", "EU", "ASIA"]
                            },
                            gameplaySettings: {
                                difficulty: "Hard",
                                pvpEnabled: true,
                                autoSave: true,
                                saveInterval: 300
                            },
                            features: ["multiplayer", "crafting", "trading", "guilds"]
                        }
                    }
                },
                {
                    name: "Quest Data",
                    data: {
                        quest: {
                            id: "Q001",
                            title: "The Dragon's Treasure",
                            description: "Defeat the ancient dragon and claim its legendary treasure",
                            difficulty: "Legendary",
                            rewards: {
                                experience: 5000,
                                gold: 1000,
                                items: ["Dragon Scale Armor", "Fire Resistance Ring"]
                            },
                            objectives: [
                                { id: 1, description: "Find the Dragon's Lair", completed: true },
                                { id: 2, description: "Defeat the Ancient Dragon", completed: false },
                                { id: 3, description: "Claim the Treasure", completed: false }
                            ],
                            timeLimit: null,
                            prerequisites: ["Level 40+", "Fire Resistance"],
                            isActive: true
                        }
                    }
                }
            ];

            const randomSample = samples[Math.floor(Math.random() * samples.length)];
            this.jsonInput = JSON.stringify(randomSample.data, null, 2);
            this.validateJSON();
            this.showSuccessMessage(`📚 Loaded sample: ${randomSample.name}`);
        },

        // Tree View Toggle
        toggleTreeView() {
            this.treeView = !this.treeView;
            if (this.treeView && this.formattedJSON) {
                try {
                    const parsed = JSON.parse(this.formattedJSON);
                    this.updateJsonTree(parsed);
                } catch (err) {
                    this.treeView = false;
                }
            }
        },

        // JSON Tree Generator
        updateJsonTree(obj) {
            this.jsonTree = this.generateTreeHTML(obj, 0);
        },
        
        // Syntax highlighting for JSON
        syntaxHighlight(json) {
            if (typeof json !== 'string') {
                json = JSON.stringify(json, null, 2);
            }
            
            // Replace HTML entities to prevent XSS
            json = this.escapeHtml(json);
            
            // Add syntax highlighting with regex
            return json.replace(/(\"|\'|\:|\{|\}|\[|\]|\,|\n|\t|\r)/g, (match) => {
                let cls = '';
                
                switch (match) {
                    case '"':
                    case "'":
                        cls = 'json-quote';
                        break;
                    case ':':
                        cls = 'json-colon';
                        break;
                    case '{':
                    case '}':
                    case '[':
                    case ']':
                        cls = 'json-bracket';
                        break;
                    case ',':
                        cls = 'json-comma';
                        break;
                    case '\n':
                    case '\t':
                    case '\r':
                        return match; // Don't style whitespace
                }
                
                return cls ? `<span class="${cls}">${match}</span>` : match;
            })
            // Style property names
            .replace(/\"([^\"]+)\"\s*:/g, '"<span class="json-key">$1</span>":')
            // Style string values
            .replace(/:\s*\"([^\"]*)\"/, ': "<span class="json-string">$1</span>"')
            // Style numbers
            .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
            // Style booleans and null
            .replace(/:\s*(true|false|null)/g, ': <span class="json-boolean">$1</span>');
        },

        generateTreeHTML(obj, depth) {
            const indent = '  '.repeat(depth);
            let html = '';

            if (obj === null) {
                return '<span class="json-null">null</span>';
            }

            if (typeof obj === 'string') {
                return `<span class="json-string">"${this.escapeHtml(obj)}"</span>`;
            }

            if (typeof obj === 'number') {
                return `<span class="json-number">${obj}</span>`;
            }

            if (typeof obj === 'boolean') {
                return `<span class="json-boolean">${obj}</span>`;
            }

            if (Array.isArray(obj)) {
                if (obj.length === 0) return '[]';
                
                html += '[\n';
                obj.forEach((item, index) => {
                    html += indent + '  ';
                    html += this.generateTreeHTML(item, depth + 1);
                    if (index < obj.length - 1) html += ',';
                    html += '\n';
                });
                html += indent + ']';
                return html;
            }

            if (typeof obj === 'object') {
                const keys = Object.keys(obj);
                if (keys.length === 0) return '{}';

                html += '{\n';
                keys.forEach((key, index) => {
                    html += indent + '  ';
                    html += `<span class="json-key">"${this.escapeHtml(key)}"</span>: `;
                    html += this.generateTreeHTML(obj[key], depth + 1);
                    if (index < keys.length - 1) html += ',';
                    html += '\n';
                });
                html += indent + '}';
                return html;
            }

            return String(obj);
        },

        // Utility Functions
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },

        isValidJsonString(str) {
            try {
                JSON.parse(str);
                return true;
            } catch {
                return false;
            }
        },

        // Theme and Settings
        toggleMode() {
            this.mode = this.mode === 'light' ? 'dark' : 'light';
            this.showSuccessMessage(
                this.mode === 'dark' 
                    ? '🌙 Entered the Dark Realm!' 
                    : '☀️ Returned to the Light Realm!'
            );
        },

        saveSettings() {
            const settings = {
                mode: this.mode,
                autoSave: this.autoSave,
                treeView: this.treeView
            };
            localStorage.setItem('rpgJsonEditorSettings', JSON.stringify(settings));
        },

        loadSettings() {
            const settings = localStorage.getItem('rpgJsonEditorSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.mode = parsed.mode || 'light';
                this.autoSave = parsed.autoSave !== undefined ? parsed.autoSave : true;
                this.treeView = parsed.treeView || false;
            }
        },

        // History Management
        saveToHistory() {
            if (this.jsonInput && this.jsonInput !== this.getLastHistoryItem()) {
                this.history.push({
                    content: this.jsonInput,
                    timestamp: new Date().toISOString()
                });

                if (this.history.length > this.maxHistory) {
                    this.history.shift();
                }

                this.historyIndex = this.history.length - 1;
            }
        },

        getLastHistoryItem() {
            return this.history.length > 0 ? this.history[this.history.length - 1].content : '';
        },

        // Enhanced Input Handling
        handleInput(event) {
            // Auto-completion for common JSON patterns
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const value = textarea.value;
            
            if (event.inputType === 'insertText') {
                const char = event.data;
                let autoComplete = '';
                
                switch (char) {
                    case '{':
                        autoComplete = '}';
                        break;
                    case '[':
                        autoComplete = ']';
                        break;
                    case '"':
                        if (cursorPos === 0 || value[cursorPos - 2] !== '\\') {
                            const beforeCursor = value.substring(0, cursorPos);
                            const openQuotes = (beforeCursor.match(/"/g) || []).length;
                            if (openQuotes % 2 === 1) {
                                autoComplete = '"';
                            }
                        }
                        break;
                }
                
                if (autoComplete) {
                    setTimeout(() => {
                        const newPos = cursorPos;
                        textarea.value = value.substring(0, cursorPos) + autoComplete + value.substring(cursorPos);
                        textarea.setSelectionRange(newPos, newPos);
                        this.jsonInput = textarea.value;
                    }, 0);
                }
            }
        },

        handleKeydown(event) {
            const textarea = event.target;
            
            // Tab key for indentation
            if (event.key === 'Tab') {
                event.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                
                if (event.shiftKey) {
                    // Shift+Tab: Remove indentation
                    const lines = value.substring(0, start).split('\n');
                    const currentLine = lines[lines.length - 1];
                    if (currentLine.startsWith('  ')) {
                        const newStart = start - 2;
                        textarea.value = value.substring(0, start - 2) + value.substring(start);
                        textarea.setSelectionRange(newStart, newStart);
                        this.jsonInput = textarea.value;
                    }
                } else {
                    // Tab: Add indentation
                    textarea.value = value.substring(0, start) + '  ' + value.substring(end);
                    textarea.setSelectionRange(start + 2, start + 2);
                    this.jsonInput = textarea.value;
                }
            }
            
            // Ctrl+Z for undo (basic implementation)
            if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.jsonInput = this.history[this.historyIndex].content;
                }
            }
            
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
                event.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.jsonInput = this.history[this.historyIndex].content;
                }
            }
        },

        // Success Message System
        showSuccessMessage(message, type = 'success') {
            this.successMessage = message;
            this.showSuccess = true;
            
            setTimeout(() => {
                this.showSuccess = false;
            }, 3000);
        }
    },

    // Lifecycle Hooks
    mounted() {
        this.loadSettings();
        document.body.className = this.mode;
        
        // Initialize with a welcome message
        setTimeout(() => {
            this.showSuccessMessage('🎮 Welcome to RPG JSON Quest Editor!');
        }, 500);

        // Add keyboard shortcuts info
        console.log(`
🎮 RPG JSON Quest Editor - Keyboard Shortcuts:
- Tab: Add indentation
- Shift+Tab: Remove indentation  
- Ctrl+Z: Undo
- Ctrl+Y: Redo
- Auto-completion for {}, [], and "" pairs
        `);
    },

    beforeDestroy() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }
});