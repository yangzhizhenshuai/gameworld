document.addEventListener('DOMContentLoaded', () => {
    // Default API configurations
    const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
    const DEFAULT_API_KEY = 'sk-47cf617a468e407a9d69fc4cd7433ded';

    // DOM Elements
    const newDialogueBtn = document.getElementById('new-dialogue-btn');
    const apiConfigBtn = document.getElementById('api-config-btn');
    const memoryEditor = document.getElementById('memory-editor');
    const saveMemoryBtn = document.getElementById('save-memory-btn');
    const importMemoryInput = document.getElementById('import-memory-input');
    const importMemoryBtn = document.getElementById('import-memory-btn');
    const exportMemoryBtn = document.getElementById('export-memory-btn');
    const dialogueContainer = document.getElementById('dialogue-container');
    const memoryUpdateSuggestionContainer = document.getElementById('memory-update-suggestion-container');
    const memoryDiffView = document.getElementById('memory-diff-view');
    const replaceMemoryBtn = document.getElementById('replace-memory-btn');
    const copySuggestionBtn = document.getElementById('copy-suggestion-btn');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const updateMemoryBtn = document.getElementById('update-memory-btn');
    const apiConfigModal = document.getElementById('api-config-modal');
    const closeApiModalBtn = document.getElementById('close-api-modal');
    const baseUrlInput = document.getElementById('base-url-input');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiConfigBtn = document.getElementById('save-api-config-btn');

    let currentDialogue = []; // Stores { role: 'user'/'assistant', content: 'message' }
    let assistantSystemContent = '';

    // --- API Configuration --- //
    function loadApiConfig() {
        const storedBaseUrl = localStorage.getItem('apiBaseUrl') || DEFAULT_BASE_URL;
        const storedApiKey = localStorage.getItem('apiKey') || DEFAULT_API_KEY;
        baseUrlInput.value = storedBaseUrl;
        apiKeyInput.value = storedApiKey;
    }

    function saveApiConfig() {
        localStorage.setItem('apiBaseUrl', baseUrlInput.value.trim());
        localStorage.setItem('apiKey', apiKeyInput.value.trim());
        alert('API 配置已保存！');
        apiConfigModal.style.display = 'none';
    }

    apiConfigBtn.addEventListener('click', () => {
        loadApiConfig();
        apiConfigModal.style.display = 'block';
    });
    closeApiModalBtn.addEventListener('click', () => apiConfigModal.style.display = 'none');
    saveApiConfigBtn.addEventListener('click', saveApiConfig);
    window.addEventListener('click', (event) => {
        if (event.target === apiConfigModal) {
            apiConfigModal.style.display = 'none';
        }
    });

    // --- Memory Management (记忆.md) --- //
    function loadMemory() {
        const savedMemory = localStorage.getItem('memoryMdContent');
        if (savedMemory) {
            memoryEditor.value = savedMemory;
        } else {
            // Load default 记忆.md if available, otherwise empty
            fetch('记忆.md')
                .then(response => response.ok ? response.text() : Promise.resolve('')) // Handle if file not found
                .then(text => {
                    memoryEditor.value = text;
                    localStorage.setItem('memoryMdContent', text); // Save initial content
                })
                .catch(error => {
                    console.error('无法加载默认记忆.md:', error);
                    memoryEditor.value = '# 用户记忆\n\n- 初始记忆内容。'; // Fallback default
                    localStorage.setItem('memoryMdContent', memoryEditor.value);
                });
        }
    }

    function saveMemory() {
        const memoryContent = memoryEditor.value;
        localStorage.setItem('memoryMdContent', memoryContent);
        alert('记忆已保存到 localStorage！');
    }
    saveMemoryBtn.addEventListener('click', saveMemory);

    importMemoryBtn.addEventListener('click', () => importMemoryInput.click());
    importMemoryInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                memoryEditor.value = e.target.result;
                saveMemory(); // Optionally save after import
                alert('记忆已导入！');
            };
            reader.readAsText(file);
            importMemoryInput.value = ''; // Reset file input
        }
    });

    exportMemoryBtn.addEventListener('click', () => {
        const memoryContent = memoryEditor.value;
        const blob = new Blob([memoryContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '记忆.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('记忆已导出为 记忆.md！');
    });

    // --- Load assistant System Content --- //
    function loadAssistantSystem() {
        fetch('导师系统.md')
            .then(response => response.ok ? response.text() : Promise.resolve(''))
            .then(text => {
                assistantSystemContent = text;
                if (!text) console.warn('导师系统.md 为空或未找到。');
            })
            .catch(error => console.error('无法加载导师系统.md:', error));
    }

    // --- Dialogue Management --- // 
    function addMessageToDialogue(role, content, isAssistant = false) {
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');
        messageBubble.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        
        if (isAssistant) {
            // Potentially parse markdown or add assistant name later
            // For now, just simple text, can be enhanced for multiple assistants
            const assistantName = ""; // Placeholder, can be dynamic
            messageBubble.innerHTML = `<strong>${assistantName}:</strong> ${content.replace(/\n/g, '<br>')}`;
        } else {
            messageBubble.textContent = content;
        }
        
        dialogueContainer.appendChild(messageBubble);
        dialogueContainer.scrollTop = dialogueContainer.scrollHeight; // Scroll to bottom
        currentDialogue.push({ role, content });
        saveCurrentDialogue();
    }

    sendMessageBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    });

    async function handleSendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessageToDialogue('user', message);
        chatInput.value = '';
        chatInput.focus();

        // Simulate LLM call
        try {
            const response = await callLLM_AssistantResponse(message);
            // 不再需要这行，因为在流式处理中已经创建和更新了消息气泡
            // addMessageToDialogue('assistant', response, true);
        } catch (error) {
            console.error('LLM Call failed:', error);
            addMessageToDialogue('assistant', '抱歉，我现在无法回复。错误：' + error.message, true);
        }
    }

    newDialogueBtn.addEventListener('click', () => {
        if (confirm('确定要开始新的对话吗？当前对话记录将被清除。')) {
            dialogueContainer.innerHTML = '';
            currentDialogue = [];
            localStorage.removeItem('currentDialogue'); // Clear saved dialogue
            // Optionally clear memory update suggestion area
            memoryUpdateSuggestionContainer.style.display = 'none';
            memoryDiffView.innerHTML = '';
            alert('新的对话已开始。');
        }
    });

    function saveCurrentDialogue() {
        localStorage.setItem('currentDialogue', JSON.stringify(currentDialogue));
    }

    function loadCurrentDialogue() {
        const saved = localStorage.getItem('currentDialogue');
        if (saved) {
            currentDialogue = JSON.parse(saved);
            currentDialogue.forEach(msg => {
                // Need to differentiate if it was an assistant message for proper rendering
                // This simple load assumes all 'assistant' messages were from the assistant logic.
                addMessageToDialogue(msg.role, msg.content, msg.role === 'assistant'); 
            });
        }
    }

    // --- LLM Interaction (Placeholders) --- //
    async function callLLM_AssistantResponse(userMessage) {
        // This is a placeholder for the actual API call
        console.log('Simulating LLM call for assistant response...');
        const apiKey = localStorage.getItem('apiKey') || DEFAULT_API_KEY;
        const baseUrl = localStorage.getItem('apiBaseUrl') || DEFAULT_BASE_URL;

        if (!apiKey || !baseUrl) {
            throw new Error('API Key 或 Base URL 未配置。');
        }

        const memoryContent = memoryEditor.value;
        
        // Construct messages for the LLM
        const messages = [
            { 
                role: "system", 
                content: `# 目标

这是一个人生方向探讨会，让以下{人物} 围绕你的议题，对未来进行讨论

# 工作流

1. 人物之间互相对话探讨，启发思路
2. 在你回答问题时，发现有些观点能够对我最近思考的问题有所启发时，如果可以进行引导式提问

# 自我记忆

${memoryContent}

# 要求

1. 逻辑明确：结构清晰易解析
2. 启发性：角度刁钻
3. 具体：明确内容，不模糊
4. 每个人都需要发言
5. 严格根据自我记忆进行发言，谈及我的不要超出记忆范围

# 人物

1. 李笑来
将认知科学应用于个人成长

2. 查理芒格
多元思维模型的倡导者，强调跨学科思考

3. 罗永浩
言语犀利，有批判性

4. 马斯克
第一性原理

5. 苏格拉底
问答式教学法，启发式对话

6. 杰伊·福雷斯特
系统动力学之父，他的反馈环理论能完善你对系统变化的理解

7. 镜像的我
你是我，请你读取记忆中的对话，作为一个AI版的我来跟我对话。`
            },
            // Include recent dialogue history if applicable, adjust as needed
            ...currentDialogue.slice(-5).map(msg => ({ role: msg.role, content: msg.content })), 
            { role: "user", content: userMessage }
        ];

        console.log("Sending to LLM:", messages);
        console.log("Using Base URL:", baseUrl, "ApiKey:", apiKey.substring(0, 7) + "...");

        // 创建消息气泡但内容为空，准备接收流式内容
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble', 'assistant-message');
        messageBubble.innerHTML = '<strong></strong> <span class="streaming-content"></span>';
        dialogueContainer.appendChild(messageBubble);
        const streamingContent = messageBubble.querySelector('.streaming-content');
        dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
        
        try {
            // 设置流式输出
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: messages,
                    max_tokens: 1024,
                    temperature: 0.7,
                    stream: true // 启用流式输出
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('LLM API Error:', errorData);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let accumulatedContent = "";
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码二进制数据
                const chunk = decoder.decode(value, { stream: true });
                
                // 处理 SSE 格式的数据
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const content = data.choices[0]?.delta?.content || '';
                            if (content) {
                                accumulatedContent += content;
                                streamingContent.innerHTML += content.replace(/\n/g, '<br>');
                                dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e, line);
                        }
                    }
                }
            }
            
            // 保存对话记录
            currentDialogue.push({ role: 'assistant', content: accumulatedContent });
            saveCurrentDialogue();
            
            return accumulatedContent;
        } catch (error) {
            console.error('Error during streaming:', error);
            messageBubble.innerHTML = `<strong>错误:</strong> ${error.message}`;
            throw error;
        }
    }

    updateMemoryBtn.addEventListener('click', async () => {
        if (currentDialogue.length === 0) {
            alert('当前没有对话内容可用于更新记忆。');
            return;
        }

        memoryUpdateSuggestionContainer.style.display = 'block';
        memoryDiffView.innerHTML = '正在生成记忆更新建议...';
        replaceMemoryBtn.disabled = true;
        copySuggestionBtn.disabled = true;

        try {
            const suggestedMemory = await callLLM_SuggestMemoryUpdate();
            // For now, just show the suggested memory. Diffing will be complex.
            // Simple display, not actual diff:
            const originalMemory = memoryEditor.value;
            memoryDiffView.innerHTML = 
                `<strong>旧记忆:</strong><pre>${escapeHtml(originalMemory)}</pre><hr>` +
                `<strong>建议新记忆:</strong><pre>${escapeHtml(suggestedMemory)}</pre>`;
            
            // Store suggested memory temporarily for one-click replace
            memoryDiffView.dataset.suggestedMemory = suggestedMemory;

            replaceMemoryBtn.disabled = false;
            copySuggestionBtn.disabled = false;

        } catch (error) {
            console.error('Memory update suggestion failed:', error);
            memoryDiffView.innerHTML = `生成建议失败: ${error.message}`;
        }
    });

    replaceMemoryBtn.addEventListener('click', () => {
        const suggestedMemory = memoryDiffView.dataset.suggestedMemory;
        if (suggestedMemory) {
            memoryEditor.value = suggestedMemory;
            saveMemory();
            alert('记忆已更新并保存！');
            memoryUpdateSuggestionContainer.style.display = 'none';
        } else {
            alert('没有可替换的建议内容。');
        }
    });

    copySuggestionBtn.addEventListener('click', () => {
        const suggestedMemory = memoryDiffView.dataset.suggestedMemory;
        if (suggestedMemory) {
            navigator.clipboard.writeText(suggestedMemory)
                .then(() => alert('建议内容已复制到剪贴板！'))
                .catch(err => alert('复制失败: ' + err));
        } else {
            alert('没有可复制的建议内容。');
        }
    });

    async function callLLM_SuggestMemoryUpdate() {
        // Placeholder for LLM call to suggest memory updates
        console.log('Simulating LLM call for memory update suggestion...');
        const apiKey = localStorage.getItem('apiKey') || DEFAULT_API_KEY;
        const baseUrl = localStorage.getItem('apiBaseUrl') || DEFAULT_BASE_URL;

        if (!apiKey || !baseUrl) {
            throw new Error('API Key 或 Base URL 未配置。');
        }

        const currentMemory = memoryEditor.value;
        const dialogueHistoryText = currentDialogue.map(msg => `${msg.role}: ${msg.content}`).join('\n');

        const messages = [
            { role: "system", content: "你是一个专业的助理，擅长根据对话历史和现有记忆，总结并更新记忆内容。请返回完整的、建议更新后的记忆.md内容。如果内容有变化，请尽量保持原有格式，并指出关键的增删改。" },
            { role: "user", content: `这是当前的记忆.md内容：\n\n---\n${currentMemory}\n---\n\n这是最近的对话历史：\n\n---\n${dialogueHistoryText}\n---\n\n请根据以上信息，提供更新后的完整记忆.md内容。` }
        ];
        
        console.log("Sending to LLM for memory update:", messages);

        // 开始流式处理
        memoryDiffView.innerHTML = '正在生成建议...';
        let accumulatedContent = "";

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: messages,
                    max_tokens: 1024,
                    temperature: 0.7,
                    stream: true // 启用流式输出
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('LLM API Error:', errorData);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            
            // 创建临时显示容器
            memoryDiffView.innerHTML = '<div class="streaming-memory-update"></div>';
            const streamingDisplay = memoryDiffView.querySelector('.streaming-memory-update');
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码二进制数据
                const chunk = decoder.decode(value, { stream: true });
                
                // 处理 SSE 格式的数据
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const content = data.choices[0]?.delta?.content || '';
                            if (content) {
                                accumulatedContent += content;
                                streamingDisplay.innerHTML = escapeHtml(accumulatedContent).replace(/\n/g, '<br>');
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e, line);
                        }
                    }
                }
            }
            
            // 完成后显示对比视图
            const originalMemory = memoryEditor.value;
            memoryDiffView.innerHTML = 
                `<strong>旧记忆:</strong><pre>${escapeHtml(originalMemory)}</pre><hr>` +
                `<strong>建议新记忆:</strong><pre>${escapeHtml(accumulatedContent)}</pre>`;
            
            // 存储建议内容以便一键替换
            memoryDiffView.dataset.suggestedMemory = accumulatedContent;
            return accumulatedContent;
            
        } catch (error) {
            console.error('Memory update suggestion failed:', error);
            memoryDiffView.innerHTML = `生成建议失败: ${error.message}`;
            throw error;
        }
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    // --- Initialization --- //
    loadApiConfig(); // Load API config first as it might be needed by other functions
    loadMemory();
    loadAssistantSystem();
    loadCurrentDialogue();
}); 