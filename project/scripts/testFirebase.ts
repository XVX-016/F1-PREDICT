import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig, validateConfig } from './config';

// Test Firebase configuration
const testFirebaseConnection = async () => {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Validate configuration
    validateConfig();
    console.log('✅ Environment variables are set');
    
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log(`📁 Project ID: ${firebaseConfig.projectId}`);
    
    // Test Firestore connection
    console.log('📊 Testing Firestore connection...');
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Firestore connection successful');
    console.log(`📄 Test collection has ${snapshot.size} documents`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Test Jolpica API
const testJolpicaAPI = async () => {
  try {
    console.log('📡 Testing Jolpica API...');
    
    const response = await fetch('https://api.jolpi.ca/ergast/f1/2025/drivers');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const driverCount = data.MRData?.DriverTable?.Drivers?.length || 0;
    
    console.log('✅ Jolpica API connection successful');
    console.log(`👥 Found ${driverCount} drivers`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Jolpica API test failed:', error);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Firebase and API tests...\n');
  
  const firebaseTest = await testFirebaseConnection();
  console.log('');
  const jolpicaTest = await testJolpicaAPI();
  
  console.log('\n📊 Test Results:');
  console.log(`Firebase: ${firebaseTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Jolpica API: ${jolpicaTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (firebaseTest && jolpicaTest) {
    console.log('\n🎉 All tests passed! You can now run:');
    console.log('  npm run seed-firebase');
    console.log('  npm run train-ml');
  } else {
    console.log('\n⚠️ Some tests failed. Please check your configuration.');
  }
};

// Run tests
runTests()
  .then(() => {
    console.log('\n🏁 Tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  });

export { testFirebaseConnection, testJolpicaAPI, runTests };
