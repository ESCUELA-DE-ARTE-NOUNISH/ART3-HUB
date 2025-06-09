# Supabase Integration Setup

This document explains how to set up and use the Supabase integration for user profile tracking.

## Environment Variables

Add this environment variable to your `.env.local` file:

```bash
# Option 1: Standard DATABASE_URL (Recommended)
DATABASE_URL=postgresql://postgres:[service_role_key]@db.[project_id].supabase.co:5432/postgres

# Option 2: Individual Supabase variables (Alternative)
# SUPABASE_URL=https://[project_id].supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: We use the service role key (not the anon key) for server-side operations with full database access.

## Database Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema** by executing the SQL in `/database/schema.sql` in your Supabase SQL editor:
   - Go to your Supabase dashboard
   - Navigate to "SQL Editor"
   - Paste the content from `database/schema.sql`
   - Click "Run"

3. **Get your environment variables**:
   - **Project ID**: `qlxscaowoewhbkjqmxzp` (from your current setup)
   - **Service Role Key**: Found in Settings > API > Project API keys > service_role (⚠️ Keep this secret!)
   
   Your `DATABASE_URL` should look like:
   ```bash
   DATABASE_URL=postgresql://postgres:[your_service_role_key]@db.qlxscaowoewhbkjqmxzp.supabase.co:5432/postgres
   ```

## Database Schema

The integration creates a `user_profiles` table with:

- `id` (UUID, Primary Key)
- `wallet_address` (Text, Unique) - Stores the user's wallet address
- `profile_complete` (Boolean) - Tracks if the user has completed their profile
- `created_at` (Timestamp) - When the record was created
- `updated_at` (Timestamp) - When the record was last updated

## Usage

### 1. Automatic Tracking

The system automatically tracks wallet connections via server-side API calls:

```tsx
import { useUserProfile } from '@/hooks/useUserProfile'

function MyComponent() {
  const { 
    userProfile, 
    isConnected, 
    walletAddress, 
    isProfileComplete,
    updateProfileCompletion 
  } = useUserProfile()

  // Profile is automatically created when wallet connects
  // All data flows through /api/user-profile endpoints
}
```

**Architecture**: Browser → API Routes → Supabase Database

### 2. Profile Completion Tracking

```tsx
// Mark profile as complete
await updateProfileCompletion(true)

// Mark profile as incomplete
await updateProfileCompletion(false)

// Check if profile is complete
if (isProfileComplete) {
  // User has completed their profile
}
```

### 3. Visual Indicators

The connect menu now shows visual indicators:
- ✅ Green check: Profile complete
- ⚠️ Yellow X: Profile incomplete

### 4. Demo Component

Use the `UserProfileStatus` component to see the integration in action:

```tsx
import { UserProfileStatus } from '@/components/user-profile-status'

function MyPage() {
  return (
    <div>
      <UserProfileStatus />
    </div>
  )
}
```

## API Endpoints

### GET /api/user-profile
Get user profile by wallet address:
```bash
GET /api/user-profile?wallet_address=0x123...
```

### POST /api/user-profile
Create new user profile:
```bash
POST /api/user-profile
{
  "wallet_address": "0x123..."
}
```

### PUT /api/user-profile
Update profile completion:
```bash
PUT /api/user-profile
{
  "wallet_address": "0x123...",
  "profile_complete": true
}
```

## Service Methods

### UserService.upsertUserProfile(walletAddress)
Creates or updates a user profile for the given wallet address.

### UserService.getUserProfile(walletAddress)
Retrieves user profile by wallet address.

### UserService.updateProfileCompletion(walletAddress, isComplete)
Updates the profile completion status.

### UserService.isProfileComplete(walletAddress)
Checks if user profile is complete.

## Security Notes

- Row Level Security (RLS) is enabled on the `user_profiles` table
- Current policy allows all operations (can be made more restrictive)
- Wallet addresses are stored in lowercase for consistency
- The system gracefully handles missing Supabase configuration

## Testing Without Supabase

The system is designed to work without Supabase configuration:
- All database operations will be skipped
- Console warnings will be shown
- The app will continue to function normally

This allows for development and testing without requiring a Supabase setup.