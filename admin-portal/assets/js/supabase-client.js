const SUPABASE_URL = 'https://opxiwposdessahcimksq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9weGl3cG9zZGVzc2FoY2lta3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzM0MTcsImV4cCI6MjA4NzU0OTQxN30.NC6Xr9mCt0Dg_n__uAX858MDo-IeK2KuCdgHzVhG3OA';

let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof createClient === 'function') {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

window.supabaseClient = supabaseClient;

const normalizeUserRecord = (user) => {
    if (!user || typeof user !== 'object') return null;
    const normalized = { ...user };
    const cardNumber = user.cardNumber || user.card_number || null;
    if (cardNumber) {
        normalized.cardNumber = cardNumber;
        normalized.card_number = cardNumber;
    }
    return normalized;
};

const serializeUserRecord = (user) => {
    if (!user || typeof user !== 'object') return null;
    return {
        id: user.id ?? null,
        name: user.name ?? null,
        email: user.email ?? null,
        password: user.password ?? null,
        phone: user.phone ?? null,
        role: user.role ?? null,
        status: user.status ?? null,
        subscription_plan: user.subscription_plan ?? null,
        credit_limit: user.credit_limit ?? 0,
        balance: user.balance ?? 0,
        outstanding: user.outstanding ?? 0,
        pin: user.pin ?? null,
        card_number: user.card_number || user.cardNumber || null,
        activity: user.activity ?? null,
        location: user.location ?? null,
        wilaya: user.wilaya ?? null,
        coords: user.coords ?? null,
        doc_id_front: user.doc_id_front ?? (user.documents?.id_front || null),
        doc_id_back: user.doc_id_back ?? (user.documents?.id_back || null),
        doc_payslip: user.doc_payslip ?? (user.documents?.payslip || null),
        doc_rib: user.doc_rib ?? (user.documents?.rib || null),
        doc_commercial_register: user.doc_commercial_register ?? (user.documents?.commercial_register || null),
        doc_contract: user.doc_contract ?? (user.documents?.contract || null)
    };
};

window.AuthService = {
    _listeners: [],
    subscribe(callback) {
        if (typeof callback !== 'function') return () => {};

        this._listeners.push(callback);
        callback(this.getCurrentUser());
        return () => {
            this._listeners = this._listeners.filter(cb => cb !== callback);
        };
    },
    notify() {
        const user = this.getCurrentUser();
        this._listeners.forEach(cb => {
            try {
                cb(user);
            } catch (err) {
                console.error('Auth Listener Error:', err);
            }
        });
    },
    getCurrentUser() {
        try {
            const session = localStorage.getItem('adjil_session');
            return session ? normalizeUserRecord(JSON.parse(session)) : null;
        } catch (e) {
            localStorage.removeItem('adjil_session');
            return null;
        }
    },
    async signIn(identifier, password) {
        if (!identifier || !password) throw new Error('يرجى إدخال البريد/الهاتف وكلمة المرور');

        const tryLocal = () => {
            const localUsers = (() => {
                try {
                    return JSON.parse(localStorage.getItem('adjil_users') || '[]');
                } catch {
                    return [];
                }
            })();
            const user = localUsers.find(u => (u.email === identifier || u.phone === identifier) && u.password === password);
            if (!user) throw new Error('بيانات الدخول غير صحيحة');
            const normalized = normalizeUserRecord(user);
            localStorage.setItem('adjil_session', JSON.stringify(normalized));
            this.notify();
            return normalized;
        };

        if (!window.supabaseClient) return tryLocal();

        const { data, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},phone.eq.${identifier}`)
            .eq('password', password)
            .maybeSingle();

        if (error) return tryLocal();
        if (!data) return tryLocal();

        const normalized = normalizeUserRecord(data);
        localStorage.setItem('adjil_session', JSON.stringify(normalized));
        
        // Ensure user is in the local users list (cache)
        try {
            const localUsers = JSON.parse(localStorage.getItem('adjil_users') || '[]');
            const idx = localUsers.findIndex(u => u.id === normalized.id);
            if (idx >= 0) localUsers[idx] = { ...localUsers[idx], ...normalized };
            else localUsers.push(normalized);
            localStorage.setItem('adjil_users', JSON.stringify(localUsers));
        } catch (e) { console.error('Failed to update local users cache during login:', e); }

        this.notify();
        return normalized;
    },
    async signUp(userData) {
        const toInsertInitial = serializeUserRecord(userData);
        if (!toInsertInitial) throw new Error('بيانات التسجيل غير صحيحة');

        const tryLocal = () => {
            const localUsers = (() => {
                try {
                    return JSON.parse(localStorage.getItem('adjil_users') || '[]');
                } catch {
                    return [];
                }
            })();

            const exists = localUsers.some(u => u.email === toInsertInitial.email || (toInsertInitial.phone && u.phone === toInsertInitial.phone));
            if (exists) throw new Error('الحساب موجود مسبقاً');

            const localRecord = normalizeUserRecord({
                ...toInsertInitial,
                status: 'local_only'
            });
            localUsers.push(localRecord);
            localStorage.setItem('adjil_users', JSON.stringify(localUsers));
            return { mode: 'local_only', user: localRecord };
        };

        if (!window.supabaseClient) return tryLocal();

        let authUserId = null;
        try {
            if (window.supabaseClient.auth && typeof window.supabaseClient.auth.signUp === 'function') {
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email: toInsertInitial.email,
                    password: toInsertInitial.password
                });
                if (authError) throw authError;
                authUserId = authData?.user?.id || null;
            }
        } catch (err) {
            console.error('Supabase Auth Signup Error:', err);
            // Don't fall back to local if it's a real auth error like "email exists"
            if (err.message && (err.message.includes('exists') || err.message.includes('already'))) throw err;
            return tryLocal();
        }

        const toInsert = {
            ...toInsertInitial,
            id: authUserId || toInsertInitial.id
        };

        const { data, error } = await window.supabaseClient
            .from('users')
            .insert([toInsert])
            .select()
            .single();

        if (error) {
            console.error('Supabase User Insert Error:', error);
            return tryLocal();
        }

        const normalized = normalizeUserRecord(data);
        
        // Ensure user is in the local users list (cache)
        try {
            const localUsers = JSON.parse(localStorage.getItem('adjil_users') || '[]');
            const idx = localUsers.findIndex(u => u.id === normalized.id);
            if (idx >= 0) localUsers[idx] = { ...localUsers[idx], ...normalized };
            else localUsers.push(normalized);
            localStorage.setItem('adjil_users', JSON.stringify(localUsers));
        } catch (e) { console.error('Failed to update local users cache during signup:', e); }

        return { mode: 'supabase_auth', user: normalized, needsEmailConfirmation: true };
    },
    async migrateLocalToCloud() {
        if (!window.supabaseClient || !window.supabaseClient.auth || typeof window.supabaseClient.auth.signUp !== 'function') {
            return { synced: false, skipped: true, reason: 'no_supabase_auth' };
        }

        const safeParse = (key, fallback) => {
            try {
                const v = localStorage.getItem(key);
                return v ? JSON.parse(v) : fallback;
            } catch {
                return fallback;
            }
        };

        const currentSession = safeParse('adjil_session', null);
        const currentUserLegacy = safeParse('currentUser', null);
        const localUser = normalizeUserRecord(currentSession || currentUserLegacy);

        if (!localUser) return { synced: false, skipped: true, reason: 'no_local_user' };

        const needsSync =
            localUser.status === 'local_only' ||
            localUser.synced === false ||
            (localUser.synced == null && localUser.status != null);

        if (!needsSync) return { synced: false, skipped: true, reason: 'already_synced' };
        if (!localUser.email || !localUser.password) return { synced: false, skipped: true, reason: 'missing_credentials' };

        let authUserId = null;
        let authError = null;

        try {
            const { data: authData, error: signUpError } = await window.supabaseClient.auth.signUp({
                email: localUser.email,
                password: localUser.password
            });
            if (signUpError) authError = signUpError;
            authUserId = authData?.user?.id || null;
        } catch (err) {
            authError = err;
        }

        if (authError) {
            const msg = String(authError?.message || authError || '').toLowerCase();
            const looksLikeExists =
                msg.includes('already') ||
                msg.includes('exists') ||
                msg.includes('registered');

            if (looksLikeExists && typeof window.supabaseClient.auth.signInWithPassword === 'function') {
                try {
                    const { data: signInData, error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                        email: localUser.email,
                        password: localUser.password
                    });
                    if (signInError) return { synced: false, skipped: false, error: signInError.message };
                    authUserId = signInData?.user?.id || null;
                } catch (err) {
                    return { synced: false, skipped: false, error: err?.message || String(err) };
                }
            } else {
                return { synced: false, skipped: false, error: authError?.message || String(authError) };
            }
        }

        const row = serializeUserRecord(localUser);
        if (!row) return { synced: false, skipped: false, error: 'invalid_local_user' };
        row.id = authUserId || row.id;

        const { data: profileRows, error: profileError } = await window.supabaseClient
            .from('users')
            .upsert([row], { onConflict: 'email' })
            .select();

        if (profileError) return { synced: false, skipped: false, error: profileError.message };

        const cloudUser = normalizeUserRecord(Array.isArray(profileRows) ? profileRows[0] : profileRows);

        const updatedUser = normalizeUserRecord({
            ...(cloudUser || localUser),
            synced: true,
            status: 'synced'
        });

        const usersList = safeParse('adjil_users', []);
        const nextUsersList = Array.isArray(usersList)
            ? usersList.map(u => (u?.email === updatedUser.email ? { ...u, ...updatedUser } : u))
            : usersList;

        if (Array.isArray(nextUsersList) && !nextUsersList.some(u => u?.email === updatedUser.email)) {
            nextUsersList.push(updatedUser);
        }

        localStorage.setItem('adjil_users', JSON.stringify(nextUsersList));
        localStorage.setItem('adjil_session', JSON.stringify(updatedUser));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        this.notify();
        return { synced: true, user: updatedUser };
    },
    signOut() {
        localStorage.removeItem('adjil_session');
        this.notify();
    },
    async demoSignIn(role) {
        const tryLocal = () => {
            const localUsers = (() => {
                try {
                    return JSON.parse(localStorage.getItem('adjil_users') || '[]');
                } catch {
                    return [];
                }
            })();
            const user = localUsers.find(u => u.role === role);
            if (!user) throw new Error('لا يوجد حساب تجريبي');
            const normalized = normalizeUserRecord(user);
            localStorage.setItem('adjil_session', JSON.stringify(normalized));
            this.notify();
            return normalized;
        };

        if (!window.supabaseClient) return tryLocal();

        const { data, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('role', role)
            .limit(1)
            .maybeSingle();

        if (error) return tryLocal();
        if (!data) return tryLocal();

        const normalized = normalizeUserRecord(data);
        localStorage.setItem('adjil_session', JSON.stringify(normalized));
        this.notify();
        return normalized;
    }
};
