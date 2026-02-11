# IBB Log — Product Spec

## Mission

A group workout accountability app where users track workouts, post to groups, and hold each other accountable.

## Features

### Groups

- Group permissions enable users to view any group they belong to
- Groups can have a group avatar/photo
- Groups can have a description and/or a subtitle
- Each group has its own collocated "hub" / detail page where a user can see:
  - Other group members
  - The group feed (recent posts)
  - Group history
  - Group configurations
- Each group can have a chat interface

#### Private Groups

- User creates private group → becomes group admin
- User sends invites to other members
  - Can signify if invited user is an "admin" or a "member"
  - Any member can invite any other user
    - If "member", can't set user role when inviting
    - If "admin", can set user role when inviting
  - An invite can be sent to a user that is not yet on the platform
    - This user will be prompted to sign up as part of joining group/onboarding

#### Public Groups

- User creates public group → becomes group admin
- Same invite flow as Private
- Public groups can be found on a dedicated public groups screen
  - On this screen, a user can search, browse and join groups

### Workout Tracking

- A user can track a workout without belonging to any groups (solo tracking)
- Can post 1 workout to all groups they are a member of
  - If user has more than one group, offer ability to select which groups to post
  - Defaults post to all groups
  - If user has 1 group, no option presented
- User submits: title, optional description, time, and uploads image
  - Image is required

#### Post Labels

- Icon label for didn't meet group configuration "qualifications" (e.g. didn't meet workout minimum)
- Number icon label for workout of week # (1st of week, 2nd of week, 3rd, etc.)

### Feed

- View history on a timeline (like Instagram)
- Filters: by group, by day, by week
- View public groups post option
- Defaults to just group posts the user belongs to
- Each post should have a "group" tag
- Post display (facebook/X/instagram style):
  - Show photo
  - Show post/workout details
  - Allow user reactions

### Push Notifications

- Group members receive push notifications for:
  - Chat messages
  - Workout posts
  - Reminders (TBD)
  - Opt-in daily workout related motivation message (stretch goal, could be AI generated)

### User Profile Screen

- Edit username (potentially)
- Update email
- Update profile image/avatar
- Delete account
- Add "bio" (short personal description)

## User Flows

### New User

1. Completes sign up
   - Inputs: email, username, avatar/profile photo, password, bio
2. Logs in
3. Sees group invites (invites screen)
4. Has "Join or Create Group" option

### Existing User

1. Loads to Feed screen once authenticated

## Data Model

### Key Relationships

- **Workouts ↔ Groups**: Many-to-many via `group_workouts` junction table. A single workout can be posted to multiple groups.
- **Reactions & Comments**: Per-group. Each group sees its own reactions/comments on a workout post (via `group_workouts`).
- **Invites**: First-class entity with token-based shareable links + optional email delivery. Can target users not yet on the platform.
- **Groups**: Have `public` or `private` visibility.

### Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users — username, display_name, avatar_url, bio |
| `groups` | Name, description, subtitle, avatar, visibility, invite_code, workout config |
| `group_members` | Junction: user ↔ group with role (admin/member) |
| `group_invites` | Invitations with token, email, role, status, expiry |
| `workouts` | User-owned workout: title, description, duration, images |
| `group_workouts` | Junction: workout posted to a group, with week_key and qualification status |
| `reactions` | Emoji reactions on group_workouts (per-group) |
| `comments` | Threaded comments on group_workouts (per-group) |
| `group_messages` | Group chat messages |
