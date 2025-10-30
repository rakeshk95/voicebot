# 🧪 Dynamic Variables Testing Guide

## Prerequisites
- Backend server running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Valid authentication token
- At least one campaign with dynamic variables configured

## Test Cases

### 1. **Campaign Setup Test**
```bash
# Create a test campaign with variables:
# Go to /campaigns/new → Flow step → Variables tab
# Add these variables:
# - Key: customer_name, Value: John Doe
# - Key: appointment_date, Value: 2025-10-30
# - Key: service_type, Value: Consultation
```

### 2. **UI Display Test**
1. Navigate to `/campaigns`
2. Find your test campaign
3. Click the phone icon (📞) to open "Make Test Call"
4. **Expected Results:**
   - ✅ Campaign details section (blue box)
   - ✅ **NEW**: "Available Variables" section (green box)
   - ✅ Variables displayed as: `customer_name → John Doe`
   - ✅ Helper text: "These variables will be automatically populated in the call"

### 3. **API Integration Test**
1. Open Browser DevTools (F12) → Network tab
2. In test call dialog, enter phone number: `9876543210`
3. Click "Make Call"
4. **Check API Request:**
   ```json
   POST /api/v1/calls
   {
     "campaign_id": "your-campaign-id",
     "to_number": "9876543210",
     "dynamic_variables": {
       "mobile_number": "9876543210",
       "customer_name": "John Doe",
       "appointment_date": "2025-10-30",
       "service_type": "Consultation"
     },
     "call_metadata": {
       "org_id": "your-org-id",
       "user_id": "your-user-id"
     }
   }
   ```

### 4. **CallHistory Integration Test**
1. Navigate to `/call-history`
2. Select your test campaign from dropdown
3. Click phone icon on any call record
4. **Check API Request:** Should include same dynamic variables structure

### 5. **Edge Cases Test**

#### A. Campaign with No Variables
- Create campaign without variables in Flow step
- **Expected:** No "Available Variables" section in test call dialog
- **Expected:** API call only includes `mobile_number`

#### B. Campaign with Empty Variables
- Create variables with empty values
- **Expected:** Variables still appear in UI and API

#### C. Campaign with Special Characters
- Create variables with special characters: `customer_name → John's Café`
- **Expected:** Properly escaped in API call

### 6. **Backend Verification Test**
Check backend logs for:
```
📋 Dynamic variables for row 1: {'customer_name': 'John Doe', 'appointment_date': '2025-10-30', 'service_type': 'Consultation'}
📡 Sending request to external API: {"to_number": "9876543210", "dynamic_variables": {...}, "metadata": {...}, "campaign_id": "..."}
```

### 7. **Console Testing**
Open browser console and run:
```javascript
// Test campaign data structure
const campaign = {
  id: "test-campaign-id",
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

// Test variable extraction
const variables = campaign?.llm?.promptJson?.promptVariables || {};
console.log("Variables:", variables);
console.log("Variable count:", Object.keys(variables).length);
```

## Expected Results Summary

| Test Case | UI Display | API Integration | Status |
|-----------|------------|-----------------|---------|
| Campaign with variables | ✅ Green box shows variables | ✅ Variables in request | ✅ |
| Campaign without variables | ✅ No green box | ✅ Only mobile_number | ✅ |
| CallHistory integration | ✅ Same as campaigns | ✅ Same structure | ✅ |
| Edge cases | ✅ Handles gracefully | ✅ Proper escaping | ✅ |

## Troubleshooting

### If variables don't appear in UI:
1. Check campaign has `llm.promptJson.promptVariables` configured
2. Verify variables are saved in database
3. Check browser console for JavaScript errors

### If API call fails:
1. Check Network tab for 400/500 errors
2. Verify authentication token is valid
3. Check backend logs for detailed error messages

### If variables are missing from API:
1. Verify campaign data is loaded correctly
2. Check the `makeCall` function implementation
3. Ensure variables are being spread correctly: `...(campaign?.llm?.promptJson?.promptVariables || {})`

## Success Criteria
- ✅ Variables display correctly in test call dialog
- ✅ Variables are included in API requests
- ✅ Both Campaigns and CallHistory pages work
- ✅ Edge cases handled gracefully
- ✅ No JavaScript errors in console
- ✅ Backend receives and processes variables correctly
