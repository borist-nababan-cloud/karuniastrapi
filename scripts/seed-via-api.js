const axios = require('axios');

const BASE_URL = 'http://localhost:1337';
const JWT_TOKEN = 'your-jwt-token-here'; // You need to get this from login

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/local`, {
      identifier: 'borist@nababancloud.net',
      password: 'NewPassword123!'
    });
    return response.data.jwt;
  } catch (error) {
    console.error('Login failed:', error.response?.data);
    throw error;
  }
}

async function createVehicleGroups(data, token) {
  console.log('Creating Vehicle Groups...');
  for (const group of data.vehicleGroups) {
    try {
      await axios.post(`${BASE_URL}/api/vehicle-groups`, { data: group }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`  ✓ Created: ${group.name}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`  - Already exists: ${group.name}`);
      } else {
        console.error(`  ✗ Error: ${group.name}`, error.response?.data);
      }
    }
  }
}

async function main() {
  try {
    // First, ensure Strapi is running
    console.log('Checking if Strapi is running...');
    await axios.get(`${BASE_URL}/health`);

    // Login
    console.log('Logging in...');
    const token = await login();
    console.log('Login successful!');

    // Load seed data
    const seedData = require('../data/seed-dealership-data.json');

    // Create data
    await createVehicleGroups(seedData, token);

    console.log('\n✅ Seeding complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Strapi is running (npm run develop)');
    console.log('2. Your admin credentials are correct');
    console.log('3. Permissions are set for the APIs');
  }
}

main();