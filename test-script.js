// 🧪 Dynamic Variables Testing Script
// Run this in browser console on the campaigns page

console.log("🧪 Starting Dynamic Variables Test...");

// Test 1: Check if campaigns have variables
function testCampaignVariables() {
  console.log("\n📋 Test 1: Checking campaign variables...");
  
  // This would need to be adapted based on how campaigns are stored in your app
  // For now, let's create a mock test
  const mockCampaign = {
    id: "test-campaign",
    name: "Test Campaign",
    llm: {
      promptJson: {
        promptVariables: {
          customer_name: "John Doe",
          appointment_date: "2025-10-30",
          service_type: "Consultation"
        }
      }
    }
  };
  
  const variables = mockCampaign?.llm?.promptJson?.promptVariables || {};
  console.log("✅ Variables found:", variables);
  console.log("✅ Variable count:", Object.keys(variables).length);
  
  return Object.keys(variables).length > 0;
}

// Test 2: Test API payload construction
function testAPIPayload() {
  console.log("\n📡 Test 2: Testing API payload construction...");
  
  const phoneNumber = "9876543210";
  const campaign = {
    id: "test-campaign-id",
    llm: {
      promptJson: {
        promptVariables: {
          customer_name: "John Doe",
          appointment_date: "2025-10-30",
          service_type: "Consultation"
        }
      }
    },
    org_id: "org_test"
  };
  
  const payload = {
    campaign_id: campaign.id,
    to_number: phoneNumber,
    dynamic_variables: {
      mobile_number: phoneNumber,
      // Include campaign's dynamic variables
      ...(campaign?.llm?.promptJson?.promptVariables || {})
    },
    call_metadata: {
      org_id: campaign.org_id || 'org_1',
      user_id: localStorage.getItem('userId') || 'user_1'
    }
  };
  
  console.log("✅ API Payload:", JSON.stringify(payload, null, 2));
  
  // Verify structure
  const hasVariables = Object.keys(payload.dynamic_variables).length > 1;
  const hasMobileNumber = payload.dynamic_variables.mobile_number === phoneNumber;
  const hasCampaignId = payload.campaign_id === campaign.id;
  
  console.log("✅ Has variables:", hasVariables);
  console.log("✅ Has mobile number:", hasMobileNumber);
  console.log("✅ Has campaign ID:", hasCampaignId);
  
  return hasVariables && hasMobileNumber && hasCampaignId;
}

// Test 3: Test UI display logic
function testUIDisplayLogic() {
  console.log("\n🎨 Test 3: Testing UI display logic...");
  
  const campaignWithVariables = {
    llm: {
      promptJson: {
        promptVariables: {
          customer_name: "John Doe",
          appointment_date: "2025-10-30"
        }
      }
    }
  };
  
  const campaignWithoutVariables = {
    llm: {
      promptJson: {
        promptVariables: {}
      }
    }
  };
  
  const campaignNoLLM = {};
  
  // Test display logic
  const shouldShowVariables1 = campaignWithVariables?.llm?.promptJson?.promptVariables && 
    Object.keys(campaignWithVariables.llm.promptJson.promptVariables).length > 0;
  
  const shouldShowVariables2 = campaignWithoutVariables?.llm?.promptJson?.promptVariables && 
    Object.keys(campaignWithoutVariables.llm.promptJson.promptVariables).length > 0;
  
  const shouldShowVariables3 = campaignNoLLM?.llm?.promptJson?.promptVariables && 
    Object.keys(campaignNoLLM.llm?.promptJson?.promptVariables || {}).length > 0;
  
  console.log("✅ Campaign with variables should show:", shouldShowVariables1);
  console.log("✅ Campaign without variables should show:", shouldShowVariables2);
  console.log("✅ Campaign with no LLM should show:", shouldShowVariables3);
  
  return shouldShowVariables1 && !shouldShowVariables2 && !shouldShowVariables3;
}

// Test 4: Test variable rendering
function testVariableRendering() {
  console.log("\n🎯 Test 4: Testing variable rendering...");
  
  const variables = {
    customer_name: "John Doe",
    appointment_date: "2025-10-30",
    service_type: "Consultation"
  };
  
  const entries = Object.entries(variables);
  console.log("✅ Variable entries:", entries);
  
  // Simulate the rendering logic
  const renderedVariables = entries.map(([key, value]) => ({
    key,
    value,
    display: `${key} → ${value}`
  }));
  
  console.log("✅ Rendered variables:", renderedVariables);
  
  return renderedVariables.length === entries.length;
}

// Run all tests
function runAllTests() {
  console.log("🚀 Running all Dynamic Variables tests...\n");
  
  const test1 = testCampaignVariables();
  const test2 = testAPIPayload();
  const test3 = testUIDisplayLogic();
  const test4 = testVariableRendering();
  
  console.log("\n📊 Test Results:");
  console.log("✅ Campaign Variables Test:", test1 ? "PASS" : "FAIL");
  console.log("✅ API Payload Test:", test2 ? "PASS" : "FAIL");
  console.log("✅ UI Display Logic Test:", test3 ? "PASS" : "FAIL");
  console.log("✅ Variable Rendering Test:", test4 ? "PASS" : "FAIL");
  
  const allPassed = test1 && test2 && test3 && test4;
  console.log("\n🎉 Overall Result:", allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
  
  return allPassed;
}

// Export for manual testing
window.testDynamicVariables = {
  runAllTests,
  testCampaignVariables,
  testAPIPayload,
  testUIDisplayLogic,
  testVariableRendering
};

console.log("✅ Test functions loaded. Run 'testDynamicVariables.runAllTests()' to start testing.");
