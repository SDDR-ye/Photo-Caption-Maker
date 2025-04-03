/**
 * 多语言支持模块
 * 负责加载语言文件、切换语言、翻译界面文本等功能
 */

class I18nManager {
  constructor() {
    this.currentLanguage = null;
    this.translations = {};
    this.config = null;
    this.initialized = false;
    this.onLanguageChangeCallbacks = [];
  }

  /**
   * 初始化多语言支持
   * @returns {Promise} 初始化完成的Promise
   */
  async init() {
    try {
      // 加载语言配置文件
      const configResponse = await fetch('languages/config.json');
      this.config = await configResponse.json();
      
      // 获取浏览器语言或存储的语言偏好
      const savedLanguage = localStorage.getItem('preferredLanguage');
      const browserLanguage = navigator.language || navigator.userLanguage;
      
      // 确定要使用的语言
      let languageToUse = this.config.defaultLanguage;
      
      if (savedLanguage) {
        // 如果有保存的语言偏好，优先使用
        languageToUse = savedLanguage;
      } else if (browserLanguage) {
        // 检查浏览器语言是否在支持的语言列表中
        const browserLangCode = browserLanguage.split('-')[0];
        const matchedLang = this.config.availableLanguages.find(lang => 
          lang.code === browserLanguage || lang.code.startsWith(browserLangCode + '-')
        );
        
        if (matchedLang) {
          languageToUse = matchedLang.code;
        }
      }
      
      // 加载选定的语言
      await this.setLanguage(languageToUse);
      
      // 初始化完成
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('初始化多语言支持失败:', error);
      return false;
    }
  }

  /**
   * 设置当前语言
   * @param {string} langCode - 语言代码
   * @returns {Promise} 语言加载完成的Promise
   */
  async setLanguage(langCode) {
    try {
      // 检查语言是否受支持
      const langInfo = this.config.availableLanguages.find(lang => lang.code === langCode);
      
      if (!langInfo) {
        console.warn(`不支持的语言: ${langCode}，使用默认语言代替`);
        langCode = this.config.defaultLanguage;
      }
      
      // 加载语言文件
      const response = await fetch(`languages/${langCode}.json`);
      this.translations = await response.json();
      
      // 更新当前语言
      this.currentLanguage = langCode;
      
      // 保存语言偏好
      localStorage.setItem('preferredLanguage', langCode);
      
      // 更新页面上的文本
      this.updatePageTexts();
      
      // 更新HTML的lang属性
      document.documentElement.lang = langCode;
      
      // 更新文档方向（用于阿拉伯语等从右到左的语言）
      if (langCode === 'ar-SA') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
      
      // 触发语言变更回调
      this.onLanguageChangeCallbacks.forEach(callback => callback(langCode));
      
      return true;
    } catch (error) {
      console.error(`加载语言 ${langCode} 失败:`, error);
      
      // 如果不是默认语言，尝试加载默认语言
      if (langCode !== this.config.defaultLanguage) {
        console.warn(`尝试加载默认语言: ${this.config.defaultLanguage}`);
        return this.setLanguage(this.config.defaultLanguage);
      }
      
      return false;
    }
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键，格式为 "section.key" 或 "section.subsection.key"
   * @param {Object} params - 替换参数
   * @returns {string} 翻译后的文本
   */
  t(key, params = {}) {
    // 分割键以访问嵌套对象
    const keys = key.split('.');
    let value = this.translations;
    
    // 遍历键路径
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`翻译键 "${key}" 未找到`);
        return key; // 返回键作为后备
      }
    }
    
    // 如果值不是字符串，返回键
    if (typeof value !== 'string') {
      console.warn(`翻译键 "${key}" 的值不是字符串`);
      return key;
    }
    
    // 替换参数
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue);
    }
    
    return result;
  }

  /**
   * 更新页面上的所有文本
   */
  updatePageTexts() {
    // 查找所有带有 data-i18n 属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      // 根据元素类型设置文本
      if (element.tagName === 'INPUT' && element.getAttribute('type') === 'text') {
        element.placeholder = translation;
      } else if (element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else if (element.tagName === 'IMG') {
        element.alt = translation;
      } else if (element.tagName === 'META' && element.name === 'description') {
        element.content = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // 更新页面标题
    const titleTranslation = this.t('app.title');
    if (titleTranslation) {
      document.title = titleTranslation;
    }
    
    // 更新描述元标签
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descTranslation = this.t('app.description');
      if (descTranslation) {
        metaDescription.content = descTranslation;
      }
    }
  }

  /**
   * 获取当前语言信息
   * @returns {Object} 当前语言信息
   */
  getCurrentLanguageInfo() {
    return this.config.availableLanguages.find(lang => lang.code === this.currentLanguage);
  }

  /**
   * 获取所有可用语言
   * @returns {Array} 可用语言列表
   */
  getAvailableLanguages() {
    return this.config.availableLanguages;
  }

  /**
   * 添加语言变更回调
   * @param {Function} callback - 语言变更时调用的回调函数
   */
  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.onLanguageChangeCallbacks.push(callback);
    }
  }
}

// 创建全局实例
const i18n = new I18nManager();

// 导出实例
window.i18n = i18n;