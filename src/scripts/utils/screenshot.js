export default class Screenshot {
  constructor(options = {}) {
    this.html2canvas = options.html2canvas || window.html2canvas;
    this.loadingElement = options.loadingElement;
    this.scale = options.scale || 0.5;
    this.maxFileSize = options.maxFileSize || 900 * 1024; // 900KB safety margin
    this.defaultFormat = options.format || 'image/webp';
    this.showAlerts = options.showAlerts !== false; // Default true
  }

  async take(element = document.body, options = {}) {
    try {
      this.showLoading();

      // Capture screenshot
      const canvas = await (this.html2canvas
        ? this.html2canvas(element, {
            scale: this.scale,
            useCORS: true,
            allowTaint: true,
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight,
            ...options,
          })
        : this.#basicScreenshot(element));

      // Show initial size
      const initialBlob = await this.#canvasToBlob(canvas, 1);
      // Return compressed version
      const result = await this.#ensureMaxSize(canvas);
      return result;
    } catch (error) {
      console.error('Screenshot error:', error);
      this.#showAlert(`Error: ${error.message}`, 'error');
      throw error;
    } finally {
      this.hideLoading();
    }
  }

  // Basic screenshot fallback
  async #basicScreenshot(element) {
    const canvas = document.createElement('canvas');
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
    canvas.getContext('2d').drawImage(element, 0, 0);
    return canvas;
  }

  // Core compression logic
  async #ensureMaxSize(canvas) {
    let quality = 0.7;
    let blob = await this.#canvasToBlob(canvas, quality);

    // Strategy 1: Adjust quality
    while (blob.size > this.maxFileSize && quality >= 0.1) {
      quality -= 0.1;
      blob = await this.#canvasToBlob(canvas, quality);
    }

    // Strategy 2: Reduce dimensions if still too large
    if (blob.size > this.maxFileSize) {
      const scale = Math.sqrt(this.maxFileSize / blob.size);
      const newWidth = Math.floor(canvas.width * scale);
      const newHeight = Math.floor(canvas.height * scale);

      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = newWidth;
      resizedCanvas.height = newHeight;

      const ctx = resizedCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

      const finalBlob = await this.#canvasToBlob(resizedCanvas, quality);
      return resizedCanvas;
    }

    this.#showAlert(`Screenshot Success Size: ${this.#formatSize(blob.size)}`, 'success');
    return canvas;
  }

  async #canvasToBlob(canvas, quality) {
    return new Promise((resolve) => {
      if (this.defaultFormat === 'image/webp') {
        canvas.toBlob(resolve, 'image/webp', quality);
      } else {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      }
    });
  }

  // Utility methods
  async getCompressedBlob(canvas, quality = 0.7) {
    const blob = await this.#canvasToBlob(canvas, quality);
    this.#showAlert(`Compressed blob size: ${this.#formatSize(blob.size)}`);
    return blob;
  }

  async getCompressedBase64(canvas, quality = 0.7) {
    return new Promise((resolve) => {
      if (this.defaultFormat === 'image/webp') {
        const data = canvas.toDataURL('image/webp', quality);
        this.#showAlert(`Base64 size: ${this.#formatSize(data.length)}`);
        resolve(data);
      } else {
        const data = canvas.toDataURL('image/jpeg', quality);
        this.#showAlert(`Base64 size: ${this.#formatSize(data.length)}`);
        resolve(data);
      }
    });
  }

  #formatSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  #showAlert(message, type = 'info') {
    if (!this.showAlerts) return;

    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: fadeIn 0.3s;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.animation = 'fadeOut 0.3s';
      setTimeout(() => alert.remove(), 300);
    }, 3000);

    // Add styles if not already present
    if (!document.getElementById('screenshot-alert-styles')) {
      const style = document.createElement('style');
      style.id = 'screenshot-alert-styles';
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
      `;
      document.head.appendChild(style);
    }
  }

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'block';
      this.loadingElement.textContent = 'Processing screenshot...';
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  }
}
