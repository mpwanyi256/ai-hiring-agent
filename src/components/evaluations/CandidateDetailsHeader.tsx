import { apiSuccess } from "@/lib/notification";
import { CandidateBasic } from "@/types";

type CandidateDetailsProps = {
  candidate: CandidateBasic;
}

export const CandidateDetailsHeader = ({ candidate }: CandidateDetailsProps) => {

    const handleMoveDraft = () => {
        apiSuccess('Move draft coming soon')
    }

    const handleScheduleInterview = () => {
        apiSuccess('Schedule interview coming soon')
    }
  return (
    <div className="bg-gradient-to-r from-primary via-green-600 to-primary rounded-t-lg p-6 text-white relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green-500/20"></div>
        <div className="relative">
            <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                {`${candidate.firstName} ${candidate.lastName}`?.charAt(0).toUpperCase() || 
                    candidate.email?.charAt(0).toUpperCase() || 'A'}
                </span>
            </div>
            <div>
                <h2 className="text-xl font-bold">
                {`${candidate.firstName} ${candidate.lastName}`}
                </h2>
                <p className="text-green-100">{candidate.email}</p>
            </div>
            </div>
            <div className="mt-4 flex space-x-4">
            <button onClick={handleMoveDraft} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Move Draft
            </button>
            <button onClick={handleScheduleInterview} className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Schedule Interview
            </button>
            </div>
        </div>
    </div>
  )
}