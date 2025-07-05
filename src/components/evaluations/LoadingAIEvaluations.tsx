type LoadingAIEvaluationsProps = {
  className?: string;
}

export const LoadingAIEvaluations = ({ className }: LoadingAIEvaluationsProps) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
  )
}
