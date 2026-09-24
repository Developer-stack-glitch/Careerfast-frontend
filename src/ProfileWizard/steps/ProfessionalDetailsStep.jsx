import React, { useState, useEffect } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import { Form, Input, Select, Row, Col } from 'antd';
import { updateBasicDetails, updateAbout } from '../../ApiService/action';

const { Option } = Select;
const { TextArea } = Input;

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

  useEffect(() => {
    const isF =
      profileData.experience.isFresher === true ||
      profileData.professional.careerLevel === 'Fresher';
    setIsFresher(isF);

    form.setFieldsValue({
      jobTitle: profileData.professional.jobTitle || '',
      totalExperience: isF
        ? 'Fresher (0 Years)'
        : profileData.professional.totalExperience || '',
      careerLevel: isF
        ? 'Fresher'
        : profileData.professional.careerLevel || undefined,
      headline: profileData.professional.headline || '',
      summary: profileData.professional.summary || '',
    });
  }, [profileData.professional, profileData.experience.isFresher, form]);

  const handleStatusChange = (status) => {
    setIsFresher(status);
    updateProfileField('experience', 'isFresher', status);

    if (status) {
      form.setFieldsValue({
        totalExperience: 'Fresher (0 Years)',
        careerLevel: 'Fresher',
      });
    } else {
      const prevExp = profileData.professional.totalExperience;
      const prevLevel = profileData.professional.careerLevel;
      form.setFieldsValue({
        totalExperience:
          prevExp && prevExp !== 'Fresher (0 Years)' && prevExp !== '0 years'
            ? prevExp
            : '',
        careerLevel:
          prevLevel && prevLevel !== 'Fresher' ? prevLevel : undefined,
      });
    }
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      const effectiveCareerLevel = isFresher ? 'Fresher' : values.careerLevel;
      const effectiveExperience = isFresher ? '0 years' : values.totalExperience;

      updateProfileSection('professional', {
        ...values,
        careerLevel: effectiveCareerLevel,
        totalExperience: effectiveExperience,
      });
      updateProfileField('experience', 'isFresher', isFresher);

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
            <Col xs={24} sm={isFresher ? 24 : 12}>
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
                <Input
                  placeholder={
                    isFresher
                      ? 'e.g. Software Engineer, Junior Frontend Developer, QA Trainee'
                      : 'e.g. Full Stack Developer'
                  }
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>

            {!isFresher && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="totalExperience"
                  label={
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Total Experience
                    </span>
                  }
                  rules={[{ required: true, whitespace: true, message: 'Please enter total experience' }]}
                >
                  <Input
                    placeholder="e.g. 3 years 2 months"
                    className="h-11 rounded-xl text-sm border-gray-200"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          {!isFresher && (
            <Row gutter={20}>
              <Col xs={24}>
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
