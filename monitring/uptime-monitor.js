const axios = require('axios');
const fs = require('fs');
const path = require('path');

class UptimeMonitor {
  constructor(config) {
    this.services = config.services || [];
    this.interval = config.interval || 60000; // 1 minute
    this.logFile = config.logFile || 'uptime.log';
    this.alertWebhook = config.alertWebhook;
    this.running = false;
  }

  async checkService(service) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(service.url, {
        timeout: service.timeout || 10000,
        headers: service.headers || {}
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 300;
      
      return {
        name: service.name,
        url: service.url,
        status: isHealthy ? 'up' : 'down',
        statusCode: response.status,
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: service.name,
        url: service.url,
        status: 'down',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkAllServices() {
    const results = await Promise.all(
      this.services.map(service => this.checkService(service))
    );
    
    return results;
  }

  logResults(results) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      results
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
    
    console.log(`[${logEntry.timestamp}] Health check completed`);
    results.forEach(result => {
      const status = result.status === 'up' ? '✅' : '❌';
      console.log(`  ${status} ${result.name}: ${result.status} (${result.responseTime}ms)`);
    });
  }

  async sendAlert(downServices) {
    if (!this.alertWebhook || downServices.length === 0) return;
    
    const message = {
      text: `🚨 Service Alert: ${downServices.length} service(s) are down`,
      attachments: downServices.map(service => ({
        color: 'danger',
        fields: [
          { title: 'Service', value: service.name, short: true },
          { title: 'URL', value: service.url, short: true },
          { title: 'Error', value: service.error || 'Unknown', short: false }
        ]
      }))
    };
    
    try {
      await axios.post(this.alertWebhook, message);
    } catch (error) {
      console.error('Failed to send alert:', error.message);
    }
  }

  async monitor() {
    if (this.running) return;
    
    this.running = true;
    console.log('Starting uptime monitoring...');
    
    while (this.running) {
      try {
        const results = await this.checkAllServices();
        this.logResults(results);
        
        const downServices = results.filter(r => r.status === 'down');
        await this.sendAlert(downServices);
        
        await new Promise(resolve => setTimeout(resolve, this.interval));
      } catch (error) {
        console.error('Monitor error:', error);
        await new Promise(resolve => setTimeout(resolve, this.interval));
      }
    }
  }

  stop() {
    this.running = false;
    console.log('Stopping uptime monitoring...');
  }
}

// Example configuration
const config = {
  services: [
    {
      name: 'Backend API',
      url: process.env.BACKEND_URL + '/health' || 'http://localhost:5000/health',
      timeout: 10000
    },
    {
      name: 'Frontend',
      url: process.env.FRONTEND_URL || 'http://localhost:3000',
      timeout: 10000
    }
  ],
  interval: 60000, // 1 minute
  logFile: 'logs/uptime.log',
  alertWebhook: process.env.SLACK_WEBHOOK_URL
};

if (require.main === module) {
  const monitor = new UptimeMonitor(config);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
  
  monitor.monitor();
}

module.exports = UptimeMonitor;