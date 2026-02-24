# Group Invite Share

**Status:** Active — in implementation
**Packages needed:** none (`Share` from `react-native` is sufficient)

---

## Problem

Groups generate an invite code but there's no way to send it from within the app. Users
have to manually copy the code and paste it into a message themselves. For a beta audience
being onboarded via text/DM, this is unnecessary friction.

---

## How It Works

Replace the plain `Invite code: XXXXX` text in the group detail screen with a tappable
row that opens the native iOS/Android share sheet, pre-populated with a ready-to-send
message.

---

## User Flow

1. Group admin opens the group detail screen
2. Taps the **Share Invite** button (or the invite code row)
3. Native share sheet appears with a pre-written message:
   > "Join my group on IBB Log! Use invite code: **XXXXX**
   > Download the app: [TestFlight link]"
4. User picks iMessage / WhatsApp / whatever → done

---

## Implementation

### `app/group/[id].tsx`

Replace:
```tsx
<Text className="mt-2 text-sm text-gray-500">
  Invite code: {group.invite_code}
</Text>
```

With a pressable row:
```tsx
<Pressable onPress={handleShareInvite} className="mt-2 flex-row items-center gap-2">
  <Text className="text-sm text-gray-500">
    Invite code: {group.invite_code}
  </Text>
  <ShareNetwork size={16} color="#666" weight="regular" />
</Pressable>
```

Handler:
```ts
const handleShareInvite = async () => {
  await Share.share({
    message: `Join my group "${group.name}" on IBB Log!\nInvite code: ${group.invite_code}`,
  });
};
```

`Share` is imported from `react-native` — no additional package needed.

---

## Notes

- Only show the share affordance if the current user is the group **admin** (or any member?
  — to be decided; sharing invite codes as a non-admin seems fine for beta)
- The TestFlight link can be appended to the message once we have a stable public link
- Future: deep link support so the invite code auto-fills when the recipient opens the app

---

## Open Questions
- Should non-admins be able to share invite codes, or admin-only?
- Should tapping the invite code copy it to clipboard in addition to (or instead of) the share sheet?
  - Copy-to-clipboard is a good secondary affordance (long press = copy, tap = share)
