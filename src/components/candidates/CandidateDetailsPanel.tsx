import React, { useState } from 'react';
import SidePanel from '../ui/SidePanel';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Tab } from '@headlessui/react';
import GeneralTab from './GeneralTab';
import EvaluationsTab from './EvaluationsTab';
import TimelineTab from './TimelineTab';
import InterviewSchedulingModal from '../interviews/InterviewSchedulingModal';
import SendContractModal from '../contracts/SendContractModal';

// --- Main Panel ---
interface CandidateDetailsPanelProps {
  isOpen: boolean;
  candidate: CandidateWithEvaluation;
  onClose: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  { name: 'General', Component: GeneralTab },
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
  const handleScheduleEvent = () => setSchedulingModalOpen(true);
  const handleCloseSchedulingModal = () => setSchedulingModalOpen(false);
  const handleSendContract = () => setSendContractModalOpen(true);
  const handleCloseSendContractModal = () => setSendContractModalOpen(false);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      title={`${candidate.firstName} ${candidate.lastName} - Details`}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Tabs Section */}
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-2 border-b mb-6 bg-white">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }: { selected: boolean }) =>
                  classNames(
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
                ) : (
                  <tab.Component candidate={candidate} />
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
