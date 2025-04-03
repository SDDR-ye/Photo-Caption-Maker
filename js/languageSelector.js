/**
 * 语言选择器组件
 * 提供用户界面用于切换应用程序语言
 */

class LanguageSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`找不到ID为${containerId}的容器元素`);
      return;
    }
    
    this.initialized = false;
    this.currentLanguage = null;
  }
  
  /**
   * 初始化语言选择器
   */
  async init() {
    try {
      // 等待i18n初始化完成
      if (!window.i18n || !window.i18n.initialized) {
        await new Promise(resolve => {
          const checkI18n = () => {
            if (window.i18n && window.i18n.initialized) {
              resolve();
            } else {
              setTimeout(checkI18n, 100);
            }
          };
          checkI18n();
        });
      }
      
      // 获取当前语言和可用语言列表
      this.currentLanguage = window.i18n.currentLanguage;
      const availableLanguages = window.i18n.getAvailableLanguages();
      
      // 创建语言选择器UI
      this.render(availableLanguages);
      
      // 监听语言变更事件
      window.i18n.onLanguageChange(langCode => {
        this.updateSelectedLanguage(langCode);
      });
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('初始化语言选择器失败:', error);
      return false;
    }
  }
  
  /**
   * 渲染语言选择器UI
   * @param {Array} languages - 可用语言列表
   */
  render(languages) {
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建语言选择器下拉菜单
    const selectElement = document.createElement('div');
    selectElement.className = 'language-selector';
    selectElement.setAttribute('aria-label', '选择语言');
    
    // 添加图标
    const iconElement = document.createElement('img');
    iconElement.src = 'globe-icon.svg';
    iconElement.alt = '语言';
    iconElement.style.width = '20px';
    iconElement.style.marginRight = '5px';
    selectElement.appendChild(iconElement);
    
    // 创建下拉菜单
    const dropdownElement = document.createElement('select');
    
    // 添加语言选项
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = `${lang.flag} ${lang.nativeName}`;
      option.selected = lang.code === this.currentLanguage;
      dropdownElement.appendChild(option);
    });
    
    // 添加事件监听器
    dropdownElement.addEventListener('change', (e) => {
      const selectedLanguage = e.target.value;
      window.i18n.setLanguage(selectedLanguage);
    });
    
    // 将下拉菜单添加到选择器
    selectElement.appendChild(dropdownElement);
    
    // 将选择器添加到容器
    this.container.appendChild(selectElement);
  }
  
  /**
   * 更新选中的语言
   * @param {string} langCode - 语言代码
   */
  updateSelectedLanguage(langCode) {
    const selectElement = this.container.querySelector('select');
    if (selectElement) {
      selectElement.value = langCode;
    }
  }
}

// 导出语言选择器类
window.LanguageSelector = LanguageSelector;