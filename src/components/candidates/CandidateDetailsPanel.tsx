import React, { useState } from 'react';
import SidePanel from '../ui/SidePanel';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Tab } from '@headlessui/react';
import GeneralTab from './GeneralTab';
import OffersTab from './OffersTab';
import EventsTab from './EventsTab';
import EvaluationsTab from './EvaluationsTab';
import TimelineTab from './TimelineTab';
import InterviewSchedulingModal from '../interviews/InterviewSchedulingModal';
import SendContractModal from '../contracts/SendContractModal';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchApplicationEvents } from '@/store/interviews/interviewsThunks';

// --- Main Panel ---
interface CandidateDetailsPanelProps {
  isOpen: boolean;
  candidate: CandidateWithEvaluation;
  onClose: () => void;
}

const tabs = [
  { name: 'General', Component: GeneralTab },
  { name: 'Offers', Component: OffersTab },
  { name: 'Events', Component: EventsTab },
  { name: 'Timeline', Component: TimelineTab },
  { name: 'Evaluations', Component: EvaluationsTab },
  // { name: 'Experience', Component: ExperienceTab },
];

const CandidateDetailsPanel: React.FC<CandidateDetailsPanelProps> = ({
  isOpen,
  candidate,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [schedulingModalOpen, setSchedulingModalOpen] = useState(false);
  const [sendContractModalOpen, setSendContractModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.selectedCandidate.isLoading);

  const handleScheduleEvent = () => setSchedulingModalOpen(true);

  const handleCloseSchedulingModal = () => {
    setSchedulingModalOpen(false);
    // Refresh events after modal closes (which happens after successful creation)
    if (candidate.id) {
      dispatch(fetchApplicationEvents(candidate.id));
    }
  };

  const handleSendContract = () => setSendContractModalOpen(true);
  const handleCloseSendContractModal = () => setSendContractModalOpen(false);

  // Function to refresh events that can be passed to EventsTab
  const refreshEvents = () => {
    if (candidate.id) {
      dispatch(fetchApplicationEvents(candidate.id));
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      title={`${candidate.firstName} ${candidate.lastName} - Details`}
    >
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-primary rounded-full" />
          </div>
        )}
      </div>
      <div className="flex flex-col h-full min-h-0">
        {/* Tabs Section */}
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-2 border-b mb-6 bg-white">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }: { selected: boolean }) =>
                  cn(
                    'px-4 py-2 text-sm font-medium rounded-t',
                    selected
                      ? 'bg-white border-b-2 border-primary-600 text-primary-700'
                      : 'bg-gray-50 text-gray-500 hover:text-primary-700',
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="flex-1 min-h-0">
            {tabs.map((tab) => (
              <Tab.Panel key={tab.name} className="h-full min-h-0 flex flex-col">
                {tab.name === 'General' ? (
                  <tab.Component
                    candidate={candidate}
                    onScheduleEvent={handleScheduleEvent}
                    onSendContract={handleSendContract}
                  />
                ) : tab.name === 'Offers' ? (
                  <tab.Component candidate={candidate} onSendContract={handleSendContract} />
                ) : tab.name === 'Events' ? (
                  <tab.Component
                    candidate={candidate}
                    onScheduleEvent={handleScheduleEvent}
                    onSendContract={handleSendContract}
                    onRefreshEvents={refreshEvents}
                  />
                ) : (
                  <tab.Component candidate={candidate} onSendContract={handleSendContract} />
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
      {/* Interview Scheduling Modal */}
      <InterviewSchedulingModal
        isOpen={schedulingModalOpen}
        onClose={handleCloseSchedulingModal}
        candidate={candidate}
        jobId={candidate.jobId}
        jobTitle={candidate.jobTitle}
      />

      {/* Send Contract Modal */}
      <SendContractModal
        isOpen={sendContractModalOpen}
        onClose={handleCloseSendContractModal}
        candidate={candidate}
        jobTitle={candidate.jobTitle}
      />
    </SidePanel>
  );
};

export default CandidateDetailsPanel;
