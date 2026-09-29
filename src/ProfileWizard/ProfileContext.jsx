import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUserProfile } from '../ApiService/action';
import { message } from 'antd';

const ProfileContext = createContext(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const isStepMandatoryComplete = (stepId, data) => {
  if (!data) return false;
  const { basic, professional, experience, jobPreferences } = data;

  switch (stepId) {
    case 1: // Basic Information: First Name, Last Name, Email, City, State, and Email Verified
      return Boolean(
        basic?.firstName &&
        basic?.firstName.trim() &&
        basic?.lastName &&
        basic?.lastName.trim() &&
        basic?.email &&
        basic?.email.trim() &&
        basic?.city &&
        basic?.city.trim() &&
        basic?.state &&
        basic?.state.trim() &&
        (basic?.isEmailVerified === true || basic?.isEmailVerified === 1)
      );
    case 2: { // Professional Details
      const isFresher = experience?.isFresher === true || professional?.careerLevel === 'Fresher';
      if (isFresher) {
        return Boolean(
          professional?.jobTitle &&
          professional?.jobTitle.trim() &&
          professional?.headline &&
          professional?.headline.trim()
        );
      }
      return Boolean(
        professional?.jobTitle &&
        professional?.jobTitle.trim() &&
        professional?.headline &&
        professional?.headline.trim() &&
        professional?.totalExperience &&
        professional?.careerLevel
      );
    }
    case 3: // Work Experience (Fresher track optional, experienced track can skip)
      return true;
    case 4: // Education (Optional)
      return true;
    case 5: // Skills (Optional / Recommended)
      return true;
    case 6: // Job Preferences
      return Boolean(
        jobPreferences?.preferredRoles?.length > 0 &&
        jobPreferences?.preferredLocations?.length > 0 &&
        jobPreferences?.workMode?.length > 0 &&
        jobPreferences?.jobType?.length > 0 &&
        jobPreferences?.noticePeriod &&
        jobPreferences?.relocation
      );
    case 7: // Resume (Optional)
      return true;
    case 8: // Visibility
      return true;
    case 9: // Review
      return true;
    default:
      return true;
  }
};

export const ProfileProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    basic: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      city: '',
      state: '',
      dob: null,
      gender: null,
      profilePhoto: null,
      isEmailVerified: false
    },
    professional: {
      jobTitle: '',
      totalExperience: '',
      careerLevel: null,
      headline: '',
      summary: ''
    },
    experience: {
      isFresher: false,
      list: []
    },
    education: [],
    skills: [],
    jobPreferences: {
      preferredRoles: [],
      preferredLocations: [],
      workMode: [],
      jobType: [],
      expectedSalary: '',
      currentSalary: '',
      noticePeriod: null,
      relocation: null
    },
    resume: null,
    visibility: {
      mode: 'Limited',
      hiddenCompanies: [],
      allowContact: true,
      showInSearch: true
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;
  const stepValidatorRef = useRef(null);
  const [isStepSaving, setIsStepSaving] = useState(false);

  const registerStepValidator = useCallback((validatorFn) => {
    stepValidatorRef.current = validatorFn;
    return () => {
      if (stepValidatorRef.current === validatorFn) {
        stepValidatorRef.current = null;
      }
    };
  }, []);

  const goToStep = useCallback(async (targetStep) => {
    if (targetStep === currentStep) return false;
    if (isStepSaving) return false;

    // Moving backwards to an earlier step is always allowed
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    // Moving forward (targetStep > currentStep):
    // 1. MUST validate the current active step first
    if (stepValidatorRef.current) {
      setIsStepSaving(true);
      try {
        const isValid = await stepValidatorRef.current();
        setIsStepSaving(false);
        if (!isValid) {
          return false;
        }
      } catch (error) {
        setIsStepSaving(false);
        console.error('Validation error moving to next step:', error);
        return false;
      }
    }

    // 2. If skipping ahead multiple steps (e.g. Step 1 -> Step 4),
    // ensure all intermediate steps that have mandatory fields are satisfied
    if (targetStep > currentStep + 1) {
      for (let s = currentStep + 1; s < targetStep; s++) {
        if (!isStepMandatoryComplete(s, profileData)) {
          message.warning(`Please complete Step ${s} before proceeding to Step ${targetStep}.`);
          setCurrentStep(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return false;
        }
      }
    }

    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }, [currentStep, isStepSaving, profileData]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');
      if (!userId) return;

      const payload = { user_id: userId };
      const response = await getUserProfile(payload);

      if (response && response.status === 200) {
        const data = response.data?.data || response.data;
        const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');

        let preferredJobObj = {};
        try {
          if (data.preferred_job_type) {
            if (typeof data.preferred_job_type === 'string' && data.preferred_job_type.startsWith('{')) {
              preferredJobObj = JSON.parse(data.preferred_job_type);
            } else if (typeof data.preferred_job_type === 'object') {
              preferredJobObj = data.preferred_job_type;
            }
          }
        } catch (e) {
          preferredJobObj = {};
        }

        const locationParts = (data.location || '').split(', ');
        const derivedCity = data.city || locationParts[0] || '';
        const derivedState = data.state || (locationParts.length > 1 ? locationParts.slice(1).join(', ') : '');

        setProfileData(prev => ({
          ...prev,
          basic: {
            ...prev.basic,
            firstName: data.first_name || data.name?.split(' ')[0] || loginDetails.first_name || '',
            lastName: data.last_name || data.name?.split(' ').slice(1).join(' ') || loginDetails.last_name || '',
            email: data.email || loginDetails.email || '',
            mobile: data.mobile || data.phone || loginDetails.phone || '',
            city: derivedCity,
            state: derivedState,
            dob: data.dob || null,
            gender: data.gender || null,
            profilePhoto: data.profile_image || null,
            isEmailVerified: data.is_email_verified === 1 || data.is_email_verified === true || loginDetails.is_email_verified === 1 || false,
          },
          professional: {
            ...prev.professional,
            jobTitle: data.user_type || data.job_title || '',
            totalExperience: data.total_years || data.experience || '',
            careerLevel: data.career_level || (data.experince_type === 'Fresher' ? 'Fresher' : null),
            headline: data.headline || '',
            summary: data.about || ''
          },
          experience: {
            isFresher: data.experince_type === 'Fresher' || data.is_fresher || false,
            list: data.professional || data.experience_list || []
          },
          education: (data.education || data.education_list || []).map(edu => ({
            ...edu,
            education_level: edu.qualification || edu.education_level,
            degree_name: edu.course || edu.degree_name,
            institute_name: edu.college || edu.institute_name,
            start_year: edu.start_date || edu.start_year,
            end_year: edu.end_date || edu.end_year,
            percentage_cgpa: edu.percentage || edu.percentage_cgpa,
          })),
          skills: data.skills || [],
          jobPreferences: {
            ...prev.jobPreferences,
            preferredRoles: preferredJobObj.preferredRoles || [],
            preferredLocations: preferredJobObj.preferredLocations || [],
            workMode: preferredJobObj.workMode || [],
            jobType: preferredJobObj.jobType || [],
            expectedSalary: preferredJobObj.expectedSalary || data.expected_salary || '',
            currentSalary: preferredJobObj.currentSalary || data.current_salary || '',
            noticePeriod: preferredJobObj.noticePeriod || data.notice_period || null,
            relocation: preferredJobObj.relocation || null,
          },
          resume: data.resume || null,
          visibility: {
            mode: data.visibility_mode || 'Limited',
            hiddenCompanies: Array.isArray(data.hidden_companies) ? data.hidden_companies : [],
            allowContact: data.allow_contact !== undefined ? Boolean(data.allow_contact) : true,
            showInSearch: data.show_in_search !== undefined ? Boolean(data.show_in_search) : true,
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileSection = useCallback((section, data) => {
    setProfileData(prev => ({
      ...prev,
      [section]: (data && typeof data === 'object' && !(data instanceof File) && !Array.isArray(data))
        ? { ...prev[section], ...data }
        : data
    }));
  }, []);

  const updateProfileField = useCallback((section, field, value) => {
    setProfileData(prev => {
      if (Array.isArray(prev[section])) {
        return {
          ...prev,
          [section]: value
        };
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
    });
  }, []);

  const calculateCompletion = () => {
    let score = 0;
    const { basic, professional, experience, education, skills, jobPreferences, resume } = profileData;

    if (basic.firstName && basic.lastName && basic.email && basic.mobile && (basic.isEmailVerified === true || basic.isEmailVerified === 1)) score += 10;
    if (professional.jobTitle && professional.headline) score += 15;
    if (experience.isFresher || experience.list.length > 0) score += 20;
    if (education.length > 0) score += 15;
    if (skills.length > 0) score += 15;
    if (jobPreferences.preferredRoles?.length > 0) score += 10;
    if (resume) score += 10;
    if (basic.profilePhoto) score += 5;

    return score;
  };

  const value = {
    profileData,
    loading,
    currentStep,
    totalSteps,
    setCurrentStep,
    goToStep,
    registerStepValidator,
    isStepSaving,
    setIsStepSaving,
    isStepMandatoryComplete,
    updateProfileSection,
    updateProfileField,
    calculateCompletion,
    fetchProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
