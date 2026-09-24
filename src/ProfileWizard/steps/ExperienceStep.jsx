import React, { useState, useEffect } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import StepHeaderIllustration from '../StepHeaderIllustration';
import { Form, Input, Select, Button, DatePicker, Checkbox, Row, Col, message, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { insertExperience, updateExperience, deleteExperience, updateBasicDetails } from '../../ApiService/action';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ExperienceStep = () => {
  const { profileData, updateProfileField, setCurrentStep } = useProfile();
  const initialIsFresher =
    profileData.experience.isFresher === true ||
    profileData.professional.careerLevel === 'Fresher' ||
    profileData.professional.totalExperience === '0 years' ||
    profileData.professional.totalExperience === 'Fresher (0 Years)';

  const [isFresher, setIsFresher] = useState(initialIsFresher);
  const [experiences, setExperiences] = useState(profileData.experience.list || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isF =
      profileData.experience.isFresher === true ||
      profileData.professional.careerLevel === 'Fresher';
    setIsFresher(isF);
    setExperiences(profileData.experience.list || []);
  }, [profileData.experience, profileData.professional.careerLevel]);

  const handleFresherToggle = async (val) => {
    setIsFresher(val);
    updateProfileField('experience', 'isFresher', val);

    if (val) {
      updateProfileField('professional', 'careerLevel', 'Fresher');
      updateProfileField('professional', 'totalExperience', '0 years');
    }

    try {
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');
      await updateBasicDetails({
        is_fresher: val,
        experince_type: val ? 'Fresher' : 'Experience',
        user_id: userId
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setCurrentlyWorking(false);
    form.resetFields();
    if (isFresher) {
      form.setFieldsValue({
        employmentType: 'Internship'
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    const exp = experiences[index];
    setEditingIndex(index);
    setCurrentlyWorking(exp.currentlyWorking || false);

    form.setFieldsValue({
      jobTitle: exp.job_title || exp.jobTitle,
      company: exp.company_name || exp.company,
      employmentType: exp.employment_type || exp.employmentType,
      startDate: exp.start_date || exp.startDate ? dayjs(exp.start_date || exp.startDate) : null,
      endDate: exp.end_date || exp.endDate ? dayjs(exp.end_date || exp.endDate) : null,
      currentlyWorking: exp.currentlyWorking || false,
      location: exp.location,
      description: exp.description || exp.jobDescription,
      skills: exp.skills,
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (index) => {
    const exp = experiences[index];
    try {
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');
      if (exp.id || exp._id) {
        await deleteExperience({ id: exp.id || exp._id, user_id: userId });
      }
      const newList = [...experiences];
      newList.splice(index, 1);
      setExperiences(newList);
      updateProfileField('experience', 'list', newList);
      message.success(isFresher ? 'Internship/project removed' : 'Experience removed');
    } catch (error) {
      message.error('Failed to remove entry');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const expData = {
        job_title: values.jobTitle,
        company_name: values.company,
        designation: values.employmentType,
        start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        end_date: values.currentlyWorking ? null : (values.endDate ? values.endDate.format('YYYY-MM-DD') : null),
        currently_working: values.currentlyWorking ? 1 : 0,
        location: values.location,
        description: values.description,
        skills: values.skills || []
      };

      if (editingIndex !== null) {
        const currentExp = experiences[editingIndex];
        const updatePayload = {
          ...expData,
          user_id: userId,
          id: currentExp.id || currentExp._id
        };

        if (updatePayload.id) {
          await updateExperience(updatePayload);
        }

        const newList = [...experiences];
        newList[editingIndex] = { ...currentExp, ...expData, id: updatePayload.id };
        setExperiences(newList);
        updateProfileField('experience', 'list', newList);
        message.success(isFresher ? 'Internship/project updated' : 'Experience updated');
      } else {
        const insertPayload = {
          user_id: userId,
          experiences: [expData]
        };
        const res = await insertExperience(insertPayload);
        const insertedId = res?.data?.id || Math.random().toString();
        const newList = [...experiences, { ...expData, id: insertedId }];
        setExperiences(newList);
        updateProfileField('experience', 'list', newList);
        message.success(isFresher ? 'Internship/project added' : 'Experience added');
      }

      setIsModalOpen(false);
      setLoading(false);
    } catch (error) {
      console.error('Validation failed:', error);
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    return true;
  };

  const handleSkipToEducation = () => {
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            STEP 3 OF 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            {isFresher ? 'Add your internships or projects' : 'Tell us about your experience'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            {isFresher
              ? 'Showcase any internships, freelance gigs, or major college projects (Optional for freshers).'
              : 'Add your current and previous work experience to highlight your career journey.'}
          </p>
        </div>
        <StepHeaderIllustration />
      </div>

      {/* Main Step White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">
        {/* Subtle Status Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isFresher ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5FF] text-[#6B21A8] border border-purple-200">
                <span>🎓</span> Fresher Track
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                <span>💼</span> Experienced Track
              </span>
            )}
            <span className="text-xs text-gray-400">
              {isFresher ? 'Work experience is optional' : 'Add your work history'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleFresherToggle(!isFresher)}
            className="text-xs text-[#6B21A8] hover:text-[#581C87] font-semibold underline transition-colors text-left sm:text-right"
          >
            {isFresher
              ? 'Have full-time experience? Switch to experienced track'
              : 'Applying as a fresher? Switch to fresher track'}
          </button>
        </div>

        {/* Fresher View */}
        {isFresher ? (
          <div>
            {experiences.length === 0 ? (
              <div className="bg-gradient-to-br from-[#FAF5FF] to-white p-8 rounded-2xl text-center border border-purple-200">
                <div className="w-14 h-14 rounded-2xl bg-purple-100/70 text-[#6B21A8] shadow-xs flex items-center justify-center mx-auto mb-3.5 text-3xl">
                  🎓
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  No work experience? No problem!
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                  As a fresher, full-time experience is not required. You can add any <strong>internships</strong>, <strong>freelance work</strong>, or <strong>academic projects</strong> to give yourself an edge, or skip straight to Education.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="px-4 py-2.5 rounded-xl bg-white border-2 border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50 font-medium text-sm inline-flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <PlusOutlined />
                    <span>Add Internship or Project (Optional)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipToEducation}
                    className="px-4 py-2.5 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-medium text-sm inline-flex items-center gap-2 transition-all shadow-xs"
                  >
                    <span>Skip to Education</span>
                    <ArrowRightOutlined className="text-[10px]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-0">
                    Your Internships & Projects ({experiences.length})
                  </p>
                  <button
                    type="button"
                    onClick={handleSkipToEducation}
                    className="text-xs font-semibold text-[#6B21A8] hover:underline flex items-center gap-1"
                  >
                    <span>Continue to Education</span>
                    <ArrowRightOutlined className="text-[10px]" />
                  </button>
                </div>

                {experiences.map((exp, index) => (
                  <div key={index} className="border border-gray-100 rounded-2xl p-5 hover:border-purple-200 transition-colors bg-white shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 mb-0">{exp.job_title || exp.jobTitle}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#6B21A8] border border-purple-100">
                            {exp.employment_type || exp.employmentType || 'Project'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-1 mb-0">
                          {exp.company_name || exp.company} {exp.location && `· ${exp.location}`}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 mb-0">
                          {exp.start_date ? dayjs(exp.start_date).format('MMM YYYY') : exp.startDate ? dayjs(exp.startDate).format('MMM YYYY') : ''} – {' '}
                          {exp.currentlyWorking || (!exp.end_date && !exp.endDate) ? 'Present / Ongoing' : (exp.end_date ? dayjs(exp.end_date).format('MMM YYYY') : dayjs(exp.endDate).format('MMM YYYY'))}
                        </p>
                        {(exp.skills || exp.description) && (
                          <div className="mt-2.5">
                            {exp.skills && <p className="text-xs text-[#6B21A8] font-medium mb-0.5">{exp.skills}</p>}
                            {exp.description && <p className="text-xs text-gray-500 line-clamp-2">{exp.description}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="text"
                          icon={<EditOutlined className="text-gray-500 hover:text-[#6B21A8]" />}
                          onClick={() => openEditModal(index)}
                        />
                        <Popconfirm
                          title="Remove entry"
                          description="Are you sure you want to remove this?"
                          onConfirm={() => handleDelete(index)}
                          okText="Yes"
                          cancelText="No"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            icon={<DeleteOutlined className="text-gray-400 hover:text-red-500" />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={openAddModal}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-200 hover:border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50/30 text-xs font-bold transition-all flex items-center justify-center gap-2 mt-3"
                >
                  <PlusOutlined />
                  <span>Add Another Internship / Project</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Experienced View */
          <div>
            {experiences.length === 0 ? (
              <div className="text-center py-10 bg-[#F8F9FE] rounded-2xl border border-dashed border-purple-200 p-8">
                <p className="text-xs text-gray-500 mb-4">You haven't added any work experience yet.</p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50 font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-xs"
                >
                  <PlusOutlined />
                  <span>Add Experience</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp, index) => (
                  <div key={index} className="border border-gray-100 rounded-2xl p-4 hover:border-purple-200 transition-colors bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-0">{exp.job_title || exp.jobTitle}</h3>
                        <p className="text-xs text-gray-600 font-medium mt-0.5 mb-0">
                          {exp.company_name || exp.company} {exp.location && `· ${exp.location}`}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 mb-0">
                          {exp.start_date ? dayjs(exp.start_date).format('MMM YYYY') : exp.startDate ? dayjs(exp.startDate).format('MMM YYYY') : ''} – {' '}
                          {exp.currentlyWorking || (!exp.end_date && !exp.endDate) ? 'Present' : (exp.end_date ? dayjs(exp.end_date).format('MMM YYYY') : dayjs(exp.endDate).format('MMM YYYY'))}
                        </p>

                        {(exp.skills || exp.description) && (
                          <div className="mt-3">
                            {exp.skills && <p className="text-xs text-[#6B21A8] font-medium mb-1">{exp.skills}</p>}
                            {exp.description && <p className="text-xs text-gray-500 line-clamp-2">{exp.description}</p>}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          type="text"
                          icon={<EditOutlined className="text-gray-500 hover:text-[#6B21A8]" />}
                          onClick={() => openEditModal(index)}
                        />
                        <Popconfirm
                          title="Remove experience"
                          description="Are you sure you want to remove this experience?"
                          onConfirm={() => handleDelete(index)}
                          okText="Yes"
                          cancelText="No"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            icon={<DeleteOutlined className="text-gray-400 hover:text-red-500" />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={openAddModal}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-200 hover:border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50/30 text-xs font-bold transition-all flex items-center justify-center gap-2 mt-3"
                >
                  <PlusOutlined />
                  <span>Add Another Experience</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />

      {/* Modal */}
      <Modal
        title={
          editingIndex !== null
            ? (isFresher ? "Edit Internship / Project" : "Edit Experience")
            : (isFresher ? "Add Internship / Project" : "Add Experience")
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={680}
        wrapClassName="profile-wizard-scope profile-wizard-modal"
        confirmLoading={loading}
        okText={isFresher ? "Save Entry" : "Save Experience"}
        okButtonProps={{ className: "bg-[#F95721] hover:bg-[#F95721] rounded-xl font-medium" }}
        cancelButtonProps={{ className: "rounded-xl font-medium" }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="jobTitle"
                label={
                  <span className="text-xs font-semibold text-gray-800">
                    {isFresher ? 'Role / Project Title' : 'Job Title'}
                  </span>
                }
                rules={[{ required: true, message: isFresher ? 'Please enter role or project title' : 'Please enter job title' }]}
              >
                <Input
                  placeholder={isFresher ? "e.g. Web Development Intern, Capstone Project Lead" : "e.g. Full Stack Developer"}
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="company"
                label={
                  <span className="text-xs font-semibold text-gray-800">
                    {isFresher ? 'Company / College / Organization' : 'Company Name'}
                  </span>
                }
                rules={[{ required: true, message: isFresher ? 'Please enter organization or college' : 'Please enter company name' }]}
              >
                <Input
                  placeholder={isFresher ? "e.g. Acme Tech Solutions, College Research Lab" : "e.g. ABC Technologies"}
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="employmentType"
                label={
                  <span className="text-xs font-semibold text-gray-800">
                    {isFresher ? 'Project / Work Type' : 'Employment Type'}
                  </span>
                }
              >
                <Select
                  placeholder="Select type"
                  className="h-11 w-full rounded-xl text-sm"
                >
                  {isFresher ? (
                    <>
                      <Option value="Internship">Internship</Option>
                      <Option value="Academic Project">Academic Project</Option>
                      <Option value="Freelance">Freelance</Option>
                      <Option value="Volunteer">Volunteer</Option>
                      <Option value="Part Time">Part Time</Option>
                    </>
                  ) : (
                    <>
                      <Option value="Full Time">Full Time</Option>
                      <Option value="Part Time">Part Time</Option>
                      <Option value="Contract">Contract</Option>
                      <Option value="Internship">Internship</Option>
                      <Option value="Freelance">Freelance</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="location" label={<span className="text-xs font-semibold text-gray-800">Location</span>}>
                <Input placeholder="e.g. Chennai, Remote" className="h-11 rounded-xl text-sm border-gray-200" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="startDate" label={<span className="text-xs font-semibold text-gray-800">Start Date</span>} rules={[{ required: true, message: 'Please select start date' }]}>
                <DatePicker className="h-11 w-full rounded-xl text-sm border-gray-200" format="YYYY-MM" picker="month" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="endDate" label={<span className="text-xs font-semibold text-gray-800">End Date</span>} rules={[{ required: !currentlyWorking, message: 'Please select end date' }]}>
                <DatePicker
                  className="h-11 w-full rounded-xl text-sm border-gray-200"
                  format="YYYY-MM"
                  picker="month"
                  disabled={currentlyWorking}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="currentlyWorking" valuePropName="checked" className="mb-4 -mt-2">
            <Checkbox onChange={(e) => setCurrentlyWorking(e.target.checked)}>
              <span className="text-xs text-gray-600">
                {isFresher ? 'This project or internship is currently ongoing' : 'I am currently working here'}
              </span>
            </Checkbox>
          </Form.Item>

          <Form.Item name="skills" label={<span className="text-xs font-semibold text-gray-800">Key Skills Used</span>}>
            <Input placeholder="e.g. React, Node.js, MongoDB" className="h-11 rounded-xl text-sm border-gray-200" />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="text-xs font-semibold text-gray-800">
                {isFresher ? 'Project / Internship Summary' : 'Job Description'}
              </span>
            }
          >
            <TextArea
              rows={4}
              placeholder={
                isFresher
                  ? "Describe what you built, technologies used, and outcomes achieved..."
                  : "Describe your responsibilities and achievements..."
              }
              className="rounded-xl border-gray-200 text-sm"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExperienceStep;
