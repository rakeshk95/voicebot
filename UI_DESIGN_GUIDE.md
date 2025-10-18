# Voxiflow UI Design Guide

## 🎨 Visual Design System

### Color Palette

#### Primary Colors:
- **Blue Gradient**: `from-blue-600 to-indigo-600` (Templates, Call features)
- **Purple Gradient**: `from-purple-600 to-pink-600` (Integrations, AI features)
- **Green**: `from-green-500 to-green-600` (WhatsApp, Success states)
- **Orange/Red**: `from-orange-600 to-red-600` (Automations, Alerts)

#### Status Colors:
- **Success**: `emerald-100` / `emerald-700`
- **Warning**: `yellow-100` / `yellow-700`
- **Error**: `red-100` / `red-700`
- **Info**: `blue-100` / `blue-700`
- **Neutral**: `gray-100` / `gray-700`

---

## 📱 Page-by-Page Visual Design

### 1. 🤖 AI Assistant (`/ai-chat`)

```
┌──────────────────────────────────────────────────────────────┐
│ ⭐ AI Assistant          [🟢 Online] [⚙️ Settings]            │
│    Powered by Advanced Language Models                        │
├──────────────────────────────────────────────────────────────┤
│ [💬 New Conversation]                                         │
│                                                               │
│ 📋 Conversations:      │  🔵 Quick Actions:                  │
│ ┌─────────────────┐   │  [🧠 Analyze Performance]           │
│ │ Campaign Strat  │   │  [⚡ Set Up Batch]                  │
│ │ How to optimize │   │  [📥 Generate Report]               │
│ │ 2:30 PM         │   │  [⏰ Optimize Times]                │
│ └─────────────────┘   │                                     │
│                       │  ┌──────────────────────────────┐   │
│ ┌─────────────────┐   │  │ 👤 You: Help me analyze...  │   │
│ │ Batch Call [2]  │   │  │     2:45 PM ✓               │   │
│ │ Setup help      │   │  └──────────────────────────────┘   │
│ │ 1:15 PM         │   │                                     │
│ └─────────────────┘   │  ┌──────────────────────────────┐   │
│                       │  │ 🤖 AI: I can help you with  │   │
│                       │  │     that! Here's what I      │   │
│                       │  │     recommend...             │   │
│                       │  │     2:45 PM [📋 🙋 👎]      │   │
│                       │  └──────────────────────────────┘   │
│                       │                                     │
│                       │  [📎] [🎤] [Type message...] [📤]  │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Split-screen layout: Conversations sidebar + Chat area
- Gradient header with online status badge
- Quick action chips for common tasks
- Message bubbles with distinct user/AI styling
- Timestamp and status indicators
- Feedback buttons (copy, thumbs up/down)
- Voice and attachment input options

---

### 2. 💬 WhatsApp Integration (`/whatsapp`)

```
┌──────────────────────────────────────────────────────────────┐
│ 💚 WhatsApp Integration       [🟢 Connected]                  │
│    Connect with WhatsApp Business API                         │
├──────────────────────────────────────────────────────────────┤
│ 📊 Stats:                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 📤12,453│ │ ✅98.5% │ │ 📈67%   │ │ 💬342   │           │
│ │ Sent    │ │ Delivery│ │ Response│ │ Active  │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├──────────────────────────────────────────────────────────────┤
│ [Setup & Config] [Features & Use Cases] [Templates]          │
├──────────────────────────────────────────────────────────────┤
│ 📱 Business Phone Number: [+1 (555) 123-4567    ]           │
│ 🔑 API Key: [••••••••••••••••••••••••] [📋]                 │
│ 🔗 Webhook: [https://api.voxiflow.com/...] [📋]             │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ℹ️ Need Help Getting Started?                          │   │
│ │   View our setup guide for instructions  [View Guide]  │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ [Test Connection]           [🔗 Connect WhatsApp]            │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Green gradient theme (WhatsApp colors)
- Real-time stats cards
- Three-tab layout (Setup, Features, Templates)
- API configuration fields
- Connection status indicator
- Help callout box
- Message template library

---

### 3. 🔌 Integrations (`/integrations`)

```
┌──────────────────────────────────────────────────────────────┐
│ 🟣 Integrations                [⚡ Browse All]                │
│    Connect Voxiflow with your favorite tools                  │
├──────────────────────────────────────────────────────────────┤
│ 📊 Stats:                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 🔌5     │ │ 💾12,453│ │ 🔄2 min │ │ ✅99.8% │           │
│ │ Active  │ │ Synced  │ │ Last    │ │ Success │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├──────────────────────────────────────────────────────────────┤
│ [All] [CRM] [Communication] [Productivity] [Sync Logs]       │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │ ☁️ Salesforce   │ │ 🔷 Zoho CRM    │ │ 🟠 HubSpot     ││
│ │ [✅ Connected]  │ │ [✅ Connected]  │ │ [Available]    ││
│ │                 │ │                 │ │                 ││
│ │ Sync contacts   │ │ Two-way sync    │ │ Contact & co... ││
│ │ and leads       │ │ Deal tracking   │ │ Deal auto...    ││
│ │                 │ │                 │ │                 ││
│ │ ✓ Auto-sync     │ │ ✓ Call logs     │ │ ✓ Call track    ││
│ │ ✓ Activity log  │ │ ✓ Custom fields │ │ ✓ Email inte    ││
│ │                 │ │                 │ │                 ││
│ │ [⚙️ Configure]  │ │ [⚙️ Configure]  │ │ [🔗 Connect]   ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                               │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │ 💬 Slack        │ │ 🟣 MS Teams     │ │ ⚡ Zapier      ││
│ │ [Available]     │ │ [Available]     │ │ [Available]    ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Purple gradient theme
- Stats dashboard for integrations
- Category tabs (All, CRM, Communication, etc.)
- Grid layout with integration cards
- Status badges (Connected, Available, Coming Soon)
- Feature checkmarks
- Configure/Connect buttons
- Sync logs tab

---

### 4. 📄 Templates (`/templates`)

```
┌──────────────────────────────────────────────────────────────┐
│ 📄 Templates                         [➕ Create Template]     │
│    Manage your call, SMS, and email templates                │
├──────────────────────────────────────────────────────────────┤
│ 📊 Stats:                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 📄6     │ │ ⭐3     │ │ 📈9,918 │ │ ✅82%   │           │
│ │ Total   │ │ Favorite│ │ Usage   │ │ Success │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├──────────────────────────────────────────────────────────────┤
│ 🔍 [Search templates...                                    ] │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 📞 Welcome Call Script ⭐                                ││
│ │ [Onboarding] [VOICE]                                     ││
│ │                                                           ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Hello {{customer_name}}, welcome to {{company...   │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Usage: 1,245  Success: 87%                               ││
│ │                                                           ││
│ │ [👁️ Preview] [📋 Duplicate] [✏️ Edit] [🗑️]             ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 📞 Appointment Reminder ⭐                               ││
│ │ [Reminders] [VOICE]                                      ││
│ │                                                           ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ Hi {{customer_name}}, this is a reminder about... │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                           ││
│ │ Usage: 3,421  Success: 92%                               ││
│ │                                                           ││
│ │ [👁️ Preview] [📋 Duplicate] [✏️ Edit] [🗑️]             ││
│ └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Blue gradient theme
- Stats cards for template metrics
- Search functionality
- Template cards with:
  - Icon and favorite star
  - Category and type badges
  - Content preview box
  - Usage statistics
  - Action buttons (Preview, Duplicate, Edit, Delete)
- Variable placeholders ({{customer_name}})

---

### 5. ⚡ Automations (`/automations`)

```
┌──────────────────────────────────────────────────────────────┐
│ ⚡ Automations                    [➕ Create Automation]       │
│    Automate your workflows and save time                      │
├──────────────────────────────────────────────────────────────┤
│ 📊 Stats:                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ ⚡4     │ │ ▶️3,091 │ │ ✅87%   │ │ ⏰245h  │           │
│ │ Active  │ │ Executed│ │ Success │ │ Saved   │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├──────────────────────────────────────────────────────────────┤
│ Your Automations:                                             │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Post-Call Follow-up [🟢 Active]                        │   │
│ │ Send WhatsApp message and email after successful call  │   │
│ │                                                         │   │
│ │ [📞 Call Completed] → [💬 WhatsApp] → [📧 Email] →    │   │
│ │ [👥 Update CRM]                                        │   │
│ │                                                         │   │
│ │ Executions: 1,245  Success: 94%  Last: 1 hour ago     │   │
│ │                                     [🔘] [✏️] [🗑️]     │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Failed Call Recovery [🟢 Active]                       │   │
│ │ Schedule retry and send SMS for failed calls           │   │
│ │                                                         │   │
│ │ [❌ Call Failed] → [⏰ Schedule] → [💬 SMS] →         │   │
│ │ [👥 Notify Team]                                       │   │
│ │                                                         │   │
│ │ Executions: 342  Success: 78%  Last: 2 hours ago      │   │
│ │                                     [🔘] [✏️] [🗑️]     │   │
│ └────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│ Automation Templates:                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │👥Welcome │ │📈Re-eng..│ │💬Survey  │ │⏰Payment │       │
│ │Series    │ │Campaign  │ │Feedback  │ │Reminders │       │
│ │[+ Use]   │ │[+ Use]   │ │[+ Use]   │ │[+ Use]   │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Orange/Red gradient theme
- Stats dashboard
- Automation flow visualization with arrows
- Visual workflow display (Trigger → Actions)
- Toggle switches for enable/disable
- Execution statistics
- Edit and delete actions
- Automation templates for quick start

---

## 🎯 Common UI Patterns

### 1. Stats Cards
```
┌─────────────────┐
│ 📊 Icon         │
│                 │
│ 12,453          │ ← Large number, bold
│ Label           │ ← Small text, gray
└─────────────────┘
```

### 2. Status Badges
```
[🟢 Active]      - Green with pulse dot
[🟡 Paused]      - Yellow
[⚪ Draft]       - Gray
[✅ Connected]   - Emerald
[Available]      - Blue
[Coming Soon]    - Gray
```

### 3. Action Buttons
```
Primary: [🔗 Connect WhatsApp]    - Gradient background
Outline: [⚙️ Configure]           - Border, transparent bg
Ghost:   [📋 Copy]                - No border, hover effect
Icon:    [🗑️]                     - Icon only
```

### 4. Cards with Hover Effect
```
┌────────────────────┐
│ 📄 Title           │ ← On hover:
│ Description...     │   shadow increases
│ [Action Button]    │   slight scale up
└────────────────────┘
```

### 5. Section Headers
```
⭐ Title                    [Badge] [Actions]
   Subtitle description
───────────────────────────────────────────────
```

---

## 📐 Layout Grid System

### Desktop (>1024px):
- 3-column grid for cards
- Sidebar (280px) + Content area
- Max width: 1440px

### Tablet (768px - 1024px):
- 2-column grid for cards
- Collapsible sidebar
- Full width content

### Mobile (<768px):
- 1-column stacked layout
- Bottom navigation
- Full width cards

---

## 🎨 Typography

### Headings:
- **Page Title**: `text-3xl font-bold text-gray-900`
- **Section Title**: `text-xl font-semibold text-gray-900`
- **Card Title**: `text-lg font-semibold text-gray-900`

### Body Text:
- **Primary**: `text-gray-900`
- **Secondary**: `text-gray-600`
- **Muted**: `text-gray-500`

### Special Text:
- **Success**: `text-green-600`
- **Warning**: `text-yellow-600`
- **Error**: `text-red-600`

---

## 🌟 Interactive States

### Hover States:
- Cards: `hover:shadow-md transition-shadow`
- Buttons: `hover:bg-blue-700 transition-colors`
- Links: `hover:text-blue-600 transition-colors`

### Active States:
- Sidebar items: `bg-blue-50 border-l-4 border-blue-600`
- Tabs: `bg-white border-b-2 border-blue-600`
- Switches: `bg-green-600`

### Loading States:
- Spinner: Rotating circle border
- Skeleton: Animated gray boxes
- Progress: Animated progress bar

---

## 📱 Responsive Breakpoints

```
sm:  640px  - Small tablets
md:  768px  - Tablets
lg:  1024px - Laptops
xl:  1280px - Desktops
2xl: 1536px - Large screens
```

---

## 🎭 Animation Guidelines

### Transitions:
- **Duration**: 150ms - 300ms
- **Easing**: `ease-in-out`

### Animations:
- **Pulse**: For online/active indicators
- **Bounce**: For loading dots
- **Fade**: For tooltips and modals
- **Slide**: For sidebars and drawers

---

This design guide ensures consistency across all new features and provides a reference for future development!

