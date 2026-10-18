(() => {
  const config = window.DAYMARK_SYNC_CONFIG || {};
  const hasConfig = Boolean(config.url && config.publishableKey);
  const deviceKey = 'daymark-sync-device-v1';
  let client = null;
  let currentUser = null;
  let syncTimer = null;
  let suppressWrites = false;
  let lastCloudWrite = 0;
  let loadingUserId = null;
  let activeChannel = null;

  const status = (label, title = label) => {
    const text = document.getElementById('syncStatus');
    const button = document.getElementById('syncBtn');
    if (text) text.textContent = label;
    if (button) { button.title = title; button.dataset.state = label.toLowerCase().replace(/\W+/g, '-'); }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const message = (text, isError = false) => {
    if (window.daymarkToast) window.daymarkToast(text);
    status(isError ? 'Sync issue' : 'Synced', text);
  };

  function accountDialog(mode = 'signin') {
    if (!hasConfig) {
      window.daymarkShowModal('Cloud sync setup', `<div class="sync-help"><div class="sync-cloud-icon">☁</div><p>Daymark can sync tasks and habits across your devices once its private cloud database is connected.</p><p>The owner needs to connect Supabase and add its public project URL and publishable key. No passwords or secret keys belong in this app.</p><p class="sync-small">Your current tasks stay on this device until cloud sync is connected.</p></div>`);
      return;
    }
    if (currentUser) {
      window.daymarkShowModal('Sync is on', `<div class="sync-help"><div class="sync-cloud-icon">✓</div><p>Signed in as <b>${esc(currentUser.email)}</b>.</p><p>Your Daymark data is saved to your account and will load on other devices after you sign in there.</p><button class="btn secondary form-submit" id="syncSignOut">Sign out</button></div>`);
      document.getElementById('syncSignOut').onclick = async () => {
        const {error} = await client.auth.signOut();
        if (error) return message(error.message, true);
        if (activeChannel) { await client.removeChannel(activeChannel); activeChannel = null; }
        currentUser = null;
        status('Sign in', 'Sign in to sync across devices');
        window.daymarkShowModal('Signed out', '<div class="sync-help"><p>This device still has its saved data. Sign back in anytime to sync again.</p></div>');
      };
      return;
    }
    const create = mode === 'signup';
    window.daymarkShowModal(create ? 'Create your sync account' : 'Sign in to sync', `<form id="syncAuthForm" class="form-grid"><div class="sync-help"><p>Use the same email and password on each device. Your data is kept in your private account.</p></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input name="password" type="password" required minlength="8" autocomplete="${create?'new-password':'current-password'}" placeholder="At least 8 characters"></div><button class="btn form-submit">${create?'Create account':'Sign in'}</button><button class="link-button" type="button" id="syncModeToggle">${create?'Already have an account? Sign in':'New to sync? Create an account'}</button></form>`);
    document.getElementById('syncModeToggle').onclick = () => accountDialog(create ? 'signin' : 'signup');
    document.getElementById('syncAuthForm').onsubmit = async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = String(form.get('email')).trim();
      const password = String(form.get('password'));
      const submit = event.currentTarget.querySelector('button[type="submit"]');
      submit.disabled = true; submit.textContent = create ? 'Creating…' : 'Signing in…';
      const result = create
        ? await client.auth.signUp({email,password})
        : await client.auth.signInWithPassword({email,password});
      if (result.error) { submit.disabled = false; submit.textContent = create ? 'Create account' : 'Sign in'; return message(result.error.message, true); }
      if (create && !result.data.session) {
        window.daymarkShowModal('Check your email', '<div class="sync-help"><p>Supabase sent a confirmation email. Open it, confirm your account, then return to Daymark and sign in.</p></div>');
        return;
      }
      if (result.data.user) await loadUser(result.data.user);
      document.getElementById('modalBackdrop').classList.remove('open');
    };
  }

  function mergeForFirstDevice(localState, cloudState) {
    const merged = {...localState, ...cloudState};
    for (const collection of ['projects','tasks','habits','events','sessions']) {
      const byId = new Map((localState[collection] || []).map(item => [item.id, item]));
      for (const item of (cloudState[collection] || [])) byId.set(item.id, item);
      merged[collection] = [...byId.values()];
    }
    merged.settings = {...(localState.settings || {}), ...(cloudState.settings || {})};
    return merged;
  }

  async function loadUser(user) {
    if (!user || loadingUserId === user.id) return;
    loadingUserId = user.id; currentUser = user; status('Loading…', 'Loading your saved data');
    try {
      const {data: remote, error} = await client.from('daymark_data').select('data,updated_at').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      const localState = window.daymarkGetState();
      if (!remote) {
        await writeCloud(localState);
      } else {
        const hasSyncedOnThisDevice = localStorage.getItem(deviceKey) === user.id;
        const nextState = hasSyncedOnThisDevice ? remote.data : mergeForFirstDevice(localState, remote.data);
        suppressWrites = true;
        window.daymarkApplyState(nextState);
        suppressWrites = false;
        localStorage.setItem(deviceKey, user.id);
        if (!hasSyncedOnThisDevice) await writeCloud(nextState);
      }
      status('Synced', `Synced as ${user.email}`);
      realtimeChannel(user);
    } catch (error) {
      suppressWrites = false; currentUser = null; status('Sync issue', 'Could not load your cloud data');
      window.daymarkToast(`Sync could not load: ${error.message || 'Check the cloud setup.'}`);
    } finally { loadingUserId = null; }
  }

  async function writeCloud(data) {
    if (!client || !currentUser || suppressWrites) return;
    status('Saving…', 'Saving your latest changes');
    const {error} = await client.from('daymark_data').upsert({user_id:currentUser.id,data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if (error) throw error;
    localStorage.setItem(deviceKey, currentUser.id);
    lastCloudWrite = Date.now();
    status('Synced', `Synced as ${currentUser.email}`);
  }

  function scheduleCloudWrite() {
    if (!currentUser || suppressWrites) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => writeCloud(window.daymarkGetState()).catch(error => message(`Could not save: ${error.message || 'Check your connection.'}`, true)), 600);
  }

  function realtimeChannel(user) {
    if (activeChannel) client.removeChannel(activeChannel);
    activeChannel = client.channel(`daymark-${user.id}`).on('postgres_changes', {event:'*',schema:'public',table:'daymark_data',filter:`user_id=eq.${user.id}`}, payload => {
      if (currentUser?.id !== user.id || Date.now() - lastCloudWrite < 1800 || !payload.new?.data) return;
      suppressWrites = true;
      window.daymarkApplyState(payload.new.data);
      suppressWrites = false;
      status('Synced', 'Updated from your other device');
    }).subscribe();
  }

  async function initialize() {
    const button = document.getElementById('syncBtn');
    if (!button) return;
    button.addEventListener('click', () => accountDialog());
    window.addEventListener('daymark:save', scheduleCloudWrite);
    if (!hasConfig) { status('Sync setup', 'Cloud sync is not connected yet'); return; }
    if (!window.supabase?.createClient) { status('Sync issue', 'Could not load the sync service'); return; }
    client = window.supabase.createClient(config.url, config.publishableKey);
    status('Sign in', 'Sign in to sync across devices');
    const {data,error} = await client.auth.getSession();
    if (error) { status('Sync issue', error.message); return; }
    if (data.session?.user) await loadUser(data.session.user);
    client.auth.onAuthStateChange((event, session) => {
      if (session?.user && event !== 'TOKEN_REFRESHED') setTimeout(() => loadUser(session.user), 0);
      else if (!session?.user) {
        currentUser = null;
        if (activeChannel) { client.removeChannel(activeChannel); activeChannel = null; }
        status('Sign in', 'Sign in to sync across devices');
      }
    });
  }
  initialize();
})();

