-- ⚠️ ملاحظة مهمة: لا يمكن إدراج مستخدمين مباشرة في auth.users
-- استخدم لوحة التحكم Supabase لإنشاء المستخدم

-- الطريقة الصحيحة:

-- 1. اذهب إلى: https://supabase.com/dashboard
-- 2. اختر مشروعك
-- 3. Authentication → Users
-- 4. اضغط "Create user"
-- 5. أدخل:
--    Email: admin@adjil.dz
--    Password: Admin123!
--    Confirm password: Admin123!
-- 6. اضغط "Create user"

-- بعد إنشاء المستخدم من لوحة التحكم، انسخ الـ ID من قائمة المستخدمين
-- ثم شغل هذا السكربت لإضافة السجل في staff table:

-- استبدل 'USER_ID_HERE' بـ ID المستخدم الذي نسخته
INSERT INTO staff (
  id,
  username,
  full_name,
  email,
  role,
  is_active,
  is_ceo,
  created_at
) VALUES (
  'USER_ID_HERE',
  'admin',
  'المدير العام / CEO',
  'admin@adjil.dz',
  'ceo',
  true,
  true,
  NOW()
);

-- مثال إذا كان الـ ID هو: 12345678-1234-1234-1234-123456789012
-- INSERT INTO staff (
--   id,
--   username,
--   full_name,
--   email,
--   role,
--   is_active,
--   is_ceo,
--   created_at
-- ) VALUES (
--   '12345678-1234-1234-1234-123456789012',
--   'admin',
--   'المدير العام / CEO',
--   'admin@adjil.dz',
--   'ceo',
--   true,
--   true,
--   NOW()
-- );
