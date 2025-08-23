# Analytics Tracking System

This document outlines the comprehensive analytics tracking system implemented in the Intavia application using Firebase Analytics.

## Overview

The analytics system provides insights into user behavior, feature usage, and application performance across all major user touchpoints. **Events are only tracked in production environments to prevent development noise.**

## Environment-Based Tracking

### Production vs Development

- **Production**: Full analytics tracking enabled
- **Development**: No events sent to Firebase (console logging only)
- **Environment Detection**: Uses `isDev` constant from `@/lib/constants`

### Benefits

- Prevents development/testing data from polluting production analytics
- Maintains clean production data for accurate insights
- Development errors still logged to console for debugging
- Easy to test tracking implementation without affecting analytics

## Architecture

### Core Components

1. **Analytics Provider** (`src/providers/analytics-provider.tsx`)
   - Automatically tracks page views
   - Handles route changes
   - Integrates with Firebase Analytics

2. **Tracking Utilities** (`src/lib/analytics/tracking.ts`)
   - Comprehensive event tracking functions
   - Categorized by feature area
   - Consistent parameter structure
   - **Environment-aware tracking** (production only)

3. **Analytics Hook** (`src/hooks/useAnalytics.ts`)
   - Easy-to-use hook for components
   - Auto-tracks page views based on routes
   - Provides access to all tracking functions

4. **Error Tracking** (`src/lib/analytics/errorTracking.ts`)
   - Centralized error tracking
   - Context-aware error reporting
   - **Development-friendly logging** (console only in dev)

## Event Categories

### Marketing Pages

- `home_page` - Landing page visits
- `pricing_page` - Pricing page visits
- `contact_page` - Contact page visits
- `faq_page` - FAQ page visits

### Authentication

- `signin_page` - Sign-in page visits
- `signup_page` - Sign-up page visits
- `email_verification` - Email verification visits
- `team_invite_page` - Team invitation page visits

### Application Core

- `dashboard` - Dashboard visits (with section tracking)
- `settings_page` - Settings page visits
- `contracts_page` - Contracts page visits
- `jobs_page` - Jobs page visits
- `teams_page` - Teams page visits
- `notifications_page` - Notifications page visits
- `admin_page` - Admin dashboard visits

### Contract Management

- `contract_interaction` - Contract page views and interactions
- `contract_created` - Contract creation events
- `contract_updated` - Contract update events
- `contract_deleted` - Contract deletion events
- `contract_sent` - Contract sending to candidates
- `contract_signed` - Contract signing events (signed/rejected)
- `contract_template_used` - Contract template usage

### Job Management

- `job_created` - Job creation events
- `job_interaction` - Job page views and interactions
- `job_application` - Job application events
- `job_updated` - Job update events
- `job_deleted` - Job deletion events

### Candidate Management

- `candidate_interaction` - Candidate page views and interactions
- `candidate_evaluation` - Candidate evaluation events
- `interview_scheduled` - Interview scheduling events

### Interview Management

- `interview_created` - Interview creation events
- `interview_updated` - Interview update events
- `interview_status_changed` - Interview status changes
- `interview_completed` - Interview completion events

### Team Management

- `team_interaction` - Team page interactions
- `invite_sent` - Team invitation events
- `team_member_invited` - Team member invitation details
- `team_member_joined` - Team member joining events
- `team_member_removed` - Team member removal events
- `role_changed` - Team role changes

### Integrations

- `provider_connection` - Third-party service connections
- `provider_disconnected` - Service disconnections
- `api_errors` - API error tracking
- `validation_errors` - Form validation failures

### User Engagement

- `feature_usage` - Feature-specific actions
- `button_click` - Button interactions
- `modal_opened` - Modal opening events
- `modal_closed` - Modal closing events
- `search_performed` - Search functionality
- `filter_applied` - Filter usage
- `filter_cleared` - Filter clearing
- `sort_applied` - Sorting functionality

### Navigation and Pagination

- `page_changed` - Page navigation events
- `load_more` - Load more functionality
- `form_started` - Form initiation
- `form_submitted` - Form submission (success/failure)
- `form_validation` - Form field validation

### File and Media

- `file_uploaded` - File upload events
- `file_downloaded` - File download events

### Performance and Timing

- `page_load_time` - Page load performance
- `api_response_time` - API response performance

## Usage Examples

### Basic Page Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function MyPage() {
  // Automatically tracks page view
  useAnalytics();

  return <div>Page content</div>;
}
```

### Custom Event Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function MyComponent() {
  const analytics = useAnalytics();

  const handleAction = () => {
    // Track custom event
    analytics.trackFeatureUsage('my_feature', 'action_performed');
  };

  return <button onClick={handleAction}>Click me</button>;
}
```

### Contract Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ContractComponent() {
  const analytics = useAnalytics();

  const handleContractCreate = () => {
    analytics.trackFormStart('contract_creation', 'contracts');
    // ... contract creation logic
    analytics.trackContractCreation('full_time');
    analytics.trackFormSubmission('contract_creation', true, 'contracts');
  };

  return <button onClick={handleContractCreate}>Create Contract</button>;
}
```

### Interview Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function InterviewComponent() {
  const analytics = useAnalytics();

  const handleInterviewSchedule = () => {
    analytics.trackFormStart('interview_scheduling', 'interviews');
    // ... interview scheduling logic
    analytics.trackInterviewCreation('candidate_id', 'job_id', 'video');
    analytics.trackInterviewScheduled('candidate_id', 'video');
  };

  return <button onClick={handleInterviewSchedule}>Schedule Interview</button>;
}
```

### Team Management Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function TeamComponent() {
  const analytics = useAnalytics();

  const handleInviteMember = () => {
    analytics.trackFormStart('team_member_invite', 'teams');
    // ... invitation logic
    analytics.trackTeamMemberInvited('invite_id', 'employee', 'modal');
  };

  return <button onClick={handleInviteMember}>Invite Member</button>;
}
```

### Search and Filter Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export default function SearchComponent() {
  const analytics = useAnalytics();

  const handleSearch = (query: string) => {
    analytics.trackSearch('jobs', query, resultsCount);
  };

  const handleFilter = (filterType: string, value: string) => {
    analytics.trackFilterApplied(filterType, value);
  };

  return <div>Search and filter components</div>;
}
```

### Error Tracking

```tsx
import { trackComponentError } from '@/lib/analytics/errorTracking';

try {
  // Some operation
} catch (error) {
  trackComponentError(error, 'MyComponent', 'handleAction');
}
```

### Provider Connection Tracking

```tsx
import { trackProviderConnection } from '@/lib/analytics/tracking';

// Track connection attempt
trackProviderConnection('google', 'initiated');

// Track success/failure
trackProviderConnection('google', 'success');
trackProviderConnection('google', 'failed');
```

## Testing and Development

### Testing Analytics in Development

Even though events aren't sent to Firebase in development, you can still test your analytics implementation:

1. **Console Logging**: All events are logged to console in development
2. **Function Calls**: Verify tracking functions are called correctly
3. **Parameter Validation**: Check that event parameters are structured properly
4. **Integration Testing**: Ensure analytics hooks are properly integrated

### Development Console Output

```typescript
// In development, you'll see console logs like:
console.log('Event would be tracked:', 'page_view', {
  page_name: 'dashboard',
  page_category: 'application',
  page_type: 'dashboard',
});

// Error tracking in development:
console.error('Error tracked (dev mode):', {
  error: 'API request failed',
  context: { component: 'UserProfile' },
  page: '/dashboard/profile',
});
```

### Switching to Production Mode

To test with real Firebase tracking:

1. Set environment variable: `NEXT_PUBLIC_CLIENT_ENV=production`
2. Restart your development server
3. Events will now be sent to Firebase
4. Monitor Firebase Analytics dashboard for real-time events

### Troubleshooting

#### Common Issues

1. **Events not appearing**
   - Check `NEXT_PUBLIC_CLIENT_ENV` value
   - Verify Firebase configuration
   - Check browser console for errors
   - Ensure analytics provider is mounted

2. **Development vs Production confusion**
   - Development: Console logs only, no Firebase calls
   - Production: Full tracking to Firebase
   - Check environment variable value

3. **Performance issues**
   - Development: No network calls to Firebase
   - Production: Network calls for each event
   - Monitor bundle size impact

## Implementation Status

### ✅ Implemented

- [x] Core analytics infrastructure
- [x] Page view tracking (all major pages)
- [x] Marketing page tracking
- [x] Authentication page tracking
- [x] Dashboard and admin tracking
- [x] Job creation and management tracking
- [x] Candidate interaction tracking
- [x] Provider connection tracking
- [x] Error tracking system
- [x] Contract creation and management tracking
- [x] Interview scheduling and management tracking
- [x] Team management and invitation tracking
- [x] Search and filter functionality tracking
- [x] Form interaction tracking
- [x] Modal interaction tracking
- [x] File upload/download tracking
- [x] Performance metrics tracking

### 🔄 In Progress

- [ ] Advanced user journey tracking
- [ ] Conversion funnel analysis
- [ ] A/B testing support
- [ ] User segmentation

### 📋 Planned

- [ ] Real-time analytics dashboard
- [ ] Predictive analytics
- [ ] Integration with other analytics platforms
- [ ] Custom event builder interface

## Configuration

### Environment Variables

```env
# Environment control
NEXT_PUBLIC_CLIENT_ENV=production  # or 'development'

# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
```

### Environment Control

The analytics system automatically detects the environment using the `isDev` constant:

```typescript
// From @/lib/constants.ts
export const isDev = process.env.NEXT_PUBLIC_CLIENT_ENV === 'development';

// Analytics tracking behavior:
if (!isDev) {
  // Production: Send events to Firebase
  track('event_name', parameters);
} else {
  // Development: No Firebase calls, console logging only
  console.log('Event would be tracked:', 'event_name', parameters);
}
```

### Development vs Production

- **Development** (`NEXT_PUBLIC_CLIENT_ENV=development`):
  - No events sent to Firebase
  - Console logging for debugging
  - Error tracking to console only
  - Safe for testing and development

- **Production** (`NEXT_PUBLIC_CLIENT_ENV=production`):
  - Full analytics tracking
  - Events sent to Firebase
  - Error tracking to analytics
  - Real user data collection

## Best Practices

### 1. Consistent Event Naming

- Use snake_case for event names
- Be descriptive but concise
- Group related events with prefixes

### 2. Parameter Structure

- Always include `page_category` and `page_type`
- Use consistent parameter names across events
- Include relevant IDs when available

### 3. Error Handling

- Track errors with context
- Don't expose sensitive information
- Use appropriate error categories

### 4. Performance

- Track events asynchronously
- Don't block user interactions
- Batch events when possible

### 5. Form Tracking

- Track form start, submission, and validation
- Include success/failure status
- Track form context and purpose

### 6. Search and Filter Tracking

- Track search queries and result counts
- Monitor filter usage patterns
- Track filter clearing actions

## Monitoring and Analysis

### Firebase Analytics Dashboard

- Real-time user activity
- Event breakdowns by category
- User journey analysis
- Conversion tracking
- Performance metrics

### Key Metrics to Monitor

- Page view counts and patterns
- User engagement rates
- Feature adoption and usage
- Error rates and patterns
- Conversion funnels
- Search and filter effectiveness
- Form completion rates
- Team collaboration metrics

### Custom Reports

- User behavior patterns
- Feature usage trends
- Error frequency analysis
- Integration success rates
- Contract and interview workflows
- Team collaboration patterns

## Troubleshooting

### Common Issues

1. **Events not appearing**
   - Check Firebase configuration
   - Verify analytics provider is mounted
   - Check browser console for errors

2. **Duplicate events**
   - Ensure proper cleanup in useEffect
   - Check for multiple component mounts
   - Verify event deduplication logic

3. **Performance issues**
   - Check for excessive event firing
   - Verify async tracking implementation
   - Monitor bundle size impact

### Debug Mode

Enable debug logging in development:

```tsx
// In development, events are logged to console
if (process.env.NODE_ENV === 'development') {
  console.log('Analytics event:', eventName, parameters);
}
```

## Future Enhancements

### Planned Features

- Real-time analytics dashboard
- Advanced user segmentation
- Predictive analytics
- Integration with other analytics platforms
- Custom event builder interface
- Advanced funnel analysis
- Cohort analysis
- Heatmap integration

### Scalability Considerations

- Event batching and queuing
- Rate limiting for high-volume events
- Data retention policies
- Privacy compliance features
- Real-time data processing
- Advanced aggregation capabilities

## Support

For questions or issues with the analytics system:

1. Check this documentation
2. Review Firebase Analytics documentation
3. Check browser console for errors
4. Contact the development team

---

_Last updated: January 2025_
