# SMS-Activate Webhook Setup Guide

## Overview
This guide explains how to set up webhooks for real-time OTP delivery from SMS-Activate. With webhooks enabled, you'll receive SMS codes instantly (50-500ms) instead of polling every 3-5 seconds.

## Benefits
- **5-10x Faster**: Instant delivery vs polling delay
- **Lower API Calls**: 95% reduction in status check requests
- **Better UX**: Users see codes immediately
- **Cost Savings**: Fewer API calls = lower costs

## Prerequisites
- Admin access to your application
- SMS-Activate API key configured
- Public HTTPS endpoint (automatic with Vercel deployment)

## Setup Steps

### 1. Deploy Your Application
Your webhook endpoint must be publicly accessible via HTTPS.

```bash
# Deploy to Vercel (automatic)
vercel deploy --prod
```

Your webhook URL will be:
```
https://your-domain.vercel.app/api/webhooks/sms-activate
```

### 2. Configure Webhook in Application

**Option A: Via Admin API**
```bash
curl -X POST https://your-domain.vercel.app/api/admin/webhooks/configure \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "sms-activate",
    "isEnabled": true
  }'
```

**Option B: Via Database**
Run the migration script:
```bash
# Script 206_add_sms_webhook_support.sql is already created
# Execute it via Supabase dashboard or CLI
```

### 3. Configure Webhook in SMS-Activate Dashboard

1. Login to https://sms-activate.io
2. Go to **Profile** → **Settings**
3. Scroll to **Webhooks** section
4. Enter webhook URL: `https://your-domain.vercel.app/api/webhooks/sms-activate`
5. Check **Enable webhooks** checkbox
6. Click **Save**

### 4. Verify Webhook Setup

Test the webhook endpoint:
```bash
# Should return 405 Method Not Allowed (expected for GET)
curl https://your-domain.vercel.app/api/webhooks/sms-activate
```

Purchase a test number and verify:
- Check webhook_logs table for incoming webhooks
- Verify OTP code appears instantly in phone_rentals table
- Check webhook_delivered flag is set to true

## Webhook Payload Structure

SMS-Activate sends POST requests with this payload:
```json
{
  "activationId": 635468021,
  "service": "wa",
  "text": "Your WhatsApp code is 123-456",
  "code": "123456",
  "country": 2,
  "receivedAt": "2023-01-01 12:00:00"
}
```

## Security

### IP Whitelist
Webhooks are only accepted from SMS-Activate IPs:
- `188.42.218.183`
- `142.91.156.119`

In development mode, all IPs are allowed for testing.

### Error Handling
- Webhook returns 200 even on errors to prevent excessive retries
- SMS-Activate will retry up to 8 times over 2 hours
- All webhook attempts are logged in `webhook_logs` table

## Monitoring

### Check Webhook Logs
```sql
-- Recent webhooks
SELECT * FROM webhook_logs 
WHERE provider = 'sms-activate'
ORDER BY created_at DESC 
LIMIT 50;

-- Success rate
SELECT 
  processing_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM webhook_logs
WHERE provider = 'sms-activate'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY processing_status;
```

### Check Webhook Delivery Rate
```sql
-- Compare webhook vs polling delivery
SELECT 
  webhook_delivered,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds
FROM phone_rentals
WHERE provider = 'sms-activate'
AND created_at > NOW() - INTERVAL '24 hours'
AND status = 'completed'
GROUP BY webhook_delivered;
```

## Troubleshooting

### Webhooks Not Arriving
1. Verify webhook is enabled in SMS-Activate dashboard
2. Check webhook URL is correct and publicly accessible
3. Verify firewall/security settings allow SMS-Activate IPs
4. Check application logs for errors

### Webhook Failing
1. Check `webhook_logs` table for error messages
2. Verify database permissions (RLS policies)
3. Check Supabase service role key is configured
4. Review application logs for stack traces

### Testing Webhooks Locally
Use ngrok to expose localhost:
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Expose via ngrok
ngrok http 3000

# Use ngrok URL in SMS-Activate webhook settings
https://your-subdomain.ngrok.io/api/webhooks/sms-activate
```

## Performance Impact

### Before Webhooks (Polling)
- Average OTP delivery: 5-10 seconds
- API calls per activation: 10-20 status checks
- Server load: High (constant polling)

### After Webhooks
- Average OTP delivery: 50-500ms
- API calls per activation: 2-3 (purchase + finish)
- Server load: Low (event-driven)

## Cost Savings

Estimated API call reduction: **95%**
- Before: ~15 status checks × 10,000 rentals = 150,000 API calls/month
- After: ~0 status checks × 10,000 rentals = 0 API calls/month (webhook delivered)

SMS-Activate API rate limits become less of a concern with webhooks enabled.

## Next Steps

After webhook setup:
1. Monitor webhook success rate for 24 hours
2. Compare delivery times (webhook vs polling)
3. Consider removing polling entirely once webhook stability is proven
4. Implement FreePrice optimization (Task 3)

## Support

If you encounter issues:
1. Check SMS-Activate documentation: https://sms-activate.io/api2#webhookInfo
2. Contact SMS-Activate support with webhook logs
3. Review application error logs and webhook_logs table
