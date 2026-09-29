import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import { Form, Input, Select, Row, Col, AutoComplete, Spin } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { updateBasicDetails, updateAbout } from '../../ApiService/action';
import {
  fetchWorldwideJobRoles,
  getInitialJobRoles,
} from '../../Common/worldwideDataService';

const { Option } = Select;
const { TextArea } = Input;

const yearOptions = Array.from({ length: 31 }, (_, i) => ({ value: `${i} Years`, label: `${i} Years` }));
const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const label = i <= 1 ? `${i} Month` : `${i} Months`;
  return { value: label, label: label };
});

const ProfessionalDetailsStep = () => {
  const { profileData, updateProfileSection, updateProfileField } = useProfile();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  const initialIsFresher =
    profileData.experience.isFresher === true ||
    profileData.professional.careerLevel === 'Fresher' ||
    profileData.professional.totalExperience === '0 years' ||
    profileData.professional.totalExperience === 'Fresher (0 Years)';

  const [isFresher, setIsFresher] = useState(initialIsFresher);
  const isInitializedRef = useRef(false);

  const formatJobRoleOption = (role) => ({
    value: role,
    label: (
      <div className="flex items-center justify-between py-1 px-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">💼</span>
          <span className="text-sm font-medium text-gray-800">{role}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#6B21A8] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-semibold">
          Worldwide
        </span>
      </div>
    ),
  });

  const [jobTitleOptions, setJobTitleOptions] = useState(() =>
    getInitialJobRoles().slice(0, 30).map(formatJobRoleOption)
  );
  const [loadingJobTitles, setLoadingJobTitles] = useState(false);
  const jobTitleSearchTimer = useRef(null);

  const handleSearchJobTitles = useCallback((searchText) => {
    if (jobTitleSearchTimer.current) {
      clearTimeout(jobTitleSearchTimer.current);
    }

    const trimmed = (searchText || '').trim();
    if (!trimmed) {
      setJobTitleOptions(getInitialJobRoles().slice(0, 30).map(formatJobRoleOption));
      setLoadingJobTitles(false);
      return;
    }

    // Instant local matches for 0ms delay
    const initialList = getInitialJobRoles();
    const localFiltered = initialList.filter(role =>
      role.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (localFiltered.length > 0) {
      setJobTitleOptions(localFiltered.map(formatJobRoleOption));
    }

    // Debounced worldwide ESCO occupational API search
    setLoadingJobTitles(true);
    jobTitleSearchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchWorldwideJobRoles(trimmed);
        setJobTitleOptions(results.map(formatJobRoleOption));
      } catch (err) {
        console.error('Error fetching worldwide job titles:', err);
      } finally {
        setLoadingJobTitles(false);
      }
    }, 200);
  }, []);

  useEffect(() => {
    const isF =
      profileData.experience.isFresher === true ||
      profileData.professional.careerLevel === 'Fresher';
    setIsFresher(isF);

    if (isInitializedRef.current && form.isFieldsTouched()) {
      return;
    }

    const currentValues = form.getFieldsValue();
    const expString = currentValues.totalExperience || profileData.professional.totalExperience || '';
    let parsedYears = undefined;
    let parsedMonths = undefined;

    if (!isF && expString) {
      const lowerExp = expString.toLowerCase();
      const yearMatch = lowerExp.match(/(\d+)\s*year/);
      if (yearMatch) parsedYears = `${yearMatch[1]} Years`;

      const monthMatch = lowerExp.match(/(\d+)\s*month/);
      if (monthMatch) {
        const m = parseInt(monthMatch[1], 10);
        parsedMonths = m <= 1 ? `${m} Month` : `${m} Months`;
      }
    }

    form.setFieldsValue({
      jobTitle: currentValues.jobTitle !== undefined && currentValues.jobTitle !== '' ? currentValues.jobTitle : (profileData.professional.jobTitle || ''),
      totalYears: isF ? '0 Years' : (currentValues.totalYears || parsedYears || undefined),
      totalMonths: isF ? '0 Month' : (currentValues.totalMonths || parsedMonths || undefined),
      careerLevel: isF
        ? 'Fresher'
        : (currentValues.careerLevel || profileData.professional.careerLevel || undefined),
      currentSalary: currentValues.currentSalary !== undefined && currentValues.currentSalary !== ''
        ? currentValues.currentSalary
        : (profileData.jobPreferences.currentSalary || ''),
      headline: currentValues.headline !== undefined && currentValues.headline !== '' ? currentValues.headline : (profileData.professional.headline || ''),
      summary: currentValues.summary !== undefined && currentValues.summary !== '' ? currentValues.summary : (profileData.professional.summary || ''),
    });

    if (profileData.professional.jobTitle || profileData.professional.headline) {
      isInitializedRef.current = true;
    }
  }, [
    profileData.professional.jobTitle,
    profileData.professional.totalExperience,
    profileData.professional.careerLevel,
    profileData.professional.headline,
    profileData.professional.summary,
    profileData.jobPreferences.currentSalary,
    profileData.experience.isFresher,
    form
  ]);

  const handleStatusChange = (status) => {
    setIsFresher(status);
    const currentValues = form.getFieldsValue();
    const effectiveExperience = status ? 'Fresher (0 Years)' : `${currentValues.totalYears || '0 Years'} ${currentValues.totalMonths || '0 Month'}`;
    updateProfileSection('professional', {
      ...currentValues,
      careerLevel: status ? 'Fresher' : (currentValues.careerLevel || profileData.professional.careerLevel),
      totalExperience: effectiveExperience,
    });
    updateProfileField('experience', 'isFresher', status);

    if (status) {
      form.setFieldsValue({
        totalYears: '0 Years',
        totalMonths: '0 Month',
        careerLevel: 'Fresher',
      });
    } else {
      const prevLevel = profileData.professional.careerLevel;

      const expString = profileData.professional.totalExperience || '';
      let parsedYears = undefined;
      let parsedMonths = undefined;
      if (expString && expString !== 'Fresher (0 Years)' && expString !== '0 years') {
        const lowerExp = expString.toLowerCase();
        const yearMatch = lowerExp.match(/(\d+)\s*year/);
        if (yearMatch) parsedYears = `${yearMatch[1]} Years`;
        const monthMatch = lowerExp.match(/(\d+)\s*month/);
        if (monthMatch) {
          const m = parseInt(monthMatch[1], 10);
          parsedMonths = m <= 1 ? `${m} Month` : `${m} Months`;
        }
      }

      form.setFieldsValue({
        totalYears: parsedYears || currentValues.totalYears || undefined,
        totalMonths: parsedMonths || currentValues.totalMonths || undefined,
        careerLevel:
          prevLevel && prevLevel !== 'Fresher' ? prevLevel : (currentValues.careerLevel && currentValues.careerLevel !== 'Fresher' ? currentValues.careerLevel : undefined),
      });
    }
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      const effectiveCareerLevel = isFresher ? 'Fresher' : values.careerLevel;
      const effectiveExperience = isFresher ? '0 years' : `${values.totalYears || '0 Years'} ${values.totalMonths || '0 Month'}`.trim();

      updateProfileSection('professional', {
        ...values,
        careerLevel: effectiveCareerLevel,
        totalExperience: effectiveExperience,
      });
      updateProfileField('experience', 'isFresher', isFresher);
      updateProfileField('jobPreferences', 'currentSalary', values.currentSalary);

      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const payloadBasic = {
        job_title: values.jobTitle,
        user_type: values.jobTitle,
        experience: effectiveExperience,
        total_years: effectiveExperience,
        career_level: effectiveCareerLevel,
        headline: values.headline,
        is_fresher: isFresher,
        experince_type: isFresher ? 'Fresher' : 'Experience',
        current_salary: values.currentSalary,
        user_id: userId,
      };

      const payloadAbout = {
        about: values.summary,
        user_id: userId,
        id: userId,
      };

      await Promise.all([
        updateBasicDetails(payloadBasic),
        updateAbout(payloadAbout)
      ]);

      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Validation failed:', error);
      setIsSaving(false);
      return false;
    }
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="mb-6">
        <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
          STEP 2 OF 8
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
          Build your professional identity
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
          Tell recruiters what you do and what kind of role you're looking for.
        </p>
      </div>

      {/* Main Step White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">
        {/* Experience Status Selector */}
        <div className="mb-6 p-4 rounded-2xl bg-[#FAF5FF] border border-[#EDE9FE]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-0.5">What is your experience status?</p>
              <p className="text-xs text-gray-500 mb-0">Select your status to customize your profile details.</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => handleStatusChange(true)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${isFresher
                  ? 'bg-[#6B21A8] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                🎓 I am a Fresher
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(false)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${!isFresher
                  ? 'bg-[#6B21A8] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                💼 I have Experience
              </button>
            </div>
          </div>
        </div>

        <Form form={form} layout="vertical" requiredMark={false} scrollToFirstError>
          <Row gutter={20}>
            <Col xs={24} sm={24}>
              <Form.Item
                name="jobTitle"
                label={
                  <span className="text-xs font-semibold text-gray-800">
                    <span className="text-red-500 mr-1">*</span>
                    {isFresher ? 'Target / Desired Job Role' : 'Current / Most Recent Job Title'}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: isFresher
                      ? 'Please enter your desired job role'
                      : 'Please enter your job title',
                  },
                ]}
              >
                <AutoComplete
                  options={jobTitleOptions}
                  onSearch={handleSearchJobTitles}
                  onSelect={(val) => form.setFieldsValue({ jobTitle: val })}
                  popupMatchSelectWidth={true}
                  filterOption={false}
                  className="w-full"
                >
                  <Input
                    placeholder={
                      isFresher
                        ? 'e.g. Software Engineer, Junior Frontend Developer, QA Trainee'
                        : 'e.g. Full Stack Developer'
                    }
                    className="h-11 rounded-xl text-sm border-gray-200"
                    suffix={
                      loadingJobTitles ? (
                        <Spin size="small" />
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">Worldwide</span>
                      )
                    }
                  />
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          {!isFresher && (
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="totalYears"
                  label={
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Total Years of Experience
                    </span>
                  }
                  rules={[{ required: true, message: 'Please select total years' }]}
                >
                  <Select
                    placeholder="Select Years"
                    className="h-11 w-full rounded-xl text-sm border-gray-200"
                    options={yearOptions}
                    showSearch
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="totalMonths"
                  label={
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Total Months of Experience
                    </span>
                  }
                  rules={[{ required: true, message: 'Please select total months' }]}
                >
                  <Select
                    placeholder="Select Months"
                    className="h-11 w-full rounded-xl text-sm border-gray-200"
                    options={monthOptions}
                    showSearch
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {!isFresher && (
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="careerLevel"
                  label={
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Career Level
                    </span>
                  }
                  rules={[{ required: true, message: 'Please select a career level' }]}
                >
                  <Select
                    placeholder="Select career level"
                    className="h-11 w-full rounded-xl text-sm"
                  >
                    <Option value="Entry Level">Entry Level</Option>
                    <Option value="Mid Level">Mid Level</Option>
                    <Option value="Senior Level">Senior Level</Option>
                    <Option value="Lead/Manager">Lead/Manager</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="currentSalary"
                  label={
                    <span className="text-xs font-semibold text-gray-800">
                      Current Salary (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                    </span>
                  }
                >
                  <Input
                    prefix={<DollarOutlined className="text-gray-400 mr-1.5" />}
                    placeholder="e.g. 10 LPA"
                    className="h-11 rounded-xl text-sm border-gray-200"
                  />
                </Form.Item>
                <p className="text-[11px] text-gray-400 -mt-4 mb-4">Confidential. Helps us recommend better salary matches.</p>
              </Col>
            </Row>
          )}

          <Row gutter={20}>
            <Col xs={24}>
              <Form.Item
                name="headline"
                label={
                  <span className="text-xs font-semibold text-gray-800">
                    <span className="text-red-500 mr-1">*</span>Professional Headline
                  </span>
                }
                rules={[{ required: true, whitespace: true, message: 'Please enter a headline' }]}
              >
                <Input
                  placeholder={
                    isFresher
                      ? 'e.g. Computer Science Graduate | Passionate about Full Stack Development | React, Python'
                      : 'e.g. Full Stack Developer | React | Node.js'
                  }
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24}>
              <Form.Item
                name="summary"
                label={
                  <span className="text-xs font-semibold text-gray-800">
                    <span className="text-red-500 mr-1">*</span>About Me / Professional Summary
                  </span>
                }
                rules={[
                  { required: true, message: 'Please write a brief summary' },
                  { max: 500, message: 'Summary cannot exceed 500 characters' },
                ]}
              >
                <TextArea
                  rows={4}
                  showCount
                  maxLength={500}
                  className="rounded-xl text-sm"
                  placeholder={
                    isFresher
                      ? 'e.g. Enthusiastic Computer Science graduate with strong foundational knowledge in web technologies and hands-on project experience. Eager to contribute and grow in a dynamic tech team...'
                      : 'e.g. I am a software engineer with 3+ years of experience building scalable web applications...'
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Bottom Action Bar */}
      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />
    </div>
  );
};

export default ProfessionalDetailsStep;
