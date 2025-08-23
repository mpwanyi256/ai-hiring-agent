import { trackError } from './tracking';
import { isDev } from '@/lib/constants';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  companyId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private userId?: string;
  private companyId?: string;

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  setUserContext(userId: string, companyId?: string) {
    this.userId = userId;
    this.companyId = companyId;
  }

  trackError(
    error: Error | string,
    context: ErrorContext = {},
    page: string = window.location.pathname,
  ) {
    // Only track errors in production
    if (isDev) {
      // In development, just log to console
      console.error('Error tracked (dev mode):', {
        error: typeof error === 'string' ? error : error.message,
        context,
        page,
      });
      return;
    }

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = typeof error === 'string' ? 'string_error' : error.constructor.name;

    const trackingData = {
      error_type: errorType,
      error_message: errorMessage,
      page,
      component: context.component,
      action: context.action,
      user_id: context.userId || this.userId,
      company_id: context.companyId || this.companyId,
      ...context.additionalData,
    };

    trackError(errorType, errorMessage, page);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', trackingData);
    }
  }

  trackApiError(
    endpoint: string,
    status: number,
    error: Error | string,
    context: ErrorContext = {},
  ) {
    // Only track API errors in production
    if (isDev) {
      console.error('API Error tracked (dev mode):', {
        endpoint,
        status,
        error: typeof error === 'string' ? error : error.message,
        context,
      });
      return;
    }

    this.trackError(error, {
      ...context,
      action: 'api_call',
      additionalData: {
        endpoint,
        status_code: status,
        error_category: 'api',
      },
    });
  }

  trackValidationError(field: string, validationRule: string, context: ErrorContext = {}) {
    // Only track validation errors in production
    if (isDev) {
      console.error('Validation Error tracked (dev mode):', {
        field,
        validation_rule: validationRule,
        context,
      });
      return;
    }

    this.trackError(`Validation failed for ${field}`, {
      ...context,
      action: 'validation',
      additionalData: {
        field_name: field,
        validation_rule: validationRule,
        error_category: 'validation',
      },
    });
  }

  trackNetworkError(error: Error | string, context: ErrorContext = {}) {
    // Only track network errors in production
    if (isDev) {
      console.error('Network Error tracked (dev mode):', {
        error: typeof error === 'string' ? error : error.message,
        context,
      });
      return;
    }

    this.trackError(error, {
      ...context,
      action: 'network_request',
      additionalData: {
        error_category: 'network',
      },
    });
  }

  trackComponentError(error: Error | string, component: string, context: ErrorContext = {}) {
    // Only track component errors in production
    if (isDev) {
      console.error('Component Error tracked (dev mode):', {
        error: typeof error === 'string' ? error : error.message,
        component,
        context,
      });
      return;
    }

    this.trackError(error, {
      ...context,
      component,
      action: 'component_render',
      additionalData: {
        error_category: 'component',
      },
    });
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Convenience functions
export const trackComponentError = (
  error: Error | string,
  component: string,
  context?: ErrorContext,
) => {
  errorTracker.trackComponentError(error, component, context);
};

export const trackApiError = (
  endpoint: string,
  status: number,
  error: Error | string,
  context?: ErrorContext,
) => {
  errorTracker.trackApiError(endpoint, status, error, context);
};

export const trackValidationError = (
  field: string,
  validationRule: string,
  context?: ErrorContext,
) => {
  errorTracker.trackValidationError(field, validationRule, context);
};

export const trackNetworkError = (error: Error | string, context?: ErrorContext) => {
  errorTracker.trackNetworkError(error, context);
};
