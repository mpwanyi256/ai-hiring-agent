import DashboardLayout from './DashboardLayout';

interface PageLoadingWrapperProps {
  message?: string;
}

export const PageLoadingWrapper: React.FC<PageLoadingWrapperProps> = ({
  message = 'Loading...',
}) => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-185px)] flex flex-col gap-4 overflow-hidden justify-center items-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-muted-text">{message}</span>
      </div>
    </DashboardLayout>
  );
};
