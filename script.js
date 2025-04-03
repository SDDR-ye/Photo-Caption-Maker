/**
 * 图片字幕生成器 - 主要脚本
 * 实现图片上传、字幕编辑和图片下载等功能
 */

// 等待DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const editorSection = document.getElementById('editorSection');
    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d');
    const textInput = document.getElementById('textInput');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontColor = document.getElementById('fontColor');
    const fontWeight = document.getElementById('fontWeight');
    const textStroke = document.getElementById('textStroke');
    const textStrokeColor = document.getElementById('textStrokeColor');
    const textStrokeColorGroup = document.getElementById('textStrokeColorGroup');
    const watermarkToggle = document.getElementById('watermarkToggle');
    const watermarkOptions = document.getElementById('watermarkOptions');
    const watermarkText = document.getElementById('watermarkText');
    const watermarkOpacity = document.getElementById('watermarkOpacity');
    const watermarkOpacityValue = document.getElementById('watermarkOpacityValue');
    const watermarkSize = document.getElementById('watermarkSize');
    const watermarkSizeValue = document.getElementById('watermarkSizeValue');
    const watermarkColor = document.getElementById('watermarkColor');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const helpLink = document.getElementById('helpLink');
    const helpModal = document.getElementById('helpModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // 图片和字幕状态
    let originalImage = null;
    let textPosition = 'bottom-center'; // 默认文字位置
    
    // 初始化设置
    initializeApp();
    
    /**
     * 初始化应用
     */
    function initializeApp() {
        // 设置拖放区域事件
        setupDragAndDrop();
        
        // 设置文件选择事件
        fileInput.addEventListener('change', handleFileSelect);
        
        // 设置字幕编辑事件
        setupTextEditEvents();
        
        // 设置按钮事件
        setupButtonEvents();
        
        // 设置帮助模态框事件
        setupModalEvents();
        
        // 尝试从localStorage恢复上次的设置
        restoreSettings();
    }
    
    /**
     * 设置拖放区域事件
     */
    function setupDragAndDrop() {
        // 阻止默认拖放行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        // 高亮拖放区域
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        // 取消高亮拖放区域
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        // 处理拖放文件
        dropArea.addEventListener('drop', handleDrop, false);
        
        // 获取上传按钮元素
        const uploadButton = document.querySelector('.upload-button');
        
        // 点击上传按钮触发文件选择
        uploadButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡到dropArea
        });
        
        // 点击上传区域（但不是按钮）触发文件选择
        dropArea.addEventListener('click', (e) => {
            // 确保点击的不是上传按钮
            if (!e.target.closest('.upload-button')) {
                fileInput.click();
            }
        });
    }
    
    /**
     * 设置字幕编辑相关事件
     */
    function setupTextEditEvents() {
        // 文本输入事件
        textInput.addEventListener('input', updateCanvas);
        
        // 字体设置事件
        fontFamily.addEventListener('change', updateCanvas);
        fontSize.addEventListener('input', () => {
            fontSizeValue.textContent = `${fontSize.value}px`;
            updateCanvas();
        });
        fontColor.addEventListener('input', updateCanvas);
        fontWeight.addEventListener('change', updateCanvas);
        
        // 字体外边框事件
        textStroke.addEventListener('change', () => {
            textStrokeColorGroup.style.display = textStroke.value !== 'none' ? 'block' : 'none';
            updateCanvas();
        });
        textStrokeColor.addEventListener('input', updateCanvas);
        
        // 水印开关事件
        watermarkToggle.addEventListener('change', () => {
            watermarkOptions.style.display = watermarkToggle.checked ? 'block' : 'none';
            updateCanvas();
        });
        
        // 水印相关事件
        watermarkText.addEventListener('input', updateCanvas);
        watermarkOpacity.addEventListener('input', () => {
            watermarkOpacityValue.textContent = `${watermarkOpacity.value}%`;
            updateCanvas();
        });
        watermarkSize.addEventListener('input', () => {
            watermarkSizeValue.textContent = `${watermarkSize.value}px`;
            updateCanvas();
        });
        watermarkColor.addEventListener('input', updateCanvas);
    }
    
    /**
     * 设置按钮事件
     */
    function setupButtonEvents() {
        // 重置按钮事件
        resetBtn.addEventListener('click', resetEditor);
        
        // 下载按钮事件
        downloadBtn.addEventListener('click', downloadImage);
    }
    
    /**
     * 设置模态框事件
     */
    function setupModalEvents() {
        // 打开帮助模态框
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            helpModal.style.display = 'block';
        });
        
        // 关闭模态框
        closeBtn.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
    
    /**
     * 阻止默认拖放行为
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * 高亮拖放区域
     */
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    /**
     * 取消高亮拖放区域
     */
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    /**
     * 处理拖放文件
     */
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
    
    /**
     * 处理文件选择
     */
    function handleFileSelect(e) {
        const files = e.target.files;
        
        if (files.length > 0) {
            handleFiles(files);
            // 重置文件输入框的值，这样用户可以再次选择同一个文件
            e.target.value = '';
        }
    }
    
    /**
     * 处理文件
     */
    function handleFiles(files) {
        const file = files[0];
        
        // 检查是否为图片文件
        if (!file.type.match('image.*')) {
            alert('请选择图片文件！');
            return;
        }
        
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert('文件大小不能超过10MB！');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // 保存原始图片
                originalImage = img;
                
                // 显示编辑区域
                editorSection.style.display = 'block';
                
                // 滚动到编辑区域
                editorSection.scrollIntoView({ behavior: 'smooth' });
                
                // 更新画布
                updateCanvas();
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * 更新画布
     */
    function updateCanvas() {
        if (!originalImage) return;
        
        // 设置画布尺寸
        const maxWidth = Math.min(originalImage.width, 800);
        const scale = maxWidth / originalImage.width;
        const scaledHeight = originalImage.height * scale;
        
        // 获取字幕文字
        const text = textInput.value;
        const lines = text ? text.split('\n') : [];
        
        // 设置字体样式
        const fontSizeValue = parseInt(fontSize.value);
        const lineHeight = fontSizeValue * 1.5; // 字幕区域高度
        
        // 计算字幕背景高度
        const captionHeight = lineHeight;
        const totalCaptionHeight = lines.length > 0 ? captionHeight * lines.length : 0;
        
        // 设置新的画布尺寸（原图高度 + 字幕区域总高度）
        imageCanvas.width = maxWidth;
        imageCanvas.height = scaledHeight + totalCaptionHeight;
        
        // 清除画布
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        
        // 绘制原始图片
        ctx.drawImage(originalImage, 0, 0, maxWidth, scaledHeight);
        
        if (lines.length > 0) {
            // 从原图底部截取字幕背景区域
            const captionBgHeight = captionHeight;
            const captionBgY = scaledHeight - captionBgHeight;
            
            // 设置字体样式
            ctx.font = `${fontWeight.value} ${fontSizeValue}px ${fontFamily.value}`;
            ctx.fillStyle = fontColor.value;
            ctx.textAlign = 'center';
            
            // 设置字体外边框
            if (textStroke.value !== 'none') {
                let strokeWidth = 1; // 默认为1px
                
                // 根据选择设置描边宽度
                if (textStroke.value === 'medium') {
                    strokeWidth = 2;
                } else if (textStroke.value === 'thick') {
                    strokeWidth = 3;
                }
                
                ctx.strokeStyle = textStrokeColor.value;
                ctx.lineWidth = strokeWidth;
            }
            
            // 为每行字幕添加背景和文字
            lines.forEach((line, index) => {
                // 计算当前字幕区域的Y坐标
                const currentY = scaledHeight + (index * captionHeight);
                
                // 绘制字幕背景（从原图底部截取）
                ctx.drawImage(
                    imageCanvas, // 源图像
                    0, captionBgY, // 源图像上的x和y坐标
                    maxWidth, captionBgHeight, // 源图像上的宽度和高度
                    0, currentY, // 目标图像上的x和y坐标
                    maxWidth, captionBgHeight // 目标图像上的宽度和高度
                );
                
                // 在字幕背景上绘制文字
                const textY = currentY + captionHeight / 2 + fontSizeValue / 3; // 垂直居中
                
                // 如果启用了外边框，先绘制描边
                if (textStroke.value !== 'none') {
                    ctx.strokeText(line, maxWidth / 2, textY);
                }
                
                // 绘制填充文字
                ctx.fillText(line, maxWidth / 2, textY);
            });
        }
        
        // 添加水印
        if (watermarkToggle.checked && watermarkText.value) {
            drawWatermark(watermarkText.value);
        }
        
        // 保存当前设置
        saveSettings();
    }
    
    /**
     * 计算文字位置
     */
    function calculateTextPosition(position, width, height, text, fontSizeValue) {
        const x = width / 2; // 水平居中
        let y;
        
        // 根据位置设置y坐标
        if (position.startsWith('top')) {
            y = fontSizeValue * 1.5;
        } else if (position.startsWith('middle')) {
            y = height / 2;
        } else { // bottom
            y = height - fontSizeValue * (text.split('\n').length) * 0.8;
        }
        
        return { x, y };
    }
    
    /**
     * 绘制水印
     */
    function drawWatermark(text) {
        ctx.save();
        
        // 获取水印设置
        const opacity = watermarkOpacity.value / 100;
        const size = watermarkSize.value;
        const color = watermarkColor.value;
        
        // 将颜色转换为rgba格式以支持透明度
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // 设置水印样式
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom'; // 设置文本基线为底部，使文本向下扩展
        
        // 绘制水印
        // 固定右上角位置，使水印向左下方扩展
        const margin = 10;
        ctx.fillText(text, imageCanvas.width - margin, margin + parseInt(size)); // 调整Y坐标，使文本向下扩展
        
        ctx.restore();
    }
    
    /**
     * 重置编辑器
     */
    function resetEditor() {
        textInput.value = '';
        fontFamily.value = 'Arial, sans-serif';
        fontSize.value = 32;
        fontSizeValue.textContent = '32px';
        fontColor.value = '#ffffff';
        fontWeight.value = 'normal';
        
        // 重置字体外边框
        textStroke.value = 'none';
        textStrokeColor.value = '#000000';
        textStrokeColorGroup.style.display = 'none';
        
        // 设置默认文字位置为底部中间
        textPosition = 'bottom-center';
        
        // 重置水印
        watermarkToggle.checked = false;
        watermarkOptions.style.display = 'none';
        watermarkText.value = '';
        watermarkOpacity.value = 50;
        watermarkOpacityValue.textContent = '50%';
        watermarkSize.value = 14;
        watermarkSizeValue.textContent = '14px';
        watermarkColor.value = '#ffffff';
        
        // 更新画布
        updateCanvas();
    }
    
    /**
     * 预览图片
     */
    function previewImage() {
        if (!originalImage) return;
        
        // 显示预览模态框
        const previewModal = document.getElementById('previewModal');
        const previewImage = document.getElementById('previewImage');
        const previewCloseBtn = document.getElementById('previewCloseBtn');
        const confirmDownloadBtn = document.getElementById('confirmDownloadBtn');
        
        // 设置预览图片
        previewImage.src = imageCanvas.toDataURL('image/png');
        
        // 显示模态框
        previewModal.style.display = 'block';
        
        // 关闭预览模态框
        previewCloseBtn.onclick = function() {
            previewModal.style.display = 'none';
        };
        
        // 点击模态框外部关闭
        window.onclick = function(event) {
            if (event.target === previewModal) {
                previewModal.style.display = 'none';
            }
        };
        
        // 确认下载按钮事件
        confirmDownloadBtn.onclick = downloadImage;
    }
    
    /**
     * 下载图片
     */
    function downloadImage() {
        if (!originalImage) return;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = '图片字幕_' + new Date().getTime() + '.png';
        link.href = imageCanvas.toDataURL('image/png');
        link.click();
    }
    
    /**
     * 保存设置到localStorage
     */
    function saveSettings() {
        if (!localStorage) return;
        
        const settings = {
            fontFamily: fontFamily.value,
            fontSize: fontSize.value,
            fontColor: fontColor.value,
            fontWeight: fontWeight.value,
            textStroke: textStroke.value,
            textStrokeColor: textStrokeColor.value,
            textPosition: textPosition,
            watermarkEnabled: watermarkToggle.checked,
            watermarkText: watermarkText.value,
            watermarkOpacity: watermarkOpacity.value,
            watermarkSize: watermarkSize.value,
            watermarkColor: watermarkColor.value
        };
        
        localStorage.setItem('captionGeneratorSettings', JSON.stringify(settings));
    }
    
    /**
     * 从localStorage恢复设置
     */
    function restoreSettings() {
        if (!localStorage) return;
        
        const savedSettings = localStorage.getItem('captionGeneratorSettings');
        if (!savedSettings) return;
        
        try {
            const settings = JSON.parse(savedSettings);
            
            fontFamily.value = settings.fontFamily || 'Arial, sans-serif';
            fontSize.value = settings.fontSize || 32;
            fontSizeValue.textContent = `${fontSize.value}px`;
            fontColor.value = settings.fontColor || '#ffffff';
            fontWeight.value = settings.fontWeight || 'normal';
            
            // 设置字体外边框
            textStroke.value = settings.textStroke || 'none';
            textStrokeColor.value = settings.textStrokeColor || '#000000';
            textStrokeColorGroup.style.display = textStroke.value !== 'none' ? 'block' : 'none';
            
            // 设置文字位置
            textPosition = settings.textPosition || 'bottom-center';
            
            // 设置水印
            watermarkToggle.checked = settings.watermarkEnabled || false;
            watermarkOptions.style.display = watermarkToggle.checked ? 'block' : 'none';
            watermarkText.value = settings.watermarkText || '';
            watermarkOpacity.value = settings.watermarkOpacity || 50;
            watermarkOpacityValue.textContent = `${watermarkOpacity.value}%`;
            watermarkSize.value = settings.watermarkSize || 14;
            watermarkSizeValue.textContent = `${watermarkSize.value}px`;
            watermarkColor.value = settings.watermarkColor || '#ffffff';
            
        } catch (e) {
            console.error('恢复设置失败:', e);
        }
    }
});