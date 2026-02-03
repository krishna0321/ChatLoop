# Angular Design System Refactor TODO

## Phase 1: Clean Global Stylesheet
- [ ] Remove all legacy variables from styles.css
- [ ] Keep only new design system variables in :root
- [ ] Ensure theme switching (light/dark) works properly
- [ ] Add any missing utility classes for components

## Phase 2: Refactor Component CSS Files
- [ ] app.component.css
- [ ] features/about/about.component.css
- [ ] features/auth/login/login.component.css
- [ ] features/auth/register/register.component.css
- [ ] features/chat/chat.component.css
- [ ] features/chat/chat-room/chat-room.component.css
- [ ] features/chats/chats.component.css
- [ ] features/chats/create-room/create-room.component.css
- [ ] features/contact/contact.component.css
- [ ] features/dashboard/dashboard.component.css
- [ ] features/faq/faq.component.css
- [ ] features/group/add-members/add-members.component.css
- [ ] features/group/create-group/create-group.component.css
- [ ] features/group/group-chat/group-chat.component.css
- [ ] features/group/group-info/group-info.component.css
- [ ] features/profile/profile.component.css
- [ ] features/settings/settings.component.css
- [ ] features/users/users.component.css
- [ ] features/users/user-profile/user-profile.component.css
- [ ] layout/chat-list/chat-list.component.css
- [ ] layout/leftbar/leftbar.component.css
- [ ] layout/topbar/topbar.component.css
- [ ] layouts/admin-layout/admin-layout.component.css
- [ ] layouts/app-layout/app-layout.component.css
- [ ] layouts/auth-layout/auth-layout.component.css

## Phase 3: Testing & Verification
- [ ] Verify theme switching works across all components
- [ ] Check that all visuals remain premium and modern
- [ ] Ensure no layout breaks or animation issues
- [ ] Confirm blur and glow effects are optimized
