interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-10rem)]">
      <div className="bg-white rounded-lg border border-gray-light p-8">
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">{message}</span>
        </div>
      </div>
    </div>
  );
};
