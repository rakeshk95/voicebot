# Batch Calling Monitor UI - User Guide

## ✨ New Features

### 🎯 **Real-Time Monitoring Dashboard**

The new enhanced batch calling page provides a **beautiful, clean interface** with comprehensive tracking of your batch operations.

---

## 📊 **What You'll See**

### **1. Active Batch Operation Card** (When Running)

![Active Batch](concept)

**Displays:**
- ✅ **Operation Name** - Your custom batch name or auto-generated
- ✅ **Status Badge** - Color-coded status (Starting, Processing, Paused, Completed, Failed)
- ✅ **Progress Bar** - Visual progress with percentage
- ✅ **Real-time Stats Cards:**
  - 📊 **Total Calls** - Total number in batch
  - ✅ **Completed** - Successfully processed calls
  - ⏳ **Pending** - Remaining calls to process  
  - ❌ **Failed** - Failed calls (with error tracking)

**Additional Metrics:**
- 📈 **Speed** - Calls per minute rate
- ⏱️ **Duration** - Time elapsed since start
- 🎯 **ETA** - Estimated time to completion

**Control Buttons:**
- ⏸️ **Pause** - Temporarily pause the batch
- ▶️ **Resume** - Continue paused batch
- ⏹️ **Stop** - Cancel the batch operation
- 🔄 **Refresh** - Manual refresh
- 🔄 **Auto ON/OFF** - Toggle auto-refresh (every 3 seconds)

---

### **2. Recent Operations** (History)

Shows your last 10 batch operations with:
- ✅ **Status Badge** - Visual status indicator
- 📊 **Progress Bar** - Completion percentage
- 📈 **Statistics:**
  - Total calls
  - Completed count
  - Failed count
  - Start time
- 🎯 **Progress Percentage** - Large, easy-to-read number

---

### **3. Start New Batch Form**

**Clean, organized form with:**
- 🏢 **Organization** - Dropdown selector
- 📢 **Campaign** - Filtered by selected org
- 📝 **Batch Name** (Optional) - Custom name for tracking
- ⏱️ **Delay Between Calls** - Configurable (1-60 seconds)
- 🔧 **Worker Channels** - Performance tuning (1-32)
- 📁 **Excel File Upload** - Drag & drop or browse

**Smart Features:**
- ✅ Form validation
- ✅ Field dependencies (campaign disabled until org selected)
- ✅ File type validation (.xlsx, .xls only)
- ✅ Visual feedback (green checkmark when file selected)
- ✅ Helpful tooltips and descriptions

---

## 🎨 **Visual Design**

### **Color-Coded Status**

| Status | Color | Meaning |
|--------|-------|---------|
| ✅ **Completed** | Green | Successfully finished |
| 🔵 **Processing** | Blue | Currently running |
| 🟡 **Starting** | Yellow | Initializing |
| 🟠 **Paused** | Orange | Temporarily stopped |
| 🔴 **Failed** | Red | Encountered errors |
| ⚫ **Cancelled** | Gray | User cancelled |

### **Stat Cards**
- **Blue** - Total Calls
- **Green** - Completed
- **Orange** - Pending  
- **Red** - Failed

Each card has:
- Icon indicator
- Large number display
- Descriptive label

---

## 🔄 **Real-Time Updates**

### **Auto-Refresh Mode**
When enabled:
- 🔄 Updates every **3 seconds**
- ⚡ Shows spinning icon
- 📊 Automatically refreshes stats
- 🎯 Updates progress in real-time

### **Manual Refresh**
- Click "Refresh" button
- Updates current operation status
- Fetches latest statistics

---

## 🎯 **How To Use**

### **Starting a Batch:**

1. **Select Organization** from dropdown
2. **Choose Campaign** (filtered by org)
3. **Upload Excel File** with "Mobile Number" column
4. *(Optional)* **Set Batch Name** for easy tracking
5. *(Optional)* **Configure Settings:**
   - Delay between calls (default: 5 seconds)
   - Worker channels (default: 16)
6. **Click "Start Batch Operation"**

### **Monitoring:**

1. **Watch the dashboard** appear with your active operation
2. **Track progress** in real-time:
   - Progress bar fills up
   - Completed count increases
   - ETA updates dynamically
3. **Check speed** (calls/minute) to gauge performance
4. **Monitor failures** - Red stat card shows any failed calls

### **Controlling:**

#### Pause:
- Click **"Pause"** to temporarily stop
- Use when: Need to adjust settings, system maintenance

#### Resume:
- Click **"Resume"** to continue from where you paused
- Batch picks up exactly where it left off

#### Stop:
- Click **"Stop"** to cancel completely
- ⚠️ **Warning:** Cannot be resumed once stopped
- Operation moves to "Recent Operations" history

### **Checking History:**

1. **Scroll to "Recent Operations"** section
2. **View past batches** with full stats
3. **Click on any operation** to see details
4. **Track performance** over time

---

## 📈 **Key Metrics Explained**

### **Progress Percentage**
- `(Completed Calls / Total Calls) × 100`
- Updates in real-time
- Shown in progress bar and large number

### **Speed (Calls/Minute)**
- `Completed Calls / Time Elapsed (minutes)`
- Indicates system performance
- Higher = faster processing

### **ETA (Estimated Time)**
- `Remaining Calls / Current Speed`
- Smart calculation based on current rate
- Updates as speed changes
- Shows "Less than 1 min" when nearly done

### **Duration**
- Time elapsed since batch started
- Format: `Xh Ym Zs`
- Continues counting until completion

---

## 🚨 **Error Handling**

### **Failed Calls Tracking**
- ❌ **Red stat card** shows failed count
- 📊 **Visible in recent operations**
- 🔍 **Check detailed errors** using monitoring tools:
  ```bash
  cd D:\Voxiflow\be\chatbot
  python check_call_failures.py
  ```

### **Operation Failures**
- 🔴 Status changes to "Failed"
- ⚠️ Error message displayed
- 📝 Details saved in recent operations
- 🛠️ Use dashboard to check errors

---

## 💡 **Pro Tips**

### **Performance Optimization:**
1. **Increase Worker Channels** (up to 32) for faster processing
2. **Reduce Delay** (minimum 1 second) if API allows
3. **Monitor Speed** metric to find optimal settings
4. **Use Auto-Refresh** during active operations

### **Best Practices:**
1. **Name Your Batches** - Easy to identify in history
2. **Check Recent Operations** - Learn from past performance
3. **Monitor Failed Count** - Investigate if >0
4. **Use Pause** - Instead of stopping when you need to check something
5. **Keep Auto-Refresh ON** - For accurate real-time tracking

### **Troubleshooting:**
1. **If progress stuck:**
   - Check "Failed" count
   - Click "Refresh" manually
   - Check backend workers are running

2. **If no stats showing:**
   - Ensure batch was started successfully
   - Check browser console for errors
   - Verify backend is running (port 8000)

3. **If controls disabled:**
   - Some operations can't be paused
   - Completed/Failed ops can't be controlled
   - Check operation status badge

---

## 🎨 **UI Components**

### **Cards Used:**
- ✅ Main Operation Card (with border highlight)
- 📊 Stat Cards (4 metrics)
- 📋 Recent Operations Cards
- 📝 Form Card

### **Interactive Elements:**
- 🔘 Buttons (Primary, Outline, Destructive)
- 📊 Progress Bars (Smooth animations)
- 🏷️ Status Badges (Color-coded)
- 🔽 Dropdowns (Org, Campaign)
- 📁 File Input (With visual feedback)

### **Icons Used:**
- 📞 Phone - Active batch
- ⏰ Clock - Pending/Time metrics
- ✅ CheckCircle - Completed
- ❌ XCircle - Failed
- 👥 Users - Total calls
- 📈 TrendingUp - Speed
- 📊 BarChart - ETA
- 🔄 RefreshCw - Refresh (spins when active)
- ▶️ Play - Resume
- ⏸️ Pause - Pause
- ⏹️ Square - Stop
- 📤 Upload - Start/File upload

---

## 🔗 **Integration with Backend**

### **API Endpoints Used:**
```
POST   /api/v1/unified-batch-calls/create          - Start batch
GET    /api/v1/unified-batch-calls/operations/:id  - Get status  
POST   /api/v1/unified-batch-calls/operations/:id/pause   - Pause
POST   /api/v1/unified-batch-calls/operations/:id/resume  - Resume
POST   /api/v1/unified-batch-calls/operations/:id/cancel  - Stop
```

### **Real-Time Polling:**
- ✅ Polls every **3 seconds** when auto-refresh ON
- ✅ Only polls active operations (starting, processing)
- ✅ Stops polling when completed/failed/cancelled
- ✅ Moves to history automatically when done

---

## 📱 **Responsive Design**

### **Desktop (>768px):**
- 4-column stat grid
- 3-column metrics row
- Side-by-side form fields

### **Mobile (<768px):**
- 2-column stat grid
- Stacked metrics
- Full-width form fields
- Touch-friendly buttons

---

## 🎯 **Next Steps**

1. **Start a test batch** to see the UI in action
2. **Try pausing/resuming** to see controls work
3. **Check failed calls** if any errors occur
4. **Review recent operations** to track history
5. **Optimize settings** based on speed metrics

---

## 📚 **Related Documentation**

- [Monitoring Tools Guide](../../be/chatbot/MONITORING_TOOLS.md)
- [Call API Flow](../../be/chatbot/CALL_API_FLOW.md)
- [API Documentation](../../be/chatbot/CAMPAIGN_VERSIONING_API_DOCS.md)

---

**Enjoy your new batch calling experience!** 🚀

