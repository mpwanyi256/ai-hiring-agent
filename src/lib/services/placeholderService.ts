import { ContractPlaceholder, PlaceholderCategory } from '@/types/contracts';

class PlaceholderService {
  private placeholdersCache: ContractPlaceholder[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getPlaceholders(category?: PlaceholderCategory): Promise<ContractPlaceholder[]> {
    // Check cache first
    if (this.placeholdersCache.length > 0 && Date.now() < this.cacheExpiry && !category) {
      return this.placeholdersCache;
    }

    try {
      const url = category
        ? `/api/contracts/placeholders?category=${encodeURIComponent(category)}`
        : '/api/contracts/placeholders';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch placeholders');
      }

      const data = await response.json();

      if (!category) {
        // Cache all placeholders
        this.placeholdersCache = data.placeholders;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      }

      return data.placeholders || [];
    } catch (error) {
      console.error('Error fetching placeholders:', error);
      // Return fallback placeholders if API fails
      return this.getFallbackPlaceholders(category);
    }
  }

  formatPlaceholder(key: string): string {
    return `{{ ${key} }}`;
  }

  private getFallbackPlaceholders(category?: PlaceholderCategory): ContractPlaceholder[] {
    const fallbackPlaceholders: ContractPlaceholder[] = [
      {
        id: '1',
        key: 'candidate_name',
        label: 'Candidate Name',
        description: 'Full name of the candidate/employee',
        category: 'candidate',
        example: 'John Smith',
      },
      {
        id: '2',
        key: 'candidate_email',
        label: 'Candidate Email',
        description: 'Email address of the candidate',
        category: 'candidate',
        example: 'john.smith@email.com',
      },
      {
        id: '3',
        key: 'company_name',
        label: 'Company Name',
        description: 'Name of the hiring company',
        category: 'company',
        example: 'Acme Corporation',
      },
      {
        id: '4',
        key: 'company_address',
        label: 'Company Address',
        description: 'Full address of the company',
        category: 'company',
        example: '123 Business St, City, State 12345',
      },
      {
        id: '5',
        key: 'job_title',
        label: 'Job Title',
        description: 'Position title for the role',
        category: 'job',
        example: 'Software Engineer',
      },
      {
        id: '6',
        key: 'salary_amount',
        label: 'Salary Amount',
        description: 'Numerical salary amount',
        category: 'compensation',
        example: '75000',
      },
      {
        id: '7',
        key: 'salary_currency',
        label: 'Salary Currency',
        description: 'Currency for the salary',
        category: 'compensation',
        example: 'USD',
      },
      {
        id: '8',
        key: 'start_date',
        label: 'Start Date',
        description: 'Employment start date',
        category: 'dates',
        example: 'January 15, 2024',
      },
      {
        id: '9',
        key: 'end_date',
        label: 'End Date',
        description: 'Employment end date (if applicable)',
        category: 'dates',
        example: 'January 15, 2025',
      },
      {
        id: '10',
        key: 'signing_date',
        label: 'Signing Date',
        description: 'Date when the contract is signed',
        category: 'dates',
        example: 'December 1, 2023',
      },
      {
        id: '11',
        key: 'employment_type',
        label: 'Employment Type',
        description: 'Type of employment arrangement',
        category: 'job',
        example: 'Full-time',
      },
      {
        id: '12',
        key: 'contract_duration',
        label: 'Contract Duration',
        description: 'Length of the contract period',
        category: 'contract',
        example: '12 months',
      },
    ];

    if (category) {
      return fallbackPlaceholders.filter((p) => p.category === category);
    }

    return fallbackPlaceholders;
  }

  clearCache(): void {
    this.placeholdersCache = [];
    this.cacheExpiry = 0;
  }

  // Get a specific placeholder by key
  async getPlaceholderByKey(key: string): Promise<ContractPlaceholder | undefined> {
    const placeholders = await this.getPlaceholders();
    return placeholders.find((p) => p.key === key);
  }

  // Get placeholders by multiple categories
  async getPlaceholdersByCategories(
    categories: PlaceholderCategory[],
  ): Promise<ContractPlaceholder[]> {
    const placeholders = await this.getPlaceholders();
    return placeholders.filter((p) => categories.includes(p.category as PlaceholderCategory));
  }
}

// Export a singleton instance
export const placeholderService = new PlaceholderService();
