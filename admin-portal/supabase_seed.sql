
-- Seed Data for Adjil BNPL
-- Run this in Supabase SQL Editor to populate the database with demo data

-- 1. Insert Users (Customers & Merchants)
INSERT INTO public.users (id, name, email, password, role, balance, outstanding, pin, card_number, activity, location, coords, wilaya)
VALUES 
    (
        '11111111-1111-4111-8111-111111111111', 
        'محمد علي', 
        'c@adjil.dz', 
        '123', 
        'customer', 
        10000, 
        0, 
        '1234', 
        '5423 0000 0000 0001',
        NULL, NULL, NULL, NULL
    ),
    (
        '22222222-2222-4222-8222-222222222222', 
        'متجر الإلكترونيات', 
        'm@adjil.dz', 
        '123', 
        'merchant', 
        85000, 
        12400, 
        NULL, 
        NULL, 
        'بيع الأجهزة الإلكترونية والهواتف', 
        'العناصر، الجزائر العاصمة', 
        '36.7456,3.0645', 
        '16-الجزائر'
    ),
    (
        '33333333-3333-4333-8333-333333333333', 
        'سوبر ماركت السلام', 
        'qr@adjil.dz', 
        '123', 
        'merchant', 
        0, 
        0, 
        NULL, 
        NULL, 
        'مواد غذائية وعامة', 
        'باب الزوار، الجزائر العاصمة', 
        '36.7111,3.1722', 
        '16-الجزائر'
    ),
    (
        '44444444-4444-4444-8444-444444444444', 
        'صيدلية الشفاء', 
        'phones@adjil.dz', 
        '123', 
        'merchant', 
        0, 
        0, 
        NULL, 
        NULL, 
        'أدوية ومستلزمات طبية', 
        'دالي ابراهيم، الجزائر العاصمة', 
        '36.7588,2.9833', 
        '16-الجزائر'
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Transactions
-- Linking customers and merchants based on the demo scenario

INSERT INTO public.transactions (id, created_at, amount, status, method, merchant_id, customer_id, merchant_name, customer_name, customer_card)
VALUES
    -- Transactions for Customer (محمد علي)
    (
        gen_random_uuid(),
        '2026-03-20 10:15:30+00',
        1500,
        'completed',
        'BNPL_QR',
        '33333333-3333-4333-8333-333333333333', -- سوبر ماركت السلام
        '11111111-1111-4111-8111-111111111111',
        'سوبر ماركت السلام (مواد غذائية)',
        'محمد علي',
        '5423 0000 0000 0001'
    ),
    (
        gen_random_uuid(),
        '2026-03-21 14:45:12+00',
        2200,
        'completed',
        'BNPL_QR',
        NULL, -- Unknown merchant in demo data (محطة نفطال), keeping NULL or could create a dummy one.
        '11111111-1111-4111-8111-111111111111',
        'محطة نفطال (بنزين)',
        'محمد علي',
        '5423 0000 0000 0001'
    ),
    (
        gen_random_uuid(),
        '2026-03-22 09:30:05+00',
        850,
        'completed',
        'BNPL_QR',
        '44444444-4444-4444-8444-444444444444', -- صيدلية الشفاء
        '11111111-1111-4111-8111-111111111111',
        'صيدلية الشفاء',
        'محمد علي',
        '5423 0000 0000 0001'
    ),
    (
        gen_random_uuid(),
        '2026-03-23 18:20:45+00',
        4500,
        'completed',
        'BNPL_QR',
        NULL, -- Unknown merchant (فندق الأوراسي)
        '11111111-1111-4111-8111-111111111111',
        'فندق الأوراسي (إقامة)',
        'محمد علي',
        '5423 0000 0000 0001'
    ),
    
    -- Transactions for Merchant (متجر الإلكترونيات)
    (
        gen_random_uuid(),
        '2026-03-20 11:00:00+00',
        12000,
        'completed',
        'BNPL_DIRECT',
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111', -- Assuming same customer for demo continuity
        'متجر الإلكترونيات',
        'محمد علي',
        '5423 0000 0000 0001'
    ),
    (
        gen_random_uuid(),
        '2026-03-21 15:30:00+00',
        35000,
        'completed',
        'BNPL_DIRECT',
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
        'متجر الإلكترونيات',
        'محمد علي',
        '5423 0000 0000 0001'
    ),
    (
        gen_random_uuid(),
        '2026-03-22 10:45:00+00',
        38000,
        'completed',
        'BNPL_DIRECT',
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
        'متجر الإلكترونيات',
        'محمد علي',
        '5423 0000 0000 0001'
    );
    
