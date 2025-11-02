/**
 * Utility để quản lý giao tiếp giữa các tab
 * Sử dụng Broadcast Channel API và localStorage để đồng bộ dữ liệu
 */

class TabCommunication {
  constructor() {
    this.channel = new BroadcastChannel('chatmate_tabs');
    this.tabId = this.generateTabId();
    
    // Lưu tab ID vào sessionStorage để track tab hiện tại
    sessionStorage.setItem('chatmate_tab_id', this.tabId);
    
    // Listen cho messages từ các tab khác
    this.channel.addEventListener('message', this.handleMessage.bind(this));
    
    // Cleanup khi tab đóng
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'PASSWORD_RESET_REDIRECT':
        this.handlePasswordResetRedirect(data);
        break;
      case 'TAB_COMMUNICATION_TEST':
        console.log('Tab communication test received:', data);
        break;
    }
  }

  /**
   * Xử lý redirect password reset
   */
  handlePasswordResetRedirect(data) {
    const { targetTabId, redirectUrl } = data;
    const currentTabId = sessionStorage.getItem('chatmate_tab_id');
    
    // Chỉ xử lý nếu đây là tab được target
    if (currentTabId === targetTabId) {
      // Redirect tab này đến URL mới
      window.location.href = redirectUrl;
    }
  }

  /**
   * Gửi message đến tất cả tabs
   */
  sendMessage(type, data) {
    this.channel.postMessage({ type, data });
  }

  /**
   * Yêu cầu tab gốc redirect đến trang confirm password reset
   */
  requestPasswordResetRedirect(confirmUrl) {
    const originalTabId = localStorage.getItem('password_reset_original_tab');
    
    if (originalTabId) {
      this.sendMessage('PASSWORD_RESET_REDIRECT', {
        targetTabId: originalTabId,
        redirectUrl: confirmUrl
      });
      
      // Đợi một chút rồi đóng tab hiện tại
      setTimeout(() => {
        window.close();
      }, 1000);
      
      return true;
    }
    
    return false;
  }

  /**
   * Đăng ký tab hiện tại là tab gốc cho password reset
   */
  registerAsPasswordResetTab() {
    localStorage.setItem('password_reset_original_tab', this.tabId);
    
    // Set expiration (1 hour)
    const expiration = Date.now() + (60 * 60 * 1000);
    localStorage.setItem('password_reset_original_tab_exp', expiration.toString());
  }

  /**
   * Kiểm tra xem có tab gốc đã đăng ký không
   */
  hasPasswordResetTab() {
    const tabId = localStorage.getItem('password_reset_original_tab');
    const expiration = localStorage.getItem('password_reset_original_tab_exp');
    
    if (!tabId || !expiration) {
      return false;
    }
    
    // Kiểm tra expiration
    if (Date.now() > parseInt(expiration)) {
      this.clearPasswordResetTab();
      return false;
    }
    
    return true;
  }

  /**
   * Xóa thông tin tab gốc
   */
  clearPasswordResetTab() {
    localStorage.removeItem('password_reset_original_tab');
    localStorage.removeItem('password_reset_original_tab_exp');
  }

  /**
   * Cleanup khi tab đóng
   */
  cleanup() {
    const currentTabId = sessionStorage.getItem('chatmate_tab_id');
    const originalTabId = localStorage.getItem('password_reset_original_tab');
    
    // Nếu tab đang đóng là tab gốc của password reset, clear nó
    if (currentTabId === originalTabId) {
      this.clearPasswordResetTab();
    }
    
    this.channel.close();
  }

  /**
   * Test connection giữa các tabs
   */
  testConnection() {
    this.sendMessage('TAB_COMMUNICATION_TEST', {
      from: this.tabId,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const tabCommunication = new TabCommunication();

// Export hook để sử dụng trong React components
export const useTabCommunication = () => {
  return tabCommunication;
};

export default tabCommunication;