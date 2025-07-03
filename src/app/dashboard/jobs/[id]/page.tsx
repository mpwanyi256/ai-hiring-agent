import CurrentJobWrapper from '@/components/currentJob/CurrentJobWrapper';
import { Metadata } from 'next';

interface JobDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Add metadata
export const metadata: Metadata = {
  title: 'Job Details',
  description: 'View job details and manage job status',
};

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  return <CurrentJobWrapper params={params} />;
}
