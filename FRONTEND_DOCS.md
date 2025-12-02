# Frontend Application - Complete Feature Documentation

## 🎨 Technology Stack
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Styling**: Vanilla CSS
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Fetch API

## 📱 UI Components

### 1. Authentication Views

#### Login Form
- **Features**:
  - Role selection (Normal User, Admin, Store Owner)
  - Email and password validation
  - Error handling and display
  - Loading state indication
  - Auto-redirect to appropriate dashboard on successful login

- **Validation**:
  - Email format validation
  - Non-empty credentials check

#### Sign-Up Form
- **Features**:
  - User registration form
  - Name, Email, Address, Password fields
  - Full form validation
  - Auto-login after successful signup
  - Error handling for duplicate emails

- **Validation**:
  - Name: 20-60 characters
  - Email: Standard format
  - Password: 8-16 chars, uppercase + special character
  - Address: Max 400 characters

### 2. Admin Dashboard

#### Dashboard Summary
- **Displays**:
  - Total number of users
  - Total number of stores
  - Total number of ratings
  - Summary cards in grid layout

#### User Management
- **Create User**:
  - Name, Email, Address, Password fields
  - Role selection (Normal, Owner, Admin)
  - Inline form for quick addition
  - Full validation before submission

- **List Users**:
  - Table view with columns: Name, Email, Address, Role, Owner Rating
  - Filter by Name, Email, Address, Role
  - Real-time filtering
  - Shows owner average rating if applicable

#### Store Management
- **Create Store**:
  - Name, Email, Address fields
  - Optional owner assignment by User ID
  - Inline form submission
  - Auto-refresh after creation

- **List Stores**:
  - Table view with columns: Name, Email, Address, Average Rating
  - Filter by Name, Email, Address
  - Real-time filtering
  - Shows current ratings

#### Owner Requests Management
- **View Pending Requests**:
  - Table showing user owner upgrade requests
  - Columns: User Name, Email, Address, Request Date, Actions
  - Displays count of pending requests
  - Shows no-data message when empty

- **Approve Requests**:
  - One-click approval
  - Auto-updates user role to 'owner'
  - Refreshes all dashboard data
  - Error handling

- **Reject Requests**:
  - With optional rejection reason
  - Keeps user as 'normal' role
  - Reason stored in database
  - Notification to admin on action

### 3. Normal User Dashboard

#### Store Browsing
- **Features**:
  - View all registered stores
  - Search by store name
  - Search by address
  - Real-time filtering
  - Shows store details: Name, Address, Overall Rating, User's Rating

#### Owner Status Management
- **Upgrade Button**:
  - Visible only to users without pending/approved requests
  - Opens modal to confirm owner request
  - Shows current request status:
    - Pending status with message
    - Approved status with message
    - Rejected status with rejection reason

#### Rating Submission
- **Features**:
  - Rating dropdown (1-5 scale)
  - Submit new rating
  - Update existing rating
  - Visual indication of current user rating
  - Error handling and feedback

- **Table Columns**:
  - Store Name
  - Address
  - Overall Rating
  - Your Rating
  - Rate (dropdown selector)

### 4. Store Owner Dashboard

#### Store Summary
- **Features**:
  - Table of all owned stores
  - Shows: Store Name, Average Rating, Total Ratings
  - Clickable rows to select store
  - Shows highlighted selected store
  - No stores message when empty

#### Ratings View
- **Features**:
  - Select store to view ratings
  - Table showing all raters:
    - User Name
    - Email
    - Address
    - Rating Value
    - Last Updated Date/Time
  - Sorted by most recent update

### 5. Global Features

#### Header Navigation
- **Shows**:
  - App title and branding
  - Current user name and role
  - "Change Password" button
  - "Logout" button

#### Change Password Modal
- **Features**:
  - Current password verification
  - New password entry
  - Confirm password match
  - Full password validation
  - Success feedback message
  - Auto-close after success
  - Error handling
  - Modal overlay with close button

#### Owner Request Modal
- **Features**:
  - Confirmation dialog
  - Description of owner status
  - Submit request button
  - Cancel option
  - Error display
  - Loading state
  - Auto-close on success

## 🎯 Key Features Implementation

### Authentication Flow
1. User logs in with email and password
2. Token stored in localStorage
3. User data stored in localStorage
4. Auto-redirect to appropriate dashboard
5. Token sent in Authorization header for all API requests

### State Management
- Local state for form inputs
- Local state for fetched data
- UseEffect for API calls
- URL parameters for filters (live sync)

### Error Handling
- Try-catch blocks for all API calls
- User-friendly error messages
- Error display in UI
- Graceful degradation

### Loading States
- Disabled buttons during submission
- Loading text on buttons
- Response status validation

## 📊 Form Validations

### Password Regex
```javascript
/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,16}$/
```
- 8-16 characters
- At least one uppercase letter
- At least one special character

### Form Validation Rules
- **Name**: 20-60 characters
- **Email**: Standard email format
- **Password**: Regex pattern above
- **Address**: Maximum 400 characters

## 🎨 Styling Features

### Color Scheme
- Primary: #d32323 (Yelp Red)
- Success: #4CAF50 (Green)
- Error: #f44336 (Red)
- Info: #2196F3 (Blue)
- Background: #f5f5f5 (Light Gray)

### Responsive Design
- Mobile-friendly forms
- Responsive tables
- Flexible layouts
- Max-width containers

### User Experience
- Smooth transitions
- Clear visual feedback
- Intuitive navigation
- Modal overlays
- Information boxes with color coding

## 🔄 API Integration

### Endpoints Used
**Authentication**:
- POST /auth/signup
- POST /auth/login
- POST /auth/change-password

**Admin**:
- GET /admin/summary
- POST /admin/users
- GET /admin/users
- POST /admin/stores
- GET /admin/stores
- GET /admin/owner-requests
- POST /admin/owner-requests/:id/approve
- POST /admin/owner-requests/:id/reject

**User**:
- GET /stores
- POST /stores/:id/rating
- POST /user/request-owner
- GET /user/owner-request-status

**Owner**:
- GET /owner/summary
- GET /owner/store-raters/:id

## 🚀 Running the Application

### Development
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

### Backend (Concurrent)
```bash
cd backend
npm install
npm start
```

Backend runs on: http://localhost:4000

### Build for Production
```bash
npm run build
npm run preview
```

## 📋 Completed Components Checklist

- ✅ Login Form with role selection
- ✅ Sign-up Form with validation
- ✅ Admin Dashboard with summary cards
- ✅ User management (create, list, filter)
- ✅ Store management (create, list, filter)
- ✅ Owner requests management
- ✅ Normal user store browsing and filtering
- ✅ Rating submission and updates
- ✅ Store owner dashboard
- ✅ Owner store raters view
- ✅ Change password modal
- ✅ Owner upgrade request modal
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Form validation
- ✅ LocalStorage persistence
- ✅ Token-based authentication

## 🔐 Security Features

- JWT token storage in localStorage
- Authorization header for all authenticated requests
- Client-side form validation
- Password requirements enforced
- Role-based view access
- Secure API communication

## 📱 Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- CSS Grid and Flexbox support required

## 🎓 Architecture

### Component Structure
```
App (Main Component)
├── LoginForm
├── SignupForm
├── AdminDashboard
│   ├── User Management Section
│   ├── Store Management Section
│   └── Owner Requests Section
├── UserDashboard
│   ├── Owner Request Section
│   └── Store Browsing Section
├── OwnerDashboard
│   ├── Store Summary
│   └── Raters View
├── ChangePasswordModal
└── OwnerRequestModal
```

### State Flow
- Authentication state managed at App level
- View state controlled by selected dashboard
- Each dashboard manages its own data fetching
- Modals controlled by parent components

## 🔧 Development Notes

- Uses React Hooks (useState, useEffect)
- Functional component architecture
- Client-side routing simulation with view state
- Fetch API for HTTP requests
- LocalStorage for persistence
- CSS Grid and Flexbox for layouts

