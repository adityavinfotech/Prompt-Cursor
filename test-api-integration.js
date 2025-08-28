// Simple test script to verify iteration API functionality
const testIterationAPI = async () => {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing Iteration API Integration...\n');
  
  // Test 1: Initial Analysis
  console.log('1️⃣ Testing Initial Analysis...');
  try {
    const initialResponse = await fetch(`${baseURL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: 'Create a user authentication system with login and registration',
        formData: {
          taskType: 'Feature Development',
          goal: 'Implement secure user authentication',
          components: ['auth', 'user', 'database'],
          inputs: 'User credentials, email',
          outputs: 'JWT tokens, user session'
        }
      })
    });
    
    if (initialResponse.ok) {
      const initialData = await initialResponse.json();
      console.log('✅ Initial analysis successful');
      console.log(`   Goals: ${initialData.data.goals.length}`);
      console.log(`   Questions: ${initialData.data.questions.length}`);
      console.log(`   Assumptions: ${initialData.data.assumptions.length}\n`);
      
      // Test 2: Create Iteration
      console.log('2️⃣ Testing Iteration Creation...');
      const iterationResponse = await fetch(`${baseURL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement: 'Create a user authentication system with login and registration',
          formData: {
            taskType: 'Feature Development',
            goal: 'Implement secure user authentication',
            components: ['auth', 'user', 'database'],
            inputs: 'User credentials, email',
            outputs: 'JWT tokens, user session'
          },
          iterationData: {
            previousAnalysis: initialData.data,
            userEdits: {
              goals: [...initialData.data.goals, 'Add two-factor authentication'],
              constraints: [...initialData.data.constraints, 'Must comply with GDPR']
            },
            userFeedback: 'Please focus more on security aspects and add OAuth integration',
            iterationNumber: 2
          }
        })
      });
      
      if (iterationResponse.ok) {
        const iterationData = await iterationResponse.json();
        console.log('✅ Iteration creation successful');
        console.log(`   Goals: ${iterationData.data.goals.length}`);
        console.log(`   Questions: ${iterationData.data.questions.length}`);
        console.log(`   Assumptions: ${iterationData.data.assumptions.length}`);
        console.log('✅ All API tests passed!\n');
        
        return { success: true, initialData: initialData.data, iterationData: iterationData.data };
      } else {
        const error = await iterationResponse.json();
        console.log('❌ Iteration creation failed:', error);
        return { success: false, error };
      }
    } else {
      const error = await initialResponse.json();
      console.log('❌ Initial analysis failed:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return { success: false, error: error.message };
  }
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testIterationAPI().then(result => {
    if (result.success) {
      console.log('🎉 Integration test completed successfully!');
      process.exit(0);
    } else {
      console.log('💥 Integration test failed!');
      process.exit(1);
    }
  });
}

module.exports = { testIterationAPI };
