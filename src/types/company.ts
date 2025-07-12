export interface ClientCompany {
  id: string;
  name: string;
  slug: string;
  bio: string;
  logo_url: string | null;
}

export interface CompanyState {
  company: ClientCompany | null;
  loading: boolean;
}
