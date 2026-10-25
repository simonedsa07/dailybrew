const fs = require('fs');

const file = 'src/App.tsx';
const backup = 'src/App.tsx.before-profile-page';
fs.copyFileSync(file, backup);

let s = fs.readFileSync(file, 'utf8');

// Make the sidebar profile open a dedicated profile page.
s = s.replace(
  `onClick={() => setActivePage('Settings')}`,
  `onClick={() => setActivePage('My Profile')}`
);

// Remove the first two logout buttons (in the habits and expenses sections).
const logoutButton = /<button\s+className="auth-submit"\s+type="button"\s+onClick={handleLogout}\s+style=\{\{ marginTop: '20px', width: '100%' \}\}\s*>\s*Log out\s*<\/button>/g;

let count = 0;
s = s.replace(logoutButton, (match) => {
  count++;
  return count <= 2 ? '' : match;
});

// Add a dedicated profile page before the Settings page.
const settingsMarker = "          {activePage === 'Settings' && (";
const profilePage = `          {activePage === 'My Profile' && (
            <section className="panel standalone-panel">
              <p className="eyebrow">YOUR LITTLE CORNER</p>
              <h2>My profile ☕</h2>
              <p className="panel-description">A little space that belongs to you.</p>
              <div className="profile-detail-card">
                <span className="avatar profile-large-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="settings-row">
                <span><strong>Account name</strong><small>The name linked to your Daily Brew account.</small></span>
                <strong>{user.name}</strong>
              </div>
              <div className="settings-row">
                <span><strong>Email address</strong><small>Your account login email.</small></span>
                <strong>{user.email}</strong>
              </div>
              <div className="settings-row">
                <span><strong>Café beans</strong><small>Your current bean balance.</small></span>
                <strong>🫘 {beanBalance}</strong>
              </div>
              <button className="soft-button" type="button" onClick={() => setActivePage('Settings')}>
                Open settings →
              </button>
            </section>
          )}

`;

if (!s.includes(settingsMarker)) {
  console.error('Could not find Settings page marker. No profile page inserted.');
  process.exit(1);
}
if (!s.includes("activePage === 'My Profile'")) {
  s = s.replace(settingsMarker, profilePage + settingsMarker);
}

fs.writeFileSync(file, s, 'utf8');
console.log('Profile page added. Logout buttons removed from', Math.min(count, 2), 'non-settings sections.');
console.log('Backup:', backup);
