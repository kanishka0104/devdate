# 🎨 User Flow - Project Collaboration Feature

## Visual Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│                        DevDate App                          │
│  ┌──────┬──────────┬─────────┬─────────┬──────────┬──────┐ │
│  │ Home │ Projects │ Matches │  Chat   │ Profile  │ Logout│ │
│  └──────┴──────────┴─────────┴─────────┴──────────┴──────┘ │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │      PROJECTS PAGE (Feed)          │
        │  ┌──────────────────────────────┐  │
        │  │  [Create Project] Button     │  │
        │  └──────────────────────────────┘  │
        │                                    │
        │  Filters Sidebar    │  Feed        │
        │  ┌────────────┐    │  ┌─────────┐ │
        │  │ Type       │    │  │ Card 1  │ │
        │  │ Skills     │    │  │ Card 2  │ │
        │  │ Tech Stack │    │  │ Card 3  │ │
        │  └────────────┘    │  └─────────┘ │
        └────────────────────────────────────┘
                │                    │
                │                    │
     ┌──────────┴─────────┐   ┌─────┴──────────┐
     ▼                    ▼   ▼                ▼
CREATE PROJECT      VIEW DETAILS    VIEW REQUESTS
     │                    │                    │
     │                    │                    │
     ▼                    ▼                    ▼
┌─────────┐      ┌──────────────┐    ┌────────────┐
│ Form    │      │ Full Info    │    │ Pending    │
│ Title   │      │ Owner Profile│    │ Accepted   │
│ Desc    │      │ Skills       │    │ Rejected   │
│ Type    │      │ Tech Stack   │    │            │
│ Skills  │      │ Links        │    │ [Accept]   │
│ Tech    │      │              │    │ [Reject]   │
│ Links   │      │ [Request     │    └────────────┘
│         │      │  to Collab]  │           │
│[Submit] │      └──────────────┘           │
└─────────┘              │                  │
     │                   │                  │
     │                   ▼                  ▼
     │          ┌─────────────────┐  ┌──────────────┐
     │          │ Request Form    │  │ Collaboration│
     │          │ ┌─────────────┐ │  │ Created!     │
     │          │ │ Message     │ │  │              │
     │          │ └─────────────┘ │  │ Document in  │
     │          │ [Send Request]  │  │ /collab/     │
     │          └─────────────────┘  └──────────────┘
     │                   │
     └───────────────────┴──────────────────┐
                                            ▼
                                    ┌──────────────┐
                                    │ FIRESTORE DB │
                                    │              │
                                    │ /projects    │
                                    │ /requests    │
                                    │ /collab      │
                                    └──────────────┘
```

---

## User Journey Flows

### Flow 1: Creating a Project (Project Owner)

```
START
  │
  ├─► Click "Projects" in navigation
  │     │
  │     ├─► Click "Create Project" button
  │     │     │
  │     │     ├─► Fill form:
  │     │     │    ├─ Title: "AI Recipe App"
  │     │     │    ├─ Description: "Building ML..."
  │     │     │    ├─ Type: "Machine Learning"
  │     │     │    ├─ Skills: [Python, ML, TensorFlow]
  │     │     │    ├─ Tech: [Python, Flask, React]
  │     │     │    └─ Links: GitHub URL
  │     │     │
  │     │     ├─► Click "Create Project"
  │     │     │     │
  │     │     │     ├─► Validation ✓
  │     │     │     ├─► Save to Firestore
  │     │     │     └─► Success!
  │     │     │
  │     │     └─► Redirect to Projects Feed
  │     │           │
  │     │           └─► See your new project card
  │     │
  │     └─► Project now visible to all users
  │
END
```

### Flow 2: Requesting Collaboration (Collaborator)

```
START
  │
  ├─► Navigate to Projects page
  │     │
  │     ├─► Apply filters (optional):
  │     │    ├─ Type: "Machine Learning"
  │     │    └─ Skills: "Python"
  │     │
  │     ├─► Browse project cards
  │     │     │
  │     │     └─► Click "View Details" on interesting project
  │     │           │
  │     │           ├─► Read full description
  │     │           ├─► Check required skills
  │     │           ├─► View tech stack
  │     │           │
  │     │           └─► Scroll to "Request to Collaborate"
  │     │                 │
  │     │                 ├─► Write message:
  │     │                 │    "I have 5 years Python/ML experience..."
  │     │                 │
  │     │                 ├─► Click "Send Request"
  │     │                 │     │
  │     │                 │     ├─► Check for duplicates
  │     │                 │     ├─► Save to /requests
  │     │                 │     └─► Success notification
  │     │                 │
  │     │                 └─► Return to projects feed
  │     │
  │     └─► Request now visible to project owner
  │
END
```

### Flow 3: Managing Requests (Project Owner)

```
START
  │
  ├─► Navigate to Projects page
  │     │
  │     └─► Click "View Requests" on your project
  │           │
  │           ├─► See requests organized in tabs:
  │           │    │
  │           │    ├─► PENDING TAB (active)
  │           │    │    ├─ Requester 1: "I have experience..."
  │           │    │    │   ├─ See profile pic
  │           │    │    │   ├─ See skills
  │           │    │    │   ├─ Read message
  │           │    │    │   └─ Actions: [Accept] [Reject]
  │           │    │    │
  │           │    │    └─ Requester 2: "Excited to join..."
  │           │    │
  │           │    ├─► Click "Accept" on Requester 1
  │           │    │     │
  │           │    │     ├─► Update status → "accepted"
  │           │    │     ├─► Create /collaboration doc
  │           │    │     ├─► Increment collaborator count
  │           │    │     └─► Real-time UI update
  │           │    │           │
  │           │    │           ├─► Card moves to ACCEPTED tab
  │           │    │           └─► Counter updates
  │           │    │
  │           │    ├─► ACCEPTED TAB
  │           │    │    └─ Requester 1 (now here)
  │           │    │
  │           │    └─► REJECTED TAB
  │           │         └─ (empty)
  │           │
  │           └─► Collaboration established!
  │
END
```

---

## Page Transitions

### State Diagram

```
┌─────────────┐
│   Discover  │──────┐
└─────────────┘      │
                     │
┌─────────────┐      │
│   Projects  │◄─────┤
└──────┬──────┘      │
       │             │
       ├──────► Create Project
       │             │
       ├──────► Project Details
       │             │
       └──────► Project Requests
                     │
┌─────────────┐      │
│   Matches   │◄─────┤
└─────────────┘      │
                     │
┌─────────────┐      │
│    Chat     │◄─────┤
└─────────────┘      │
                     │
┌─────────────┐      │
│   Profile   │◄─────┘
└─────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTIONS                         │
└────────┬──────────────────────────────────┬─────────────┘
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│  Create Project  │              │  Send Request    │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         ▼                                  ▼
┌──────────────────────────────────────────────────────┐
│                   VALIDATION LAYER                   │
│  ├─ Check required fields                           │
│  ├─ Verify authentication                           │
│  ├─ Prevent duplicates                              │
│  └─ Sanitize inputs                                 │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                  FIRESTORE DATABASE                  │
│                                                      │
│  /projects/{id}                                      │
│    ├─ title, description, type                      │
│    ├─ skills, techStack                             │
│    ├─ owner info                                    │
│    └─ /requests/{reqId}                             │
│         ├─ requester info                           │
│         ├─ message                                  │
│         └─ status                                   │
│                                                      │
│  /collaborations/{id}                               │
│    ├─ projectId                                     │
│    ├─ ownerId                                       │
│    └─ collaboratorId                                │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│              REAL-TIME LISTENERS                     │
│  ├─ onSnapshot for projects feed                    │
│  ├─ onSnapshot for requests                         │
│  └─ Auto-update UI on changes                       │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                   UI UPDATES                         │
│  ├─ Render new cards                                │
│  ├─ Update status badges                            │
│  ├─ Animate transitions                             │
│  └─ Show notifications                              │
└──────────────────────────────────────────────────────┘
```

---

## Component Interaction

```
┌──────────────────────────────────────────────────────┐
│                   app.html                           │
│  ┌────────────────────────────────────────────────┐ │
│  │           Navigation Bar                       │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │     Page Container (active page shown)         │ │
│  │                                                │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │    Projects Feed                         │ │ │
│  │  │  ┌─────────────┐  ┌──────────────────┐  │ │ │
│  │  │  │  Filters    │  │   Project Cards  │  │ │ │
│  │  │  │             │  │                  │  │ │ │
│  │  │  │ Type        │  │  Card 1 ←───────┼──┼─┼─┐
│  │  │  │ Skills      │  │  Card 2         │  │ │ │
│  │  │  │ Tech        │  │  Card 3         │  │ │ │
│  │  │  │             │  │                  │  │ │ │
│  │  │  │ [Apply]     │  │                  │  │ │ │
│  │  │  │ [Clear]     │  │                  │  │ │ │
│  │  │  └─────────────┘  └──────────────────┘  │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                                                      │
┌─────────────────────────────────────────────────────┘
│
└──► js/projects.js
     │
     ├──► loadProjectsFeed()
     ├──► applyProjectFilters()
     ├──► renderProjectsFeed()
     ├──► viewProjectDetails()
     ├──► submitCollaborationRequest()
     └──► handleRequest()
            │
            └──► Firestore Operations
                  │
                  ├──► db.collection('projects').add()
                  ├──► db.collection('projects').onSnapshot()
                  ├──► db.collection('requests').add()
                  └──► db.collection('collaborations').add()
```

---

## Event Flow

```
User Action          →  JavaScript           →  Firestore        →  UI Update
─────────────────────────────────────────────────────────────────────────────

Click "Projects"     →  showPage()          →                   →  Show feed
                        loadProjectsFeed()   →  Query projects   →  Render cards

Apply Filter         →  applyProjectFilters()→                  →  Re-render
                        loadProjectsFeed()   →  Filtered query   →  New cards

Create Project       →  createProject()     →  .add()           →  Success msg
                        Validation           →  Save doc         →  Navigate

View Details         →  viewProjectDetails()→  .get()           →  Show info
                        Fetch project        →  Retrieve data    →  Render form

Send Request         →  submitCollab...()   →  .add()           →  Confirmation
                        Check duplicates     →  Save request     →  Navigate

Accept Request       →  handleRequest()     →  .update()        →  Status change
                        Update status        →  Create collab    →  Tab switch
                        Create collaboration →  .add()           →  Counter++
```

---

## Error Handling Flow

```
User Input → Validation → Pass? ┬─ YES → Process → Success ✓
                                 │
                                 └─ NO  → Error Message ✗
                                           │
                                           └─► Show alert()
                                               Display in UI
                                               Log to console
                                               Don't save data
```

---

This visual guide helps understand:
- How users navigate the feature
- How data flows through the system
- How components interact
- How events are processed
- How errors are handled

Use this as a reference for understanding the architecture and flow of the Project Collaboration feature!
