import React from 'react';
import { Spin, ConfigProvider } from 'antd';
import { useProfile, ProfileProvider } from './ProfileContext';
import ProfileSidebar from './ProfileSidebar';
import BasicInformationStep from './steps/BasicInformationStep';
import ProfessionalDetailsStep from './steps/ProfessionalDetailsStep';
import ExperienceStep from './steps/ExperienceStep';
import EducationStep from './steps/EducationStep';
import SkillsStep from './steps/SkillsStep';
import JobPreferencesStep from './steps/JobPreferencesStep';
import ResumeStep from './steps/ResumeStep';
import VisibilityStep from './steps/VisibilityStep';
import ReviewStep from './steps/ReviewStep';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from '@/routing-shim';

const WizardHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 h-16 flex items-center justify-between px-6 sm:px-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Brand Logo */}
      <div
        onClick={() => navigate('/candidate-profile/mainprofile')}
        className="flex items-center gap-2 cursor-pointer select-none"
      >
        <img src="https://careerfast.in/_next/static/media/careerfastlogofinal.0nplzw.k4hsr8.png" alt="Careerfast" className="w-48 h-auto object-contain" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => window.open('mailto:support@careerfast.in', '_blank')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <QuestionCircleOutlined className="text-sm" />
          <span>Need Help?</span>
        </button>

        <span className="h-4 w-px bg-gray-200" />

        <button
          type="button"
          onClick={() => navigate('/candidate-profile/mainprofile')}
          className="text-xs font-bold text-[#6B21A8] hover:text-[#581C87] hover:bg-purple-50 px-3.5 py-1.5 rounded-lg border border-purple-200 transition-colors"
        >
          Save & Exit
        </button>
      </div>
    </header>
  );
};

const WizardContent = () => {
  const { currentStep, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
        <Spin size="large" />
      </div>
    );
  }

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

      {/* Mobile Top Step Indicator */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 sticky top-16 z-20">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#6B21A8]">STEP {currentStep} OF 9</span>
          <span className="text-gray-500 font-medium">Candidate Profile</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
          <div
            className="bg-[#6B21A8] h-1 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 9) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-start gap-6 flex-1">
        <ProfileSidebar />
        <main className="flex-1 w-full min-w-0">
          {renderStep()}
        </main>
      </div>
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
