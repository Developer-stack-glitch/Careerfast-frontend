import React, { useState, useEffect } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import StepHeaderIllustration from '../StepHeaderIllustration';
import { Form, Input, Select, Button, message, Modal, Row, Col, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { insertEducation, updateEducation, deleteEducation } from '../../ApiService/action';
import dayjs from 'dayjs';

const { Option } = Select;

const EducationStep = () => {
  const { profileData, updateProfileField } = useProfile();
  const [educationList, setEducationList] = useState(profileData.education || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form] = Form.useForm();
  const selectedLevel = Form.useWatch('level', form);
  const is10th = selectedLevel === '10th';
  const is12th = selectedLevel === '12th';
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEducationList(profileData.education || []);
  }, [profileData.education]);

  const openAddModal = () => {
    setEditingIndex(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    const edu = educationList[index];
    setEditingIndex(index);
    const startY = edu.start_year || edu.startYear;
    const endY = edu.end_year || edu.endYear;
    form.setFieldsValue({
      level: edu.education_level || edu.level,
      degree: edu.degree_name || edu.degree,
      specialization: edu.specialization,
      institution: edu.institute_name || edu.institution,
      university: edu.university_name || edu.university,
      startYear: startY ? dayjs().year(parseInt(startY, 10)) : null,
      endYear: endY ? dayjs().year(parseInt(endY, 10)) : null,
      percentage: edu.percentage_cgpa || edu.percentage,
      location: edu.location,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (index) => {
    const edu = educationList[index];
    try {
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');
      if (edu.id || edu._id) {
        await deleteEducation({ id: edu.id || edu._id, user_id: userId });
      }
      const newList = [...educationList];
      newList.splice(index, 1);
      setEducationList(newList);
      updateProfileField('education', '', newList);
      message.success('Education removed');
    } catch (error) {
      message.error('Failed to remove education');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const isTenth = values.level === '10th';
      const isTwelfth = values.level === '12th';

      const degreeName = isTenth
        ? '10th Standard'
        : isTwelfth
          ? (values.degree || '12th Standard')
          : values.degree;

      const startYearVal = values.startYear
        ? values.startYear.year().toString()
        : values.endYear
          ? (isTwelfth ? (values.endYear.year() - 2).toString() : (values.endYear.year() - 1).toString())
          : null;

      const payload = {
        qualification: values.level,
        education_level: values.level,
        course: degreeName,
        degree_name: degreeName,
        specialization: isTenth ? '' : (values.specialization || ''),
        college: values.institution,
        institute_name: values.institution,
        university_name: values.university,
        start_date: startYearVal,
        start_year: startYearVal,
        end_date: values.endYear ? values.endYear.year().toString() : null,
        end_year: values.endYear ? values.endYear.year().toString() : null,
        percentage: values.percentage,
        percentage_cgpa: values.percentage,
        location: values.location,
        user_id: userId
      };

      if (editingIndex !== null) {
        const currentEdu = educationList[editingIndex];
        payload.id = currentEdu.id || currentEdu._id;

        if (payload.id) {
          await updateEducation(payload);
        }

        const newList = [...educationList];
        newList[editingIndex] = { ...currentEdu, ...payload };
        setEducationList(newList);
        updateProfileField('education', '', newList);
        message.success('Education updated');
      } else {
        const res = await insertEducation(payload);
        const insertedId = res?.data?.id || Math.random().toString();
        const newList = [...educationList, { ...payload, id: insertedId }];
        setEducationList(newList);
        updateProfileField('education', '', newList);
        message.success('Education added');
      }

      setIsModalOpen(false);
      setLoading(false);
    } catch (error) {
      console.error('Validation failed:', error);
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    return true; // Education can be optional
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            STEP 4 OF 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Add your education
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            Help recruiters understand your academic background.
          </p>
        </div>
        <StepHeaderIllustration />
      </div>

      {/* Main White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">
        {educationList.length === 0 ? (
          <div className="text-center py-10 bg-[#F8F9FE] rounded-2xl border border-dashed border-purple-200 p-8">
            <p className="text-xs text-gray-500 mb-4">You haven't added any education details yet.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-white border border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50 font-bold text-xs inline-flex items-center gap-2 transition-colors"
            >
              <PlusOutlined />
              <span>Add Education</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {educationList.map((edu, index) => (
              <div key={index} className="border border-gray-100 rounded-2xl p-4 hover:border-purple-200 transition-colors bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-0">
                      {edu.education_level === '10th'
                        ? '10th Standard'
                        : edu.education_level === '12th'
                          ? `12th Standard ${edu.specialization ? `(${edu.specialization})` : ''}`
                          : `${edu.degree_name || edu.degree || edu.education_level || 'Degree'} ${edu.specialization ? `in ${edu.specialization}` : ''}`}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mt-0.5 mb-0">
                      {edu.institute_name || edu.institution}
                      {(edu.university_name || edu.university) && ` • ${edu.university_name || edu.university}`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 mb-0">
                      {edu.education_level === '10th' || edu.education_level === '12th'
                        ? (edu.end_year || edu.endYear ? `Passing Year: ${edu.end_year || edu.endYear}` : '')
                        : (edu.start_year || edu.startYear || edu.end_year || edu.endYear)
                          ? `${edu.start_year || edu.startYear || ''} – ${edu.end_year || edu.endYear || ''}`
                          : ''}
                    </p>
                    {(edu.percentage_cgpa || edu.percentage) && (
                      <p className="text-xs text-[#6B21A8] font-medium mt-2 mb-0">
                        Score: {edu.percentage_cgpa || edu.percentage}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      type="text"
                      icon={<EditOutlined className="text-gray-500 hover:text-[#6B21A8]" />}
                      onClick={() => openEditModal(index)}
                    />
                    <Popconfirm
                      title="Remove education"
                      description="Are you sure you want to remove this education record?"
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
              <span>Add Another Education</span>
            </button>
          </div>
        )}
      </div>

      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />

      {/* Modal */}
      <Modal
        title={editingIndex !== null ? "Edit Education" : "Add Education"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={680}
        wrapClassName="profile-wizard-scope profile-wizard-modal"
        confirmLoading={loading}
        okText="Save Education"
        okButtonProps={{ className: "bg-[#F95721] hover:bg-[#F95721] rounded-xl font-medium" }}
        cancelButtonProps={{ className: "rounded-xl font-medium" }}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          onValuesChange={(changedValues) => {
            if (changedValues.level === '10th') {
              form.setFieldsValue({
                degree: '10th Standard',
                specialization: undefined,
                startYear: undefined,
              });
            } else if (changedValues.level === '12th') {
              form.setFieldsValue({
                degree: '12th Standard',
                startYear: undefined,
              });
            }
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="level" label={<span className="text-xs font-semibold text-gray-800">Education Level</span>} rules={[{ required: true, message: 'Please select education level' }]}>
                <Select placeholder="Select level" className="h-11 w-full rounded-xl text-sm">
                  <Option value="10th">10th</Option>
                  <Option value="12th">12th</Option>
                  <Option value="Diploma">Diploma</Option>
                  <Option value="Undergraduate">Undergraduate</Option>
                  <Option value="Postgraduate">Postgraduate</Option>
                  <Option value="Doctorate">Doctorate</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            {is10th ? (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="university"
                  label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>Board</span>}
                  rules={[{ required: true, message: 'Please enter board' }]}
                >
                  <Input placeholder="e.g. CBSE, ICSE, State Board" className="h-11 rounded-xl text-sm border-gray-200" />
                </Form.Item>
              </Col>
            ) : is12th ? (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="university"
                  label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>Board</span>}
                  rules={[{ required: true, message: 'Please enter board' }]}
                >
                  <Input placeholder="e.g. CBSE, ISC, State Board" className="h-11 rounded-xl text-sm border-gray-200" />
                </Form.Item>
              </Col>
            ) : (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="degree"
                  label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>Degree</span>}
                  rules={[{ required: true, message: 'Please enter degree' }]}
                >
                  <Input placeholder="e.g. B.Tech, B.Sc" className="h-11 rounded-xl text-sm border-gray-200" />
                </Form.Item>
              </Col>
            )}
          </Row>

          {is10th ? (
            <>
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="institution"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>School Name</span>}
                    rules={[{ required: true, message: 'Please enter school name' }]}
                  >
                    <Input placeholder="e.g. Delhi Public School, St. Xavier's High School" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="endYear"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>Passing Year</span>}
                    rules={[{ required: true, message: 'Please select passing year' }]}
                  >
                    <DatePicker picker="year" placeholder="Select passing year" className="h-11 w-full rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="percentage"
                    label={<span className="text-xs font-semibold text-gray-800">Percentage / CGPA</span>}
                  >
                    <Input placeholder="e.g. 85% or 8.5 CGPA" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="location"
                    label={<span className="text-xs font-semibold text-gray-800">School Location</span>}
                  >
                    <Input placeholder="e.g. Chennai, Mumbai" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : is12th ? (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="institution"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>School / Junior College</span>}
                    rules={[{ required: true, message: 'Please enter school/college name' }]}
                  >
                    <Input placeholder="e.g. Delhi Public School, Junior College" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="specialization"
                    label={<span className="text-xs font-semibold text-gray-800">Stream / Specialization</span>}
                  >
                    <Input placeholder="e.g. Science (PCM), Commerce, Arts" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="endYear"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Passing Year</span>}
                    rules={[{ required: true, message: 'Please select passing year' }]}
                  >
                    <DatePicker picker="year" placeholder="Select passing year" className="h-11 w-full rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="percentage"
                    label={<span className="text-xs font-semibold text-gray-800">Percentage / CGPA</span>}
                  >
                    <Input placeholder="e.g. 85% or 8.5 CGPA" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="location"
                    label={<span className="text-xs font-semibold text-gray-800">Location</span>}
                  >
                    <Input placeholder="e.g. Chennai, Mumbai" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="specialization" label={<span className="text-xs font-semibold text-gray-800">Specialization</span>}>
                    <Input placeholder="e.g. Computer Science" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="institution"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>Institution / College</span>}
                    rules={[{ required: true, message: 'Please enter institution name' }]}
                  >
                    <Input placeholder="e.g. XYZ College" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item name="university" label={<span className="text-xs font-semibold text-gray-800">University / Board</span>}>
                    <Input placeholder="e.g. Anna University" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="startYear"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>Start Year</span>}
                    rules={[{ required: true, message: 'Please select start year' }]}
                  >
                    <DatePicker picker="year" placeholder="Select start year" className="h-11 w-full rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="endYear"
                    label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1"></span>End Year</span>}
                    rules={[{ required: true, message: 'Please select end year' }]}
                  >
                    <DatePicker picker="year" placeholder="Select end year" className="h-11 w-full rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="percentage" label={<span className="text-xs font-semibold text-gray-800">Percentage / CGPA</span>}>
                    <Input placeholder="e.g. 85% or 8.5" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="location" label={<span className="text-xs font-semibold text-gray-800">Location</span>}>
                    <Input placeholder="e.g. Chennai" className="h-11 rounded-xl text-sm border-gray-200" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default EducationStep;
