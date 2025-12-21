# Admin Dashboard - New Features Guide

## Overview
The admin dashboard has been enhanced with powerful monitoring and management tools for the new SMS-Activate API v2 integration, webhooks, FreePrice, and provider health tracking.

## New Admin Pages

### 1. Provider Health Monitor (`/admin/provider-health`)

**Purpose**: Real-time monitoring of SMS provider performance and reliability.

**Key Features**:
- Live health status for each provider (healthy, degraded, unavailable)
- Success rate tracking with visual progress bars
- Average response time monitoring
- Request/response statistics
- Recent activity timeline
- Auto-refresh every 30 seconds

**Metrics Tracked**:
- Success Rate: Percentage of successful requests
- Response Time: Average API response time in milliseconds
- Total Requests: Volume of API calls
- Success/Failure Count: Breakdown of outcomes
- Last Success/Failure: Timestamp tracking

**How to Use**:
1. Navigate to Admin → Provider Health
2. View current status of all providers
3. Check alerts for degraded services
4. Review recent requests for debugging
5. Use Refresh button for manual updates

### 2. Enhanced Settings (`/admin/settings`)

**New Tabs Added**:

#### Pricing Tab
- Profit margin configuration
- Price sync from providers
- Example calculations

#### FreePrice Tab (NEW)
- Enable/disable FreePrice feature
- Configure maximum discount percentage
- Toggle auto-select best price
- Real-time savings preview

**FreePrice Settings**:
```
- freeprice_enabled: true/false
- freeprice_max_discount: 5-25%
- freeprice_auto_select: true/false
```

**Workflow**:
1. Enable FreePrice
2. Set max discount threshold
3. Enable auto-select for best UX
4. Sync prices to apply changes
5. Monitor savings in reports

### 3. Webhook Monitoring (`/admin/webhooks`)

**Purpose**: Monitor and debug webhook deliveries from SMS providers.

**Features**:
- Webhook configuration status
- Recent webhook deliveries
- Success/failure tracking
- Payload inspection
- Error message viewing
- Delivery timing metrics

**Setup Instructions**:
1. Go to Admin → Webhooks
2. Copy webhook URL
3. Configure in SMS-Activate dashboard
4. Test webhook delivery
5. Monitor incoming webhooks

## Enhanced Existing Pages

### Main Dashboard (`/admin`)
Added new metrics:
- Provider health indicators
- FreePrice savings total
- Webhook delivery success rate
- Average cost per activation

### Services Page (`/admin/services`)
Enhanced with:
- FreePrice availability badges
- Dynamic pricing indicators
- Stock levels from multiple providers
- Cost vs selling price comparison

### Rentals Page (`/admin/rentals`)
New columns:
- Provider used (sms-activate/5sim)
- FreePrice applied (yes/no)
- Webhook delivered (yes/no)
- Response time

## API Endpoints

### Provider Health
```
GET  /api/admin/provider-health
GET  /api/admin/provider-health/requests?limit=20
```

### Webhook Config
```
GET  /api/admin/webhooks/configure
POST /api/admin/webhooks/configure
```

### Settings
```
GET   /api/admin/settings
PATCH /api/admin/settings
```

## Monitoring Best Practices

### Daily Checks
1. Review provider health status
2. Check webhook delivery rate
3. Monitor FreePrice savings
4. Review any failed requests

### Weekly Tasks
1. Analyze provider performance trends
2. Adjust FreePrice thresholds
3. Review cost optimization
4. Check for pattern in failures

### Monthly Reviews
1. Provider selection optimization
2. FreePrice effectiveness analysis
3. Webhook reliability report
4. Cost savings calculation

## Alerts & Notifications

### Provider Health Alerts
- Provider marked unavailable
- Success rate drops below 90%
- Response time exceeds 5 seconds
- Consecutive failures detected

### Webhook Alerts
- Webhook delivery failures
- Payload parsing errors
- IP whitelist violations
- Timeout issues

### FreePrice Alerts
- FreePrice sync failures
- Discount threshold breaches
- Price data staleness

## Troubleshooting

### Provider Shows Unavailable
1. Check provider_health table
2. Review recent error messages
3. Verify API keys
4. Test provider API directly
5. Check rate limits

### Webhooks Not Arriving
1. Verify webhook URL is public
2. Check IP whitelist configuration
3. Review webhook_logs table
4. Test endpoint manually
5. Confirm SMS-Activate setup

### FreePrice Not Working
1. Verify freeprice_enabled = true
2. Check maxPrice parameter
3. Review service_prices.freeprice_map
4. Sync prices to update data
5. Check provider availability

## Performance Optimization

### Database Queries
- Use indexes on frequently queried columns
- Archive old provider_requests (>30 days)
- Paginate large result sets
- Cache frequently accessed data

### API Rate Limiting
- Monitor request volume
- Implement request pooling
- Use webhook delivery instead of polling
- Respect provider rate limits

### Cost Optimization
- Enable FreePrice for all services
- Set reasonable maxPrice limits
- Monitor and adjust profit margins
- Track savings per provider

## Security Considerations

### Admin Access
- All admin pages require authentication
- Role-based access control (RLS)
- Audit logging for sensitive actions
- Session timeout enforcement

### Webhook Security
- IP whitelist enforcement
- Payload signature validation (future)
- HTTPS-only endpoints
- Rate limiting on webhook endpoints

### API Keys
- Store securely in environment variables
- Never expose in logs
- Rotate regularly
- Monitor for unauthorized usage

## Reporting

### Key Metrics to Track
1. Provider uptime percentage
2. Average response times
3. Cost per activation
4. FreePrice savings total
5. Webhook delivery success rate
6. Failover frequency

### Export Options
- CSV export for Excel analysis
- JSON export for programmatic access
- PDF reports for stakeholders
- Real-time dashboard views

## Future Enhancements

### Planned Features
- Real-time alerts via Telegram bot
- Predictive analytics for stock
- A/B testing for pricing strategies
- Multi-currency support
- Advanced filtering and search
- Custom dashboard widgets

## Support & Documentation

- Technical Issues: Review error logs in webhook_logs and provider_requests
- Configuration Help: Refer to system_settings table
- API Documentation: Check docs/SMS_ACTIVATE_API_AUDIT_REPORT.md
- Feature Requests: Submit via admin feedback form
