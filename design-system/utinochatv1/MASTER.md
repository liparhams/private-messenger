# UTINOCHATV1 Master Design System

## Design read
Modern messaging product for everyday users. The visual language combines the information hierarchy and compact interaction patterns users expect from Telegram and WhatsApp with a distinct UTINOCHATV1 identity.

## Dials
- DESIGN_VARIANCE: 6
- MOTION_INTENSITY: 4
- VISUAL_DENSITY: 6

## Principles
- Mobile-first and resilient from 375px through desktop.
- One clear primary action per surface.
- Search, conversation list, message area, composer, profile, support, groups and channels must remain usable with long Persian or English text.
- Verification is semantic, not color-only: use a check glyph plus accessible label where applicable.
- Prefer real interface icons over decorative emoji.
- Respect `prefers-reduced-motion`.
- Avoid excessive blur, neon gradients and decorative effects that compete with messages.
- Keep touch targets comfortably tappable.
- Preserve focus visibility and keyboard operation.

## Product surfaces
1. Authentication: simple, trustworthy, fast, responsive.
2. Messenger: three-layer hierarchy on desktop, focused conversation on mobile.
3. Search: users, public channels, and support in one predictable result surface.
4. Groups: private by default, invite-link entry, member management.
5. Channels: public/private modes, username discovery, join flow, verification badge.
6. Admin: users, temporary/permanent moderation, all-message controls, groups/channels, support, logs, settings.

## Interaction rules
- Editing shows an explicit editing state and `ویرایش‌شده` after save.
- Deleting replaces message content with `این پیام حذف شده است.`
- Blocked users see a clear blocked state and a support path.
- Invite links must fail safely with a clear invalid/expired message.
- Public channel search only exposes channels marked public and discoverable.
