const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function checkHealth() {
  const results = {
    timestamp: new Date().toISOString(),
    backend: { status: 'unknown', responseTime: 0 },
    frontend: { status: 'unknown', responseTime: 0 }
  };

  // Check backend health
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    results.backend.responseTime = Date.now() - startTime;
    results.backend.status = response.status === 200 ? 'healthy' : 'unhealthy';
    results.backend.data = response.data;
  } catch (error) {
    results.backend.status = 'unhealthy';
    results.backend.error = error.message;
  }

  // Check frontend availability
  try {
    const startTime = Date.now();
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    results.frontend.responseTime = Date.now() - startTime;
    results.frontend.status = response.status === 200 ? 'healthy' : 'unhealthy';
  } catch (error) {
    results.frontend.status = 'unhealthy';
    results.frontend.error = error.message;
  }

  return results;
}

async function main() {
  try {
    const healthStatus = await checkHealth();
    console.log(JSON.stringify(healthStatus, null, 2));
    
    // Exit with error code if any service is unhealthy
    const isHealthy = healthStatus.backend.status === 'healthy' && 
                     healthStatus.frontend.status === 'healthy';
    
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkHealth };