/**
 * 正则替换可视化工具
 * 面向非技术用户的友好界面
 */

class RegexReplacer {
    constructor() {
        // 规则数据存储
        this.rules = [];

        // DOM元素引用
        this.elements = {
            mainText: document.getElementById('mainText'),
            rulesContainer: document.getElementById('rulesContainer'),
            parseBtn: document.getElementById('parseBtn'),
            copyBtn: document.getElementById('copyBtn'),
            generateBtn: document.getElementById('generateBtn'),
            clearRulesBtn: document.getElementById('clearRulesBtn'),
            addRuleBtn: document.getElementById('addRuleBtn'),
            loadExampleBtn: document.getElementById('loadExampleBtn'),
            toast: document.getElementById('toast')
        };

        // 示例数据
        this.exampleData = {
            text: `这是一段示例文本，用于演示正则替换功能。

(嗯|啊|呀|呢|呃|哎)[，。,.]? => 
(纸袋里|纸袋理) => 子代理
(浮沉|浮城) => 浮层
(typepe|type|taber) => tab
RP => RPA
引刀 => 影刀
徒生徒 => 图生图
纹身图 => 文生图`,
            rules: [
                { groups: [{ options: ['嗯', '啊', '呀', '呢', '呃', '哎'], suffix: '[，。,.]?' }], replacement: '' },
                { groups: [{ options: ['纸袋里', '纸袋理'], suffix: '' }], replacement: '子代理' },
                { groups: [{ options: ['浮沉', '浮城'], suffix: '' }], replacement: '浮层' },
                { groups: [{ options: ['typepe', 'type', 'taber'], suffix: '' }], replacement: 'tab' },
                { groups: [{ options: ['RP'], suffix: '' }], replacement: 'RPA' },
                { groups: [{ options: ['引刀'], suffix: '' }], replacement: '影刀' },
                { groups: [{ options: ['徒生徒'], suffix: '' }], replacement: '图生图' },
                { groups: [{ options: ['纹身图'], suffix: '' }], replacement: '文生图' }
            ]
        };

        // 拖拽状态
        this.dragState = {
            draggedElement: null,
            draggedIndex: -1
        };

        // 初始化
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromStorage();
        this.renderRules();
    }

    // 绑定事件
    bindEvents() {
        // 解析按钮
        this.elements.parseBtn.addEventListener('click', () => this.parseText());

        // 复制按钮
        this.elements.copyBtn.addEventListener('click', () => this.copyText());

        // 生成按钮
        this.elements.generateBtn.addEventListener('click', () => this.generateText());

        // 清空规则按钮
        this.elements.clearRulesBtn.addEventListener('click', () => this.clearRules());

        // 添加规则按钮
        this.elements.addRuleBtn.addEventListener('click', () => this.addRule());

        // 加载示例按钮
        this.elements.loadExampleBtn.addEventListener('click', () => this.loadExample());

        // 文本框自动保存
        this.elements.mainText.addEventListener('input',
            this.debounce(() => this.saveToStorage(), 500)
        );
    }

    // 解析文本中的规则
    parseText() {
        const text = this.elements.mainText.value.trim();
        if (!text) {
            this.showToast('请先输入文本内容', 'error');
            return;
        }

        const lines = text.split('\n');
        const newRules = [];
        let foundCount = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();
            // 支持 " => " 和 "=> " 和 " =>" 格式
            const match = trimmedLine.match(/^(.+?)\s*=>\s*(.*)$/);
            if (match) {
                const [, pattern, replacement] = match;
                const parsedRule = this.parsePattern(pattern.trim());
                parsedRule.replacement = replacement;
                newRules.push(parsedRule);
                foundCount++;
            }
        }

        if (foundCount === 0) {
            this.showToast('未找到有效的规则格式\n格式：匹配内容 => 替换内容', 'error');
            return;
        }

        // 清空原有规则，使用新解析的规则
        this.rules = newRules;
        this.renderRules();
        this.saveToStorage();
        this.showToast(`成功解析 ${foundCount} 条规则`, 'success');
    }

    // 解析匹配模式，识别(a|b|c)格式和组合
    parsePattern(pattern) {
        const result = {
            groups: [],  // 每个组是一个数组，包含多个选项
            suffix: '',  // 后缀（如 [，。,.]?）
            replacement: ''
        };

        // 检查是否有组合模式 (xxx)[suffix]
        const combinedMatch = pattern.match(/^(\([^)]+\))(\[[^\]]*\]\??)?$/);
        if (combinedMatch) {
            const groupContent = combinedMatch[1];
            result.suffix = combinedMatch[2] || '';

            // 解析组内容
            const innerMatch = groupContent.match(/^\((.+)\)$/);
            if (innerMatch) {
                const options = innerMatch[1].split('|').map(s => s.trim());
                result.groups.push({ options, suffix: result.suffix });
            }
            return result;
        }

        // 检查简单的(a|b|c)格式
        const simpleGroupMatch = pattern.match(/^\((.+)\)$/);
        if (simpleGroupMatch) {
            const options = simpleGroupMatch[1].split('|').map(s => s.trim());
            result.groups.push({ options, suffix: '' });
            return result;
        }

        // 普通文本
        result.groups.push({ options: [pattern], suffix: '' });
        return result;
    }

    // 将规则数据转换回正则表达式字符串
    ruleToPattern(rule) {
        let pattern = '';

        for (const group of rule.groups) {
            if (group.options.length > 1) {
                pattern += '(' + group.options.join('|') + ')';
            } else if (group.options.length === 1) {
                // 单个选项时，如果有后缀也需要括号
                if (group.suffix) {
                    pattern += '(' + group.options[0] + ')';
                } else {
                    pattern += group.options[0];
                }
            }
            pattern += group.suffix;
        }

        return pattern;
    }

    // 复制文本
    async copyText() {
        const text = this.elements.mainText.value;
        if (!text) {
            this.showToast('没有可复制的内容', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('复制成功！', 'success');
        } catch (err) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('复制成功！', 'success');
        }
    }

    // 生成（将规则转换为文本格式输出到左侧）
    generateText() {
        if (this.rules.length === 0) {
            this.showToast('请先添加替换规则', 'error');
            return;
        }

        const lines = [];

        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const pattern = this.ruleToPattern(rule);
            const replacement = rule.replacement || '';

            if (pattern) {
                lines.push(`${pattern} => ${replacement}`);
            }
        }

        if (lines.length === 0) {
            this.showToast('没有有效的规则可生成', 'error');
            return;
        }

        this.elements.mainText.value = lines.join('\n');
        this.saveToStorage();
        this.showToast(`已生成 ${lines.length} 条规则`, 'success');
    }

    // 处理转义序列
    processEscapeSequences(str) {
        return str
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\s/g, ' ')
            .replace(/\\\\/g, '\\');
    }

    // 清空所有规则
    clearRules() {
        if (this.rules.length === 0) {
            this.showToast('规则列表已经是空的', 'info');
            return;
        }

        if (confirm('确定要清空所有规则吗？')) {
            this.rules = [];
            this.renderRules();
            this.saveToStorage();
            this.showToast('已清空所有规则', 'success');
        }
    }

    // 加载示例数据
    loadExample() {
        const hasData = this.rules.length > 0 || this.elements.mainText.value.trim();

        if (hasData) {
            if (!confirm('加载示例将覆盖当前内容，确定继续吗？')) {
                return;
            }
        }

        this.elements.mainText.value = this.exampleData.text;
        this.rules = JSON.parse(JSON.stringify(this.exampleData.rules)); // 深拷贝
        this.renderRules();
        this.saveToStorage();
        this.showToast('示例已加载，点击「生成」查看效果', 'success');
    }

    // 添加新规则
    addRule(afterIndex = -1) {
        const newRule = {
            groups: [{ options: [''], suffix: '' }],
            replacement: ''
        };

        const container = this.elements.rulesContainer;

        // 如果之前是空状态，先清空
        if (this.rules.length === 0) {
            container.innerHTML = '';
        }

        if (afterIndex === -1) {
            this.rules.push(newRule);
            const newElement = this.createRuleElement(newRule, this.rules.length - 1);
            container.appendChild(newElement);
        } else {
            this.rules.splice(afterIndex + 1, 0, newRule);
            // 需要更新后续元素的索引，所以这里还是重新渲染
            this.renderRulesSmooth();
        }

        this.saveToStorage();

        // 聚焦到新添加的规则
        setTimeout(() => {
            const ruleElements = container.querySelectorAll('.rule-row');
            const targetIndex = afterIndex === -1 ? ruleElements.length - 1 : afterIndex + 1;
            const targetElement = ruleElements[targetIndex];
            if (targetElement) {
                const input = targetElement.querySelector('.match-item input, .simple-match-input');
                if (input) input.focus();
            }
        }, 50);
    }

    // 删除规则
    deleteRule(index) {
        const container = this.elements.rulesContainer;
        const ruleElement = container.querySelectorAll('.rule-row')[index];

        // 添加淡出动画
        if (ruleElement) {
            ruleElement.style.transition = 'opacity 0.15s, transform 0.15s';
            ruleElement.style.opacity = '0';
            ruleElement.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                this.rules.splice(index, 1);
                if (this.rules.length === 0) {
                    this.renderRules();
                } else {
                    this.renderRulesSmooth();
                }
                this.saveToStorage();
            }, 150);
        } else {
            this.rules.splice(index, 1);
            this.renderRules();
            this.saveToStorage();
        }

        this.showToast('规则已删除', 'info');
    }

    // 平滑渲染规则列表（保持滚动位置）
    renderRulesSmooth() {
        const container = this.elements.rulesContainer;
        const scrollTop = container.scrollTop;

        // 记录当前焦点
        const activeElement = document.activeElement;
        let focusInfo = null;
        if (activeElement && container.contains(activeElement)) {
            const ruleRow = activeElement.closest('.rule-row');
            if (ruleRow) {
                focusInfo = {
                    ruleIndex: parseInt(ruleRow.dataset.index),
                    selector: activeElement.className
                };
            }
        }

        container.innerHTML = '';

        this.rules.forEach((rule, index) => {
            const ruleElement = this.createRuleElement(rule, index);
            container.appendChild(ruleElement);
        });

        // 恢复滚动位置
        container.scrollTop = scrollTop;

        // 恢复焦点
        if (focusInfo) {
            const newRuleRow = container.querySelectorAll('.rule-row')[focusInfo.ruleIndex];
            if (newRuleRow) {
                const input = newRuleRow.querySelector('.' + focusInfo.selector.split(' ')[0]);
                if (input) input.focus();
            }
        }
    }

    // 渲染规则列表
    renderRules() {
        const container = this.elements.rulesContainer;

        if (this.rules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">暂无替换规则</div>
                    <div class="empty-state-hint">点击下方「添加规则」按钮创建新规则<br>或在左侧输入规则后点击「解析」</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        this.rules.forEach((rule, index) => {
            const ruleElement = this.createRuleElement(rule, index);
            container.appendChild(ruleElement);
        });
    }

    // 创建单条规则元素
    createRuleElement(rule, index) {
        const div = document.createElement('div');
        div.className = 'rule-row';
        div.dataset.index = index;

        // 拖拽事件绑定到容器（用于接收放置）
        div.addEventListener('dragover', (e) => this.handleDragOver(e));
        div.addEventListener('drop', (e) => this.handleDrop(e, index));
        div.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        div.innerHTML = `
            <div class="drag-handle" draggable="true" title="拖拽排序" data-index="${index}">⋮⋮</div>
            <div class="match-section">
                <div class="section-label">匹配内容</div>
                <div class="match-content">
                    ${this.renderMatchGroups(rule, index)}
                </div>
            </div>
            <div class="separator">=&gt;</div>
            <div class="replace-section">
                <div class="section-label">替换为</div>
                <input type="text" class="replace-input"
                    value="${this.escapeHtml(rule.replacement)}"
                    placeholder="留空则删除匹配内容"
                    data-rule-index="${index}">
            </div>
            <div class="rule-actions">
                <button class="rule-btn rule-btn-add" title="在下方添加规则" data-action="add" data-index="${index}">+</button>
                <button class="rule-btn rule-btn-delete" title="删除此规则" data-action="delete" data-index="${index}">×</button>
            </div>
        `;

        // 绑定替换输入事件
        const replaceInput = div.querySelector('.replace-input');
        replaceInput.addEventListener('input', (e) => {
            this.rules[index].replacement = e.target.value;
            this.saveToStorage();
        });

        // 绑定操作按钮事件
        div.querySelectorAll('.rule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const idx = parseInt(btn.dataset.index);
                if (action === 'add') this.addRule(idx);
                if (action === 'delete') this.deleteRule(idx);
            });
        });

        // 绑定匹配项事件
        this.bindMatchEvents(div, index);

        // 绑定拖拽手柄事件
        const dragHandle = div.querySelector('.drag-handle');
        dragHandle.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        dragHandle.addEventListener('dragend', (e) => this.handleDragEnd(e));

        return div;
    }

    // 渲染匹配组
    renderMatchGroups(rule, ruleIndex) {
        let html = '';

        rule.groups.forEach((group, groupIndex) => {
            const hasMultipleOptions = group.options.length > 1 || group.options.some(o => o.includes('|'));
            const hasSuffix = group.suffix && group.suffix.length > 0;

            if (hasMultipleOptions || hasSuffix) {
                // 多选项模式 - 展示为标签
                html += `
                    <div class="match-group" data-group-index="${groupIndex}">
                        ${hasSuffix ? `<span class="group-label">组合</span>` : ''}
                        <div class="match-items-container">
                            ${group.options.map((opt, optIndex) => `
                                <div class="match-item" data-opt-index="${optIndex}">
                                    <input type="text" value="${this.escapeHtml(opt)}"
                                        data-rule-index="${ruleIndex}"
                                        data-group-index="${groupIndex}"
                                        data-opt-index="${optIndex}">
                                    <button class="match-item-delete"
                                        data-rule-index="${ruleIndex}"
                                        data-group-index="${groupIndex}"
                                        data-opt-index="${optIndex}"
                                        title="删除此选项">×</button>
                                </div>
                            `).join('')}
                            <button class="add-match-btn"
                                data-rule-index="${ruleIndex}"
                                data-group-index="${groupIndex}"
                                title="添加选项">+</button>
                        </div>
                        ${hasSuffix ? `
                            <div class="suffix-section">
                                <span class="suffix-label">后缀：</span>
                                <input type="text" class="suffix-input"
                                    value="${this.escapeHtml(group.suffix)}"
                                    data-rule-index="${ruleIndex}"
                                    data-group-index="${groupIndex}">
                                <button class="group-btn delete-group"
                                    data-rule-index="${ruleIndex}"
                                    data-group-index="${groupIndex}"
                                    title="删除后缀">删除后缀</button>
                            </div>
                        ` : `
                            <div class="group-actions">
                                <button class="group-btn"
                                    data-action="add-suffix"
                                    data-rule-index="${ruleIndex}"
                                    data-group-index="${groupIndex}">+ 添加后缀</button>
                            </div>
                        `}
                    </div>
                `;
            } else {
                // 简单模式 - 单个输入框
                html += `
                    <input type="text" class="simple-match-input"
                        value="${this.escapeHtml(group.options[0] || '')}"
                        placeholder="输入匹配内容"
                        data-rule-index="${ruleIndex}"
                        data-group-index="${groupIndex}">
                    <div class="group-actions">
                        <button class="group-btn"
                            data-action="convert-multi"
                            data-rule-index="${ruleIndex}"
                            data-group-index="${groupIndex}">转为多选项</button>
                    </div>
                `;
            }
        });

        return html;
    }

    // 绑定匹配项相关事件
    bindMatchEvents(container, ruleIndex) {
        // 简单输入框
        container.querySelectorAll('.simple-match-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const groupIndex = parseInt(e.target.dataset.groupIndex);
                this.rules[ruleIndex].groups[groupIndex].options[0] = e.target.value;
                this.saveToStorage();
            });
        });

        // 多选项输入框
        container.querySelectorAll('.match-item input').forEach(input => {
            input.addEventListener('input', (e) => {
                const groupIndex = parseInt(e.target.dataset.groupIndex);
                const optIndex = parseInt(e.target.dataset.optIndex);
                this.rules[ruleIndex].groups[groupIndex].options[optIndex] = e.target.value;
                this.saveToStorage();
            });

            // 自动调整宽度
            input.addEventListener('input', (e) => {
                e.target.style.width = Math.max(40, e.target.value.length * 10 + 20) + 'px';
            });
        });

        // 删除选项按钮
        container.querySelectorAll('.match-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = parseInt(btn.dataset.groupIndex);
                const optIndex = parseInt(btn.dataset.optIndex);
                const group = this.rules[ruleIndex].groups[groupIndex];

                if (group.options.length <= 1) {
                    this.showToast('至少保留一个选项', 'info');
                    return;
                }

                group.options.splice(optIndex, 1);
                this.updateSingleRule(ruleIndex);
                this.saveToStorage();
            });
        });

        // 添加选项按钮
        container.querySelectorAll('.add-match-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = parseInt(btn.dataset.groupIndex);
                this.rules[ruleIndex].groups[groupIndex].options.push('');
                this.updateSingleRule(ruleIndex);
                this.saveToStorage();

                // 聚焦到新添加的输入框
                setTimeout(() => {
                    const ruleElements = this.elements.rulesContainer.querySelectorAll('.rule-row');
                    const inputs = ruleElements[ruleIndex].querySelectorAll('.match-item input');
                    if (inputs.length > 0) {
                        inputs[inputs.length - 1].focus();
                    }
                }, 50);
            });
        });

        // 后缀输入
        container.querySelectorAll('.suffix-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const groupIndex = parseInt(e.target.dataset.groupIndex);
                this.rules[ruleIndex].groups[groupIndex].suffix = e.target.value;
                this.saveToStorage();
            });
        });

        // 删除后缀按钮
        container.querySelectorAll('.delete-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = parseInt(btn.dataset.groupIndex);
                this.rules[ruleIndex].groups[groupIndex].suffix = '';
                this.updateSingleRule(ruleIndex);
                this.saveToStorage();
            });
        });

        // 操作按钮
        container.querySelectorAll('.group-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const groupIndex = parseInt(btn.dataset.groupIndex);

                if (action === 'add-suffix') {
                    this.rules[ruleIndex].groups[groupIndex].suffix = '[，。,.]?';
                    this.updateSingleRule(ruleIndex);
                    this.saveToStorage();
                }

                if (action === 'convert-multi') {
                    // 转换为多选项模式
                    const currentValue = this.rules[ruleIndex].groups[groupIndex].options[0];
                    this.rules[ruleIndex].groups[groupIndex].options = [currentValue, ''];
                    this.updateSingleRule(ruleIndex);
                    this.saveToStorage();

                    // 聚焦到新添加的输入框
                    setTimeout(() => {
                        const ruleElements = this.elements.rulesContainer.querySelectorAll('.rule-row');
                        const inputs = ruleElements[ruleIndex].querySelectorAll('.match-item input');
                        if (inputs.length > 1) {
                            inputs[inputs.length - 1].focus();
                        }
                    }, 50);
                }
            });
        });
    }

    // 更新单条规则（不影响其他规则）
    updateSingleRule(ruleIndex) {
        const container = this.elements.rulesContainer;
        const oldElement = container.querySelectorAll('.rule-row')[ruleIndex];

        if (oldElement && this.rules[ruleIndex]) {
            const newElement = this.createRuleElement(this.rules[ruleIndex], ruleIndex);
            oldElement.replaceWith(newElement);
        }
    }

    // 拖拽开始
    handleDragStart(e, index) {
        const ruleRow = e.target.closest('.rule-row');
        this.dragState.draggedElement = ruleRow;
        this.dragState.draggedIndex = index;
        ruleRow.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(ruleRow, 0, 0);
    }

    // 拖拽结束
    handleDragEnd(e) {
        const ruleRow = e.target.closest('.rule-row');
        if (ruleRow) {
            ruleRow.classList.remove('dragging');
        }
        this.elements.rulesContainer.querySelectorAll('.rule-row').forEach(row => {
            row.classList.remove('drag-over');
        });
    }

    // 拖拽经过
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const row = e.target.closest('.rule-row');
        if (row && row !== this.dragState.draggedElement) {
            row.classList.add('drag-over');
        }
    }

    // 拖拽离开
    handleDragLeave(e) {
        const row = e.target.closest('.rule-row');
        if (row) {
            row.classList.remove('drag-over');
        }
    }

    // 放置
    handleDrop(e, targetIndex) {
        e.preventDefault();
        const sourceIndex = this.dragState.draggedIndex;

        if (sourceIndex !== targetIndex) {
            // 重新排序
            const [removed] = this.rules.splice(sourceIndex, 1);
            this.rules.splice(targetIndex, 0, removed);
            this.renderRulesSmooth();
            this.saveToStorage();
            this.showToast('规则顺序已调整', 'info');
        }

        this.elements.rulesContainer.querySelectorAll('.rule-row').forEach(row => {
            row.classList.remove('drag-over');
        });
    }

    // 保存到本地存储
    saveToStorage() {
        const data = {
            text: this.elements.mainText.value,
            rules: this.rules,
            timestamp: Date.now()
        };
        localStorage.setItem('regexReplacer', JSON.stringify(data));
    }

    // 从本地存储加载
    loadFromStorage() {
        try {
            const data = localStorage.getItem('regexReplacer');
            if (data) {
                const parsed = JSON.parse(data);
                this.elements.mainText.value = parsed.text || '';
                this.rules = parsed.rules || [];
            }
        } catch (err) {
            console.error('加载存储数据失败:', err);
        }
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // HTML转义
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.regexReplacer = new RegexReplacer();
});
