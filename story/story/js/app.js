// 全局变量
let currentFilters = {
    positions: [],
    industries: [],
    resultTypes: []
};
let currentPage = 1;
let pageSize = 9;
let filteredCases = [];

// DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化筛选按钮
    initFilterButtons();
    
    // 初始化分页大小选择器
    initPageSizeSelector();
    
    // 初始化清除筛选按钮
    document.getElementById('clear-filters').addEventListener('click', clearAllFilters);
    
    // 初始化案例展示
    updateFilteredCases();
    renderCases();
    updatePagination();
});

// 初始化筛选按钮
function initFilterButtons() {
    // 岗位筛选按钮
    const positionFilters = document.getElementById('position-filters');
    filterOptions.positions.forEach(position => {
        const button = createFilterButton(position, 'positions');
        positionFilters.appendChild(button);
    });
    
    // 行业筛选按钮
    const industryFilters = document.getElementById('industry-filters');
    filterOptions.industries.forEach(industry => {
        const button = createFilterButton(industry, 'industries');
        industryFilters.appendChild(button);
    });
    
    // 成果类型筛选按钮
    const resultTypeFilters = document.getElementById('result-type-filters');
    filterOptions.resultTypes.forEach(resultType => {
        const button = createFilterButton(resultType, 'resultTypes');
        resultTypeFilters.appendChild(button);
    });
}

// 创建筛选按钮
function createFilterButton(value, filterType) {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.textContent = value;
    button.addEventListener('click', () => {
        toggleFilter(value, filterType);
        updateFilteredCases();
        currentPage = 1; // 重置到第一页
        renderCases();
        updatePagination();
    });
    return button;
}

// 切换筛选条件
function toggleFilter(value, filterType) {
    const index = currentFilters[filterType].indexOf(value);
    if (index === -1) {
        // 添加筛选条件
        currentFilters[filterType].push(value);
        // 更新按钮样式
        document.querySelectorAll('.filter-button').forEach(btn => {
            if (btn.textContent === value) {
                btn.classList.add('active');
            }
        });
    } else {
        // 移除筛选条件
        currentFilters[filterType].splice(index, 1);
        // 更新按钮样式
        document.querySelectorAll('.filter-button').forEach(btn => {
            if (btn.textContent === value) {
                btn.classList.remove('active');
            }
        });
    }
}

// 清除所有筛选条件
function clearAllFilters() {
    currentFilters = {
        positions: [],
        industries: [],
        resultTypes: []
    };
    
    // 更新按钮样式
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    updateFilteredCases();
    currentPage = 1; // 重置到第一页
    renderCases();
    updatePagination();
}

// 初始化分页大小选择器
function initPageSizeSelector() {
    const pageSizeSelector = document.getElementById('page-size');
    pageSizeSelector.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // 重置到第一页
        renderCases();
        updatePagination();
    });
}

// 更新筛选后的案例列表
function updateFilteredCases() {
    filteredCases = casesData.filter(caseItem => {
        // 检查是否符合所有筛选条件
        const matchesPositions = currentFilters.positions.length === 0 || 
            caseItem.positions.some(position => currentFilters.positions.includes(position));
            
        const matchesIndustries = currentFilters.industries.length === 0 || 
            caseItem.industries.some(industry => currentFilters.industries.includes(industry));
            
        const matchesResultTypes = currentFilters.resultTypes.length === 0 || 
            caseItem.resultTypes.some(resultType => currentFilters.resultTypes.includes(resultType));
            
        return matchesPositions && matchesIndustries && matchesResultTypes;
    });
    
    // 更新筛选结果计数
    document.getElementById('filtered-count').textContent = filteredCases.length;
}

// 渲染案例卡片
function renderCases() {
    const casesContainer = document.getElementById('cases-container');
    casesContainer.innerHTML = '';
    
    // 计算当前页的案例
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredCases.length);
    const currentPageCases = filteredCases.slice(startIndex, endIndex);
    
    if (currentPageCases.length === 0) {
        // 没有匹配的案例
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = '没有找到匹配的案例，请尝试其他筛选条件';
        casesContainer.appendChild(noResults);
        return;
    }
    
    // 创建案例卡片
    currentPageCases.forEach(caseItem => {
        const caseCard = createCaseCard(caseItem);
        casesContainer.appendChild(caseCard);
    });
}

// 创建案例卡片
function createCaseCard(caseItem) {
    const card = document.createElement('div');
    card.className = 'case-card';
    
    const content = document.createElement('div');
    content.className = 'case-content';
    
    // 卡片头部：姓名
    const header = document.createElement('div');
    header.className = 'case-header';
    
    const name = document.createElement('h3');
    name.className = 'case-name';
    name.textContent = caseItem.name;
    header.appendChild(name);
    
    // 标签：岗位、行业、成果类型
    const tags = document.createElement('div');
    tags.className = 'case-tags';
    
    // 添加岗位标签
    caseItem.positions.forEach(position => {
        const tag = document.createElement('span');
        tag.className = 'case-tag';
        tag.textContent = position;
        tags.appendChild(tag);
    });
    
    // 添加行业标签
    caseItem.industries.forEach(industry => {
        const tag = document.createElement('span');
        tag.className = 'case-tag';
        tag.textContent = industry;
        tags.appendChild(tag);
    });
    
    // 背景部分
    const background = document.createElement('div');
    background.className = 'case-section';
    
    const backgroundTitle = document.createElement('h4');
    backgroundTitle.textContent = '背景';
    background.appendChild(backgroundTitle);
    
    const backgroundText = document.createElement('p');
    backgroundText.textContent = caseItem.background;
    background.appendChild(backgroundText);
    
    // 挑战部分
    const challenge = document.createElement('div');
    challenge.className = 'case-section';
    
    const challengeTitle = document.createElement('h4');
    challengeTitle.textContent = '挑战';
    challenge.appendChild(challengeTitle);
    
    const challengeText = document.createElement('p');
    challengeText.textContent = caseItem.challenge;
    challenge.appendChild(challengeText);
    
    // 解决方案部分
    const solution = document.createElement('div');
    solution.className = 'case-section';
    
    const solutionTitle = document.createElement('h4');
    solutionTitle.textContent = '解决方案';
    solution.appendChild(solutionTitle);
    
    const solutionText = document.createElement('p');
    solutionText.textContent = caseItem.solution;
    solution.appendChild(solutionText);
    
    // 成果部分
    const result = document.createElement('div');
    result.className = 'case-result';
    
    // 添加成果类型标签
    const resultTypesContainer = document.createElement('div');
    resultTypesContainer.className = 'case-tags';
    
    caseItem.resultTypes.forEach(resultType => {
        const tag = document.createElement('span');
        tag.className = 'case-tag';
        tag.textContent = resultType;
        resultTypesContainer.appendChild(tag);
    });
    
    const resultTitle = document.createElement('h4');
    resultTitle.textContent = '成果';
    result.appendChild(resultTitle);
    
    const resultText = document.createElement('p');
    resultText.textContent = caseItem.result;
    result.appendChild(resultText);
    
    // 组装卡片
    content.appendChild(header);
    content.appendChild(tags);
    content.appendChild(background);
    content.appendChild(challenge);
    content.appendChild(solution);
    content.appendChild(result);
    
    card.appendChild(content);
    
    return card;
}

// 更新分页
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('page-numbers');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    // 计算总页数
    const totalPages = Math.ceil(filteredCases.length / pageSize);
    
    // 更新上一页/下一页按钮状态
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    
    // 添加上一页按钮事件
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderCases();
            updatePagination();
        }
    };
    
    // 添加下一页按钮事件
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderCases();
            updatePagination();
        }
    };
    
    // 清空页码
    pageNumbers.innerHTML = '';
    
    // 生成页码
    if (totalPages <= 7) {
        // 如果总页数少于等于7，显示所有页码
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = createPageNumber(i);
            pageNumbers.appendChild(pageNumber);
        }
    } else {
        // 如果总页数大于7，显示部分页码
        if (currentPage <= 3) {
            // 当前页靠近开始
            for (let i = 1; i <= 5; i++) {
                const pageNumber = createPageNumber(i);
                pageNumbers.appendChild(pageNumber);
            }
            
            // 添加省略号
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
            
            // 添加最后一页
            const lastPage = createPageNumber(totalPages);
            pageNumbers.appendChild(lastPage);
        } else if (currentPage >= totalPages - 2) {
            // 当前页靠近结束
            // 添加第一页
            const firstPage = createPageNumber(1);
            pageNumbers.appendChild(firstPage);
            
            // 添加省略号
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
            
            for (let i = totalPages - 4; i <= totalPages; i++) {
                const pageNumber = createPageNumber(i);
                pageNumbers.appendChild(pageNumber);
            }
        } else {
            // 当前页在中间
            // 添加第一页
            const firstPage = createPageNumber(1);
            pageNumbers.appendChild(firstPage);
            
            // 添加省略号
            const ellipsisStart = document.createElement('span');
            ellipsisStart.className = 'page-ellipsis';
            ellipsisStart.textContent = '...';
            pageNumbers.appendChild(ellipsisStart);
            
            // 添加当前页及其前后各一页
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                const pageNumber = createPageNumber(i);
                pageNumbers.appendChild(pageNumber);
            }
            
            // 添加省略号
            const ellipsisEnd = document.createElement('span');
            ellipsisEnd.className = 'page-ellipsis';
            ellipsisEnd.textContent = '...';
            pageNumbers.appendChild(ellipsisEnd);
            
            // 添加最后一页
            const lastPage = createPageNumber(totalPages);
            pageNumbers.appendChild(lastPage);
        }
    }
}

// 创建页码
function createPageNumber(pageNum) {
    const pageNumber = document.createElement('div');
    pageNumber.className = 'page-number';
    if (pageNum === currentPage) {
        pageNumber.classList.add('active');
    }
    pageNumber.textContent = pageNum;
    
    pageNumber.addEventListener('click', () => {
        currentPage = pageNum;
        renderCases();
        updatePagination();
    });
    
    return pageNumber;
}