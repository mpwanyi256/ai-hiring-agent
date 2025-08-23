import { trackError } from './tracking';

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
    errorMessage: string,
    context: ErrorContext = {},
  ) {
    this.trackError(errorMessage, {
      ...context,
      additionalData: {
        endpoint,
        status_code: status,
        error_category: 'api_error',
      },
    });
  }

  trackValidationError(field: string, validationRule: string, context: ErrorContext = {}) {
    this.trackError(`Validation failed for ${field}`, {
      ...context,
      additionalData: {
        field,
        validation_rule: validationRule,
        error_category: 'validation_error',
      },
    });
  }

  trackNetworkError(url: string, errorType: string, context: ErrorContext = {}) {
    this.trackError(`Network error: ${errorType}`, {
      ...context,
      additionalData: {
        url,
        error_type: errorType,
        error_category: 'network_error',
      },
    });
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

// Convenience functions
export const trackComponentError = (error: Error | string, component: string, action?: string) => {
  errorTracker.trackError(error, { component, action });
};

export const trackApiError = (
  endpoint: string,
  status: number,
  errorMessage: string,
  component?: string,
) => {
  errorTracker.trackApiError(endpoint, status, errorMessage, { component });
};

export const trackValidationError = (field: string, validationRule: string, component?: string) => {
  errorTracker.trackValidationError(field, validationRule, { component });
};
