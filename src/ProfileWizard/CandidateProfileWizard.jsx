import React, { useState } from 'react';
import { Spin, ConfigProvider, Drawer } from 'antd';
import { useProfile, ProfileProvider } from './ProfileContext';
import ProfileSidebar, {
  ProfileStepsList,
  ProfilePromoCard,
  calculateCompletedStepsCount,
  wizardSteps,
} from './ProfileSidebar';
import BasicInformationStep from './steps/BasicInformationStep';
import ProfessionalDetailsStep from './steps/ProfessionalDetailsStep';
import ExperienceStep from './steps/ExperienceStep';
import EducationStep from './steps/EducationStep';
import SkillsStep from './steps/SkillsStep';
import JobPreferencesStep from './steps/JobPreferencesStep';
import ResumeStep from './steps/ResumeStep';
import VisibilityStep from './steps/VisibilityStep';
import ReviewStep from './steps/ReviewStep';
import { QuestionCircleOutlined, UnorderedListOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from '@/routing-shim';

const WizardHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 h-16 flex items-center justify-between px-3 sm:px-6 md:px-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Brand Logo */}
      <div
        onClick={() => navigate('/candidate-profile/mainprofile')}
        className="flex items-center gap-2 cursor-pointer select-none"
      >
        <img
          src="https://careerfast.in/_next/static/media/careerfastlogofinal.0nplzw.k4hsr8.png"
          alt="Careerfast"
          className="w-32 sm:w-44 h-auto object-contain"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={() => window.open('mailto:careerfastcontact@gmail.com', '_blank')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-50"
        >
          <QuestionCircleOutlined className="text-sm text-[#6B21A8]" />
          <span className="hidden xs:inline sm:inline">Need Help?</span>
          <span className="xs:hidden sm:hidden">Help</span>
        </button>

        <span className="h-4 w-px bg-gray-200" />

        <button
          type="button"
          onClick={() => navigate('/candidate-profile/mainprofile')}
          className="text-xs font-bold text-[#6B21A8] hover:text-[#581C87] hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors shrink-0"
        >
          Save & Exit
        </button>
      </div>
    </header>
  );
};

const WizardContent = () => {
  const { currentStep, loading, profileData, calculateCompletion } = useProfile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Spin size="large" />
      </div>
    );
  }

  const currentStepObj = wizardSteps.find((s) => s.id === currentStep);
  const isFresher =
    profileData?.experience?.isFresher === true ||
    profileData?.professional?.careerLevel === 'Fresher';
  const currentStepTitle =
    currentStep === 3 && isFresher ? 'Internships & Projects' : currentStepObj?.title || 'Profile Step';

  const completedStepsCount = calculateCompletedStepsCount(profileData);
  const completion = calculateCompletion();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformationStep />;
      case 2:
        return <ProfessionalDetailsStep />;
      case 3:
        return <ExperienceStep />;
      case 4:
        return <EducationStep />;
      case 5:
        return <SkillsStep />;
      case 6:
        return <JobPreferencesStep />;
      case 7:
        return <ResumeStep />;
      case 8:
        return <VisibilityStep />;
      case 9:
        return <ReviewStep />;
      default:
        return <BasicInformationStep />;
    }
  };

  return (
    <div className="profile-wizard-scope min-h-screen bg-[#F4F5FA] flex flex-col">
      <WizardHeader />

      {/* Mobile Top Step Indicator & Actions Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 sticky top-16 z-30 shadow-xs">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-extrabold text-[#6B21A8] text-xs shrink-0 tracking-wide">
              STEP {currentStep} OF 9
            </span>
            <span className="text-gray-300 text-xs shrink-0">•</span>
            <span className="text-gray-800 font-semibold text-xs truncate">
              {currentStepTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#6B21A8] bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-full border border-purple-200/80 shrink-0 transition-colors shadow-xs"
          >
            <UnorderedListOutlined className="text-[11px]" />
            <span>Steps ({completedStepsCount}/8)</span>
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completion === 100 ? 'bg-emerald-500' : 'bg-[#6B21A8]'
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
          <span
            className={`text-[11px] font-bold shrink-0 ${
              completion === 100 ? 'text-emerald-600' : 'text-gray-700'
            }`}
          >
            {completion}%
          </span>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex flex-col md:flex-row items-start gap-6 flex-1">
        {/* Desktop Sidebar (hidden on mobile) */}
        <ProfileSidebar />

        {/* Step Content */}
        <main className="flex-1 w-full min-w-0">{renderStep()}</main>
      </div>

      {/* Mobile Steps Bottom Sheet Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-1">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-0">Profile Steps</h3>
              <p className="text-xs text-gray-500 font-normal mt-0.5 mb-0">
                {completedStepsCount} of 8 steps completed
              </p>
            </div>
            <span className="text-xs font-bold text-[#6B21A8] bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-full">
              {completion}% Done
            </span>
          </div>
        }
        placement="bottom"
        height="82vh"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        closeIcon={<CloseOutlined className="text-gray-500 text-sm" />}
        styles={{
          header: { borderBottom: '1px solid #F3F4F6', padding: '16px 20px' },
          body: { padding: '16px 20px', backgroundColor: '#FFFFFF' },
          content: { borderTopLeftRadius: '24px', borderTopRightRadius: '24px', overflow: 'hidden' },
        }}
      >
        <div className="flex flex-col justify-between min-h-full pb-6">
          <div>
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
              Tap any step to navigate
            </p>
            <ProfileStepsList onStepSelect={() => setMobileDrawerOpen(false)} />
          </div>

          <div className="mt-6">
            <ProfilePromoCard />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

const wizardTheme = {
  token: {
    colorPrimary: '#6B21A8',
    colorPrimaryHover: '#8B5CF6',
    borderRadius: 12,
    controlHeight: 44,
    fontSize: 14,
    colorBorder: '#E5E7EB',
    fontFamily: 'inherit',
  },
  components: {
    Input: {
      controlHeight: 44,
      borderRadius: 12,
      activeBorderColor: '#6B21A8',
      hoverBorderColor: '#8B5CF6',
      activeShadow: '0 0 0 3px rgba(107, 33, 168, 0.12)',
    },
    Select: {
      controlHeight: 44,
      borderRadius: 12,
      colorPrimary: '#6B21A8',
      colorPrimaryHover: '#8B5CF6',
      controlOutline: 'rgba(107, 33, 168, 0.12)',
      optionSelectedBg: '#F5F0FF',
      optionSelectedColor: '#6B21A8',
    },
    DatePicker: {
      controlHeight: 44,
      borderRadius: 12,
      colorPrimary: '#6B21A8',
      colorPrimaryHover: '#8B5CF6',
      controlOutline: 'rgba(107, 33, 168, 0.12)',
      activeBorderColor: '#6B21A8',
      hoverBorderColor: '#8B5CF6',
      activeShadow: '0 0 0 3px rgba(107, 33, 168, 0.12)',
    },
    InputNumber: {
      controlHeight: 44,
      borderRadius: 12,
      activeBorderColor: '#6B21A8',
      hoverBorderColor: '#8B5CF6',
      activeShadow: '0 0 0 3px rgba(107, 33, 168, 0.12)',
    },
    Radio: {
      colorPrimary: '#6B21A8',
    },
    Checkbox: {
      colorPrimary: '#6B21A8',
      borderRadiusSM: 4,
    },
    Switch: {
      colorPrimary: '#6B21A8',
    },
    Button: {
      borderRadius: 12,
      controlHeight: 44,
    },
    Modal: {
      borderRadiusLG: 20,
    },
  },
};

const CandidateProfileWizard = () => {
  return (
    <ConfigProvider theme={wizardTheme}>
      <ProfileProvider>
        <WizardContent />
      </ProfileProvider>
    </ConfigProvider>
  );
};

export default CandidateProfileWizard;
