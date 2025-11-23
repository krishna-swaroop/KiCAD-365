# Frontend Architecture Documentation

This guide explains the KiCAD-365 frontend architecture and how to extend it without modifying the core App.jsx.

## Architecture Overview

The frontend uses a **modular component architecture** where each component has a single, well-defined responsibility.

```
src/
├── App.jsx                          # Main router (home vs project)
├── components/
│   ├── ui.jsx                       # Reusable UI primitives
│   ├── viewers.jsx                  # File preview components
│   ├── FileTree.jsx                 # File tree display
│   ├── EngineeringView.jsx          # 3-pane engineering layout
│   ├── WorkInProgressPane.jsx       # Placeholder for WIP features
│   ├── ThreeDViewer.jsx            # Three.js 3D model viewer (disabled)
│   ├── ProjectDetailView.jsx       # Project view container
│   ├── ProjectHeader.jsx            # Project header bar
│   ├── ProjectSidebar.jsx           # Navigation sidebar
│   └── FileBrowserView.jsx          # File browsing view
└── utils.js                         # Helper functions
```

## Component Hierarchy

```
App.jsx
├── Home View (project gallery)
└── ProjectDetailView.jsx
    ├── ProjectHeader.jsx
    ├── ProjectSidebar.jsx
    └── Main Content Area
        ├── EngineeringView.jsx (default)
        └── FileBrowserView.jsx (when tab selected)
```

---

## Core Components

### App.jsx
**Purpose**: Main application router  
**Responsibility**: Switch between home (gallery) and project views  
**Size**: ~270 lines (down from 416 after refactoring)

**Key State**:
- `view`: 'home' | 'project'
- `selectedProject`: Currently open project
- `projects`: List of all projects

**What NOT to modify here**:
- ❌ Don't add project-specific UI
- ❌ Don't add new views inside project detail
- ❌ Don't handle file operations

**What you CAN modify**:
- ✅ Add new top-level views (e.g., settings page)
- ✅ Modify project gallery layout
- ✅ Add global state management

---

### ProjectDetailView.jsx
**Purpose**: Container for project-specific views  
**Responsibility**: Orchestrates header, sidebar, and main content area  
**Size**: ~145 lines

**Key State**:
- `activeTab`: Current sidebar selection (null = Engineering View)
- `projectFiles`: File tree data
- `tabs`: Available folder tabs
- `isSyncing`: Sync & build status

**How it works**:
```jsx
<ProjectDetailView project={selectedProject} onBack={...}>
  <ProjectHeader /> 
  <ProjectSidebar />
  {activeTab ? <FileBrowserView /> : <EngineeringView />}
</ProjectDetailView>
```

**To add a new view** (e.g., "Analytics View"):
1. Create `AnalyticsView.jsx` component
2. Add state: `const [showAnalytics, setShowAnalytics] = useState(false)`
3. Update render logic:
```jsx
{showAnalytics ? <AnalyticsView /> : 
 activeTab ? <FileBrowserView /> : <EngineeringView />}
```

---

### ProjectHeader.jsx
**Purpose**: Top bar with project name and actions  
**Props**:
- `project`: Project object
- `onBack`: Navigate back callback
- `onSyncAndBuild`: Sync action callback
- `isSyncing`: Loading state

**To add a button**:
```jsx
<header>
  {/* existing buttons */}
  <Button onClick={handleNewAction}>
    <NewIcon size={16} />
    NEW ACTION
  </Button>
</header>
```

---

### ProjectSidebar.jsx
**Purpose**: Navigation tabs (Engineering View + folders)  
**Props**:
- `tabs`: Array of `{ id, label, icon, hasItems }`
- `activeTab`: Current selection
- `onTabChange`: Selection callback

**To add a new tab**:

In `ProjectDetailView.jsx`, modify tab generation:
```jsx
const dynamicTabs = [
  ...orderedFolders.map(...),
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart, 
    hasItems: true 
  }
];
```

The sidebar automatically renders the new tab!

---

### EngineeringView.jsx
**Purpose**: 3-pane Altium Live-style layout  
**Props**:
- `projectName`: Display name
- `schematicUrl`: PDF URL for schematic pane
- `pcbUrl`: PDF URL for PCB pane
- `model3DUrl`: GLB URL for 3D model pane

**Structure**:
```
┌────────────┬─────────────┐
│ Schematic  │     PCB     │
├────────────┴─────────────┤
│       3D Model           │
└──────────────────────────┘
```

**To modify**:
1. Edit grid layout (currently `grid-cols-2 grid-rows-2`)
2. Replace `WorkInProgressPane` with actual viewers when ready
3. Add new panes by modifying the grid

---

### FileBrowserView.jsx
**Purpose**: Display files for selected folder  
**Props**:
- `activeTab`: Current folder ID
- `tabs`: Tab metadata
- `projectFiles`: File tree data
- `onPreview`: File preview callback
- `projectId`: Project ID

**Returns null if `!activeTab`** (Engineering View shown instead)

---

## Adding New Features

### Example 1: Add a "Design Review" View

**Step 1**: Create the component
```jsx
// src/components/DesignReviewView.jsx
export const DesignReviewView = ({ projectId }) => {
  return (
    <div className="h-full p-8">
      <h2>Design Review</h2>
      {/* Your review UI */}
    </div>
  );
};
```

**Step 2**: Add state in `ProjectDetailView.jsx`
```jsx
const [showReview, setShowReview] = useState(false);
```

**Step 3**: Add button to `ProjectHeader.jsx` or `ProjectSidebar.jsx`
```jsx
<Button onClick={() => setShowReview(true)}>
  Review
</Button>
```

**Step 4**: Update render logic in `ProjectDetailView.jsx`
```jsx
<main>
  {showReview ? <DesignReviewView projectId={project.id} /> :
   activeTab ? <FileBrowserView ... /> : 
   <EngineeringView ... />}
</main>
```

**Done!** No changes to App.jsx required.

---

### Example 2: Add a Custom Sidebar Tab

**In ProjectDetailView.jsx**, modify `loadProjectDetails`:

```jsx
const dynamicTabs = [
  ...orderedFolders.map(...),
  {
    id: 'custom-reports',
    label: 'Reports',
    icon: FileText,
    hasItems: customReportsExist()
  }
];
```

The sidebar automatically renders it. Handle the tab selection:

```jsx
{activeTab === 'custom-reports' ? (
  <CustomReportsView />
) : activeTab ? (
  <FileBrowserView ... />
) : (
  <EngineeringView ... />
)}
```

---

### Example 3: Replace WorkInProgressPane with Real Viewer

**Current state** (Schematic pane):
```jsx
<WorkInProgressPane 
  title="Schematic" 
  downloadUrl={schematicUrl}
  fileType="Schematic PDF"
/>
```

**To add KiCanvas**:
1. Install dependency: `npm install kicanvas`
2. Create `SchematicViewer.jsx`:
```jsx
export const SchematicViewer = ({ fileUrl }) => {
  return <kicanvas-embed src={fileUrl} controls="full" />;
};
```
3. Replace in `EngineeringView.jsx`:
```jsx
<SchematicViewer fileUrl={schematicUrl} />
```

---

## Best Practices

### ✅ DO:
- Create new components for new features
- Pass data via props
- Use existing UI components from `ui.jsx`
- Keep components focused (single responsibility)
- Test in isolation

### ❌ DON'T:
- Modify App.jsx for feature additions
- Create deeply nested component hierarchies
- Mix state management with UI rendering
- Hard-code API URLs (use `API_BASE`)
- Forget to handle loading/error states

---

## File Organization Guidelines

```
components/
├── ui.jsx              # Reusable UI (Button, Input, etc.)
├── viewers.jsx         # File viewers (Markdown, CSV, PDF)
├── *View.jsx           # Full-page views
├── *Viewer.jsx         # Embeddable viewers (3D, Schematic)
└── Project*.jsx        # Project-specific components
```

**Naming Conventions**:
- `*View` = Full page/section layouts
- `*Viewer` = Embeddable content displays
- `Project*` = Project detail components

---

## Common Tasks

### Add a Backend API Call

In `ProjectDetailView.jsx` (or any component):
```jsx
const API_BASE = `http://${window.location.hostname}:8000/api`;

const handleCustomAction = async () => {
  const res = await fetch(`${API_BASE}/projects/${project.id}/custom`);
  const data = await res.json();
  // Handle response
};
```

### Add a Toast Notification

Use the existing toast state:
```jsx
setToast({ 
  type: 'success', // or 'error'
  message: 'Operation completed!' 
});
```

### Add a Modal Dialog

Import and use `PreviewModal` as a template, or create similar:
```jsx
{showModal && (
  <CustomModal onClose={() => setShowModal(false)}>
    {/* Modal content */}
  </CustomModal>
)}
```

---

## Testing Your Changes

1. **Hot reload**: Vite automatically reloads on save
2. **Check browser console**: Look for errors
3. **Test navigation**: Switch between views
4. **Test empty states**: Handle missing data gracefully

---

## Future Improvements

### Short Term
- Add React 18 support for Three.js 3D viewer
- Implement KiCanvas for Schematic/PCB panes
- Add file upload functionality

### Long Term
- Add Redux/Zustand for state management
- Implement drag & resize panes
- Add keyboard shortcuts
- Create component library (Storybook)

---

## Getting Help

- **Component not rendering?** Check props and console errors
- **State not updating?** Verify parent passes callbacks correctly
- **Styling broken?** Check Tailwind classes and parent container

For questions about the architecture, refer to this doc or check the component source code directly!
