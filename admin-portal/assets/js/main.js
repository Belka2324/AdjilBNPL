
// Tailwind Configuration
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',
                secondary: '#0ea5e9',
                dark: '#0f172a',
                darker: '#020617',
                card: '#1e293b'
            }
        }
    }
}

const WILAYAS = [
    "01-أدرار", "02-الشلف", "03-الأغواط", "04-أم البواقي", "05-باتنة", "06-بجاية", "07-بسكرة", "08-بشار", "09-البليدة", "10-البويرة",
    "11-تمنراست", "12-تبسة", "13-تلمسان", "14-تيارت", "15-تيزي وزو", "16-الجزائر", "17-الجلفة", "18-جيجل", "19-سطيف", "20-سعيدة",
    "21-سكيكدة", "22-سيدي بلعباس", "23-عنابة", "24-قالمة", "25-قسنطينة", "26-المدية", "27-مستغانم", "28-المسيلة", "29-معسكر", "30-ورقلة",
    "31-وهران", "32-البيض", "33-إليزي", "34-برج بوعريريج", "35-بومرداس", "36-الطارف", "37-تندوف", "38-تيسمسيلت", "39-الوادي", "40-خنشلة",
    "41-سوق أهراس", "42-تيبازة", "43-ميلة", "44-عين الدفلى", "45-النعامة", "46-عين تموشنت", "47-غرداية", "48-غليزان", "49-تيميمون", "50-برج باجي مختار",
    "51-أولاد جلال", "52-بني عباس", "53-عين صالح", "54-عين قزام", "55-تقرت", "56-جانت", "57-المغير", "58-المنيعة"
];

const DB = {
    get: (key) => JSON.parse(localStorage.getItem('adjil_' + key) || 'null'),
    set: (key, val) => localStorage.setItem('adjil_' + key, JSON.stringify(val)),
    // Supabase Integration Helper
    // Use this to migrate data or switch to remote DB
    supabase: {
        async syncUsers() {
            if (!window.supabaseClient) return console.error('Supabase not initialized');

            // 1. Fetch remote users
            const { data: remoteUsers, error } = await window.supabaseClient.from('users').select('*');

            if (error) {
                console.error('Supabase Sync Error:', error);
                return;
            }

            // 2. If remote is empty, seed with local dummy data
            if (!remoteUsers || remoteUsers.length === 0) {
                const localUsers = DB.get('users') || [];
                if (localUsers.length > 0) {
                    console.log('Seeding Supabase with local data...');
                    const usersForDb = localUsers.map(u => ({
                        id: u.id,
                        name: u.name ?? null,
                        email: u.email ?? null,
                        password: u.password ?? null,
                        phone: u.phone ?? null,
                        role: u.role ?? null,
                        status: u.status ?? null,
                        subscription_plan: u.subscription_plan ?? null,
                        credit_limit: u.credit_limit ?? 0,
                        balance: u.balance ?? 0,
                        outstanding: u.outstanding ?? 0,
                        pin: u.pin ?? null,
                        card_number: u.card_number || u.cardNumber || null,
                        activity: u.activity ?? null,
                        location: u.location ?? null,
                        wilaya: u.wilaya ?? null,
                        coords: u.coords ?? null
                    }));
                    const { error: insertError } = await window.supabaseClient.from('users').insert(usersForDb);
                    if (insertError) console.error('Seeding Error:', insertError);
                    else console.log('Seeding Complete!');
                }
            } else {
                // 3. If remote has data, update local cache
                // This makes the app "Online First" regarding read, but uses LocalStorage as cache
                console.log('Syncing from Supabase to LocalStorage...', remoteUsers.length, 'users found.');

                // We need to preserve the complex objects if any (like txs array might be JSON in SQL or separate table)
                // In SQL schema, 'transactions' is a separate table.
                // But in JS 'user' object, 'txs' is an embedded array.
                // We need to fetch transactions for these users to rebuild the JS object structure.

                const { data: transactions } = await window.supabaseClient.from('transactions').select('*');

                const mergedUsers = remoteUsers.map(u => {
                    // Find transactions where this user is customer or merchant
                    // Note: In JS logic, txs array contains full tx objects.
                    const userTxs = transactions ? transactions.filter(t =>
                        t.customer_id === u.id || t.merchant_id === u.id
                    ).map(t => ({
                        ...t,
                        // Map SQL columns back to JS properties if needed
                        // JS: merchant (name), customerName, customerCard
                        // SQL: merchant_name, customer_name, customer_card
                        merchant: t.merchant_name,
                        customerName: t.customer_name,
                        customerCard: t.customer_card
                    })) : [];

                    const cardNumber = u.cardNumber || u.card_number || null;
                    return { ...u, cardNumber, txs: userTxs };
                });

                DB.set('users', mergedUsers);

                // Refresh UI if app is running
                if (window.app && app.user) {
                    // Update current user reference
                    const updatedCurrentUser = mergedUsers.find(u => u.id === app.user.id);
                    if (updatedCurrentUser) {
                        app.user = updatedCurrentUser;
                        if (!app.user.cardNumber && app.user.card_number) app.user.cardNumber = app.user.card_number;
                        localStorage.setItem('adjil_session', JSON.stringify(app.user));
                        app.updateDashboardUI();
                    }
                }
            }
        }
    },
    init: () => {
        if (!localStorage.getItem('adjil_users')) {
            DB.set('users', [
                {
                    id: '11111111-1111-4111-8111-111111111111',
                    name: 'محمد علي',
                    email: 'c@adjil.dz',
                    password: '123',
                    role: 'customer',
                    status: 'active',
                    subscription_plan: 'monthly',
                    credit_limit: 10000,
                    balance: 10000,
                    cardNumber: '5423 0000 0000 0001',
                    txs: [
                        { id: 'T1', merchant: 'سوبر ماركت السلام (مواد غذائية)', amount: 1500, date: '2026-03-20 10:15:30', status: 'completed' },
                        { id: 'T2', merchant: 'محطة نفطال (بنزين)', amount: 2200, date: '2026-03-21 14:45:12', status: 'completed' },
                        { id: 'T3', merchant: 'صيدلية الشفاء', amount: 850, date: '2026-03-22 09:30:05', status: 'completed' },
                        { id: 'T4', merchant: 'فندق الأوراسي (إقامة)', amount: 4500, date: '2026-03-23 18:20:45', status: 'completed' }
                    ],
                    pin: '1234'
                },
                {
                    id: '22222222-2222-4222-8222-222222222222',
                    name: 'متجر الإلكترونيات',
                    email: 'm@adjil.dz',
                    password: '123',
                    role: 'merchant',
                    status: 'active',
                    balance: 85000,
                    outstanding: 12400,
                    activity: 'بيع الأجهزة الإلكترونية والهواتف',
                    location: 'العناصر، الجزائر العاصمة',
                    coords: '36.7456,3.0645',
                    txs: [
                        { id: 'MT1', customerCard: '5423 0000 0000 0001', amount: 12000, date: '2026-03-20 11:00:00', status: 'completed' },
                        { id: 'MT2', customerCard: '5423 0000 0000 0001', amount: 35000, date: '2026-03-21 15:30:00', status: 'completed' },
                        { id: 'MT3', customerCard: '5423 0000 0000 0001', amount: 38000, date: '2026-03-22 10:45:00', status: 'completed' }
                    ],
                    pin: null
                },
                {
                    id: '33333333-3333-4333-8333-333333333333',
                    name: 'سوبر ماركت السلام',
                    email: 'qr@adjil.dz',
                    password: '123',
                    role: 'merchant',
                    status: 'active',
                    balance: 0,
                    outstanding: 0,
                    activity: 'مواد غذائية وعامة',
                    location: 'باب الزوار، الجزائر العاصمة',
                    coords: '36.7111,3.1722',
                    txs: [],
                    pin: null
                },
                {
                    id: '44444444-4444-4444-8444-444444444444',
                    name: 'صيدلية الشفاء',
                    email: 'phones@adjil.dz',
                    password: '123',
                    role: 'merchant',
                    status: 'active',
                    balance: 0,
                    outstanding: 0,
                    activity: 'أدوية ومستلزمات طبية',
                    location: 'دالي ابراهيم، الجزائر العاصمة',
                    coords: '36.7588,2.9833',
                    txs: [],
                    pin: null
                }
            ]);
        }
    }
};

DB.init();

const app = {
    user: null,
    regRole: 'customer',
    regPhase: 1,
    gpsActive: true,
    currentPendingTx: null,
    lang: 'ar',
    translations: {
        ar: {
            home: "الرئيسية",
            how_it_works: "كيف يعمل؟",
            pricing: "الأسعار",
            about: "من نحن",
            developers: "المطورين",
            login: "دخول",
            logout: "خروج",
            invite: "دعوة",
            contact: "تواصل معنا",
            dashboard_customer: "لوحة تحكم الزبون",
            dashboard_merchant: "لوحة تحكم التاجر",
            welcome: "مرحباً بك مجدداً،",
            available_balance: "الرصيد المتاح للاستخدام",
            total_sales: "المبيعات الإجمالية",
            received_amounts: "مبالغ مستلمة",
            outstanding_amounts: "مبالغ مستحقة",
            transactions_board: "بورد المشتريات والمدفوعات",
            manual_payment: "دفع يدوي",
            scan_qr: "مسح QR Code",
            confirm_payment: "تأكيد عملية الدفع",
            merchant_name: "اسم التاجر المستفيد",
            payment_amount: "المبلغ المراد دفعه",
            confirm_deduction: "تأكيد واقتطاع المبلغ",
            success_payment: "تمت عملية الدفع بنجاح!",
            insufficient_balance: "رصيدك غير كافٍ",
            qr_code_title: "كود QR الخاص بك",
            qr_code_desc: "اجعل الزبون يمسح هذا الكود لإتمام عملية الدفع",
            sales_history: "سجل المبيعات والعمليات",
            no_sales: "لا توجد مبيعات حالياً",
            no_transactions: "لا توجد معاملات حالياً",
            card_holder: "حامل البطاقة",
            expiry_date: "الانتهاء",
            premium_card: "بطاقة رقمية مميزة",
            hero_title: "اشترِ ما تريد، وادفع براحتك.",
            hero_subtitle: "منصة آجل تمنحك رصيداً شهرياً يصل إلى 10,000 دج. تسوق من آلاف المتاجر وادفع لاحقاً باشتراك شهري بسيط.",
            new_app: "جديد: تطبيق الهاتف متوفر الآن",
            download_app: "تحميل التطبيق",
            how_it_works_title: "دليلك لاستخدام آجل",
            how_it_works_subtitle: "خطوات بسيطة تفتح لك آفاقاً جديدة للتسوق",
            step1_title: "سجل حسابك في دقائق",
            step1_desc: "عملية تسجيل سريعة وآمنة. ارفع وثائقك، اختر خطتك، واحصل على رصيدك الفوري لتبدأ رحلة تسوق ذكية.",
            step2_title: "تسوق من مئات المتاجر",
            step2_desc: "تصفح شبكتنا الواسعة من التجار المعتمدين. من الملابس إلى الإلكترونيات، كل ما تحتاجه متوفر الآن وبنظام الدفع الآجل.",
            step3_title: "امسح الكود وادفع فوراً",
            step3_desc: "لا حاجة للنقد أو البطاقات البنكية عند الشراء. ببساطة امسح رمز QR الخاص بالتاجر من خلال تطبيق آجل وأتمم عمليتك في ثوانٍ.",
            step4_title: "ادفع لاحقاً بكل أريحية",
            step4_desc: "تمتع بمشترياتك اليوم وسدد مستحقاتك في نهاية الشهر. نظامنا يضمن لك إدارة مالية مريحة وشفافة دون أي تعقيدات.",
            partners_title: "شركاء الدفع المعتمدون",
            partners_subtitle: "نثق بهم ويثقون بنا",
            about_title: "آجل: ثورة في عالم التجارة الرقمية بالجزائر",
            about_subtitle: "نحن لسنا مجرد تطبيق للدفع، نحن شريكك المالي الذي يسعى لإعادة تشكيل العلاقة بين التاجر والمستهلك في الجزائر من خلال حلول \"اشترِ الآن وادفع لاحقاً\" المبتكرة.",
            start_journey: "ابدأ رحلتك الآن",
            learn_more: "اكتشف المزيد",
            fin_adv_title: "المزايا المالية",
            fin_adv_desc: "إدارة مالية ذكية تناسب ميزانيتك",
            fin_adv_p: "نحن نوفر لك سيولة فورية تمكنك من اقتناء احتياجاتك الأساسية دون الضغط على ميزانيتك الشهرية. مع آجل، يمكنك تقسيط مشترياتك بكل شفافية.",
            fin_item1: "رصيد ائتماني فوري - احصل على رصيد تسوق بمجرد تفعيل حسابك.",
            fin_item2: "جدولة مريحة للدفع - سدد مستحقاتك في نهاية الشهر أو على دفعات ميسرة.",
            fin_item3: "بدون عمولات بنكية - نظام إسلامي وشفاف 100% يخدم مصلحة المواطن.",
            soc_adv_title: "المزايا الاجتماعية",
            soc_adv_desc: "تعزيز الثقة والتكافل في المجتمع الجزائري",
            soc_adv_p: "آجل ليست مجرد أداة مالية، بل هي جسر للثقة بين التاجر والزبون. نحن نسعى لتمكين العائلات الجزائرية من العيش بكرامة وراحة بال.",
            eco_adv_title: "المزايا الاقتصادية",
            eco_adv_desc: "دفع عجلة الاقتصاد الوطني والتحول الرقمي",
            eco_adv_p: "نحن نساهم في خلق بيئة اقتصادية نشطة من خلال زيادة المبيعات للتجار وتسهيل الحركة المالية في السوق المحلي الجزائري.",
            cta_title: "هل أنت مستعد لتجربة المستقبل؟",
            register_customer: "سجل كزبون",
            register_customer_desc: "احصل على رصيد تسوق فوري",
            register_merchant: "انضم كتاجر",
            register_merchant_desc: "ضاعف مبيعاتك اليوم",
            customer: "زبون",
            merchant: "تاجر",
            status_pending: "بانتظار الموافقة",
            status_success: "عملية ناجحة",
            sale_from: "مبيعة من:",
            collecting: "قيد التحصيل",
            footer_slogan: "البيع الآجل - الحل الرقمي الأمثل في الجزائر.",
            quick_links: "روابط سريعة",
            why_adjil: "لماذا آجل؟",
            ethics_title: "مستقبل البيع الآجل الأخلاقي",
            ethics_desc: "نحن نحل أزمة السيولة للأسر الجزائرية باستخدام التكنولوجيا، وليس الفوائد.",
            integrity_title: "النزاهة المالية",
            integrity_desc: "يضمن نظامنا السداد دون تعقيدات بيروقراطية.",
            account_frozen: "تم تجميد الحساب مؤقتاً",
            frozen_desc: "نأسف، تم تعليق صلاحيات حسابك بسبب وجود مستحقات غير مدفوعة.",
            no_merchants: "لا يوجد تجار مسجلون حالياً",
            merchants_title: "شركاؤنا من التجار",
            merchants_subtitle: "تجدوننا في جميع أنحاء الوطن",
            algiers_algeria: "الجزائر العاصمة، الجزائر",
            change_lang: "تغيير اللغة",
            investor_access: "دخول المستثمرين",
            scan_qr_title: "مسح رمز الاستجابة السريعة",
            logout_confirm: "هل أنت متأكد من تسجيل الخروج؟",
            no_data: "لا توجد بيانات",
            invite_title: "آجل | اشترِ الآن وادفع لاحقاً",
            invite_text: "انضم إلى آجل وتمتع برصيد تسوق فوري يصل إلى 10,000 دج!",
            invite_copied: "تم نسخ رابط التحميل! يمكنك الآن إرساله لأصدقائك.",
            alt_shop: "تسوق",
            alt_scan: "مسح",
            alt_paylater: "دفع لاحق",
            alt_financial: "مالي",
            alt_social: "اجتماعي",
            alt_economic: "اقتصادي",
            investment_opp: "فرصة استثمارية",
            account_suspended: "تم تعليق الحساب",
            contact_support: "تواصل مع الدعم",
            return_login: "العودة لتسجيل الدخول",
            qr_video_title: "كيفية الدفع باستخدام QR Code",
            qr_video_subtitle: "فيديو توضيحي لعملية الشراء والتحقق من الرصيد",
            video_placeholder: "فيديو توضيحي قريباً",
            pay_later_title: "الدفع اللاحق: أمان، سهولة، وراحة بال",
            pay_later_subtitle: "نظامنا مصمم ليمنحك الحرية المالية دون تعقيدات.",
            pay_later_desc: "نحن نستخدم أحدث التقنيات لضمان تجربة دفع سلسة وآمنة. يمكنك الشراء الآن من أي متجر معتمد والدفع في نهاية الشهر بكل أريحية.",
            api_title: "واجهة المطورين (API)",
            api_subtitle: "قريباً: وثائق شاملة لدمج آجل في متجرك الإلكتروني.",
            secure_payment: "عملية دفع آمنة ومشفرة 100%",
            scan_camera_desc: "وجه الكاميرا نحو كود التاجر",
            searching_qr: "يتم البحث عن رمز QR تلقائياً...",
            simulate_qr: "محاكاة مسح كود ناجح",
            online_now: "متصل الآن",
            direct_pay_title: "دفع مباشر",
            enter_due_amount: "أدخل المبلغ المستحق",
            choose_method: "اختر طريقة الدفع",
            method_qr: "تفعيل QR",
            method_id: "اختيار ID Market",
            market_id_label: "رقم ID للتاجر",
            payment_done: "تم الدفع وتحويل المبلغ إلى محفظة التاجر",
            invoice_ready: "تم إنشاء فاتورة رقمية قابلة للتحميل",
            copyright: "© 2026 منصة آجل. جميع الحقوق محفوظة.",
            auth_login_title: "تسجيل الدخول",
            auth_register_title: "حساب جديد",
            auth_welcome_title: "مرحباً بك في آجل",
            auth_login_subtitle: "سجل الدخول للمتابعة",
            auth_register_subtitle: "انضم إلى عائلة آجل اليوم",
            auth_create_account_title: "إنشاء حساب جديد",
            email_phone: "البريد الإلكتروني أو الهاتف",
            email_phone_placeholder: "example@mail.com / 0550...",
            password_placeholder: "••••••••",
            fill_required: "يرجى ملء كافة الحقول المطلوبة",
            email_registered: "هذا البريد الإلكتروني مسجل مسبقاً",
            phone_registered: "رقم الهاتف هذا مسجل مسبقاً",
            register_success: "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.",
            login_error: "خطأ في البريد الإلكتروني أو كلمة المرور",
            subscribe_login_required: "يجب تسجيل الدخول أولاً للاشتراك في الخطة",
            forgot_password_sent: "تم إرسال تعليمات استعادة كلمة المرور إلى: ",
            invalid_amount: "يرجى إدخل مبلغ صحيح",
            enter_merchant_name: "يرجى إدخال اسم التاجر",
            merchant_not_found: "خطأ: لم يتم العثور على التاجر بالاسم المدخل",
            system_error_user_not_found: "خطأ في النظام: لم يتم العثور على التاجر أو الزبون",
            payment_success_msg: "تمت عملية الدفع بنجاح!",
            qr_scan_success: "تم مسح الكود بنجاح! يرجى تأكيد الدفع.",
            search_merchant: "ابحث عن متجر",
            search_merchant_placeholder: "اسم المتجر أو نوع النشاط",
            view_on_map: "عرض على الخريطة",
            merchant_activity: "النشاط",
            merchant_location: "الموقع",
            merchant_pin_label: "رمز الدفع",
            copy_pin: "نسخ الرمز",
            copied: "تم النسخ",
            select_merchant: "اختر التاجر",
            plan_selected: "تم اختيار خطة: ",
            demo_customer: "دخول تجريبي (زبون)",
            demo_merchant: "دخول تجريبي (تاجر)",
            firstname: "الاسم",
            lastname: "اللقب",
            email: "البريد الإلكتروني",
            phone: "رقم الهاتف",
            password: "كلمة المرور",
            optional: "(اختياري)",
            create_account: "إنشاء الحساب",
            next: "التالي",
            back: "رجوع",
            confirm: "تأكيد",
            digital_contract: "العقد الرقمي",
            digital_contract_desc: "قبل تفعيل حسابك، يرجى قراءة العقد الرقمي والموافقة على الشروط.",
            open_contract: "أنقر لقراءة العقد",
            accept_terms: "قرأت ووافقت على شروط عقد آجل",
            must_accept_terms: "يجب الموافقة على شروط العقد قبل إنشاء الحساب",
            id_card: "بطاقة التعريف البيومترية",
            payslip: "شهادة كشف الراتب (PDF)",
            canceled_check: "صورة الشيك المشطوب",
            commercial_register: "نسخة من السجل التجاري",
            activity_wilaya: "ولاية النشاط",
            plan_monthly: "شهري",
            plan_6months: "6 أشهر",
            plan_annual: "سنوي",
            price_suffix: "دج/شهر",
            subscribe_now: "اشترك الآن",
            save_20: "توفير 20%",
            save_40: "توفير 40%",
            price_monthly: "500",
            price_6months: "400",
            price_annual: "300",
            most_popular: "الأكثر طلباً",
            credit_limit: "رصيد 10,000 دج",
            pay_30_days: "دفع آجل لمدة 30 يوم",
            no_interest: "بدون فوائد",
            priority_support: "أولوية الدعم الفني",
            increase_limit: "زيادة سقف الرصيد",
            annual_gifts: "هدايا سنوية",
            enter_pin_desc: "أدخل رمز PIN الخاص بك لتأكيد العملية",
            cancel: "إلغاء",
            confirm: "تأكيد",
            payment_success_desc: "تم خصم المبلغ من رصيدك بنجاح، ويمكنك الآن تحميل فاتورتك الرقمية والاحتفاظ بها.",
            amount: "المبلغ",
            merchant: "التاجر",
            transaction_id: "رقم العملية",
            download_invoice: "تحميل الفاتورة",
            return_dashboard: "العودة للوحة التحكم",
            collect_outstanding: "تحصيل المبالغ المستحقة",
            api_settlement_desc: "استخدم محرك التسوية البنكي لسحب مبالغ المبيعات الآجلة مباشرة إلى حسابك البنكي أو CCP.",
            request_payout_api: "طلب تحويل بنكي (API)",
            card_number_label: "رقم البطاقة",
            settlement_simulator: "محاكي محرك التسوية",
            settlement_simulator_sub: "Settlement Engine Simulator (Bank Side)",
            start_auto_scan: "بدء المسح والاقتطاع الآلي",
            console_waiting: "> بانتظار أوامر النظام...",
            adjil_pool: "حساب آجل التجاري (Pool)",
            pending_disbursements: "عمليات قيد التوزيع",
            api_desc_scan: "مسح الحسابات الجارية وتحديد المستحقات المطلوبة.",
            api_desc_debit: "تنفيذ الاقتطاع التلقائي (Prélèvement) من حساب الزبون.",
            api_desc_disburse: "إعادة توزيع الأموال على التجار بمختلف مؤسساتهم المالية.",
            compatible_ccp: "متوافق مع نظام بريد الجزائر (CCP)",
            compatible_cib: "متوافق مع الأنظمة البنكية (CIB/SATIM)",
            ceo_title: "كلمة المدير التنفيذي والمؤسس",
            ceo_message: "في منصة آجل، ننظر إلى المستقبل برؤية ثاقبة تضع الإنسان في قلب الابتكار المالي. هدفنا هو التوسع عالمياً عبر شراكات استراتيجية وتقنيات موثوقة تُبسّط الحياة اليومية وتفتح أبواب الفرص للجميع. نلتزم بمبادرات عملية لتحسين المستوى المعيشي للأفراد، عبر حلول دفع آمنة وشفافة تُحترم خصوصية المستخدم وتمنحه حرية الإدارة المالية دون تعقيد. كل الشكر والتقدير لكل من آمن بمشروع آجل ودعم مسيرته، فبكم نكبر وبثقتكم نخطو بثبات نحو الريادة.",
            contract_intro: "تم إبرام هذا العقد بين منصة آجل من جهة، والمشترك (زبوناً كان أو تاجراً) من جهة أخرى، بهدف تنظيم الاستفادة من خدمة البيع الآجل وفق ضوابط مالية وقانونية واضحة وشفافة.",
            contract_art1_title: "المادة 1 – موضوع العقد",
            contract_art1_desc: "يهدف هذا العقد إلى منح المشترك إمكانية استعمال رصيد ائتماني محدد من طرف المنصة للشراء من التجار المتعاقدين بنظام البيع الآجل، مع التزامه الكامل بسداد المبالغ المستحقة داخل الآجال المحددة.",
            contract_art2_title: "المادة 2 – التزامات المشترك والصرامة في التسديد",
            contract_art2_desc: "يتعهد المشترك بـ: استعمال الحساب والرصيد لأغراض قانونية، التسديد الصارم لجميع المبالغ المستحقة قبل تاريخ 05 من كل شهر كأقصى حد. وفي حالة الإخلال بهذا الموعد، توافق على تجميد حسابك البريدي/البنكي أوتوماتيكياً إشعاراً بتسوية الوضعية.",
            contract_art3_title: "المادة 3 – التزامات التاجر",
            contract_art3_desc: "يلتزم التاجر بتوثيق كل عملية بيع بدقة عبر منصة آجل، وعدم تسجيل أية عمليات صورية أو مضخمة، واحترام الأسعار المعلن عنها، والتعاون مع المنصة في أي عملية تدقيق أو مراجعة.",
            contract_art4_title: "المادة 4 – حقوق المنصة",
            contract_art4_desc: "تحتفظ المنصة بحق مراجعة سقف الرصيد الائتماني، وتعليق أو إيقاف الحساب في حال الاشتباه في استعمال غير مشروع أو عند الإخلال المتكرر بآجال السداد، مع إمكانية اللجوء للإجراءات القانونية عند الضرورة.",
            contract_art5_title: "المادة 5 – القبول الإلكتروني",
            contract_art5_desc: "يعتبر تأشير المشترك على خانة \"قرأت ووافقت على شروط عقد آجل\" قبولاً إلكترونياً تاماً لكل بنود هذا العقد وله نفس الأثر القانوني للتوقيع الخطي.",
            contract_art6_title: "المادة 6 – حماية المعطيات ذات الطابع الشخصي",
            contract_art6_desc: "تلتزم منصة آجل باحترام أحكام القانون رقم 18-07 المتعلق بحماية الأشخاص الطبيعيين في معالجة المعطيات ذات الطابع الشخصي، وباستعمال بيانات المشترك في إطار الخدمة فقط، مع توفير مستوى مناسب من السرية والأمن، ومنح المشترك حق طلب الاطلاع على بياناته أو تصحيحها أو حذفها وفقاً للقانون المعمول به.",
            contract_art7_title: "المادة 7 – تفويض الاقتطاع التلقائي والصرامة المسبقة",
            contract_art7_desc: "بموجب هذا البند، يمنح المشترك تفويضاً صريحاً وغير مشروط لمنصة آجل لاقتطاع الأقساط قبل تاريخ السداد المحدد. في حال تعذر الاقتطاع بسبب نقص الرصيد، يقر المشترك بحق المنصة في تجميد الحساب البريدي/البنكي للمشترك فوراً ودون إشعار إضافي إلى غاية تسوية الوضعية المالية.",
            contract_subscriber_name: "اسم المشترك / Nom du souscripteur",
            contract_signature_date: "تاريخ التوقيع / Date de signature",
            contract_signature_label: "إمضاء المشترك / Signature du souscripteur",
            print_contract: "طباعة العقد",
            download_contract: "تحميل العقد",
            pricing_page_title: "خطط اشتراك مرنة",
            pricing_page_subtitle: "اختر الخطة التي تناسب احتياجاتك وتمتع بالتسوق الفوري",
            about_hero_title: "آجل: ثورة في عالم التجارة الرقمية بالجزائر",
            about_hero_subtitle: "نحن لسنا مجرد تطبيق للدفع، نحن شريكك المالي الذي يسعى لإعادة تشكيل العلاقة بين التاجر والمستهلك في الجزائر من خلال حلول \"اشترِ الآن وادفع لاحقاً\" المبتكرة.",
            no_interest_fees: "0% فائدة أو رسوم خفية",
            empower_families: "تمكين الأسر",
            empower_families_desc: "توفير الاحتياجات الضرورية في الوقت المناسب دون تأخير.",
            security_privacy: "أمان وخصوصية",
            security_privacy_desc: "حماية بياناتك ومعاملاتك بأعلى معايير التشفير الرقمي.",
            support_merchants: "دعم التجار المحليين",
            support_merchants_desc: "زيادة القدرة الشرائية للزبائن تعني مبيعات أكثر ونمو أسرع للمحلات.",
            digitize_finance: "رقمنة التعاملات المالية",
            digitize_finance_desc: "تقليل الاعتماد على السيولة النقدية (الشكارة) والتوجه نحو الدفع الإلكتروني العصري.",
            pos_system: "نظام نقاط البيع (POS)",
            clear: "مسح",
            total_amount_to_pay: "المبلغ الإجمالي للدفع",
            manual_amount_placeholder: "المبلغ يدوي...",
            simulate_barcode: "محاكاة قارئ الباركود:",
            scan_product_500: "مسح منتج بـ 500 دج",
            generate_qr_code: "توليد كود الدفع (QR)",
            scan_merchant_qr: "امسح رمز QR للتاجر",
            point_camera_merchant: "وجه كاميرا هاتفك نحو كود التاجر لإتمام الدفع",
            bank_settings_title: "إعدادات الحساب البنكي / البريدي",
            bank_settings_desc: "أدخل تفاصيل حسابك البنكي لتلقي وسداد المدفوعات.",
            account_type: "نوع الحساب",
            post_account_rip: "بريد الجزائر (RIP) - CCP",
            bank_account_rib: "حساب بنكي (RIB)",
            account_number_label: "رقم الحساب (RIP/RIB)",
            account_number_placeholder: "أدخل 20 رقماً...",
            cancel_back: "إلغاء / رجوع",
            save_changes: "حفظ التغييرات",
            bank_postal_info: "معلومات البنك/البريد",
            bank_account_info_btn: "معلومات الحساب البنكي / البريدي"
        },
        fr: {
            home: "Accueil",
            how_it_works: "Comment ça marche ?",
            pricing: "Tarifs",
            about: "À propos",
            developers: "Développeurs",
            login: "Connexion",
            logout: "Déconnexion",
            invite: "Inviter",
            contact: "Contactez-nous",
            dashboard_customer: "Tableau de bord Client",
            dashboard_merchant: "Tableau de bord Marchand",
            welcome: "Bienvenue,",
            available_balance: "Solde disponible",
            total_sales: "Ventes totales",
            received_amounts: "Montants reçus",
            outstanding_amounts: "Montants à recevoir",
            transactions_board: "Historique des transactions",
            manual_payment: "Paiement manuel",
            scan_qr: "Scanner QR Code",
            confirm_payment: "Confirmer le paiement",
            merchant_name: "Nom du marchand",
            payment_amount: "Montant à payer",
            confirm_deduction: "Confirmer et déduire",
            success_payment: "Paiement effectué avec succès !",
            insufficient_balance: "Solde insuffisant",
            qr_code_title: "Votre code QR",
            qr_code_desc: "Faites scanner ce code par le client pour effectuer le paiement",
            sales_history: "Historique des ventes",
            no_sales: "Aucune vente pour le moment",
            no_transactions: "Aucune transaction pour le moment",
            card_holder: "Titulaire de la carte",
            expiry_date: "Expire",
            premium_card: "Carte numérique Premium",
            hero_title: "Achetez ce que vous voulez, payez à votre aise.",
            hero_subtitle: "Adjil vous offre un crédit mensuel allant jusqu'à 10 000 DZD. Achetez dans des milliers de magasins et payez plus tard avec un simple abonnement mensuel.",
            new_app: "Nouveau : l'application mobile est disponible",
            download_app: "Télécharger l'application",
            how_it_works_title: "Votre guide pour utiliser Adjil",
            how_it_works_subtitle: "Des étapes simples qui vous ouvrent de nouveaux horizons de shopping",
            step1_title: "Inscrivez-vous en quelques minutes",
            step1_desc: "Processus d'inscription rapide et sécurisé. Téléchargez vos documents, choisissez votre plan et obtenez votre crédit instantané.",
            step2_title: "Achetez dans des centaines de magasins",
            step2_desc: "Parcourez notre large réseau de marchands agréés. Des vêtements à l'électronique, tout est disponible.",
            step3_title: "Scannez le code et payez instantanément",
            step3_desc: "Pas besoin de cash ou de cartes. Scannez simplement le QR code du marchand via l'application Adjil.",
            step4_title: "Payez plus tard en toute sérénité",
            step4_desc: "Profitez de vos achats aujourd'hui et réglez vos cotisations à la fin du mois.",
            partners_title: "Partenaires de paiement agréés",
            partners_subtitle: "Nous leur faisons confiance et ils nous font confiance",
            about_title: "Adjil : Une révolution dans le commerce numérique en Algérie",
            about_subtitle: "Nous ne sommes pas seulement une application de paiement, nous sommes votre partenaire financier.",
            start_journey: "Commencez votre voyage",
            learn_more: "En savoir plus",
            fin_adv_title: "Avantages Financiers",
            fin_adv_desc: "Gestion financière intelligente adaptée à votre budget",
            fin_adv_p: "Nous vous offrons une liquidité immédiate qui vous permet d'acquérir vos besoins essentiels sans pression.",
            fin_item1: "Crédit instantané - Obtenez votre crédit dès l'activation de votre compte.",
            fin_item2: "Paiement échelonné - Payez à la fin du mois ou par mensualités.",
            fin_item3: "Sans commissions bancaires - Système 100% transparent au service du citoyen.",
            soc_adv_title: "Avantages Sociaux",
            soc_adv_desc: "Renforcer la confiance et la solidarité",
            soc_adv_p: "Adjil est un pont de confiance entre le marchand et le client.",
            eco_adv_title: "Avantages Économiques",
            eco_adv_desc: "Stimuler l'économie nationale",
            eco_adv_p: "Nous contribuons à créer un environnement économique actif en augmentant les ventes.",
            cta_title: "Prêt à vivre le futur ?",
            register_customer: "S'inscrire comme client",
            register_customer_desc: "Obtenez un crédit immédiat",
            register_merchant: "Devenir marchand",
            register_merchant_desc: "Doublez vos ventes aujourd'hui",
            customer: "Client",
            merchant: "Marchand",
            status_pending: "En attente",
            status_success: "Réussi",
            sale_from: "Vente de :",
            collecting: "En cours de collecte",
            footer_slogan: "Buy Now Pay Later - La solution numérique idéale en Algérie.",
            quick_links: "Liens Rapides",
            why_adjil: "Pourquoi Adjil ?",
            ethics_title: "Futur du BNPL éthique",
            ethics_desc: "Nous résolvons la crise de liquidité des familles algériennes grâce à la technologie.",
            integrity_title: "Intégrité Financière",
            integrity_desc: "Notre système garantit le paiement sans complications bureaucratiques.",
            account_frozen: "Compte temporairement gelé",
            frozen_desc: "Désolé, vos privilèges de compte ont été suspendus en raison de cotisations impayées.",
            no_merchants: "Aucun marchand inscrit pour le moment",
            merchants_title: "Nos Partenaires Marchands",
            merchants_subtitle: "Retrouvez-nous partout dans le pays",
            algiers_algeria: "Alger, Algérie",
            change_lang: "Changer de langue",
            investor_access: "Accès Investisseurs",
            scan_qr_title: "Scanner le code QR",
            logout_confirm: "Êtes-vous sûr de vouloir vous déconnecter ?",
            no_data: "Aucune donnée",
            invite_title: "Adjil | Achetez maintenant, payez plus tard",
            invite_text: "Rejoignez Adjil et profitez d'un crédit instantané jusqu'à 10 000 DZD !",
            invite_copied: "Lien de téléchargement copié ! Vous pouvez l'envoyer à vos amis.",
            alt_shop: "Acheter",
            alt_scan: "Scanner",
            alt_paylater: "Payer plus tard",
            alt_financial: "Financier",
            alt_social: "Social",
            alt_economic: "Économique",
            investment_opp: "Opportunité d'investissement",
            account_suspended: "Compte suspendu",
            contact_support: "Contacter le support",
            return_login: "Retour à la connexion",
            qr_video_title: "Comment payer avec QR Code",
            qr_video_subtitle: "Vidéo explicative sur l'achat et la vérification du solde",
            video_placeholder: "Tutoriel vidéo bientôt disponible",
            pay_later_title: "Paiement différé : Sécurité, Facilité et Tranquillité",
            pay_later_subtitle: "Notre système est conçu pour vous offrir une liberté financière sans complications.",
            pay_later_desc: "Nous utilisons les dernières technologies pour garantir une expérience de paiement fluide. Achetez maintenant et payez à la fin du mois en toute sérénité.",
            api_title: "Interface Développeurs (API)",
            api_subtitle: "Bientôt : Documentation complète pour intégrer Adjil à votre boutique en ligne.",
            secure_payment: "Paiement 100% sécurisé et crypté",
            scan_camera_desc: "Dirigez la caméra vers le code du marchand",
            searching_qr: "Recherche automatique du code QR...",
            simulate_qr: "Simuler un scan réussi",
            online_now: "En ligne maintenant",
            direct_pay_title: "Paiement Direct",
            enter_due_amount: "Entrez le montant dû",
            choose_method: "Choisir la méthode de paiement",
            method_qr: "Activer QR",
            method_id: "Choisir ID Market",
            market_id_label: "ID du marchand",
            payment_done: "Montant transféré au portefeuille du marchand",
            invoice_ready: "Facture numérique créée, prête à télécharger",
            copyright: "© 2026 Plateforme Adjil. Tous droits réservés.",
            auth_login_title: "Se connecter",
            auth_register_title: "Nouveau compte",
            auth_welcome_title: "Bienvenue chez Adjil",
            auth_login_subtitle: "Connectez-vous pour continuer",
            auth_register_subtitle: "Rejoignez la famille Adjil aujourd'hui",
            auth_create_account_title: "Créer un nouveau compte",
            email_phone: "Email ou téléphone",
            email_phone_placeholder: "example@mail.com / 0550...",
            password_placeholder: "••••••••",
            fill_required: "Veuillez remplir tous les champs requis",
            email_registered: "Cet e-mail est déjà enregistré",
            phone_registered: "Ce numéro de téléphone est déjà enregistré",
            register_success: "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
            login_error: "E-mail ou mot de passe incorrect",
            subscribe_login_required: "Vous devez vous connecter pour souscrire à un forfait",
            forgot_password_sent: "Instructions de réinitialisation envoyées à : ",
            invalid_amount: "Veuillez entrer un montant valide",
            enter_merchant_name: "Veuillez entrer le nom du marchand",
            merchant_not_found: "Erreur : Marchand non trouvé",
            system_error_user_not_found: "Erreur système : Utilisateur non trouvé",
            payment_success_msg: "Paiement réussi !",
            qr_scan_success: "QR Code scanné avec succès ! Veuillez confirmer le paiement.",
            search_merchant: "Rechercher un magasin",
            search_merchant_placeholder: "Nom du magasin ou activité",
            view_on_map: "Voir sur la carte",
            merchant_activity: "Activité",
            merchant_location: "Emplacement",
            merchant_pin_label: "Code de paiement",
            copy_pin: "Copier le code",
            copied: "Copié",
            select_merchant: "Sélectionner le marchand",
            plan_selected: "Plan sélectionné : ",
            demo_customer: "Démo (Client)",
            demo_merchant: "Démo (Marchand)",
            firstname: "Prénom",
            lastname: "Nom",
            email: "E-mail",
            phone: "Téléphone",
            password: "Mot de passe",
            optional: "(Optionnel)",
            create_account: "Créer le compte",
            next: "Suivant",
            back: "Retour",
            confirm: "Confirmer",
            digital_contract: "Contrat numérique",
            digital_contract_desc: "Avant d'activer votre compte, veuillez lire le contrat Adjil et accepter les conditions.",
            open_contract: "Cliquer pour lire le contrat",
            accept_terms: "J’ai lu et j’accepte les conditions du contrat Adjil",
            must_accept_terms: "Vous devez accepter les conditions du contrat avant de créer le compte",
            id_card: "Carte d'identité biométrique",
            payslip: "Fiche de paie (PDF)",
            canceled_check: "Chèque barré",
            commercial_register: "Registre du commerce",
            activity_wilaya: "Wilaya d'activité",
            plan_monthly: "Mensuel",
            plan_6months: "6 Mois",
            plan_annual: "Annuel",
            price_suffix: "DZD/mois",
            subscribe_now: "S'abonner",
            save_20: "Économisez 20%",
            save_40: "Économisez 40%",
            price_monthly: "500",
            price_6months: "400",
            price_annual: "300",
            most_popular: "Le Plus Populaire",
            credit_limit: "Crédit 10 000 DZD",
            pay_30_days: "Paiement à 30 jours",
            no_interest: "Sans intérêt",
            priority_support: "Support prioritaire",
            increase_limit: "Augmenter le plafond",
            annual_gifts: "Cadeaux annuels",
            enter_pin_desc: "Entrez votre code PIN pour confirmer",
            cancel: "Annuler",
            confirm: "Confirmer",
            payment_success_desc: "Le montant a été déduit avec succès, téléchargez votre facture.",
            amount: "Montant",
            merchant: "Marchand",
            transaction_id: "N° Transaction",
            download_invoice: "Télécharger Facture",
            return_dashboard: "Retour Tableau de Bord",
            collect_outstanding: "Recouvrer les Impayés",
            api_settlement_desc: "Utilisez le moteur de règlement bancaire pour retirer les ventes BNPL directement vers votre compte bancaire ou CCP.",
            request_payout_api: "Demander Virement (API)",
            card_number_label: "Numéro de Carte",
            settlement_simulator: "Simulateur de Règlement",
            settlement_simulator_sub: "Simulateur Moteur de Règlement (Côté Banque)",
            start_auto_scan: "Lancer Auto-Scan & Débit",
            console_waiting: "> En attente des commandes système...",
            adjil_pool: "Pool Commercial Adjil",
            pending_disbursements: "Virements en Attente",
            api_desc_scan: "Scanner les comptes courants et identifier les montants dus.",
            api_desc_debit: "Exécuter le prélèvement automatique sur le compte client.",
            api_desc_disburse: "Redistribuer les fonds aux marchands via différentes institutions.",
            compatible_ccp: "Compatible avec Algérie Poste (CCP)",
            compatible_cib: "Compatible avec les systèmes bancaires (CIB/SATIM)",
            ceo_title: "Mot du PDG et Fondateur",
            ceo_message: "Chez Adjil, nous envisageons l'avenir avec une vision qui place l'humain au cœur de l'innovation financière. Notre objectif est de nous étendre mondialement grâce à des partenariats stratégiques et des technologies fiables qui simplifient la vie quotidienne et ouvrent des portes d'opportunité pour tous. Nous nous engageons dans des initiatives pratiques pour améliorer le niveau de vie des individus, via des solutions de paiement sécurisées et transparentes qui respectent la vie privée des utilisateurs et leur donnent la liberté de gestion financière sans complexité. Nos remerciements à tous ceux qui ont cru au projet Adjil et ont soutenu son parcours.",
            contract_intro: "Ce contrat est conclu entre la plateforme Adjil d'une part, et l'abonné (client ou marchand) d'autre part, afin de réglementer l'utilisation du service de paiement différé selon des contrôles financiers et juridiques clairs.",
            contract_art1_title: "Article 1 – Objet du contrat",
            contract_art1_desc: "Ce contrat vise à accorder à l'abonné la possibilité d'utiliser un plafond de crédit défini par la plateforme pour effectuer des achats auprès des marchands affiliés au système BNPL, avec son plein engagement à rembourser les montants dus dans les délais impartis.",
            contract_art2_title: "Article 2 – Obligations de l'abonné",
            contract_art2_desc: "L'abonné s'engage à : utiliser le compte et le crédit uniquement à des fins légales et personnelles, respecter le plafond de crédit accordé, payer tous les montants dus dans les délais, et mettre à jour ses données personnelles.",
            contract_art3_title: "Article 3 – Obligations du marchand",
            contract_art3_desc: "Le marchand s'engage à documenter chaque transaction avec précision via Adjil, à ne pas enregistrer de transactions fictives, à respecter les prix annoncés et à coopérer avec la plateforme.",
            contract_art4_title: "Article 4 – Droits de la plateforme",
            contract_art4_desc: "Adjil se réserve le droit de réviser le plafond de crédit, de suspendre ou de fermer le compte en cas de suspicion d'utilisation illégale ou de défaut de paiement répété.",
            contract_art5_title: "Article 5 – Acceptation électronique",
            contract_art5_desc: "Cocher la case \"J'ai lu et j'accepte les conditions du contrat Adjil\" constitue une acceptation électronique complète de tous les termes, ayant le même effet juridique qu'une signature manuscrite.",
            contract_art6_title: "Article 6 – Protection des données personnelles",
            contract_art6_desc: "Adjil s'engage à respecter la loi 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, en utilisant les données uniquement pour le service, avec sécurité et confidentialité.",
            contract_art7_title: "Article 7 – Mandat de Prélèvement Automatique (Direct Debit Mandate)",
            contract_art7_desc: "En vertu de cette clause, l'abonné accorde un mandat exprès et irrévocable à Adjil pour effectuer le prélèvement automatique des mensualités dues sur son compte postal ou bancaire déclaré, à la date d'échéance convenue, sans préavis pour chaque transaction, la plateforme s'engageant à ne prélever que les montants convenus.",
            contract_subscriber_name: "Nom du souscripteur",
            contract_signature_date: "Date de signature",
            contract_signature_label: "Signature du souscripteur",
            print_contract: "Imprimer le contrat",
            download_contract: "Télécharger le contrat",
            pricing_page_title: "Plans d'abonnement flexibles",
            pricing_page_subtitle: "Choisissez le plan qui vous convient et profitez du shopping instantané",
            about_hero_title: "Adjil : Une révolution dans le commerce numérique en Algérie",
            about_hero_subtitle: "Nous ne sommes pas seulement une application de paiement, nous sommes votre partenaire financier qui cherche à remodeler la relation entre le marchand et le consommateur en Algérie grâce à des solutions innovantes \"Achetez maintenant, payez plus tard\".",
            no_interest_fees: "0% d'intérêt ou frais cachés",
            empower_families: "Autonomisation des familles",
            empower_families_desc: "Répondre aux besoins essentiels à temps sans délai.",
            security_privacy: "Sécurité et confidentialité",
            security_privacy_desc: "Protection de vos données et transactions avec les plus hauts standards de cryptage numérique.",
            support_merchants: "Soutien aux commerçants locaux",
            support_merchants_desc: "L'augmentation du pouvoir d'achat des clients signifie plus de ventes et une croissance plus rapide pour les magasins.",
            digitize_finance: "Numérisation des transactions financières",
            digitize_finance_desc: "Réduction de la dépendance au cash et orientation vers le paiement électronique moderne.",
            pos_system: "Système de Point de Vente (POS)",
            clear: "Effacer",
            total_amount_to_pay: "Montant Total à Payer",
            manual_amount_placeholder: "Montant manuel...",
            simulate_barcode: "Simuler le scanner de codes-barres:",
            scan_product_500: "Scanner un produit à 500 DZD",
            generate_qr_code: "Générer le Code QR de Paiement",
            scan_merchant_qr: "Scanner le QR Code du Marchand",
            point_camera_merchant: "Pointez la caméra vers le code du marchand",
            bank_settings_title: "Paramètres Bancaires / Postaux",
            bank_settings_desc: "Entrez vos coordonnées bancaires pour recevoir et effectuer des paiements.",
            account_type: "Type de Compte",
            post_account_rip: "Algérie Poste (RIP) - CCP",
            bank_account_rib: "Compte Bancaire (RIB)",
            account_number_label: "Numéro de Compte (RIP/RIB)",
            account_number_placeholder: "Entrez 20 chiffres...",
            cancel_back: "Annuler / Retour",
            save_changes: "Enregistrer les modifications",
            bank_postal_info: "Infos Bancaires/Postales",
            bank_account_info_btn: "Informations Bancaires / Postales"
        },
        en: {
            home: "Home",
            how_it_works: "How it works?",
            pricing: "Pricing",
            about: "About us",
            developers: "Developers",
            login: "Login",
            logout: "Logout",
            invite: "Invite",
            contact: "Contact us",
            dashboard_customer: "Customer Dashboard",
            dashboard_merchant: "Merchant Dashboard",
            welcome: "Welcome back,",
            available_balance: "Available Balance",
            total_sales: "Total Sales",
            received_amounts: "Received Amounts",
            outstanding_amounts: "Outstanding Amounts",
            transactions_board: "Transactions Board",
            manual_payment: "Manual Payment",
            scan_qr: "Scan QR Code",
            confirm_payment: "Confirm Payment",
            merchant_name: "Merchant Name",
            payment_amount: "Amount to pay",
            confirm_deduction: "Confirm & Deduct",
            success_payment: "Payment successful!",
            insufficient_balance: "Insufficient balance",
            qr_code_title: "Your QR Code",
            qr_code_desc: "Let the customer scan this code to complete the payment",
            sales_history: "Sales & Operations History",
            no_sales: "No sales at the moment",
            no_transactions: "No transactions at the moment",
            card_holder: "Card Holder",
            expiry_date: "Expires",
            premium_card: "Premium Digital Card",
            hero_title: "Buy what you want, pay at your ease.",
            hero_subtitle: "Adjil gives you a monthly credit up to 10,000 DZD. Shop from thousands of stores and pay later.",
            new_app: "New: Mobile app available now",
            download_app: "Download App",
            how_it_works_title: "Your guide to using Adjil",
            how_it_works_subtitle: "Simple steps that open new shopping horizons",
            step1_title: "Register in minutes",
            step1_desc: "Fast and secure registration. Upload documents, choose your plan, and get instant credit.",
            step2_title: "Shop from hundreds of stores",
            step2_desc: "Browse our wide network of authorized merchants. Everything you need is available.",
            step3_title: "Scan the code and pay instantly",
            step3_desc: "No need for cash or cards. Simply scan the merchant's QR code via the Adjil app.",
            step4_title: "Pay later comfortably",
            step4_desc: "Enjoy your purchases today and settle your dues at the end of the month.",
            partners_title: "Authorized Payment Partners",
            partners_subtitle: "We trust them and they trust us",
            about_title: "Adjil: A Revolution in Digital Commerce in Algeria",
            about_subtitle: "We are not just a payment app, we are your financial partner.",
            start_journey: "Start your journey now",
            learn_more: "Learn More",
            fin_adv_title: "Financial Advantages",
            fin_adv_desc: "Smart financial management tailored to your budget",
            fin_adv_p: "We provide instant liquidity allowing you to acquire your essential needs without pressure.",
            fin_item1: "Instant Credit - Get shopping credit as soon as your account is activated.",
            fin_item2: "Flexible Payment - Pay at the end of the month or in easy installments.",
            fin_item3: "No Bank Commissions - 100% transparent system serving the citizen.",
            soc_adv_title: "Social Advantages",
            soc_adv_desc: "Enhancing trust and solidarity",
            soc_adv_p: "Adjil is a bridge of trust between the merchant and the customer.",
            eco_adv_title: "Economic Advantages",
            eco_adv_desc: "Driving the national economy",
            eco_adv_p: "We contribute to creating an active economic environment by increasing sales.",
            cta_title: "Ready to experience the future?",
            register_customer: "Register as customer",
            register_customer_desc: "Get instant shopping credit",
            register_merchant: "Join as merchant",
            register_merchant_desc: "Double your sales today",
            customer: "Customer",
            merchant: "Merchant",
            status_pending: "Pending Approval",
            status_success: "Success",
            sale_from: "Sale from:",
            collecting: "Collecting",
            footer_slogan: "Buy Now Pay Later - The ideal digital solution in Algeria.",
            quick_links: "Quick Links",
            why_adjil: "Why Adjil?",
            ethics_title: "Future of Ethical BNPL",
            ethics_desc: "We solve the liquidity crisis for Algerian families using technology, not interest.",
            integrity_title: "Financial Integrity",
            integrity_desc: "Our system ensures payment without bureaucratic complications.",
            account_frozen: "Account Temporarily Frozen",
            frozen_desc: "Sorry, your account privileges have been suspended due to unpaid dues.",
            no_merchants: "No merchants registered at the moment",
            merchants_title: "Our Merchant Partners",
            merchants_subtitle: "Find us across the country",
            algiers_algeria: "Algiers, Algeria",
            change_lang: "Change Language",
            investor_access: "Investor Access",
            scan_qr_title: "Scan QR Code",
            logout_confirm: "Are you sure you want to logout?",
            no_data: "No data available",
            invite_title: "Adjil | Buy Now Pay Later",
            invite_text: "Join Adjil and get instant credit up to 10,000 DZD!",
            invite_copied: "Download link copied! You can now send it to your friends.",
            alt_shop: "Shop",
            alt_scan: "Scan",
            alt_paylater: "Pay Later",
            alt_financial: "Financial",
            alt_social: "Social",
            alt_economic: "Economic",
            investment_opp: "Investment Opportunity",
            account_suspended: "Account Suspended",
            contact_support: "Contact Support",
            return_login: "Return to Login",
            qr_video_title: "How to Pay with QR Code",
            qr_video_subtitle: "Tutorial video on purchasing and balance verification",
            video_placeholder: "Video tutorial coming soon",
            pay_later_title: "Pay Later: Security, Ease, and Peace of Mind",
            pay_later_subtitle: "Our system is designed to give you financial freedom without complications.",
            pay_later_desc: "We use the latest technologies to ensure a seamless payment experience. Buy now and pay at the end of the month with ease.",
            api_title: "Developer Interface (API)",
            api_subtitle: "Soon: Comprehensive documentation to integrate Adjil into your online store.",
            secure_payment: "100% secure and encrypted payment",
            scan_camera_desc: "Point camera at merchant code",
            searching_qr: "Searching for QR code automatically...",
            simulate_qr: "Simulate successful scan",
            online_now: "Online now",
            direct_pay_title: "Direct Payment",
            enter_due_amount: "Enter due amount",
            choose_method: "Choose payment method",
            method_qr: "Activate QR",
            method_id: "Select Market ID",
            market_id_label: "Merchant ID",
            payment_done: "Amount transferred to merchant wallet",
            invoice_ready: "Digital invoice created and ready to download",
            copyright: "© 2026 Adjil Platform. All rights reserved.",
            pos_system: "Point of Sale System (POS)",
            clear: "Clear",
            total_amount_to_pay: "Total Amount to Pay",
            manual_amount_placeholder: "Manual amount...",
            simulate_barcode: "Simulate barcode scanner:",
            scan_product_500: "Scan 500 DZD product",
            generate_qr_code: "Generate Payment QR Code",
            scan_merchant_qr: "Scan Merchant QR Code",
            point_camera_merchant: "Point your camera at the merchant code to pay",
            bank_settings_title: "Bank / Postal Settings",
            bank_settings_desc: "Enter your bank account details to receive and make payments.",
            account_type: "Account Type",
            post_account_rip: "Algerie Poste (RIP) - CCP",
            bank_account_rib: "Bank Account (RIB)",
            account_number_label: "Account Number (RIP/RIB)",
            account_number_placeholder: "Enter 20 digits...",
            cancel_back: "Cancel / Back",
            save_changes: "Save Changes",
            bank_postal_info: "Bank/Postal Info",
            bank_account_info_btn: "Bank / Postal Account Information",
            auth_login_title: "Login",
            auth_register_title: "Register",
            auth_welcome_title: "Welcome to Adjil",
            auth_login_subtitle: "Log in to continue",
            auth_register_subtitle: "Join the Adjil family today",
            auth_create_account_title: "Create a new account",
            email_phone: "Email or phone",
            email_phone_placeholder: "example@mail.com / 0550...",
            password_placeholder: "••••••••",
            fill_required: "Please fill in all required fields",
            email_registered: "Email already registered",
            phone_registered: "Phone number already registered",
            register_success: "Account created successfully! You can now log in.",
            login_error: "Invalid email or password",
            subscribe_login_required: "You must log in first to subscribe to a plan",
            forgot_password_sent: "Reset instructions sent to: ",
            invalid_amount: "Please enter a valid amount",
            enter_merchant_name: "Please enter merchant name",
            merchant_not_found: "Error: Merchant not found",
            system_error_user_not_found: "System error: User not found",
            payment_success_msg: "Payment successful!",
            qr_scan_success: "QR Code scanned successfully! Please confirm payment.",
            search_merchant: "Search for a store",
            search_merchant_placeholder: "Store name or activity",
            view_on_map: "View on Map",
            merchant_activity: "Activity",
            merchant_location: "Location",
            merchant_pin_label: "Payment PIN",
            copy_pin: "Copy PIN",
            copied: "Copied",
            select_merchant: "Select Merchant",
            plan_selected: "Plan selected: ",
            demo_customer: "Demo Login (Customer)",
            demo_merchant: "Demo Login (Merchant)",
            firstname: "First Name",
            lastname: "Last Name",
            email: "Email",
            phone: "Phone",
            password: "Password",
            optional: "(Optional)",
            create_account: "Create Account",
            next: "Next",
            back: "Back",
            confirm: "Confirm",
            digital_contract: "Digital Contract",
            digital_contract_desc: "Before activating your account, please read the Adjil contract and accept the terms.",
            open_contract: "Click to read contract",
            accept_terms: "I have read and accept the Adjil contract terms",
            must_accept_terms: "You must accept the contract terms before creating your account",
            id_card: "Biometric ID Card",
            payslip: "Payslip (PDF)",
            canceled_check: "Canceled Check",
            commercial_register: "Commercial Register",
            activity_wilaya: "Activity Wilaya",
            plan_monthly: "Monthly",
            plan_6months: "6 Months",
            plan_annual: "Annual",
            price_suffix: "DZD/month",
            subscribe_now: "Subscribe",
            save_20: "Save 20%",
            save_40: "Save 40%",
            price_monthly: "500",
            price_6months: "400",
            price_annual: "300",
            most_popular: "Most Popular",
            credit_limit: "10,000 DZD Credit",
            pay_30_days: "30-day Payment",
            no_interest: "No Interest",
            priority_support: "Priority Support",
            increase_limit: "Increase Limit",
            annual_gifts: "Annual Gifts",
            enter_pin_desc: "Enter your PIN to confirm the transaction",
            cancel: "Cancel",
            confirm: "Confirm",
            payment_success_desc: "Amount deducted successfully, you can now download your digital invoice.",
            amount: "Amount",
            merchant: "Merchant",
            transaction_id: "Transaction ID",
            download_invoice: "Download Invoice",
            return_dashboard: "Return to Dashboard",
            collect_outstanding: "Collect Outstanding",
            api_settlement_desc: "Use the banking settlement engine to withdraw BNPL sales directly to your Bank or CCP account.",
            request_payout_api: "Request Payout (API)",
            card_number_label: "Card Number",
            settlement_simulator: "Settlement Simulator",
            settlement_simulator_sub: "Settlement Engine Simulator (Bank Side)",
            start_auto_scan: "Start Auto-Scan & Debit",
            console_waiting: "> Waiting for system command...",
            adjil_pool: "Adjil Commercial Pool",
            pending_disbursements: "Pending Disbursements",
            api_desc_scan: "Scan current accounts and identify due amounts.",
            api_desc_debit: "Execute direct debit (Prélèvement) from customer account.",
            api_desc_disburse: "Redistribute funds to merchants across different institutions.",
            compatible_ccp: "Compatible with Algérie Poste (CCP)",
            compatible_cib: "Compatible with Banking Systems (CIB/SATIM)",
            ceo_title: "CEO & Founder Message",
            ceo_message: "At Adjil, we look to the future with a sharp vision that places humans at the heart of financial innovation. Our goal is to expand globally through strategic partnerships and reliable technologies that simplify daily life and open doors of opportunity for everyone. We are committed to practical initiatives to improve individuals' standard of living, through secure and transparent payment solutions that respect user privacy and grant them the freedom of financial management without complexity. All thanks and appreciation to everyone who believed in the Adjil project and supported its journey.",
            contract_intro: "This contract is concluded between Adjil Platform on one hand, and the subscriber (customer or merchant) on the other, to regulate the use of the BNPL service according to clear financial and legal controls.",
            contract_art1_title: "Article 1 – Subject of the Contract",
            contract_art1_desc: "This contract aims to grant the subscriber the possibility of using a credit limit set by the platform for purchases from merchants affiliated with the BNPL system, with their full commitment to repay the due amounts within the specified deadlines.",
            contract_art2_title: "Article 2 – Subscriber Obligations & Strict Payment",
            contract_art2_desc: "The subscriber undertakes to strictly pay all due amounts before the 5th of each month. In case of non-payment by this strict deadline, the subscriber agrees to the automatic freezing of their postal/bank account until the situation is regularized.",
            contract_art3_title: "Article 3 – Merchant Obligations",
            contract_art3_desc: "The merchant undertakes to document each sale accurately via Adjil, not to record any fictitious transactions, to respect the announced prices, and to cooperate with the platform.",
            contract_art4_title: "Article 4 – Platform Rights",
            contract_art4_desc: "The platform reserves the right to review the credit limit, and suspend or terminate the account in case of suspected illegal use or repeated payment defaults.",
            contract_art5_title: "Article 5 – Electronic Acceptance",
            contract_art5_desc: "Ticking the box \"I have read and accept the Adjil contract terms\" constitutes a full electronic acceptance of all terms, having the same legal effect as a handwritten signature.",
            contract_art6_title: "Article 6 – Personal Data Protection",
            contract_art6_desc: "Adjil undertakes to respect Law 18-07 on the protection of natural persons in the processing of personal data, using data only for the service, with appropriate security and confidentiality.",
            contract_art7_title: "Article 7 – Direct Debit Mandate & Penalties",
            contract_art7_desc: "The subscriber grants an express mandate to Adjil to deduct installments on the specified date. If deduction fails due to insufficient funds, the platform reserves the right to immediately freeze the subscriber's postal/bank account without prior notice until settlement.",
            contract_subscriber_name: "Subscriber Name",
            contract_signature_date: "Signature Date",
            contract_signature_label: "Subscriber Signature",
            print_contract: "Print Contract",
            download_contract: "Download Contract",
            pricing_page_title: "Flexible Subscription Plans",
            pricing_page_subtitle: "Choose the plan that suits your needs and enjoy instant shopping",
            about_hero_title: "Adjil: A Revolution in Digital Commerce in Algeria",
            about_hero_subtitle: "We are not just a payment app, we are your financial partner seeking to reshape the relationship between the merchant and the consumer in Algeria through innovative \"Buy Now, Pay Later\" solutions.",
            no_interest_fees: "0% Interest or hidden fees",
            empower_families: "Empowering Families",
            empower_families_desc: "Providing essential needs on time without delay.",
            security_privacy: "Security & Privacy",
            security_privacy_desc: "Protecting your data and transactions with the highest digital encryption standards.",
            support_merchants: "Support Local Merchants",
            support_merchants_desc: "Increased customer purchasing power means more sales and faster growth for stores.",
            digitize_finance: "Digitizing Financial Transactions",
            digitize_finance_desc: "Reducing reliance on cash and moving towards modern electronic payment."
        }
    },
    renderMerchants: () => {
        const users = DB.get('users') || [];
        const merchants = users.filter(u => u.role === 'merchant');
        const container = document.getElementById('dynamic-merchants-container');
        const searchInput = document.getElementById('merchants-search');
        const t = app.translations[app.lang];

        const updateUI = (filtered) => {
            if (filtered.length === 0) {
                container.innerHTML = `<p class="text-center col-span-full py-12 text-slate-500" data-t="no_merchants">${t.no_merchants}</p>`;
                return;
            }
            container.innerHTML = filtered.map(m => `
                <div class="glass-effect p-8 rounded-3xl border border-white/10 tilt-hover space-y-6">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-3xl">
                            <i class="fa-solid fa-store"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white">${m.name}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-primary font-bold uppercase tracking-widest">${m.activity || t.merchant_activity}</span>
                                <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">ID: ${m.id}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="flex items-start gap-3 text-sm text-slate-400">
                            <i class="fa-solid fa-location-dot mt-1 text-primary"></i>
                            <span>${m.location || t.merchant_location}</span>
                        </div>
                    </div>

                    <a href="https://www.google.com/maps/search/?api=1&query=${m.coords || m.location}" target="_blank" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-map-location-dot"></i>
                        <span>${t.view_on_map}</span>
                    </a>
                </div>
            `).join('');
        };

        updateUI(merchants);

        if (searchInput) {
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = merchants.filter(m =>
                    m.name.toLowerCase().includes(term) ||
                    (m.activity && m.activity.toLowerCase().includes(term))
                );
                updateUI(filtered);
            };
        }
    },
    filterMerchantSuggestions: () => {
        const input = document.getElementById('pay-merchant-name');
        const suggestionsBox = document.getElementById('merchant-suggestions');
        const term = input.value.toLowerCase();
        const users = DB.get('users') || [];
        const merchants = users.filter(u => u.role === 'merchant');

        if (!term) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        const filtered = merchants.filter(m => m.name.toLowerCase().includes(term));

        if (filtered.length > 0) {
            suggestionsBox.classList.remove('hidden');
            suggestionsBox.innerHTML = filtered.map(m => `
                <div onclick="app.selectMerchantSuggestion('${m.name}')" class="p-4 hover:bg-primary/20 cursor-pointer border-b border-slate-800 last:border-0 transition-colors">
                    <div class="font-bold text-white">${m.name}</div>
                    <div class="text-[10px] text-slate-500">${m.activity || ''}</div>
                </div>
            `).join('');
        } else {
            suggestionsBox.classList.add('hidden');
        }
    },
    selectMerchantSuggestion: (name) => {
        document.getElementById('pay-merchant-name').value = name;
        document.getElementById('merchant-suggestions').classList.add('hidden');
    },
    generateCardNumber: (userId) => {
        const base = '54230000';
        const suffix = String(userId).padStart(8, '0');
        const digits = base + suffix.slice(-8);
        return digits.match(/.{1,4}/g).join(' ');
    },
    generateMerchantPin: (pinSet) => {
        const existing = pinSet || new Set((DB.get('users') || []).filter(u => u.role === 'merchant' && u.pin).map(u => String(u.pin).padStart(4, '0')));
        let pin = '';
        let attempts = 0;
        do {
            pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            attempts += 1;
        } while (existing.has(pin) && attempts < 200);
        if (pinSet) pinSet.add(pin);
        return pin;
    },
    setLanguage: (lang) => {
        app.lang = lang;
        document.getElementById('current-lang-text').textContent = lang.toUpperCase();
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        localStorage.setItem('adjil_lang', lang);

        app.translateUI();
        // Refresh current view if needed
        if (window.location.hash) router.resolve();
    },
    toggleLanguage: () => {
        const langs = ['ar', 'fr', 'en'];
        const nextIdx = (langs.indexOf(app.lang) + 1) % langs.length;
        app.setLanguage(langs[nextIdx]);
    },
    translateUI: () => {
        const t = app.translations[app.lang];
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (t[key]) {
                // Handle standard text content
                if (el.children.length === 0) {
                    el.textContent = t[key];
                }
                // Handle attributes (placeholder, title, alt)
                if (el.hasAttribute('placeholder')) el.placeholder = t[key];
                if (el.hasAttribute('title')) el.setAttribute('title', t[key]);
                if (el.tagName === 'IMG' && el.hasAttribute('alt')) el.setAttribute('alt', t[key]);
            }
        });
        // Update specific elements that might not have children or need special handling
        const navLinks = document.querySelectorAll('nav .hidden.md\\:flex a');
        if (navLinks.length >= 5) {
            navLinks[0].textContent = t.home;
            navLinks[1].textContent = t.how_it_works;
            navLinks[2].textContent = t.pricing;
            navLinks[3].textContent = t.about;
            navLinks[4].textContent = t.developers;
        }
        const authBtnText = document.getElementById('auth-btn-text');
        if (authBtnText && !app.user) authBtnText.textContent = t.login;

        // Toggle current lang indicator
        const currentLangText = document.getElementById('current-lang-text');
        if (currentLangText) currentLangText.textContent = app.lang.toUpperCase();

        // Adjust eye icon position based on direction
        const eyeBtns = [document.getElementById('auth-pass-btn'), document.getElementById('reg-pass-btn')];
        eyeBtns.forEach(btn => {
            if (btn) {
                if (app.lang === 'ar') {
                    btn.classList.remove('right-3');
                    btn.classList.add('left-3');
                } else {
                    btn.classList.remove('left-3');
                    btn.classList.add('right-3');
                }
            }
        });

        // Adjust contract text alignment
        const contractContent = document.getElementById('contract-modal-content');
        if (contractContent) {
            contractContent.dir = app.lang === 'ar' ? 'rtl' : 'ltr';
            contractContent.style.textAlign = app.lang === 'ar' ? 'right' : 'left';
        }
    },
    animateValue: (id, start, end, duration) => {
        if (start === end) return;
        const obj = document.getElementById(id);
        if (!obj) return;
        const range = end - start;
        let current = start;
        const increment = end > start ? Math.ceil(range / (duration / 16)) : Math.floor(range / (duration / 16));
        const step = () => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                obj.textContent = end.toLocaleString();
            } else {
                obj.textContent = current.toLocaleString();
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    },
    togglePassword: (id) => {
        const input = document.getElementById(id);
        const eye = document.getElementById(id + '-eye');
        if (input.type === 'password') {
            input.type = 'text';
            eye.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            eye.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },
    forgotPassword: () => {
        const t = app.translations[app.lang];
        const email = prompt(app.lang === 'ar' ? 'يرجى إدخال بريدك الإلكتروني أو رقم هاتفك لاستعادة كلمة المرور:' : 'Please enter your email or phone to reset password:');
        if (email) {
            alert(t.forgot_password_sent + email);
        }
    },
    init: () => {
        const savedLang = localStorage.getItem('adjil_lang');
        if (savedLang) app.setLanguage(savedLang);

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker Registered!', reg))
                .catch(err => console.log('SW Registration Failed:', err));
        }

        setTimeout(() => DB.supabase.syncUsers(), 1000);
        setTimeout(() => window.AuthService?.migrateLocalToCloud?.(), 1500);
        window.addEventListener('online', () => {
            window.SyncService?.syncPendingWrites?.();
            if (app.user?.role === 'merchant') {
                window.SyncService?.fetchMerchantTransactionsFromSupabase?.(app.user.id);
            }
        });

        // Real-time Sync between Customer and Merchant
        window.addEventListener('storage', (e) => {
            if (e.key === 'adjil_users' || e.key === 'adjil_session') {
                const session = localStorage.getItem('adjil_session');
                if (session) {
                    const latestUsers = DB.get('users') || [];
                    const currentUser = JSON.parse(session);
                    const updatedUser = latestUsers.find(u => u.id === currentUser.id);

                    if (updatedUser) {
                        // Check if it's a new transaction for merchant notification
                        const oldTxCount = (app.user?.txs || []).length;
                        const newTxCount = (updatedUser.txs || []).length;

                        app.user = updatedUser;
                        localStorage.setItem('adjil_session', JSON.stringify(app.user));
                        app.updateDashboardUI();

                        if (app.user.role === 'merchant' && newTxCount > oldTxCount) {
                            app.showPaymentNotification();
                        }
                    }
                }
            }
        });

        // Migration: Ensure card numbers exist for all users
        const usersDB = DB.get('users');
        if (usersDB) {
            let changed = false;
            usersDB.forEach(u => {
                if (!u.cardNumber) {
                    u.cardNumber = app.generateCardNumber(u.id);
                    changed = true;
                }
            });
            if (changed) DB.set('users', usersDB);
        }
        if (usersDB) {
            let changed = false;
            usersDB.forEach(u => {
                if (u.role === 'customer') {
                    if (u.status == null) {
                        u.status = (u.balance || 0) > 0 ? 'active' : 'inactive';
                        changed = true;
                    }
                    if (u.credit_limit == null) {
                        u.credit_limit = (u.balance || 0) > 0 ? u.balance : 0;
                        changed = true;
                    }
                    if (u.subscription_plan === undefined) {
                        u.subscription_plan = null;
                        changed = true;
                    }
                    if ((u.balance || 0) < 0) {
                        u.balance = 0;
                        changed = true;
                    }
                    if ((u.credit_limit || 0) < 0) {
                        u.credit_limit = 0;
                        changed = true;
                    }
                } else {
                    if (u.status == null) {
                        u.status = 'active';
                        changed = true;
                    }
                    if (u.credit_limit == null) {
                        u.credit_limit = 0;
                        changed = true;
                    }
                    if (u.subscription_plan === undefined) {
                        u.subscription_plan = null;
                        changed = true;
                    }
                }
            });
            if (changed) DB.set('users', usersDB);
        }
        if (usersDB) {
            const regenFlag = localStorage.getItem('adjil_pins_regenerated');
            if (!regenFlag) {
                const pinSetAll = new Set();
                let pinsChanged = false;
                usersDB.forEach(u => {
                    if (u.role === 'merchant') {
                        u.pin = app.generateMerchantPin(pinSetAll);
                        pinsChanged = true;
                        if (window.SyncService) window.SyncService.updateMerchantProfile(u.id, { pin: u.pin });
                    }
                });
                if (pinsChanged) {
                    DB.set('users', usersDB);
                    localStorage.setItem('adjil_pins_regenerated', '1');
                }
            }
        }
        if (usersDB) {
            const pinSet = new Set(usersDB.filter(u => u.role === 'merchant' && u.pin).map(u => String(u.pin).padStart(4, '0')));
            let pinChanged = false;
            usersDB.forEach(u => {
                if (u.role === 'merchant' && (!u.pin || String(u.pin).length !== 4)) {
                    u.pin = app.generateMerchantPin(pinSet);
                    pinChanged = true;
                    if (window.SyncService) window.SyncService.updateMerchantProfile(u.id, { pin: u.pin });
                }
            });
            if (pinChanged) DB.set('users', usersDB);
        }

        if (window.AuthService) {
            window.AuthService.subscribe((user) => {
                app.user = user;
                const authBtnText = document.getElementById('auth-btn-text');
                if (authBtnText && user?.name) authBtnText.textContent = user.name;

                if (app.user) {
                    const users = DB.get('users') || [];
                    const updated = users.find(u => u.id === app.user.id);
                    if (updated) {
                        app.user = updated;
                        localStorage.setItem('adjil_session', JSON.stringify(app.user));
                    }
                }

                if (!app.user && window.location.hash.slice(1) === '/dashboard') {
                    router.navigate('/auth');
                }
            });
        } else {
            const session = localStorage.getItem('adjil_session');
            if (session) {
                app.user = JSON.parse(session);
                const authBtnText = document.getElementById('auth-btn-text');
                if (authBtnText) authBtnText.textContent = app.user.name;
            }
            // Refresh session from DB to get latest balance/txs
            if (app.user) {
                const users = DB.get('users');
                const updated = users.find(u => u.id === app.user.id);
                if (updated) {
                    app.user = updated;
                    localStorage.setItem('adjil_session', JSON.stringify(app.user));
                }
            }
        }
        router.resolve();
        app.startPolling();
    },
    startPolling: () => {
        // Poll for updates every 5 seconds
        setInterval(() => {
            if (app.user) {
                // Refresh data from DB
                const users = DB.get('users');
                const updated = users.find(u => u.id === app.user.id);
                if (updated) {
                    const oldBalance = app.user.balance;
                    app.user = updated;
                    localStorage.setItem('adjil_session', JSON.stringify(app.user));

                    // Visual feedback if balance changed (e.g. approved while merchant was away)
                    if (oldBalance !== app.user.balance) {
                        app.updateDashboardUI();
                        app.notifyLowBalance(app.user);
                    }
                }

                // If merchant, specifically refresh pending list
                if (app.user.role === 'merchant') {
                    app.updateDashboardUI();
                }
            }
            if (navigator.onLine && window.SyncService) {
                window.SyncService.syncPendingWrites();
                if (app.user?.role === 'merchant') {
                    window.SyncService.fetchMerchantTransactionsFromSupabase(app.user.id);
                }
            }
        }, 5000);
    },
    notifyTransaction: (tx) => {
        if (!app.user) return;
        const isCustomer = app.user.role === 'customer';
        const title = isCustomer ? 'تم الدفع بنجاح' : 'استلام دفعة جديدة';
        const body = isCustomer
            ? `تم دفع ${tx.amount} دج لمتجر ${tx.merchant}`
            : `استلمت ${tx.amount} دج من زبون آجل`;

        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: 'assets/Adjil logo/Adjil logo.png' });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(p => {
                    if (p === 'granted') new Notification(title, { body, icon: 'assets/Adjil logo/Adjil logo.png' });
                });
            }
        }
        app.logToApiConsole(`${title} - ${body}`, 'success');
    },
    requestApiSettlement: async () => {
        if (!app.user || app.user.role !== 'merchant') return;

        const outstanding = app.user.outstanding || 0;

        if (outstanding <= 0) {
            alert(app.lang === 'ar' ? 'لا توجد مبالغ للتحصيل' : 'No funds to settle');
            return;
        }

        const btn = document.getElementById('merch-settle-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i>`;

            app.logToApiConsole(
                app.lang === 'ar' ? 'جاري تحصيل المبالغ عبر API إلى حساب التاجر...' : 'Processing API Settlement to Merchant Bank/CCP...',
                'info'
            );

            setTimeout(() => {
                const users = DB.get('users') || [];
                const idx = users.findIndex(u => u.id === app.user.id);
                if (idx >= 0) {
                    const totalSettled = users[idx].outstanding || 0;
                    users[idx].balance = 0; // Keeping this 0 just to clean up any legacy bad data
                    users[idx].outstanding = 0;

                    if (!users[idx].txs) users[idx].txs = [];
                    users[idx].txs.push({
                        id: 'STL-' + Date.now(),
                        amount: totalSettled,
                        merchant: 'Bank Transfer (API)',
                        date: new Date().toLocaleString('ar-DZ'),
                        status: 'completed',
                        method: 'API_SETTLEMENT'
                    });

                    DB.set('users', users);
                    app.user = users[idx];
                    localStorage.setItem('adjil_session', JSON.stringify(app.user));

                    app.logToApiConsole(
                        app.lang === 'ar' ? `نجاح التحويل البنكي للمبلغ: ${totalSettled} دج` : `Successful bank transfer of: ${totalSettled} DZD`,
                        'success'
                    );

                    app.updateDashboardUI();
                    alert(app.lang === 'ar' ? 'تم تحصيل المبالغ وتحويلها لحسابكم البنكي/البريدي بنجاح' : 'Funds successfully settled to your bank account');
                }

                btn.disabled = false;
                btn.innerHTML = originalText;
            }, 2000);
        }
    },
    notifyLowBalance: (user) => {
        if (!user || user.role !== 'customer') return;
        if ((user.balance || 0) > 2000) return;
        const key = `adjil_low_balance_${user.id}`;
        const last = parseInt(localStorage.getItem(key) || '0', 10);
        if (Date.now() - last < 6 * 60 * 60 * 1000) return;
        localStorage.setItem(key, String(Date.now()));
        const title = 'تنبيه: رصيدك في آجل قارب على الانتهاء';
        const body = `رصيدك الحالي: ${(user.balance || 0).toLocaleString()} دج`;
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(p => {
                    if (p === 'granted') new Notification(title, { body });
                });
            }
        }
        app.sendLowBalanceEmail(user);
    },
    sendLowBalanceEmail: async (user) => {
        if (!user?.email || !window.supabaseClient || typeof window.supabaseClient.functions?.invoke !== 'function') return;
        try {
            await window.supabaseClient.functions.invoke('send-support-email', {
                body: {
                    type: 'low_balance',
                    to_email: user.email,
                    user_email: user.email,
                    subject: 'تنبيه: رصيدك في آجل قارب على الانتهاء',
                    description: `رصيدك الحالي: ${(user.balance || 0).toLocaleString()} دج`
                }
            });
        } catch (err) {
        }
    },
    posAmount: 0,
    clearPosAmount: () => {
        app.posAmount = 0;
        app.updatePosDisplay();
        document.getElementById('dynamic-qr-section')?.classList.add('hidden');
    },
    addPosManualAmount: () => {
        const input = document.getElementById('pos-manual-amount');
        if (!input) return;
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
            app.posAmount += val;
            app.updatePosDisplay();
            input.value = '';
        } else {
            alert(app.lang === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
        }
    },
    simulateBarcodeScan: () => {
        app.posAmount += 500;
        app.updatePosDisplay();
    },
    updatePosDisplay: () => {
        const display = document.getElementById('pos-total-display');
        if (display) display.innerHTML = `${app.posAmount.toLocaleString()} <span class="text-lg">دج</span>`;
        if (app.posAmount <= 0) {
            document.getElementById('dynamic-qr-section')?.classList.add('hidden');
        }
    },
    generateMerchantQR: () => {
        if (app.posAmount <= 0) {
            alert(app.lang === 'ar' ? 'يرجى إدخال مبلغ أكبر من الصفر أولاً' : 'Please enter an amount > 0 first');
            return;
        }
        const container = document.getElementById('merch-qr-container');
        const section = document.getElementById('dynamic-qr-section');
        const amountDisplay = document.getElementById('qr-amount-display');
        if (!container || !section) return;

        container.innerHTML = '';
        const qrData = JSON.stringify({ m: app.user.id, a: app.posAmount });

        new QRCode(container, {
            text: qrData,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        if (amountDisplay) amountDisplay.textContent = app.posAmount.toLocaleString();
        section.classList.remove('hidden');
    },
    updateDashboardUI: () => {
        const menuContainer = document.getElementById('user-menu-container');
        const dropdown = document.getElementById('user-dropdown-menu');
        if (!app.user) {
            if (menuContainer) {
                menuContainer.onmouseenter = null;
                menuContainer.onmouseleave = null;
            }
            if (dropdown) dropdown.classList.add('hidden');
            return;
        }

        // Add hover effect
        if (menuContainer && dropdown) {
            menuContainer.onmouseenter = () => dropdown.classList.remove('hidden');
            menuContainer.onmouseleave = () => dropdown.classList.add('hidden');
            dropdown.onclick = () => dropdown.classList.add('hidden');
        }

        // Update nav button text
        const authBtnText = document.getElementById('auth-btn-text');
        if (authBtnText) authBtnText.textContent = app.user.name;

        if (window.location.hash !== '#/dashboard') return;

        const balanceEl = document.getElementById('dash-balance');
        const nameEl = document.getElementById('dash-user-name');
        const holderEl = document.getElementById('card-holder-name');
        const cardNumberEl = document.getElementById('card-number');
        const txList = document.getElementById('dash-tx-list');
        const merchNameEl = document.getElementById('merch-user-name');
        const merchSalesEl = document.getElementById('merch-total-sales');
        const merchReceivedEl = document.getElementById('merch-received');
        const merchOutstandingEl = document.getElementById('merch-outstanding');
        const merchTxList = document.getElementById('merch-tx-list');
        const merchActivityEl = document.getElementById('merch-activity');
        const merchLocationEl = document.getElementById('merch-location');
        const merchPinEl = document.getElementById('merch-pin');

        app.translateUI();

        if (balanceEl) balanceEl.textContent = app.user.balance.toLocaleString();
        if (nameEl) nameEl.textContent = app.user.name;
        if (holderEl) holderEl.textContent = app.user.name;
        if (cardNumberEl && app.user.cardNumber) {
            // Show full 16 digits formatted with spaces
            cardNumberEl.textContent = app.user.cardNumber;
        }
        if (merchNameEl) merchNameEl.textContent = app.user.name;
        if (merchActivityEl) merchActivityEl.textContent = app.user.activity || '';
        if (merchLocationEl) merchLocationEl.textContent = app.user.location || app.user.wilaya || '';
        if (merchPinEl) merchPinEl.textContent = app.user.pin ? String(app.user.pin).padStart(4, '0') : '';

        // If Customer and No Plan, show CTA
        if (app.user.role === 'customer' && !app.user.subscription_plan) {
            const container = document.getElementById('app');
            const t = app.translations[app.lang];
            const dashHeader = container.querySelector('.flex.flex-col.md\\:flex-row.justify-between');
            if (dashHeader && !document.getElementById('plan-activation-banner')) {
                const banner = document.createElement('div');
                banner.id = 'plan-activation-banner';
                banner.className = 'bg-primary/10 border border-primary/20 p-6 rounded-[2rem] mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-slide-up';
                banner.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xl">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white">${app.lang === 'ar' ? 'قم بتفعيل رصيدك الآن' : 'Activate your credit now'}</h3>
                            <p class="text-xs text-slate-400">${app.lang === 'ar' ? 'اختر باقة اشتراك للحصول على رصيدك الائتماني الفوري.' : 'Choose a subscription plan to get your instant credit limit.'}</p>
                        </div>
                    </div>
                    <button onclick="router.navigate('/pricing')" class="bg-primary hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                        ${app.lang === 'ar' ? 'عرض الباقات المتاحة' : 'View Available Plans'}
                    </button>
                `;
                dashHeader.parentNode.insertBefore(banner, dashHeader.nextSibling);
            }
        }

        if (app.user.role === 'merchant') {
            const receivedAmount = (app.user.txs || []).filter(tx => tx.method === 'API_SETTLEMENT' || tx.method === 'AUTO_SCAN_SETTLEMENT').reduce((sum, tx) => sum + tx.amount, 0);
            const totalSales = (app.user.txs || []).filter(tx => tx.method !== 'API_SETTLEMENT' && tx.method !== 'AUTO_SCAN_SETTLEMENT').reduce((sum, tx) => sum + tx.amount, 0);

            if (merchSalesEl) merchSalesEl.textContent = totalSales.toLocaleString();
            if (merchReceivedEl) merchReceivedEl.textContent = receivedAmount.toLocaleString();

            // Animate outstanding balance
            if (merchOutstandingEl) {
                const targetVal = app.user.outstanding || 0;
                const currentVal = parseInt(merchOutstandingEl.textContent.replace(/,/g, '')) || 0;
                if (currentVal !== targetVal) {
                    app.animateValue('merch-outstanding', currentVal, targetVal, 1000);
                } else {
                    merchOutstandingEl.textContent = targetVal.toLocaleString();
                }
            }
        }

        if (txList && app.user.role === 'customer' && app.user.txs) {
            const t = app.translations[app.lang];
            if (app.user.txs.length > 0) {
                txList.innerHTML = app.user.txs.map(tx => `
                    <div onclick="app.showInvoiceModal('${tx.id}')" class="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 ${tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center">
                                <i class="fa-solid ${tx.status === 'pending' ? 'fa-clock' : (tx.merchant.includes('غذائية') ? 'fa-basket-shopping' : tx.merchant.includes('بنزين') ? 'fa-gas-pump' : tx.merchant.includes('صيدلية') ? 'fa-pills' : tx.merchant.includes('فندق') ? 'fa-hotel' : 'fa-receipt')}"></i>
                            </div>
                            <div>
                                <div class="text-white font-bold text-sm">${tx.merchant}</div>
                                <div class="text-[10px] text-slate-500 font-mono">${tx.date}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-white font-black text-sm">-${tx.amount} دج</div>
                            <div class="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 inline-block mt-1">${tx.status === 'pending' ? t.status_pending : t.status_success}</div>
                        </div>
                    </div>
                `).reverse().join('');
            } else {
                txList.innerHTML = `<div class="text-center py-12 text-slate-500"><i class="fa-solid fa-receipt text-4xl mb-4 opacity-20"></i><p>${t.no_transactions}</p></div>`;
            }
        }

        // Handle sub-confirm logic
        if (window.location.hash === '#/sub-confirm' && app.pendingPlan) {
            const planEl = document.getElementById('sub-confirm-plan');
            const amountEl = document.getElementById('sub-confirm-amount');
            if (planEl && amountEl) {
                const plan = app.pendingPlan;
                const price = plan === 'monthly' ? 500 : plan === '6months' ? 400 : 300;
                const label = app.lang === 'ar' 
                    ? (plan === 'monthly' ? 'شهري' : plan === '6months' ? '6 أشهر' : 'سنوي')
                    : (plan === 'monthly' ? 'Monthly' : plan === '6months' ? '6 Months' : 'Annual');
                planEl.textContent = label;
                amountEl.textContent = `${price} دج`;
            }
        }

        // Handle API report logic
        if (window.location.hash === '#/api') {
            app.renderDeductionReport();
        }

        // Animate Customer Balance
        if (balanceEl && app.user.role === 'customer') {
            const targetVal = app.user.balance || 0;
            // Force a re-read of the current displayed value to ensure animation starts from correct point
            const currentText = balanceEl.textContent.replace(/,/g, '');
            const currentVal = parseInt(currentText) || 0;

            if (currentVal !== targetVal) {
                app.animateValue('dash-balance', currentVal, targetVal, 1000);
            } else {
                balanceEl.textContent = targetVal.toLocaleString();
            }
        }

        if (merchTxList && app.user.role === 'merchant') {
            const completedTxs = (app.user.txs || []).slice().sort((a, b) => {
                const da = new Date(a.created_at || a.date || 0).getTime();
                const db = new Date(b.created_at || b.date || 0).getTime();
                return db - da;
            });
            const t = app.translations[app.lang];
            let html = '';

            if (completedTxs.length > 0) {
                html += completedTxs.map(tx => `
                    <div onclick="app.showInvoiceModal('${tx.id}')" class="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 ${tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'} rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-arrow-down"></i>
                            </div>
                            <div>
                                <div class="text-white font-bold">${t.sale_from || 'Sale from'} ID ${tx.customerCard || ''}</div>
                                <div class="text-[10px] text-slate-500 font-mono">${tx.date}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-white font-black text-sm">+${tx.amount} دج</div>
                            <div class="text-[8px] px-1.5 py-0.5 rounded ${tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'} inline-block mt-1">${tx.status === 'pending' ? (t.collecting || 'Collecting') : (t.status_success || 'Success')}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                html = `<div class="text-center py-12 text-slate-500"><i class="fa-solid fa-receipt text-4xl mb-4 opacity-20"></i><p>${t.no_sales}</p></div>`;
            }
            merchTxList.innerHTML = html;
        }
    },
    showInvoiceModal: (txId) => {
        if (!app.user || !app.user.txs) return;
        const tx = app.user.txs.find(t => t.id === txId);
        if (!tx) return;

        // Ensure we have a modal container or create one if it doesn't exist
        let modal = document.getElementById('invoice-detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'invoice-detail-modal';
            modal.className = 'fixed inset-0 z-[200] hidden items-center justify-center px-4';
            modal.innerHTML = `
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="this.parentElement.classList.add('hidden')"></div>
                <div class="glass-effect bg-slate-900/95 border border-white/10 w-full max-w-md rounded-[2rem] p-6 relative shadow-2xl animate-fade-in-up">
                    <button type="button" onclick="document.getElementById('invoice-detail-modal').classList.add('hidden')" class="absolute top-4 left-4 text-slate-400 hover:text-white">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                    <div class="text-center mb-6 pt-2">
                        <div class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-file-invoice"></i>
                        </div>
                        <h2 class="text-xl font-bold text-white">تفاصيل الفاتورة</h2>
                        <p class="text-xs text-slate-400 font-mono mt-1" id="inv-modal-id"></p>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <div class="flex justify-between items-center py-3 border-b border-slate-800">
                            <span class="text-slate-400 text-sm">التاريخ</span>
                            <span class="text-white font-medium text-sm" id="inv-modal-date"></span>
                        </div>
                        <div class="flex justify-between items-center py-3 border-b border-slate-800">
                            <span class="text-slate-400 text-sm">الزبون</span>
                            <span class="text-white font-medium text-sm" id="inv-modal-customer"></span>
                        </div>
                        <div class="flex justify-between items-center py-3 border-b border-slate-800">
                            <span class="text-slate-400 text-sm">البطاقة</span>
                            <span class="text-white font-mono text-sm" id="inv-modal-card"></span>
                        </div>
                        <div class="flex justify-between items-center py-3 border-b border-slate-800">
                            <span class="text-slate-400 text-sm">الحالة</span>
                            <span class="text-primary font-medium text-sm" id="inv-modal-status"></span>
                        </div>
                    </div>
                    
                    <div class="bg-slate-900 rounded-xl p-4 flex justify-between items-center mb-6 border border-slate-800">
                        <span class="text-slate-300 font-bold">المبلغ الإجمالي</span>
                        <span class="text-2xl font-black text-white" id="inv-modal-amount"></span>
                    </div>
                    
                    <button id="inv-modal-download-btn" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-download"></i> تحميل الفاتورة
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update modal content
        document.getElementById('inv-modal-id').textContent = tx.id;
        document.getElementById('inv-modal-date').textContent = tx.date;
        document.getElementById('inv-modal-customer').textContent = tx.customerName || (tx.customerCard ? `ID ${tx.customerCard}` : 'Unknown');
        document.getElementById('inv-modal-card').textContent = tx.customerCard || 'N/A';
        document.getElementById('inv-modal-status').textContent = tx.status === 'pending' ? 'قيد التحصيل' : 'مكتملة';
        document.getElementById('inv-modal-status').className = `font-medium text-sm ${tx.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`;
        document.getElementById('inv-modal-amount').textContent = `${tx.amount.toLocaleString()} دج`;

        document.getElementById('inv-modal-download-btn').onclick = () => app.downloadInvoice(tx);

        modal.classList.remove('hidden');
    },
    qrScannerObj: null,
    startQRScanner: () => {
        const modal = document.getElementById('qr-scanner-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        if (!app.qrScannerObj) {
            app.qrScannerObj = new Html5Qrcode("qr-reader");
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

        app.qrScannerObj.start(
            { facingMode: "environment" },
            config,
            app.onQRScanSuccess,
            (errorMessage) => {
                // Ignore continuous scanning errors
            }
        ).catch(err => {
            console.error("Camera error:", err);
            alert(app.lang === 'ar' ? "فشل فتح الكاميرا. تحقق من الصلاحيات." : "Failed to open camera. Check permissions.");
            app.stopQRScanner();
        });
    },
    stopQRScanner: () => {
        const modal = document.getElementById('qr-scanner-modal');
        if (modal) modal.classList.add('hidden');

        if (app.qrScannerObj && app.qrScannerObj.isScanning) {
            app.qrScannerObj.stop().catch(console.error);
        }
    },
    onQRScanSuccess: (decodedText) => {
        app.stopQRScanner();

        try {
            const data = JSON.parse(decodedText);
            if (data.m && data.a) {
                // Delay slightly to allow the camera to stop cleanly before opening next modal
                setTimeout(() => app.openPaymentModal('qr', data.m, data.a), 300);
            } else {
                throw new Error("Invalid format");
            }
        } catch (e) {
            if (decodedText.startsWith('adjil-merch-') || decodedText.length > 5) {
                setTimeout(() => app.openPaymentModal('qr', decodedText, ''), 300);
            } else {
                alert(app.lang === 'ar' ? 'رمز QR غير صالح لمعاملة الدفع' : 'Invalid QR Code for payment');
            }
        }
    },
    openPaymentModal: (type = 'manual', merchantId = '', amount = '') => {
        const modal = document.getElementById('payment-modal');
        const manual = document.getElementById('manual-payment-content');

        if (modal) modal.classList.remove('hidden');
        if (manual) manual.classList.remove('hidden');

        // Hide other contents
        const pinContent = document.getElementById('pin-verification-content');
        const successContent = document.getElementById('success-payment-content');
        if (pinContent) pinContent.classList.add('hidden');
        if (successContent) successContent.classList.add('hidden');

        // Reset to Step 1
        const dueBoard = document.getElementById('due-board');
        const methodBoard = document.getElementById('method-board');
        if (dueBoard) dueBoard.classList.remove('hidden');
        if (methodBoard) methodBoard.classList.add('hidden');

        // Reset Inputs
        const amtInput = document.getElementById('due-amount');
        const idInput = document.getElementById('market-id');
        const pinInput = document.getElementById('pay-pin');

        if (amtInput) amtInput.value = amount;
        if (idInput) idInput.value = merchantId;
        if (pinInput) pinInput.value = '';

        // Reset Stepper
        const stepLine = document.getElementById('modal-step-line');
        const s2 = document.getElementById('mstep-2');

        if (stepLine) stepLine.style.width = '0%';
        if (s2) {
            s2.classList.replace('bg-primary', 'bg-slate-800');
            s2.classList.replace('text-white', 'text-slate-500');
        }

        // Auto-advance if QR and data is present
        if (type === 'qr' && merchantId && amount) {
            setTimeout(() => {
                app.dueAmountOk();
            }, 300);
        }
    },

    closePaymentModal: () => {
        const modal = document.getElementById('payment-modal');
        if (modal) modal.classList.add('hidden');
    },

    dueAmountOk: () => {
        const amtInput = document.getElementById('due-amount');
        const amount = parseFloat(amtInput.value);
        const t = app.translations[app.lang];

        if (!amount || amount <= 0) return alert(app.lang === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Invalid Amount');
        if (app.user?.status && app.user.status !== 'active') return alert(app.lang === 'ar' ? 'الحساب غير نشط' : 'Account is inactive');
        if (amount > app.user.balance) return alert(t.insufficient_balance);

        const idInput = document.getElementById('market-id');
        const merchantId = idInput ? idInput.value : '';

        // If merchantId is a UUID from QR scan, skip method-board and ask for Customer PIN
        if (merchantId && merchantId.length > 5) {
            const users = DB.get('users') || [];
            const merchant = users.find(u => u.role === 'merchant' && u.id === merchantId);
            if (!merchant) {
                return alert(app.lang === 'ar' ? 'حدث خطأ: التاجر غير موجود' : 'Error: Merchant not found');
            }

            app.currentPendingTx = {
                amount,
                merchantId,
                merchantName: merchant.name
            };

            document.getElementById('manual-payment-content').classList.add('hidden');
            document.getElementById('pin-verification-content').classList.remove('hidden');
            return;
        }

        const displayAmount = document.getElementById('method-board-amount-display');
        if (displayAmount) {
            displayAmount.textContent = `${amount.toLocaleString()} دج`;
            displayAmount.classList.remove('hidden');
        }

        // Move to Step 2
        document.getElementById('due-board').classList.add('hidden');
        document.getElementById('method-board').classList.remove('hidden');

        // Update Stepper
        document.getElementById('modal-step-line').style.width = '100%';
        const s2 = document.getElementById('mstep-2');
        if (s2) {
            s2.classList.replace('bg-slate-800', 'bg-primary');
            s2.classList.replace('text-slate-500', 'text-white');
        }
    },

    backToAmount: () => {
        document.getElementById('method-board').classList.add('hidden');
        document.getElementById('due-board').classList.remove('hidden');

        // Update Stepper
        document.getElementById('modal-step-line').style.width = '0%';
        const s2 = document.getElementById('mstep-2');
        if (s2) {
            s2.classList.replace('bg-primary', 'bg-slate-800');
            s2.classList.replace('text-white', 'text-slate-500');
        }
    },

    executeDirectPayment: () => {
        const pinEl = document.getElementById('market-id');
        const mPin = (pinEl?.value || '').trim();
        if (!/^\d{4}$/.test(mPin)) {
            return alert(app.lang === 'ar' ? 'يرجى إدخال رمز تاجر مكوّن من 4 أرقام' : 'Please enter a 4-digit merchant PIN');
        }
        const users = DB.get('users') || [];
        const t = app.translations[app.lang];

        // Validate Merchant PIN
        const merchant = users.find(u => u.role === 'merchant' && String(u.pin).padStart(4, '0') === mPin);

        if (!merchant) return alert(app.lang === 'ar' ? 'رمز PIN التاجر غير صحيح' : 'Incorrect Merchant PIN');
        if (merchant.id === app.user.id) return alert(app.lang === 'ar' ? 'خطأ: لا يمكن الدفع لنفس الحساب' : "Error: Self-payment not allowed");

        const amountInput = document.getElementById('due-amount');
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) return alert(t.invalid_amount);
        
        if (app.user?.status && app.user.status !== 'active') return alert(app.lang === 'ar' ? 'الحساب غير نشط' : 'Account is inactive');
        if (amount > app.user.balance) return alert(t.insufficient_balance);

        const btn = document.getElementById('real-pay-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i>`;

        setTimeout(async () => {
            let tx;
            try {
                tx = await window.SyncService.recordTransaction({
                    customerId: app.user.id,
                    merchantId: merchant.id,
                    amount,
                    method: 'BNPL_MANUAL',
                    merchantName: merchant.name,
                    customerName: app.user.name,
                    customerCard: app.user.cardNumber
                });
            } catch (err) {
                alert(err.message || 'Error');
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }
            app.updateDashboardUI();

            // Show Success UI
            document.getElementById('manual-payment-content').classList.add('hidden');
            document.getElementById('success-payment-content').classList.remove('hidden');

            document.getElementById('success-amount').textContent = amount.toLocaleString() + ' دج';
            document.getElementById('success-merchant').textContent = merchant.name;
            document.getElementById('success-tx-id').textContent = tx.id;

            const downloadBtn = document.getElementById('download-invoice-btn');
            if (downloadBtn) downloadBtn.onclick = () => app.downloadInvoice(tx);

            window.dispatchEvent(new Event('storage'));

            btn.disabled = false;
            btn.innerHTML = originalText;
            
            // Clear inputs
            if (pinEl) pinEl.value = '';
            if (amountInput) amountInput.value = '';
        }, 1500);
    },

    confirmPinPayment: () => {
        const pinInput = document.getElementById('pay-pin').value;
        const t = app.translations[app.lang];

        if (!pinInput) return alert(app.lang === 'ar' ? 'يرجى إدخال رمز PIN' : 'Enter PIN');
        if (pinInput !== app.user.pin) return alert(app.lang === 'ar' ? 'رمز PIN خاطئ' : 'Wrong PIN');
        if (app.user?.status && app.user.status !== 'active') return alert(app.lang === 'ar' ? 'الحساب غير نشط' : 'Account is inactive');

        const { amount, merchantId, merchantName } = app.currentPendingTx;
        const users = DB.get('users');
        const custIdx = users.findIndex(u => u.id === app.user.id);
        const merchIdx = users.findIndex(u => u.id == merchantId);

        if (custIdx === -1 || merchIdx === -1) return alert("System Error: User not found");

        const btn = document.querySelector('#pin-verification-content button');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i>`;

        setTimeout(async () => {
            let tx;
            try {
                tx = await window.SyncService.recordTransaction({
                    customerId: app.user.id,
                    merchantId,
                    amount,
                    method: 'BNPL_DIRECT',
                    merchantName,
                    customerName: app.user.name,
                    customerCard: app.user.cardNumber
                });
            } catch (err) {
                alert(err.message || 'Error');
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }
            app.updateDashboardUI();

            // Show Success
            document.getElementById('pin-verification-content').classList.add('hidden');
            document.getElementById('success-payment-content').classList.remove('hidden');

            document.getElementById('success-amount').textContent = amount.toLocaleString() + ' دج';
            document.getElementById('success-merchant').textContent = merchantName;
            document.getElementById('success-tx-id').textContent = tx.id;

            const downloadBtn = document.getElementById('download-invoice-btn');
            if (downloadBtn) downloadBtn.onclick = () => app.downloadInvoice(tx);

            // Trigger storage event for other tabs
            window.dispatchEvent(new Event('storage'));

            btn.disabled = false;
            btn.innerHTML = originalText;
        }, 1500);
    },

    downloadInvoice: (tx) => {
        const html = `
            <!DOCTYPE html> <html lang="${app.lang}" dir="${app.lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>Invoice ${tx.id}</title>
                <style>body{font - family: sans-serif;padding:20px} .box{border:1px solid #ddd;border-radius:12px;padding:20px;max-width:600px;margin:0 auto} .row{display:flex;justify-content:space-between;margin:10px 0;border-bottom:1px solid #eee;padding-bottom:10px} h1{text - align:center;color:#2563eb}</style></head>
                <body><div class="box">
                    <h1>Adjil Invoice / فاتورة</h1>
                    <div class="row"><span>Transaction ID</span><span>${tx.id}</span></div>
                    <div class="row"><span>Customer</span><span>${tx.customerName}</span></div>
                    <div class="row"><span>Merchant</span><span>${tx.merchant}</span></div>
                    <div class="row"><span>Merchant PIN</span><span>${tx.merchantPin || ''}</span></div>
                    <div class="row"><span>Activity</span><span>${tx.merchantActivity || ''}</span></div>
                    <div class="row"><span>Location</span><span>${tx.merchantLocation || ''}</span></div>
                    <div class="row"><span>Date</span><span>${tx.date}</span></div>
                    <div class="row"><span>Amount</span><span style="font-weight:bold">${tx.amount} DZD</span></div>
                    <div style="text-align:center;margin-top:20px;font-size:12px;color:#888">Generated by Adjil Platform</div>
                </div></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Adjil_Invoice_${tx.id}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },
    openDigitalContract: () => {
        const modal = document.getElementById('contract-modal');
        if (modal) modal.classList.remove('hidden');
    },
    closeDigitalContract: () => {
        const modal = document.getElementById('contract-modal');
        if (modal) modal.classList.add('hidden');
    },
    printDigitalContract: () => {
        const content = document.getElementById('contract-modal-content');
        const printArea = document.getElementById('print-area');
        if (!content || !printArea) return;
        const prev = printArea.innerHTML;
        printArea.innerHTML = content.innerHTML;
        window.print();
        setTimeout(() => {
            printArea.innerHTML = prev;
        }, 500);
    },
    downloadDigitalContract: () => {
        const t = app.translations[app.lang];
        const title = t.digital_contract || 'Adjil Digital Contract';
        const desc = t.digital_contract_desc || '';
        const html = `
        <!DOCTYPE html> <html lang="${app.lang}" dir="${app.lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${title}</title>
            <style>
                body{font - family:'Cairo','Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:#f3f4f6;color:#111827;margin:0;padding:32px}
                .page{max - width:900px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 20px 45px rgba(15,23,42,0.25);padding:32px 32px 40px;border:1px solid #e5e7eb}
                h1{font - size:24px;margin:0 0 4px;font-weight:800;color:#111827}
                h2{font - size:18px;margin:20px 0 8px;font-weight:700;color:#111827}
                p{margin:4px 0;font-size:14px;line-height:1.8}
                .subtitle{font - size:12px;color:#6b7280;margin-bottom:16px}
                .section-header{font - weight:700;font-size:14px;margin:12px 0 4px}
                .meta{display:flex;justify-content:space-between;gap:16px;margin:16px 0 24px;font-size:12px;color:#4b5563}
                .meta div span{font - weight:600;color:#111827}
                .signatures{margin - top:28px;border-top:1px solid #e5e7eb;padding-top:20px;font-size:13px}
                .sig-row{display:flex;flex-wrap:wrap;gap:24px;margin-bottom:18px}
                .sig-block{flex:1 1 260px}
                .line{border - bottom:1px dotted #9ca3af;height:20px;margin-top:4px}
                .sig-box{border:1px dashed #9ca3af;border-radius:12px;height:70px;margin-top:6px}
                .footnote{margin - top:24px;font-size:11px;color:#9ca3af;text-align:${app.lang === 'ar' ? 'right' : 'left'}}
            </style></head>
        <body>
            <div class="page">
                <h1>${title}</h1>
                <div class="subtitle">${desc}</div>
                <div class="meta">
                    <div>${app.lang === 'ar' ? 'الطرف الأول: منصة آجل (Adjil BNPL)' : app.lang === 'fr' ? 'Partie A : Plateforme Adjil BNPL' : 'Party A: Adjil BNPL Platform'}</div>
                    <div>${app.lang === 'ar' ? 'الطرف الثاني: المشترك (زبون / تاجر)' : app.lang === 'fr' ? 'Partie B : Abonné (Client / Marchand)' : 'Party B: Subscriber (Customer / Merchant)'}</div>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art1_title}</div>
                    <p>${t.contract_art1_desc}</p>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art2_title}</div>
                    <p>${t.contract_art2_desc}</p>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art3_title}</div>
                    <p>${t.contract_art3_desc}</p>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art4_title}</div>
                    <p>${t.contract_art4_desc}</p>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art5_title}</div>
                    <p>${t.contract_art5_desc}</p>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art6_title}</div>
                    <p>${t.contract_art6_desc}</p>
                </div>

                <div class="section">
                    <div class="section-header">${t.contract_art7_title}</div>
                    <p>${t.contract_art7_desc}</p>
                </div>

                <div class="signatures">
                    <div class="sig-row">
                        <div class="sig-block">
                            <div>${t.contract_subscriber_name}</div>
                            <div class="line"></div>
                        </div>
                        <div class="sig-block">
                            <div>${t.contract_signature_date}</div>
                            <div class="line"></div>
                        </div>
                    </div>
                    <div class="sig-row">
                        <div class="sig-block">
                            <div>${t.contract_signature_label}</div>
                            <div class="sig-box"></div>
                        </div>
                    </div>
                </div>

                <div class="footnote">
                    ${app.lang === 'ar'
                ? 'تم إنشاء هذا العقد رقمياً عبر منصة آجل BNPL. هذا المستند مخصص للاستعمال القانوني والإداري من طرف المشترك.'
                : app.lang === 'fr'
                    ? 'Ce contrat est généré numériquement par la plateforme Adjil BNPL. Ce document est destiné à l\'usage juridique et administratif par l\'abonné.'
                    : 'This digital contract is generated by Adjil BNPL Platform and is intended for legal and administrative use by the subscriber.'}
                </div>
            </div>
        </body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Adjil_Digital_Contract.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },
    setAuthTab: (tab) => {
        const loginForm = document.getElementById('auth-login-form');
        const registerForm = document.getElementById('auth-register-form');
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            tabLogin.classList.add('bg-primary', 'text-white');
            tabLogin.classList.remove('text-slate-400');
            tabRegister.classList.remove('bg-primary', 'text-white');
            tabRegister.classList.add('text-slate-400');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            tabRegister.classList.add('bg-primary', 'text-white');
            tabRegister.classList.remove('text-slate-400');
            tabLogin.classList.remove('bg-primary', 'text-white');
            tabLogin.classList.add('text-slate-400');

            // Populate wilayas if empty
            const wilayaSelect = document.getElementById('reg-wilaya');
            if (wilayaSelect && wilayaSelect.children.length === 0) {
                const defaultOpt = document.createElement('option');
                defaultOpt.value = "";
                defaultOpt.textContent = app.lang === 'ar' ? '-- اختر الولاية --' : (app.lang === 'fr' ? '-- Choisir la Wilaya --' : '-- Select Wilaya --');
                defaultOpt.disabled = true;
                defaultOpt.selected = true;
                wilayaSelect.appendChild(defaultOpt);

                WILAYAS.forEach(w => {
                    const opt = document.createElement('option');
                    opt.value = w;
                    opt.textContent = w;
                    wilayaSelect.appendChild(opt);
                });
            }
        }
    },
    setRegRole: (role) => {
        app.regRole = role;
        const custFields = document.getElementById('reg-customer-fields');
        const merchFields = document.getElementById('reg-merchant-fields');
        const btnCust = document.getElementById('role-customer');
        const btnMerch = document.getElementById('role-merchant');

        if (role === 'customer') {
            if (custFields) custFields.classList.remove('hidden');
            if (merchFields) merchFields.classList.add('hidden');
            if (btnCust) {
                btnCust.classList.add('bg-primary', 'text-white');
                btnCust.classList.remove('text-slate-400');
            }
            if (btnMerch) {
                btnMerch.classList.remove('bg-primary', 'text-white');
                btnMerch.classList.add('text-slate-400');
            }
        } else {
            if (custFields) custFields.classList.add('hidden');
            if (merchFields) merchFields.classList.remove('hidden');
            if (btnMerch) {
                btnMerch.classList.add('bg-primary', 'text-white');
                btnMerch.classList.remove('text-slate-400');
            }
            if (btnCust) {
                btnCust.classList.remove('bg-primary', 'text-white');
                btnCust.classList.add('text-slate-400');
            }
        }
    },
    nextRegPhase: () => {
        const t = app.translations[app.lang];
        const fname = document.getElementById('reg-firstname').value;
        const lname = document.getElementById('reg-lastname').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-password').value;

        if (!fname || !lname || !pass) {
            alert(t.fill_required);
            return;
        }

        app.regPhase = 2;
        document.getElementById('reg-phase-1').classList.add('hidden');
        document.getElementById('reg-phase-2').classList.remove('hidden');

        // Update indicators
        document.getElementById('reg-step-line').style.width = '100%';
        document.getElementById('reg-step-2-indicator').classList.replace('bg-slate-800', 'bg-primary');
        document.getElementById('reg-step-2-indicator').classList.replace('text-slate-500', 'text-white');
    },
    prevRegPhase: () => {
        app.regPhase = 1;
        document.getElementById('reg-phase-2').classList.add('hidden');
        document.getElementById('reg-phase-1').classList.remove('hidden');

        // Update indicators
        document.getElementById('reg-step-line').style.width = '0%';
        document.getElementById('reg-step-2-indicator').classList.replace('bg-primary', 'bg-slate-800');
        document.getElementById('reg-step-2-indicator').classList.replace('text-white', 'text-slate-500');
    },
    register: async () => {
        const t = app.translations[app.lang];
        const fname = document.getElementById('reg-firstname').value;
        const lname = document.getElementById('reg-lastname').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-password').value;
        const terms = document.getElementById('reg-terms');

        if (terms && !terms.checked) {
            alert(t.must_accept_terms || 'يجب الموافقة على شروط العقد قبل إنشاء الحساب');
            return;
        }

        // Collect file names
        const files = {};
        if (app.regRole === 'customer') {
            const idFront = document.getElementById('reg-cust-id-front').files[0];
            const idBack = document.getElementById('reg-cust-id-back').files[0];
            const payslip = document.getElementById('reg-cust-payslip').files[0];
            const rib = document.getElementById('reg-common-rib').files[0];

            if (idFront) files.id_front = idFront.name;
            if (idBack) files.id_back = idBack.name;
            if (payslip) files.payslip = payslip.name;
            if (rib) files.rib = rib.name;
        } else {
            const idFront = document.getElementById('reg-merch-id-front').files[0];
            const idBack = document.getElementById('reg-merch-id-back').files[0];
            const cr = document.getElementById('reg-merch-cr').files[0];
            const rib = document.getElementById('reg-common-rib').files[0];

            if (idFront) files.id_front = idFront.name;
            if (idBack) files.id_back = idBack.name;
            if (cr) files.commercial_register = cr.name;
            if (rib) files.rib = rib.name;
        }

        // Add contract acceptance
        files.contract = 'accepted'; // Simulating a signed contract

        const newId = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now();
        const newUser = {
            id: newId,
            name: `${fname} ${lname} `,
            email: email,
            phone: phone,
            password: pass,
            role: app.regRole,
            status: 'inactive', // All new accounts start inactive until verification
            subscription_plan: null,
            credit_limit: 0,
            balance: 0.00, // Explicitly 0.00 initially
            outstanding: 0,
            pin: app.regRole === 'merchant' ? app.generateMerchantPin() : '1234',
            wilaya: app.regRole === 'merchant' ? document.getElementById('reg-wilaya').value : null,
            coords: null,
            documents: files,
            card_number: app.generateCardNumber(Date.now())
        };

        const btn = document.querySelector('button[data-t="confirm"]');
        const originalText = btn.textContent;
        if (btn) {
            btn.disabled = true;
            btn.textContent = '...';
        }

        try {
            const res = await window.AuthService.signUp(newUser);
            
            // Auto-login
            app.user = newUser;
            localStorage.setItem('adjil_session', JSON.stringify(app.user));
            app.tempBankDetails = null; // Clear temp memory

            alert(t.register_success);

            // Clear inputs
            const inputs = ['reg-firstname', 'reg-lastname', 'reg-email', 'reg-phone', 'reg-password'];
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            router.navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }
    },
    saveBankDetails: () => {
        const rip = document.getElementById('bank-rip')?.value;
        const rib = document.getElementById('bank-rib')?.value;

        // Determine which one is active (we could also check app.selectedBankType)
        const isCcpActive = !document.getElementById('form-ccp-fields').classList.contains('hidden');
        const isCibActive = !document.getElementById('form-cib-fields').classList.contains('hidden');

        if (isCcpActive && !rip) {
            alert(app.lang === 'ar' ? 'يرجى إدخال الحساب البريدي.' : 'Please enter your RIP.');
            return;
        }
        if (isCibActive && !rib) {
            alert(app.lang === 'ar' ? 'يرجى إدخال الحساب البنكي.' : 'Please enter your RIB.');
            return;
        }
        if (!isCcpActive && !isCibActive) {
            alert(app.lang === 'ar' ? 'يرجى اختيار نوع الحساب أولاً.' : 'Please select an account type first.');
            return;
        }

        const finalRip = isCcpActive ? rip : '';
        const finalRib = isCibActive ? rib : '';

        if (app.user) {
            app.user.bank_details = { rip: finalRip, rib: finalRib };
            localStorage.setItem('adjil_session', JSON.stringify(app.user));
            const users = DB.get('users') || [];
            const idx = users.findIndex(u => u.id === app.user.id);
            if (idx >= 0) {
                users[idx] = { ...users[idx], bank_details: { rip: finalRip, rib: finalRib } };
                DB.set('users', users);
            }
            alert(app.lang === 'ar' ? 'تم حفظ بيانات الحساب بنجاح.' : 'Bank details saved successfully.');
            router.navigate('/dashboard');
        } else {
            app.tempBankDetails = { rip: finalRip, rib: finalRib };
            alert(app.lang === 'ar' ? 'تم إضافة تفاصيل الحساب إلى طلب التسجيل.' : 'Bank details attached to your registration.');
            router.navigate('/auth');
            setTimeout(() => app.setAuthTab('register'), 100);
        }
    },
    selectBankType: (type) => {
        app.selectedBankType = type;

        const cardCcp = document.getElementById('card-ccp');
        const cardCib = document.getElementById('card-cib');
        const checkCcp = document.getElementById('check-ccp');
        const checkCib = document.getElementById('check-cib');
        const formGlobal = document.getElementById('bank-details-form');
        const formCcp = document.getElementById('form-ccp-fields');
        const formCib = document.getElementById('form-cib-fields');
        const formTitleText = document.getElementById('form-title-text');

        // Reset all
        cardCcp.classList.remove('border-[#facc15]', 'bg-[#facc15]/5', 'scale-105');
        cardCcp.classList.add('border-slate-700');
        checkCcp.classList.replace('opacity-100', 'opacity-0');

        cardCib.classList.remove('border-blue-400', 'bg-blue-500/5', 'scale-105');
        cardCib.classList.add('border-slate-700');
        checkCib.classList.replace('opacity-100', 'opacity-0');

        formCcp.classList.add('hidden');
        formCib.classList.add('hidden');
        formGlobal.classList.remove('hidden');

        if (type === 'ccp') {
            cardCcp.classList.replace('border-slate-700', 'border-[#facc15]');
            cardCcp.classList.add('bg-[#facc15]/5', 'scale-105');
            checkCcp.classList.replace('opacity-0', 'opacity-100');
            formCcp.classList.remove('hidden');
            formTitleText.textContent = app.lang === 'ar' ? 'بيانات الحساب البريدي (CCP)' : 'Postal Account Details (CCP)';
        } else if (type === 'cib') {
            cardCib.classList.replace('border-slate-700', 'border-blue-400');
            cardCib.classList.add('bg-blue-500/5', 'scale-105');
            checkCib.classList.replace('opacity-0', 'opacity-100');
            formCib.classList.remove('hidden');
            formTitleText.textContent = app.lang === 'ar' ? 'بيانات الحساب البنكي (CIB)' : 'Bank Account Details (CIB)';
        }
    },
    toggleInvestorPage: () => {
        const modal = document.getElementById('investor-modal');
        modal.classList.toggle('hidden');
    },
    login: async () => {
        const t = app.translations[app.lang];
        const identifier = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;

        const btn = document.querySelector('button[onclick="app.login()"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '...';

        try {
            await window.AuthService.signIn(identifier, pass);
            router.navigate('/dashboard');
        } catch (err) {
            alert(t.login_error + '\n' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },
    demoLogin: async (role) => {
        try {
            await window.AuthService.demoSignIn(role);
            router.navigate('/dashboard');
        } catch (err) {
            alert('Demo Login Failed: ' + err.message);
        }
    },
    subscribe: (plan) => {
        const t = app.translations[app.lang];
        if (!app.user) {
            alert(t.subscribe_login_required);
            router.navigate('/auth');
            return;
        }
        
        // Save the plan temporarily in session or state
        app.pendingPlan = plan;
        router.navigate('/sub-confirm');
    },
    confirmSubscription: async () => {
        if (!app.user || !app.pendingPlan) return;

        const btn = document.getElementById('btn-confirm-sub');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> جاري الاقتطاع...`;

        const plan = app.pendingPlan;
        const limit = plan === 'monthly' ? 10000 : plan === '6months' ? 15000 : 20000;
        
        // Simulate external payment processing (Gold/Bank card)
        await new Promise(r => setTimeout(r, 2000));

        const updates = {
            status: 'active',
            subscription_plan: plan,
            credit_limit: limit,
            balance: limit
        };

        if (window.SyncService?.updateUserProfile) {
            await window.SyncService.updateUserProfile(app.user.id, updates);
        } else {
            const users = DB.get('users') || [];
            const idx = users.findIndex(u => u.id === app.user.id);
            if (idx >= 0) {
                users[idx] = { ...users[idx], ...updates };
                DB.set('users', users);
                app.user = users[idx];
                localStorage.setItem('adjil_session', JSON.stringify(app.user));
            }
        }

        app.pendingPlan = null;
        alert(app.lang === 'ar' ? 'تم تفعيل الاشتراك والائتمان بنجاح!' : 'Subscription and credit activated successfully!');
        router.navigate('/dashboard');
    },
    toggleDashView: (view) => {
        const isMerchant = app.user?.role === 'merchant';
        const prefix = isMerchant ? 'merch-' : 'dash-';
        const listEl = document.getElementById(isMerchant ? 'merch-tx-list' : 'dash-tx-list');
        const agendaEl = document.getElementById(isMerchant ? 'merch-agenda-view' : 'dash-agenda-view');
        const btnList = document.getElementById(isMerchant ? 'merch-btn-view-list' : 'btn-view-list');
        const btnAgenda = document.getElementById(isMerchant ? 'merch-btn-view-agenda' : 'btn-view-agenda');

        if (view === 'list') {
            listEl?.classList.remove('hidden');
            agendaEl?.classList.add('hidden');
            btnList?.classList.replace('bg-slate-800', isMerchant ? 'bg-accent-orange' : 'bg-primary');
            btnList?.classList.replace('text-slate-400', 'text-white');
            btnAgenda?.classList.replace(isMerchant ? 'bg-accent-orange' : 'bg-primary', 'bg-slate-800');
            btnAgenda?.classList.replace('text-white', 'text-slate-400');
        } else {
            listEl?.classList.add('hidden');
            agendaEl?.classList.remove('hidden');
            btnAgenda?.classList.replace('bg-slate-800', isMerchant ? 'bg-accent-orange' : 'bg-primary');
            btnAgenda?.classList.replace('text-slate-400', 'text-white');
            btnList?.classList.replace(isMerchant ? 'bg-accent-orange' : 'bg-primary', 'bg-slate-800');
            btnList?.classList.replace('text-white', 'text-slate-400');
            app.renderAgenda();
        }
    },
    agendaDate: new Date(),
    changeAgendaMonth: (dir) => {
        app.agendaDate.setMonth(app.agendaDate.getMonth() + dir);
        app.renderAgenda();
    },
    renderAgenda: () => {
        const isMerchant = app.user?.role === 'merchant';
        const container = document.getElementById(isMerchant ? 'merch-agenda-calendar' : 'agenda-calendar');
        const monthYearEl = document.getElementById(isMerchant ? 'merch-agenda-month-year' : 'agenda-month-year');
        const detailsEl = document.getElementById(isMerchant ? 'merch-agenda-day-details' : 'agenda-day-details');
        
        if (!container || !monthYearEl) return;

        const year = app.agendaDate.getFullYear();
        const month = app.agendaDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        // Adjust for Arabic week (Sat=0)
        const adjustedFirstDay = (firstDay + 1) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthNames = app.lang === 'ar' 
            ? ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
            : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        monthYearEl.textContent = `${monthNames[month]} ${year}`;
        
        let html = '';
        // Empty cells for first week
        for (let i = 0; i < adjustedFirstDay; i++) {
            html += '<div class="h-10"></div>';
        }
        
        const txs = app.user?.txs || [];
        const today = new Date();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasTx = txs.some(tx => (tx.created_at || tx.date).includes(dateStr));
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
            
            html += `
                <button onclick="app.showAgendaDay('${dateStr}')" 
                    class="h-10 rounded-lg flex flex-col items-center justify-center transition-all border
                    ${isToday ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'}
                    ${hasTx ? 'font-black !text-white' : ''} relative">
                    <span class="text-xs">${d}</span>
                    ${hasTx ? '<span class="absolute bottom-1 w-1 h-1 bg-accent-orange rounded-full"></span>' : ''}
                </button>
            `;
        }
        container.innerHTML = html;
        
        // Show today's details by default if not yet shown
        if (!detailsEl.innerHTML || detailsEl.innerHTML.includes('no-tx')) {
            app.showAgendaDay(today.toISOString().split('T')[0]);
        }
    },
    showAgendaDay: (dateStr) => {
        const isMerchant = app.user?.role === 'merchant';
        const detailsEl = document.getElementById(isMerchant ? 'merch-agenda-day-details' : 'agenda-day-details');
        const txs = app.user?.txs || [];
        const dayTxs = txs.filter(tx => (tx.created_at || tx.date).includes(dateStr));
        const t = app.translations[app.lang];

        if (dayTxs.length === 0) {
            detailsEl.innerHTML = `<div class="text-center py-6 text-slate-500 text-xs no-tx">${app.lang === 'ar' ? 'لا توجد عمليات لهذا التاريخ' : 'No transactions for this date'}</div>`;
            return;
        }

        detailsEl.innerHTML = `
            <div class="text-[10px] text-slate-500 font-bold uppercase mb-2">${dateStr}</div>
            ${dayTxs.map(tx => `
                <div onclick="app.showInvoiceModal('${tx.id}')" class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 ${tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center text-xs">
                            <i class="fa-solid ${isMerchant ? 'fa-arrow-down' : 'fa-receipt'}"></i>
                        </div>
                        <div>
                            <div class="text-white font-bold text-xs">${isMerchant ? (tx.customerName || `ID ${tx.customerCard}`) : tx.merchant}</div>
                            <div class="text-[8px] text-slate-500 font-mono">${new Date(tx.created_at || tx.date).toLocaleTimeString()}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-white font-black text-xs">${isMerchant ? '+' : '-'}${tx.amount} دج</div>
                    </div>
                </div>
            `).join('')}
        `;
    },
    renderDeductionReport: () => {
        const users = DB.get('users') || [];
        const customers = users.filter(u => u.role === 'customer' && u.subscription_plan);
        const reportContainer = document.getElementById('deduction-report-list');
        if (!reportContainer) return;

        // Group by deduction date (assuming 1st of next month for current month's spend)
        // Or simply list all customers with their current balance/limit difference
        const today = new Date();
        const nextDeduction = new Date(today.getFullYear(), today.getMonth() + 1, 5); // 5th of next month

        if (customers.length === 0) {
            reportContainer.innerHTML = '<div class="text-center py-12 text-slate-500">No active subscribers found for deduction.</div>';
            return;
        }

        reportContainer.innerHTML = `
            <div class="flex justify-between items-center mb-6 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <div>
                    <div class="text-[10px] text-blue-400 font-black uppercase">Next Global Deduction Date</div>
                    <div class="text-white font-bold">${nextDeduction.toLocaleDateString('ar-DZ')}</div>
                </div>
                <button onclick="app.exportDeductionCSV()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">
                    <i class="fa-solid fa-file-csv mr-2"></i> Export for Bank/Poste
                </button>
            </div>
            <div class="space-y-3">
                ${customers.map(c => {
                    const spent = (c.credit_limit || 0) - (c.balance || 0);
                    if (spent <= 0) return '';
                    return `
                        <div class="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-xl">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <div>
                                    <div class="text-white font-bold text-sm">${c.name}</div>
                                    <div class="text-[10px] text-slate-500 font-mono">${c.cardNumber}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-white font-black text-sm">${spent.toLocaleString()} دج</div>
                                <div class="text-[8px] text-yellow-500">Pending Collection</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    exportDeductionCSV: () => {
        const users = DB.get('users') || [];
        const customers = users.filter(u => u.role === 'customer' && u.subscription_plan);
        
        let csv = "Customer Name,Card Number,Amount to Deduct,Currency,Deduction Date\n";
        customers.forEach(c => {
            const spent = (c.credit_limit || 0) - (c.balance || 0);
            if (spent > 0) {
                csv += `"${c.name}","${c.cardNumber}",${spent},"DZD","${new Date().toLocaleDateString()}"\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Adjil_Deductions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },
    logout: () => {
        const t = app.translations[app.lang];
        app.user = null;

        const menuContainer = document.getElementById('user-menu-container');
        const dropdown = document.getElementById('user-dropdown-menu');
        if (menuContainer) {
            menuContainer.onmouseenter = null;
            menuContainer.onmouseleave = null;
        }
        if (dropdown) dropdown.classList.add('hidden');

        if (window.AuthService) {
            window.AuthService.signOut();
        } else {
            localStorage.removeItem('adjil_session');
        }
        const authBtnText = document.getElementById('auth-btn-text');
        if (authBtnText) authBtnText.textContent = t.login;
        router.navigate('/auth');
    },
    inviteFriend: () => {
        const t = app.translations[app.lang];
        const shareLink = "https://adjil.dz/download";
        if (navigator.share) {
            navigator.share({
                title: t.invite_title,
                text: t.invite_text,
                url: shareLink
            }).catch(err => console.log('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(shareLink).then(() => {
                alert(t.invite_copied);
            });
        }
    },
    copyMerchantPin: () => {
        const t = app.translations[app.lang];
        const pin = app.user?.pin ? String(app.user.pin).padStart(4, '0') : '';
        if (!pin) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pin).then(() => alert(t.copied || 'Copied'));
        } else {
            const input = document.createElement('input');
            input.value = pin;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
            alert(t.copied || 'Copied');
        }
    },
    contactUs: () => {
        window.location.href = "mailto:Adjil.BNPL@gmail.com?subject=Contact%20from%20Platform";
    },
    showPaymentNotification: () => {
        const lastTx = app.user.txs[app.user.txs.length - 1];
        if (!lastTx) return;

        const toast = document.createElement('div');
        toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-slide-up';
        toast.innerHTML = `
    <div class="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                    <i class="fa-solid fa-bell animate-bounce"></i>
                </div>
                <div>
                    <div class="font-bold text-sm">${app.lang === 'ar' ? 'تم استلام دفعة جديدة!' : 'New Payment Received!'}</div>
                    <div class="text-xs opacity-90">${lastTx.amount.toLocaleString()} دج - ${lastTx.customerName}</div>
                </div>
            </div>
    `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.replace('animate-slide-up', 'animate-fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    },
    // Prototype Logic
    nextProtoStep: (step) => {
        document.querySelectorAll('.proto-step').forEach(s => s.classList.add('hidden'));
        document.getElementById(`proto - step - ${step} `).classList.remove('hidden');

        // Update indicators
        const indicators = [1, 2, 3, 4];
        indicators.forEach(i => {
            const el = document.getElementById(`step - ${i} -indicator`);
            if (i < step) {
                el.classList.replace('bg-slate-800', 'bg-green-500');
                el.classList.replace('text-slate-500', 'text-white');
                el.innerHTML = '<i class="fa-solid fa-check"></i>';
            } else if (i === step) {
                el.classList.replace('bg-slate-800', 'bg-primary');
                el.classList.replace('text-slate-500', 'text-white');
            }
        });

        // Update line
        const progress = ((step - 1) / 3) * 100;
        document.getElementById('step-line').style.width = `${progress}% `;
    },
    runProtoPayment: () => {
        const mid = document.getElementById('proto-mid').value;
        const btn = document.getElementById('proto-pay-btn');

        if (mid !== '1234') {
            alert(app.lang === 'ar' ? 'الرقم التعريفي غير صحيح (جرب 1234)' : 'Invalid ID (Try 1234)');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التأكيد...';

        setTimeout(() => {
            app.nextProtoStep(4);
        }, 1500);
    },
    checkAccountStatus: () => {
        if (window.AuthService) {
            app.user = window.AuthService.getCurrentUser();
        } else {
            const session = localStorage.getItem('adjil_session');
            if (session) app.user = JSON.parse(session);
        }
        const isFrozen = localStorage.getItem('adjil_frozen');
        if (isFrozen) document.getElementById('freeze-overlay').classList.remove('hidden');
    },
    // Banking & Settlement API Simulation
    logToApiConsole: (msg, type = 'info') => {
        const consoleEl = document.getElementById('api-console');
        if (!consoleEl) return;
        const color = type === 'success' ? 'text-green-400' : (type === 'error' ? 'text-red-400' : (type === 'warn' ? 'text-yellow-400' : 'text-slate-300'));
        const time = new Date().toLocaleTimeString();
        consoleEl.innerHTML += `<div class="${color}">[${time}] > ${msg}</div>`;
        consoleEl.scrollTop = consoleEl.scrollHeight;
    },
    runBankingAutoScan: async () => {
        const btn = document.getElementById('btn-run-scan');
        const poolEl = document.getElementById('api-pool-amount');
        const pendingEl = document.getElementById('api-pending-disbursements');

        btn.disabled = true;
        app.logToApiConsole('Initiating Auto-Scan for pending settlements...', 'warn');

        // 1. Auto Scan
        await new Promise(r => setTimeout(r, 1500));
        const users = DB.get('users') || [];
        const merchants = users.filter(u => u.role === 'merchant');
        let totalToDisburse = 0;
        let merchantCount = 0;

        merchants.forEach(m => {
            if (m.outstanding > 0) {
                totalToDisburse += m.outstanding;
                merchantCount++;
            }
        });

        app.logToApiConsole(`Scan Complete: Found ${merchantCount} merchants with ${totalToDisburse.toLocaleString()} DZD pending.`);

        // 2. Prélèvement Automatique (Direct Debit)
        app.logToApiConsole('Requesting Direct Debit from linked Banking/Poste accounts...', 'info');
        await new Promise(r => setTimeout(r, 2000));

        // Simulate transfer to Adjil Pool
        app.animateValue('api-pool-amount', 0, totalToDisburse, 1500);
        app.logToApiConsole(`Direct Debit Successful: ${totalToDisburse.toLocaleString()} DZD transferred to Adjil Commercial Pool.`, 'success');

        // 3. Redistribution to Merchants
        await new Promise(r => setTimeout(r, 1000));
        app.logToApiConsole(`Initiating redistribution to ${merchantCount} different financial institutions...`, 'warn');
        pendingEl.textContent = merchantCount;

        for (const m of merchants) {
            if (m.outstanding > 0) {
                const amount = m.outstanding;
                app.logToApiConsole(`Transferring ${amount.toLocaleString()} DZD to ${m.name} (${m.wilaya || 'Algeria'})...`);
                await new Promise(r => setTimeout(r, 800));

                // Update merchant in DB
                const mIdx = users.findIndex(u => u.id === m.id);
                // Users balances handled via sync in prod, doing local simulation here
                users[mIdx].balance = 0; // Legacy cleanup
                users[mIdx].outstanding = 0;

                if (!users[mIdx].txs) users[mIdx].txs = [];
                users[mIdx].txs.push({
                    id: 'AUTO-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                    amount: amount,
                    merchant: 'Auto-Debit Settlement',
                    date: new Date().toLocaleString('ar-DZ'),
                    status: 'completed',
                    method: 'AUTO_SCAN_SETTLEMENT'
                });

                app.logToApiConsole(`Settlement confirmed for ${m.name}. Bank: ${Math.random() > 0.5 ? 'BNA' : 'Algérie Poste'} `, 'success');
            }
        }

        // 4. Finalize
        DB.set('users', users);
        app.animateValue('api-pool-amount', totalToDisburse, 0, 1000);
        pendingEl.textContent = '0';
        app.logToApiConsole('Banking Settlement Process Completed Successfully.', 'success');
        btn.disabled = false;

        // Sync if current user is merchant
        if (app.user && app.user.role === 'merchant') {
            const updatedUser = users.find(u => u.id === app.user.id);
            app.user = updatedUser;
            localStorage.setItem('adjil_session', JSON.stringify(app.user));
            app.updateDashboardUI();
        }
    },
    // Adding user-menu logic and profile actions here
    toggleUserMenu: () => {
        if (!app.user) {
            router.navigate('/auth');
            return;
        }
        const menu = document.getElementById('user-dropdown-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    },
    handleProfilePicture: (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('profile-picture-preview').src = e.target.result;
                if (app.user) {
                    app.user.profilePicture = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    },
    openGoogleMapSelection: () => {
        // A placeholder for opening a map picker, returning default string for sim
        const loc = prompt(app.lang === 'ar' ? 'أدخل عنوانك بالتفصيل:' : 'Enter your detailed address:', app.user?.location || '');
        if (loc) {
            document.getElementById('prof-location-text').value = loc;
        }
    },
    saveProfile: () => {
        if (!app.user) return;

        const picSrc = document.getElementById('profile-picture-preview').src;
        const loc = document.getElementById('prof-location-text').value;
        const btn = document.querySelector('button[onclick="app.saveProfile()"]');
        const originalText = btn.textContent;

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i>`;

        setTimeout(() => {
            const users = DB.get('users') || [];
            const idx = users.findIndex(u => u.id === app.user.id);
            if (idx >= 0) {
                users[idx].location = loc;
                users[idx].profilePicture = picSrc;
                DB.set('users', users);

                app.user = users[idx];
                localStorage.setItem('adjil_session', JSON.stringify(app.user));
            }
            btn.disabled = false;
            btn.innerHTML = originalText;
            alert(app.lang === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Profile updated successfully!');
            app.updateDashboardUI();
        }, 800);
    },
    populateProfileData: () => {
        if (!app.user) return;
        const fn = document.getElementById('prof-firstname');
        const em = document.getElementById('prof-email');
        const loc = document.getElementById('prof-location-text');
        const pic = document.getElementById('profile-picture-preview');

        if (fn) fn.value = app.user.name || '';
        if (em) em.value = app.user.email || '';
        if (loc) loc.value = app.user.location || app.user.wilaya || '';
        if (pic && app.user.profilePicture) {
            pic.src = app.user.profilePicture;
        }
    }
};

const SyncService = {
    getPendingOps: () => {
        try {
            return JSON.parse(localStorage.getItem('adjil_pending_ops') || '[]');
        } catch {
            return [];
        }
    },
    setPendingOps: (ops) => {
        localStorage.setItem('adjil_pending_ops', JSON.stringify(ops));
    },
    enqueue: (op) => {
        const ops = SyncService.getPendingOps();
        ops.push(op);
        SyncService.setPendingOps(ops);
    },
    getCurrentMerchant: () => {
        const user = window.AuthService?.getCurrentUser?.() || app.user;
        if (user && user.role === 'merchant') return user;
        return null;
    },
    fetchMerchantFromSupabase: async (merchantId) => {
        if (!window.supabaseClient || !merchantId) return null;
        const { data, error } = await window.supabaseClient.from('users').select('*').eq('id', merchantId).maybeSingle();
        if (error || !data) return null;
        const users = DB.get('users') || [];
        const idx = users.findIndex(u => u.id === merchantId);
        const cardNumber = data.card_number || data.cardNumber || null;
        const merged = { ...data, cardNumber };
        if (idx >= 0) users[idx] = { ...users[idx], ...merged };
        else users.push(merged);
        DB.set('users', users);
        if (app.user && app.user.id === merchantId) {
            app.user = users.find(u => u.id === merchantId);
            localStorage.setItem('adjil_session', JSON.stringify(app.user));
            app.updateDashboardUI();
        }
        return merged;
    },
    fetchMerchantTransactionsFromSupabase: async (merchantId) => {
        if (!window.supabaseClient || !merchantId) return null;
        const { data, error } = await window.supabaseClient
            .from('transactions')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });
        if (error) return null;
        const txs = (data || []).map(t => ({
            id: t.id,
            amount: t.amount,
            merchant: t.merchant_name,
            merchantPin: t.merchant_pin || '',
            merchantActivity: t.merchant_activity || '',
            merchantLocation: t.merchant_location || '',
            customerName: t.customer_name,
            customerCard: t.customer_card,
            date: t.created_at ? new Date(t.created_at).toLocaleString(app.lang === 'ar' ? 'ar-DZ' : 'en-US') : '',
            status: t.status,
            method: t.method,
            created_at: t.created_at,
            idempotency_key: t.idempotency_key || null
        }));
        const users = DB.get('users') || [];
        const idx = users.findIndex(u => u.id === merchantId);
        if (idx >= 0) {
            users[idx].txs = txs;
            DB.set('users', users);
            if (app.user && app.user.id === merchantId) {
                app.user = users[idx];
                localStorage.setItem('adjil_session', JSON.stringify(app.user));
                app.updateDashboardUI();
            }
        }
        return txs;
    },
    updateMerchantProfile: async (merchantId, updates) => {
        if (!merchantId || !updates) return;
        const users = DB.get('users') || [];
        const idx = users.findIndex(u => u.id === merchantId);
        if (idx >= 0) {
            users[idx] = { ...users[idx], ...updates };
            DB.set('users', users);
        }
        SyncService.enqueue({ type: 'user_update', payload: { id: merchantId, updates } });
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient.from('users').update(updates).eq('id', merchantId);
            if (error) SyncService.enqueue({ type: 'user_update', payload: { id: merchantId, updates } });
        }
    },
    updateUserProfile: async (userId, updates) => {
        if (!userId || !updates) return;
        const users = DB.get('users') || [];
        const idx = users.findIndex(u => u.id === userId);
        if (idx >= 0) {
            users[idx] = { ...users[idx], ...updates };
            DB.set('users', users);
            if (app.user && app.user.id === userId) {
                app.user = users[idx];
                localStorage.setItem('adjil_session', JSON.stringify(app.user));
                app.updateDashboardUI();
            }
        }
        SyncService.enqueue({ type: 'user_update', payload: { id: userId, updates } });
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient.from('users').update(updates).eq('id', userId);
            if (error) SyncService.enqueue({ type: 'user_update', payload: { id: userId, updates } });
        }
    },
    recordTransaction: async (input) => {
        const { customerId, merchantId, amount, method, merchantName, customerName, customerCard } = input;
        
        // Always work with fresh users from DB
        const getUsers = () => DB.get('users') || [];
        let users = getUsers();
        
        let custIdx = users.findIndex(u => u.id === customerId);
        let merchIdx = users.findIndex(u => u.id === merchantId);

        // Robust check: ensure current user is in the local users list
        if (custIdx === -1 && app.user && app.user.id === customerId) {
            users.push(app.user);
            DB.set('users', users);
            users = getUsers(); // Refresh reference
            custIdx = users.findIndex(u => u.id === customerId);
        }

        // If merchant still not found, try to fetch it if we are online
        if (merchIdx === -1 && window.supabaseClient) {
            const remoteMerch = await SyncService.fetchMerchantFromSupabase(merchantId);
            if (remoteMerch) {
                users = getUsers(); // Refresh reference after async fetch
                merchIdx = users.findIndex(u => u.id === merchantId);
            }
        }

        // Final check for existence
        if (custIdx === -1 || merchIdx === -1) {
            console.error('User lookup failed in recordTransaction:', { 
                customerId, merchantId, 
                custFound: custIdx !== -1, 
                merchFound: merchIdx !== -1,
                localUserCount: users.length 
            });
            throw new Error(app.translations[app.lang].system_error_user_not_found || 'System Error: User not found');
        }
        
        const customer = users[custIdx];
        const merchant = users[merchIdx];

        if (customer.status && customer.status !== 'active') throw new Error(app.lang === 'ar' ? 'الحساب غير نشط' : 'Account is inactive');
        if (amount > customer.balance) throw new Error(app.translations[app.lang].insufficient_balance || 'Insufficient balance');

        const txId = 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        const idemKey = (crypto.randomUUID ? crypto.randomUUID() : (txId + '-k'));
        const createdAt = new Date().toISOString();
        
        const merchantPin = merchant.pin ? String(merchant.pin).padStart(4, '0') : '';
        const merchantActivity = merchant.activity || '';
        const merchantLocation = merchant.location || merchant.wilaya || '';
        
        const tx = {
            id: txId,
            amount,
            merchant: merchantName,
            merchantPin,
            merchantActivity,
            merchantLocation,
            customerName,
            customerCard,
            date: new Date(createdAt).toLocaleString(app.lang === 'ar' ? 'ar-DZ' : 'en-US'),
            status: 'completed',
            method,
            created_at: createdAt,
            idempotency_key: idemKey
        };

        let usedRpc = false;
        if (window.supabaseClient && typeof window.supabaseClient.rpc === 'function') {
            try {
                const { data, error } = await window.supabaseClient.rpc('process_transaction', {
                    p_customer_id: customerId,
                    p_merchant_id: merchantId,
                    p_amount: amount,
                    p_method: method,
                    p_merchant_name: merchantName,
                    p_customer_name: customerName,
                    p_customer_card: customerCard,
                    p_merchant_pin: merchantPin,
                    p_merchant_activity: merchantActivity,
                    p_merchant_location: merchantLocation,
                    p_idempotency_key: idemKey
                });
                if (!error && data && data.success) {
                    usedRpc = true;
                    tx.id = data.tx_id || tx.id;
                    
                    // Update balances from RPC result
                    users[custIdx].balance = data.new_balance ?? (users[custIdx].balance - amount);
                    users[merchIdx].balance = (users[merchIdx].balance || 0) + amount;
                    users[merchIdx].outstanding = (users[merchIdx].outstanding || 0) + amount;
                    
                    if (data.low_balance_alert) {
                        app.notifyLowBalance(users[custIdx]);
                    }
                } else if (data && data.success === false) {
                    throw new Error(data.error || 'RPC Error');
                }
            } catch (rpcErr) {
                console.warn('RPC Transaction failed, falling back to manual sync:', rpcErr);
                usedRpc = false;
            }
        }

        if (!usedRpc) {
            users[custIdx].balance -= amount;
            users[merchIdx].balance = (users[merchIdx].balance || 0) + amount;
            users[merchIdx].outstanding = (users[merchIdx].outstanding || 0) + amount;
        }

        // Add transaction to both histories
        users[custIdx].txs = users[custIdx].txs || [];
        users[merchIdx].txs = users[merchIdx].txs || [];
        users[custIdx].txs.push(tx);
        users[merchIdx].txs.push(tx);

        // Persist changes
        DB.set('users', users);
        
        // Update session if current user is the customer
        if (app.user && app.user.id === customerId) {
            app.user = users[custIdx];
            localStorage.setItem('adjil_session', JSON.stringify(app.user));
            app.notifyLowBalance(app.user);
        }
        
        // Update session if current user is the merchant
        if (app.user && app.user.id === merchantId) {
            app.user = users[merchIdx];
            localStorage.setItem('adjil_session', JSON.stringify(app.user));
        }

        if (!usedRpc) {
            const op = {
                type: 'transaction',
                payload: {
                    id: txId,
                    created_at: createdAt,
                    amount,
                    status: 'completed',
                    method,
                    merchant_id: merchantId,
                    customer_id: customerId,
                    merchant_name: merchantName,
                    merchant_pin: merchantPin,
                    merchant_activity: merchantActivity,
                    merchant_location: merchantLocation,
                    customer_name: customerName,
                    customer_card: customerCard,
                    idempotency_key: idemKey
                },
                updates: {
                    customer: { id: customerId, balance: users[custIdx].balance },
                    merchant: { id: merchantId, balance: users[merchIdx].balance, outstanding: users[merchIdx].outstanding }
                }
            };
            SyncService.enqueue(op);
            SyncService.syncPendingWrites();
        }

        if (typeof app !== 'undefined' && app.notifyTransaction) {
            app.notifyTransaction(tx);
        }

        return tx;
    },
    syncPendingWrites: async () => {
        if (!window.supabaseClient) return;
        let ops = SyncService.getPendingOps();
        if (!ops.length) return;
        const remaining = [];
        for (const op of ops) {
            if (op.type === 'transaction') {
                const { payload, updates } = op;
                const { error } = await window.supabaseClient.from('transactions').insert(payload);
                const msg = String(error?.message || '').toLowerCase();
                const duplicate = msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique');
                if (error && !duplicate) {
                    remaining.push(op);
                    continue;
                }
                await window.supabaseClient.from('users').update({ balance: updates.customer.balance }).eq('id', updates.customer.id);
                await window.supabaseClient.from('users').update({ balance: updates.merchant.balance, outstanding: updates.merchant.outstanding }).eq('id', updates.merchant.id);
            } else if (op.type === 'user_update') {
                const { id, updates } = op.payload || {};
                if (!id || !updates) {
                    continue;
                }
                const { error } = await window.supabaseClient.from('users').update(updates).eq('id', id);
                if (error) remaining.push(op);
            }
        }
        SyncService.setPendingOps(remaining);
    }
};

window.SyncService = SyncService;

const router = {
    routes: {
        '/': 'tpl-home',
        '/auth': 'tpl-auth',
        '/pricing': 'tpl-pricing',
        '/about': 'tpl-about',
        '/api': 'tpl-api',
        '/bank-details': 'tpl-bank-details',
        '/profile': 'tpl-profile',
        '/prototype': 'tpl-prototype',
        '/dashboard': 'tpl-dash',
        '/merchants-list': 'tpl-merchants-list',
        '/process-video': 'tpl-process-video',
        '/pay-later-details': 'tpl-pay-later-details',
        '/how-it-works': 'tpl-home',
        '/sub-confirm': 'tpl-sub-confirm'
    },
    navigate: (path) => {
        window.location.hash = path;
    },
    resolve: () => {
        app.checkAccountStatus();
        let path = window.location.hash.slice(1) || '/';
        let tplId = router.routes[path] || 'tpl-home';

        // Handle dynamic dashboard templates
        if (path === '/dashboard') {
            if (!app.user) {
                router.navigate('/auth');
                return;
            }
            tplId = app.user.role === 'merchant' ? 'tpl-dash-merchant' : 'tpl-dash-customer';
        }

        const tpl = document.getElementById(tplId);
        if (tpl) {
            const appContainer = document.getElementById('app');
            appContainer.innerHTML = '';
            appContainer.appendChild(tpl.content.cloneNode(true));
            app.translateUI(); // Ensure translation after rendering
            app.updateDashboardUI();

            if (path === '/merchants-list') {
                app.renderMerchants();
            }
            if (path === '/profile') {
                app.populateProfileData();
            }

            window.scrollTo(0, 0);

            if (path === '/how-it-works') {
                setTimeout(() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }
};

window.addEventListener('hashchange', router.resolve);

// Initialize if DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', app.init);
} else {
    app.init();
}

window.resetFreeze = () => {
    localStorage.removeItem('adjil_frozen');
    location.reload();
};
