export default async ({ strapi }: { strapi: any }) => {
  // Simple logging to show Strapi has started
  console.log('✅ Strapi has started successfully');
  console.log('📍 Admin panel: http://localhost:1337/admin');
  console.log('📚 API Documentation: http://localhost:1337/documentation');
  console.log('');
  console.log('💡 To add data, use the admin panel');
  console.log('🔗 Available API endpoints:');
  console.log('   - GET /api/articles');
  console.log('   - GET /api/articles/:id');
  console.log('   - GET /api/categories');
  console.log('   - GET /api/categories/:id');
  console.log('   - GET /api/authors');
  console.log('   - GET /api/authors/:id');
  console.log('   - GET /api/global');
  console.log('   - GET /api/about');
  console.log('   - GET /api/branches');
  console.log('   - GET /api/branches/:id');
  console.log('   - GET /api/supervisors');
  console.log('   - GET /api/supervisors/:id');
  console.log('   - GET /api/spks');
  console.log('   - GET /api/spks/:id');
  console.log('   - GET /api/vehicle-groups');
  console.log('   - GET /api/vehicle-groups/:id');
  console.log('   - GET /api/vehicle-types');
  console.log('   - GET /api/vehicle-types/:id');
  console.log('   - GET /api/attendances');
  console.log('   - GET /api/attendances/:id');
};