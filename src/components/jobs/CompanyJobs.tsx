import { selectCompanyJobs } from '@/store/company/companySelectors';
import { useAppSelector } from '@/store';
import Link from 'next/link';

export default function CompanyJobs() {
  const jobs = useAppSelector(selectCompanyJobs);

  return (
    <div className="w-full">
      <div className="rounded-lg">
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <Link
              href={`/jobs/${job.companySlug}/${job.interviewToken}`}
              className="bg-white border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer"
              key={job.id}
            >
              <h3 className="text-md font-bold">{`${job.title} - ${job.jobType}`}</h3>
              <p className="text-sm text-gray-500">{job.fields.skills?.join(', ')}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
