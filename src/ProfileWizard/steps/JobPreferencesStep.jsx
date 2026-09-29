import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import StepHeaderIllustration from '../StepHeaderIllustration';
import { Form, Select, Input, Radio, message, Row, Col, Spin } from 'antd';
import { DollarOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons';
import { updateBasicDetails } from '../../ApiService/action';
import {
  fetchWorldwideJobRoles,
  fetchWorldwideLocations,
  getInitialJobRoles,
  getInitialLocations,
} from '../../Common/worldwideDataService';

const { Option } = Select;

const JobPreferencesStep = () => {
  const { profileData, updateProfileSection } = useProfile();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  // Worldwide options state
  const [roleOptions, setRoleOptions] = useState(getInitialJobRoles);
  const [locationOptions, setLocationOptions] = useState(getInitialLocations);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const roleSearchTimer = useRef(null);
  const locationSearchTimer = useRef(null);

  const isInitializedRef = useRef(false);

  useEffect(() => {
    const savedRoles = profileData.jobPreferences.preferredRoles || [];
    const savedLocations = profileData.jobPreferences.preferredLocations || [];

    // Ensure saved items exist in options
    if (savedRoles.length > 0) {
      setRoleOptions(prev => [...new Set([...savedRoles, ...prev])]);
    }
    if (savedLocations.length > 0) {
      setLocationOptions(prev => [...new Set([...savedLocations, ...prev])]);
    }

    if (isInitializedRef.current && form.isFieldsTouched()) {
      return;
    }

    const currentValues = form.getFieldsValue();
    form.setFieldsValue({
      preferredRoles: (currentValues.preferredRoles && currentValues.preferredRoles.length > 0) ? currentValues.preferredRoles : savedRoles,
      preferredLocations: (currentValues.preferredLocations && currentValues.preferredLocations.length > 0) ? currentValues.preferredLocations : savedLocations,
      workMode: (currentValues.workMode && currentValues.workMode.length > 0) ? currentValues.workMode : (profileData.jobPreferences.workMode || []),
      jobType: (currentValues.jobType && currentValues.jobType.length > 0) ? currentValues.jobType : (profileData.jobPreferences.jobType || []),
      expectedSalary: currentValues.expectedSalary !== undefined && currentValues.expectedSalary !== '' ? currentValues.expectedSalary : profileData.jobPreferences.expectedSalary,
      currentSalary: currentValues.currentSalary !== undefined && currentValues.currentSalary !== '' ? currentValues.currentSalary : profileData.jobPreferences.currentSalary,
      noticePeriod: currentValues.noticePeriod !== undefined ? currentValues.noticePeriod : profileData.jobPreferences.noticePeriod,
      relocation: currentValues.relocation !== undefined ? currentValues.relocation : profileData.jobPreferences.relocation,
    });

    if (savedRoles.length > 0 || savedLocations.length > 0 || profileData.jobPreferences.noticePeriod) {
      isInitializedRef.current = true;
    }
  }, [profileData.jobPreferences, form]);

  // Debounced search for worldwide job roles via third-party API
  const handleSearchRoles = useCallback((searchText) => {
    if (roleSearchTimer.current) clearTimeout(roleSearchTimer.current);

    if (!searchText || !searchText.trim()) {
      setRoleOptions(getInitialJobRoles());
      setLoadingRoles(false);
      return;
    }

    setLoadingRoles(true);
    roleSearchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchWorldwideJobRoles(searchText);
        const currentSelected = form.getFieldValue('preferredRoles') || [];
        // Preserve selected items in options
        setRoleOptions([...new Set([...currentSelected, ...results])]);
      } catch (err) {
        console.error('Error fetching job roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    }, 280);
  }, [form]);

  // Debounced search for worldwide locations via third-party API
  const handleSearchLocations = useCallback((searchText) => {
    if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);

    if (!searchText || !searchText.trim()) {
      setLocationOptions(getInitialLocations());
      setLoadingLocations(false);
      return;
    }

    setLoadingLocations(true);
    locationSearchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchWorldwideLocations(searchText);
        const currentSelected = form.getFieldValue('preferredLocations') || [];
        // Preserve selected items in options
        setLocationOptions([...new Set([...currentSelected, ...results])]);
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoadingLocations(false);
      }
    }, 280);
  }, [form]);

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      updateProfileSection('jobPreferences', values);

      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const payload = {
        preferred_roles: values.preferredRoles,
        preferred_locations: values.preferredLocations,
        work_mode: values.workMode,
        job_type: values.jobType,
        expected_salary: values.expectedSalary,
        current_salary: values.currentSalary,
        notice_period: values.noticePeriod,
        relocation: values.relocation,
        user_id: userId,
      };

      try {
        await updateBasicDetails(payload);
      } catch (err) {
        console.error("API error, but proceeding with state save", err);
      }

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            STEP 6 OF 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            What kind of job are you looking for?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            We'll use your preferences to recommend relevant jobs worldwide.
          </p>
        </div>
        <StepHeaderIllustration />
      </div>

      {/* Main White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">
        <Form form={form} layout="vertical" requiredMark={false} scrollToFirstError>

          <Row gutter={20}>
            <Col xs={24}>
              <Form.Item
                name="preferredRoles"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Preferred Job Roles
                    </span>
                  </div>
                }
                rules={[{ required: true, message: 'Please select at least one role' }]}
              >
                <Select
                  mode="tags"
                  showSearch
                  placeholder="Type to search worldwide roles (e.g. Full Stack Developer, AI Engineer)"
                  className="rounded-xl text-sm"
                  onSearch={handleSearchRoles}
                  filterOption={false}
                  loading={loadingRoles}
                  notFoundContent={
                    loadingRoles ? (
                      <div className="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Spin size="small" /> Searching worldwide job roles...
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-gray-400">
                        Type any custom job role & press Enter to add
                      </div>
                    )
                  }
                >
                  {roleOptions.map(role => (
                    <Option key={role} value={role}>{role}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24}>
              <Form.Item
                name="preferredLocations"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Preferred Locations
                    </span>
                  </div>
                }
                rules={[{ required: true, message: 'Please select at least one location' }]}
              >
                <Select
                  mode="tags"
                  showSearch
                  placeholder="Type to search worldwide locations (e.g. Bangalore, London, New York, Remote)"
                  className="rounded-xl text-sm"
                  onSearch={handleSearchLocations}
                  filterOption={false}
                  loading={loadingLocations}
                  notFoundContent={
                    loadingLocations ? (
                      <div className="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Spin size="small" /> Searching worldwide cities...
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-gray-400">
                        Type any city, state or country & press Enter to add
                      </div>
                    )
                  }
                >
                  {locationOptions.map(loc => (
                    <Option key={loc} value={loc}>{loc}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>


          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="workMode"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Work Mode</span>}
                rules={[{ required: true, message: 'Please select preferred work mode' }]}
              >
                <Select mode="multiple" className="rounded-xl text-sm" placeholder="Select work mode">
                  <Option value="On-site">On-site</Option>
                  <Option value="Hybrid">Hybrid</Option>
                  <Option value="Remote">Remote</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="jobType"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Job Type</span>}
                rules={[{ required: true, message: 'Please select job type' }]}
              >
                <Select mode="multiple" className="rounded-xl text-sm" placeholder="Select job type">
                  <Option value="Full Time">Full Time</Option>
                  <Option value="Part Time">Part Time</Option>
                  <Option value="Contract">Contract</Option>
                  <Option value="Internship">Internship</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expectedSalary"
                label={<span className="text-xs font-semibold text-gray-800">Expected Salary (₹) <span className="text-gray-400 font-normal">(Optional)</span></span>}
              >
                <Input
                  prefix={<DollarOutlined className="text-gray-400 mr-1.5" />}
                  placeholder="e.g. 15 LPA"
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
              <p className="text-[11px] text-gray-400 -mt-4 mb-4">Only used for matching. Not shown to recruiters unless you share it.</p>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="currentSalary"
                label={<span className="text-xs font-semibold text-gray-800">Current Salary (₹) <span className="text-gray-400 font-normal">(Optional)</span></span>}
              >
                <Input
                  prefix={<DollarOutlined className="text-gray-400 mr-1.5" />}
                  placeholder="e.g. 10 LPA"
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
              <p className="text-[11px] text-gray-400 -mt-4 mb-4">Confidential. Helps us recommend better salary matches.</p>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="noticePeriod"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Notice Period</span>}
                rules={[{ required: true, message: 'Please select your notice period' }]}
              >
                <Select className="h-11 rounded-xl text-sm" placeholder="Select notice period">
                  <Option value="Immediate">Immediate</Option>
                  <Option value="15 Days">15 Days</Option>
                  <Option value="30 Days">30 Days</Option>
                  <Option value="60 Days">60 Days</Option>
                  <Option value="90 Days">90 Days</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24}>
              <Form.Item
                name="relocation"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Are you willing to relocate?</span>}
                rules={[{ required: true, message: 'Please select an option' }]}
              >
                <div className="flex gap-3">
                  <Form.Item name="relocation" noStyle>
                    <Radio.Group className="flex gap-3">
                      <Radio.Button value="Yes" className="px-5 py-2 rounded-xl border-gray-200 text-xs font-bold h-auto leading-normal">Yes</Radio.Button>
                      <Radio.Button value="No" className="px-5 py-2 rounded-xl border-gray-200 text-xs font-bold h-auto leading-normal">No</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </div>

      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />
    </div>
  );
};

export default JobPreferencesStep;
