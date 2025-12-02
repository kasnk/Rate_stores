const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true // Don't throw on any status
});

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function runTest(testName, method, endpoint, data = null, expectedStatus = 200, token = null) {
  try {
    const config = {
      method,
      url: endpoint,
      data
    };

    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    const response = await client(config);
    const passed = response.status === expectedStatus;

    testResults.tests.push({
      name: testName,
      passed,
      status: response.status,
      expectedStatus
    });

    if (passed) {
      testResults.passed++;
      console.log(`✅ ${testName} - Status: ${response.status}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${testName} - Expected: ${expectedStatus}, Got: ${response.status}`);
      if (response.data?.message) console.log(`   Message: ${response.data.message}`);
    }

    return response.data;
  } catch (err) {
    testResults.failed++;
    testResults.tests.push({
      name: testName,
      passed: false,
      error: err.message
    });
    console.log(`❌ ${testName} - Error: ${err.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('🧪 Starting API Tests...\n');

  // ===== HEALTH CHECK =====
  console.log('📋 HEALTH CHECK');
  await runTest('Health Check', 'GET', '/api/health', null, 200);

  // ===== AUTH TESTS =====
  console.log('\n🔐 AUTHENTICATION TESTS');

  // Test 1: Sign up with valid data
  let signup = await runTest(
    'Signup - Valid User',
    'POST',
    '/api/auth/signup',
    {
      name: 'Test User Valid Signup Name',
      email: `testuser${Date.now()}@example.com`,
      address: 'Test Address',
      password: 'TestPass@123'
    },
    201
  );
  const userId = signup?.id;
  const testEmail = signup?.email;

  // Test 2: Signup with invalid email
  await runTest(
    'Signup - Invalid Email',
    'POST',
    '/api/auth/signup',
    {
      name: 'Another User Valid Name Here',
      email: 'invalidemail',
      address: 'Address',
      password: 'TestPass@123'
    },
    400
  );

  // Test 3: Signup with short name (< 20 chars)
  await runTest(
    'Signup - Name Too Short',
    'POST',
    '/api/auth/signup',
    {
      name: 'Short',
      email: `short${Date.now()}@example.com`,
      address: 'Address',
      password: 'TestPass@123'
    },
    400
  );

  // Test 4: Signup with weak password
  await runTest(
    'Signup - Weak Password',
    'POST',
    '/api/auth/signup',
    {
      name: 'Test User Password Check Name',
      email: `weakpass${Date.now()}@example.com`,
      address: 'Address',
      password: 'weak'
    },
    400
  );

  // Test 5: Login with valid credentials
  let loginResp = await runTest(
    'Login - Valid Credentials',
    'POST',
    '/api/auth/login',
    {
      email: testEmail,
      password: 'TestPass@123'
    },
    200
  );
  const token = loginResp?.token;

  // Test 6: Login with invalid credentials
  await runTest(
    'Login - Invalid Password',
    'POST',
    '/api/auth/login',
    {
      email: testEmail,
      password: 'wrongpassword'
    },
    401
  );

  // Test 7: Change password
  await runTest(
    'Change Password - Valid',
    'POST',
    '/api/auth/change-password',
    {
      oldPassword: 'TestPass@123',
      newPassword: 'NewPass@456'
    },
    200,
    token
  );

  // Test 8: Login with new password
  let newLoginResp = await runTest(
    'Login - After Password Change',
    'POST',
    '/api/auth/login',
    {
      email: testEmail,
      password: 'NewPass@456'
    },
    200
  );
  const newToken = newLoginResp?.token;

  // ===== ADMIN TESTS =====
  console.log('\n👨‍💼 ADMIN TESTS');

  // Get admin token
  let adminLoginResp = await runTest(
    'Admin Login',
    'POST',
    '/api/auth/login',
    {
      email: 'admin@example.com',
      password: 'Admin@123'
    },
    200
  );
  const adminToken = adminLoginResp?.token;

  // Test 9: Get admin dashboard summary
  await runTest(
    'Admin - Get Dashboard Summary',
    'GET',
    '/api/admin/summary',
    null,
    200,
    adminToken
  );

  // Test 10: Create a new user via admin
  let newUser = await runTest(
    'Admin - Create New User',
    'POST',
    '/api/admin/users',
    {
      name: 'Admin Created User Name Here',
      email: `admincreated${Date.now()}@example.com`,
      address: 'Admin Created Address',
      password: 'AdminPass@123',
      role: 'normal'
    },
    201,
    adminToken
  );

  // Test 11: Get all users with filters
  await runTest(
    'Admin - Get Users List',
    'GET',
    '/api/admin/users',
    null,
    200,
    adminToken
  );

  // Test 12: Get users with filter by name
  await runTest(
    'Admin - Filter Users by Name',
    'GET',
    '/api/admin/users?name=Test',
    null,
    200,
    adminToken
  );

  // Test 13: Create store
  let storeResp = await runTest(
    'Admin - Create Store',
    'POST',
    '/api/admin/stores',
    {
      name: 'Test Store',
      email: 'store@example.com',
      address: 'Store Address'
    },
    201,
    adminToken
  );
  const storeId = storeResp?.id;

  // Test 14: Get all stores with filters
  await runTest(
    'Admin - Get Stores List',
    'GET',
    '/api/admin/stores',
    null,
    200,
    adminToken
  );

  // Test 15: Get stores with filter by name
  await runTest(
    'Admin - Filter Stores by Name',
    'GET',
    '/api/admin/stores?name=Test',
    null,
    200,
    adminToken
  );

  // ===== OWNER REQUEST TESTS =====
  console.log('\n📝 OWNER REQUEST TESTS');

  // Test 16: Normal user requests to become owner
  let ownerReq = await runTest(
    'User - Request Owner Status',
    'POST',
    '/api/user/request-owner',
    null,
    201,
    newToken
  );
  const requestId = ownerReq?.request?.id;

  // Test 17: Duplicate owner request (should fail)
  await runTest(
    'User - Duplicate Owner Request (should fail)',
    'POST',
    '/api/user/request-owner',
    null,
    400,
    newToken
  );

  // Test 18: Check owner request status
  await runTest(
    'User - Check Owner Request Status',
    'GET',
    '/api/user/owner-request-status',
    null,
    200,
    newToken
  );

  // Test 19: Admin views pending owner requests
  await runTest(
    'Admin - Get Pending Owner Requests',
    'GET',
    '/api/admin/owner-requests',
    null,
    200,
    adminToken
  );

  // Test 20: Admin approves owner request
  if (requestId) {
    await runTest(
      'Admin - Approve Owner Request',
      'POST',
      `/api/admin/owner-requests/${requestId}/approve`,
      null,
      200,
      adminToken
    );
  }

  // Test 21: Admin rejects an owner request
  let ownerReq2 = await runTest(
    'Admin - Create another user for rejection test',
    'POST',
    '/api/admin/users',
    {
      name: 'Rejection Test User Name Here',
      email: `reject${Date.now()}@example.com`,
      address: 'Test Address',
      password: 'TestPass@123',
      role: 'normal'
    },
    201,
    adminToken
  );
  
  if (ownerReq2?.id) {
    let rejectToken = await runTest(
      'Login with rejection test user',
      'POST',
      '/api/auth/login',
      {
        email: ownerReq2.email,
        password: 'TestPass@123'
      },
      200
    );

    if (rejectToken?.token) {
      let ownerReqForReject = await runTest(
        'Rejection test user - Request Owner',
        'POST',
        '/api/user/request-owner',
        null,
        201,
        rejectToken.token
      );

      if (ownerReqForReject?.request?.id) {
        await runTest(
          'Admin - Reject Owner Request',
          'POST',
          `/api/admin/owner-requests/${ownerReqForReject.request.id}/reject`,
          { reason: 'Does not meet criteria' },
          200,
          adminToken
        );
      }
    }
  }

  // ===== NORMAL USER STORE TESTS =====
  console.log('\n🏪 NORMAL USER STORE TESTS');

  // Test 22: Get all stores
  await runTest(
    'User - Get All Stores',
    'GET',
    '/api/stores',
    null,
    200,
    token
  );

  // Test 23: Search stores by name
  await runTest(
    'User - Search Stores by Name',
    'GET',
    '/api/stores?name=Test',
    null,
    200,
    token
  );

  // Test 24: Search stores by address
  await runTest(
    'User - Search Stores by Address',
    'GET',
    '/api/stores?address=Address',
    null,
    200,
    token
  );

  // ===== RATING TESTS =====
  console.log('\n⭐ RATING TESTS');

  if (storeId) {
    // Test 25: Submit rating
    await runTest(
      'User - Submit Rating',
      'POST',
      `/api/stores/${storeId}/rating`,
      { rating: 4 },
      201,
      token
    );

    // Test 26: Update rating
    await runTest(
      'User - Update Rating',
      'POST',
      `/api/stores/${storeId}/rating`,
      { rating: 5 },
      200,
      token
    );

    // Test 27: Invalid rating (too high)
    await runTest(
      'User - Invalid Rating (>5)',
      'POST',
      `/api/stores/${storeId}/rating`,
      { rating: 6 },
      400,
      token
    );

    // Test 28: Invalid rating (too low)
    await runTest(
      'User - Invalid Rating (<1)',
      'POST',
      `/api/stores/${storeId}/rating`,
      { rating: 0 },
      400,
      token
    );
  }

  // ===== AUTHENTICATION FAILURES =====
  console.log('\n🔒 AUTHENTICATION FAILURE TESTS');

  // Test 29: No token
  await runTest(
    'No Token - Get Stores',
    'GET',
    '/api/stores',
    null,
    401
  );

  // Test 30: Invalid token
  await runTest(
    'Invalid Token - Get Stores',
    'GET',
    '/api/stores',
    null,
    401
  );

  // Test 31: Non-admin accessing admin endpoint
  await runTest(
    'Non-Admin - Access Admin Dashboard',
    'GET',
    '/api/admin/summary',
    null,
    403,
    token
  );

  // ===== OWNER ROUTES =====
  console.log('\n👤 STORE OWNER TESTS');

  // Test 32: Owner views their summary
  await runTest(
    'Owner - Get Owner Summary',
    'GET',
    '/api/owner/summary',
    null,
    200,
    newToken
  );

  // Create store for owner
  let ownerStoreResp = await runTest(
    'Admin - Create Store for Owner',
    'POST',
    '/api/admin/stores',
    {
      name: 'Owner Test Store',
      email: 'ownerstore@example.com',
      address: 'Owner Store Address',
      owner_id: userId
    },
    201,
    adminToken
  );
  const ownerStoreId = ownerStoreResp?.id;

  // Submit rating to owner's store
  if (ownerStoreId && token) {
    await runTest(
      'User - Submit Rating to Owner Store',
      'POST',
      `/api/stores/${ownerStoreId}/rating`,
      { rating: 4 },
      201,
      token
    );
  }

  // Test 33: Owner views store raters
  if (ownerStoreId) {
    await runTest(
      'Owner - Get Store Raters',
      'GET',
      `/api/owner/store-raters/${ownerStoreId}`,
      null,
      200,
      newToken
    );
  }

  // Test 34: Non-owner accessing other's store raters
  if (ownerStoreId) {
    await runTest(
      'Non-Owner - Access Other Store Raters (should fail)',
      'GET',
      `/api/owner/store-raters/${ownerStoreId}`,
      null,
      403,
      token
    );
  }

  // ===== PRINT SUMMARY =====
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(2) : 0;
  console.log(`✔️ Success Rate: ${successRate}%`);
  console.log('='.repeat(50));

  if (testResults.failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}`);
      if (t.error) console.log(`     Error: ${t.error}`);
    });
  } else {
    console.log('\n🎉 All tests passed!');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
