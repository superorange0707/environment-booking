export const logger = {
  logs: [],

  log(...args) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'log',
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
    };
    
    // Add to memory
    this.logs.push(logEntry);
    
    // Store in localStorage
    this.saveLogs();
    
    // Also log to console
    console.log(...args);
  },

  error(...args) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'error',
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
    };
    
    this.logs.push(logEntry);
    this.saveLogs();
    console.error(...args);
  },

  clear() {
    this.logs = [];
    localStorage.removeItem('auth_logs');
  },

  getLogs() {
    return this.logs;
  },

  saveLogs() {
    localStorage.setItem('auth_logs', JSON.stringify(this.logs));
  },

  loadLogs() {
    const savedLogs = localStorage.getItem('auth_logs');
    if (savedLogs) {
      this.logs = JSON.parse(savedLogs);
    }
  }
};

// Load logs when the module is imported
logger.loadLogs(); 