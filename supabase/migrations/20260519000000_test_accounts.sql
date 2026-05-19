-- Test account subscription and verification setup
-- Run manually after creating test auth users via Admin Test Panel

-- Homeowner test accounts: grant 1-year subscription
UPDATE homeowners
SET
  subscription_expires_at = NOW() + INTERVAL '1 year',
  subscription_credit_used = false
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE id IN (
    SELECT id FROM auth.users
    WHERE email IN ('test@maidit.com', 'homeowner@maidit.app')
  )
);

-- Kasambahay test account: mark verified and available
UPDATE kasambahay
SET
  status = 'available',
  is_verified = true
WHERE profile_id IN (
  SELECT id FROM auth.users
  WHERE email = 'test.kasambahay@maidit.app'
);

-- Partner test account: ensure referral code is set
UPDATE partners
SET referral_code = 'TEST-PARTNER'
WHERE profile_id IN (
  SELECT id FROM auth.users
  WHERE email = 'partner@maidit.com'
)
AND (referral_code IS NULL OR referral_code = '');
