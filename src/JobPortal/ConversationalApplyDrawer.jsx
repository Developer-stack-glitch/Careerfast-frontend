'use client';
import React, { useState, useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaCheckCircle, FaFilePdf } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { CommonToaster } from '../Common/CommonToaster';
import { applyForJob, updateResume } from '../ApiService/action';
import '../css/conversational-apply-drawer.css';

export default function ConversationalApplyDrawer({
  open,
  onClose,
  job,
  userId,
  userResume,
  onApplySuccess,
  onUploadResumeSuccess
}) {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('init'); // 'questions' | 'resume' | 'ready'
  const [employerAnswers, setEmployerAnswers] = useState({});
  const [currentEmployerQIndex, setCurrentEmployerQIndex] = useState(0);
  const [employerAnswerInput, setEmployerAnswerInput] = useState('');
  const [selectedMultiOptions, setSelectedMultiOptions] = useState([]);
  const [resumeActionTaken, setResumeActionTaken] = useState(false);

  // Edit previous answer state
  const [editingQIndex, setEditingQIndex] = useState(null);
  const [editAnswerInput, setEditAnswerInput] = useState('');
  const [editSelectedMulti, setEditSelectedMulti] = useState([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Normalize recruiter's dynamic questions from job post
  const rawQuestions = job?.questions_with_ids || job?.questions || [];
  const employerQuestions = rawQuestions
    .map((q, idx) => {
      let opts = [];
      if (q?.options) {
        opts = Array.isArray(q.options)
          ? q.options
          : (typeof q.options === 'string' ? JSON.parse(q.options) : []);
      }
      return {
        id: q?.id || idx + 1,
        question: typeof q === 'string' ? q : q?.question || '',
        isrequired: Boolean(q?.isrequired),
        type: q?.type || q?.question_type || 'Short answer',
        options: (opts || []).filter((opt) => opt !== null && opt !== undefined && String(opt).trim() !== '')
      };
    })
    .filter((q) => q.question && q.question.trim().length > 0);

  const hasExistingResume = Boolean(
    userResume &&
    userResume !== 'null' &&
    userResume !== 'undefined' &&
    userResume !== '#' &&
    userResume.trim() !== ''
  );

  // Auto-scroll chat body
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, currentStep]);

  // Initialize conversation when drawer opens
  useEffect(() => {
    if (open) {
      setEmployerAnswers({});
      setCurrentEmployerQIndex(0);
      setEmployerAnswerInput('');
      setSelectedMultiOptions([]);
      setEditingQIndex(null);
      setEditAnswerInput('');
      setEditSelectedMulti([]);
      setResumeActionTaken(hasExistingResume);
      setIsUploading(false);
      setIsSubmitting(false);

      if (employerQuestions.length > 0) {
        // Start with recruiter's dynamic questions
        setCurrentStep('questions');
        const firstQ = employerQuestions[0];
        setMessages([
          {
            id: 'q-emp-0',
            sender: 'bot',
            text: firstQ.question,
            isrequired: firstQ.isrequired,
            qIndex: 0,
            isEmployerQ: true
          }
        ]);
      } else {
        // No recruiter questions: directly show "Please upload your resume."
        setCurrentStep('resume');
        setMessages([
          {
            id: 'q-resume',
            sender: 'bot',
            text: 'Please upload your resume.',
            isResumePrompt: true
          }
        ]);
      }
    }
  }, [open, job?.id, userResume]);

  if (!open) return null;

  // Handle Recruiter Screening Question Answer
  const handleEmployerAnswer = (answerText, isSkipped = false) => {
    const qObj = employerQuestions[currentEmployerQIndex];
    if (!qObj) return;

    if (qObj.isrequired && !isSkipped && (!answerText || !answerText.trim())) {
      CommonToaster('This question is required by the recruiter.', 'warning');
      return;
    }

    const recordedText = isSkipped ? 'Skipped' : answerText.trim();
    setEmployerAnswers((prev) => ({
      ...prev,
      [currentEmployerQIndex]: isSkipped ? '' : answerText.trim()
    }));

    // Post candidate bubble on right
    setMessages((prev) => [
      ...prev,
      {
        id: `ans-emp-${currentEmployerQIndex}-${Date.now()}`,
        sender: 'user',
        text: isSkipped ? 'Skip this question' : recordedText,
        isEmployerQAnswer: true,
        qIndex: currentEmployerQIndex
      }
    ]);
    setEmployerAnswerInput('');

    const nextQIndex = currentEmployerQIndex + 1;
    if (nextQIndex < employerQuestions.length) {
      // Ask next dynamic question
      setCurrentEmployerQIndex(nextQIndex);
      setSelectedMultiOptions([]);
      setEmployerAnswerInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const nextQ = employerQuestions[nextQIndex];
        setMessages((prev) => [
          ...prev,
          {
            id: `q-emp-${nextQIndex}`,
            sender: 'bot',
            text: nextQ.question,
            isrequired: nextQ.isrequired,
            qIndex: nextQIndex,
            isEmployerQ: true
          }
        ]);
      }, 280);
    } else {
      // All dynamic recruiter questions answered!
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // If candidate doesn't have resume, show "Please upload your resume."
        if (!hasExistingResume) {
          setCurrentStep('resume');
          setMessages((prev) => [
            ...prev,
            {
              id: 'q-resume',
              sender: 'bot',
              text: 'Please upload your resume.',
              isResumePrompt: true
            }
          ]);
        } else {
          // Already has resume
          setCurrentStep('ready');
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-ready-existing',
              sender: 'bot',
              text: job?.apply_link
                ? "Your resume is attached. Click 'Save & Apply on Employer Site' to continue to the employer application."
                : 'Your resume is attached. Click Save to complete your application.'
            }
          ]);
        }
      }, 280);
    }
  };

  // Edit Previous Answer Handlers
  const handleStartEdit = (qIndex) => {
    const targetQ = employerQuestions[qIndex];
    if (!targetQ) return;
    setEditingQIndex(qIndex);
    const currentVal = employerAnswers[qIndex] || '';
    if (targetQ.type === 'Multiple choice') {
      const parts = currentVal && currentVal !== 'Skipped'
        ? currentVal.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setEditSelectedMulti(parts);
    } else {
      setEditAnswerInput(currentVal === 'Skipped' ? '' : currentVal);
    }
  };

  const handleCancelEdit = () => {
    setEditingQIndex(null);
    setEditAnswerInput('');
    setEditSelectedMulti([]);
  };

  const handleSaveEdit = (newVal, isSkipped = false) => {
    if (editingQIndex === null) return;
    const targetQ = employerQuestions[editingQIndex];
    if (!targetQ) return;

    if (targetQ.isrequired && !isSkipped && (!newVal || !String(newVal).trim())) {
      CommonToaster('This question is required by the recruiter.', 'warning');
      return;
    }

    const finalVal = isSkipped ? 'Skipped' : String(newVal).trim();

    // 1. Update stored answers
    setEmployerAnswers((prev) => ({
      ...prev,
      [editingQIndex]: isSkipped ? '' : finalVal
    }));

    // 2. Update the message bubble text in the chat stream
    setMessages((prev) =>
      prev.map((m) => {
        if (m.sender === 'user' && m.isEmployerQAnswer && m.qIndex === editingQIndex) {
          return {
            ...m,
            text: isSkipped ? 'Skip this question' : finalVal
          };
        }
        return m;
      })
    );

    setEditingQIndex(null);
    setEditAnswerInput('');
    setEditSelectedMulti([]);
    CommonToaster('Answer updated successfully!', 'success');
  };

  const handleRestartFromQuestion = (qIndex) => {
    const targetQ = employerQuestions[qIndex];
    if (!targetQ) return;

    // 1. Remove answers from qIndex onwards
    setEmployerAnswers((prev) => {
      const updated = { ...prev };
      for (let i = qIndex; i < employerQuestions.length; i++) {
        delete updated[i];
      }
      return updated;
    });

    // 2. Reset step to questions & set active question
    setCurrentStep('questions');
    setCurrentEmployerQIndex(qIndex);

    // 3. Slice messages up to the bot prompt for qIndex
    setMessages((prev) => {
      const targetMsgIdx = prev.findIndex((m) => m.isEmployerQ && m.qIndex === qIndex);
      if (targetMsgIdx !== -1) {
        return prev.slice(0, targetMsgIdx + 1);
      }
      return prev;
    });

    const existingVal = employerAnswers[qIndex] || '';
    if (targetQ.type === 'Multiple choice') {
      const parts = existingVal && existingVal !== 'Skipped'
        ? existingVal.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setSelectedMultiOptions(parts);
    } else {
      setEmployerAnswerInput(existingVal === 'Skipped' ? '' : existingVal);
    }

    setEditingQIndex(null);
    CommonToaster(`Restarted from Question ${qIndex + 1}`, 'info');
  };

  // Upload Resume handler
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      CommonToaster('Resume must be smaller than 5MB!', 'error');
      return;
    }

    // Validate type
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileNameLower = file.name.toLowerCase();
    const isValidType = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    if (!isValidType) {
      CommonToaster('Please upload a PDF or DOC/DOCX file.', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('user_id', userId);
      formData.append('id', userId);

      const res = await updateResume(formData);
      if (res && (res.status === 200 || res.status === 201)) {
        CommonToaster('Resume uploaded successfully! 🎉', 'success');

        // Update local storage
        try {
          const stored = localStorage.getItem('loginDetails');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.resume = file.name;
            localStorage.setItem('loginDetails', JSON.stringify(parsed));
          }
        } catch { }

        setResumeActionTaken(true);
        if (onUploadResumeSuccess) {
          onUploadResumeSuccess(file.name);
        }

        // Post candidate bubble on right
        setMessages((prev) => [
          ...prev,
          {
            id: `ans-resume-${Date.now()}`,
            sender: 'user',
            text: file.name,
            isFile: true
          }
        ]);

        // Post bot confirmation bubble
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setCurrentStep('ready');
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-ready',
              sender: 'bot',
              text: job?.apply_link
                ? "Great! Your resume is attached. Click 'Save & Apply on Employer Site' to continue to the employer application."
                : 'Great! Your resume is attached. Click Save to complete your application.'
            }
          ]);
        }, 300);
      } else {
        CommonToaster('Upload failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      CommonToaster('Failed to upload resume. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle "I'll do it later"
  const handleLaterClick = () => {
    setResumeActionTaken(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `ans-later-${Date.now()}`,
        sender: 'user',
        text: "I'll do it later"
      }
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentStep('ready');
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-ready-later',
          sender: 'bot',
          text: job?.apply_link
            ? "No problem! Click 'Save & Apply on Employer Site' to continue to the employer application."
            : 'No problem! You can proceed and upload your resume anytime from your profile.'
        }
      ]);
    }, 280);
  };

  // Submit Application
  const handleSave = async () => {
    // Check if required employer screening questions are answered
    if (employerQuestions.length > 0) {
      const missingRequired = employerQuestions.some(
        (q, idx) => q.isrequired && !employerAnswers[idx]?.trim()
      );
      if (missingRequired) {
        CommonToaster('Please answer all required questions before saving.', 'warning');
        return;
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('AccessToken') : null;
    if (!token || !userId) {
      CommonToaster('Please log in to apply.', 'error');
      return;
    }

    const structuredAnswers = employerQuestions.map((q, index) => ({
      questionId: q.id,
      answer: employerAnswers[index] || ''
    }));

    const payload = {
      postId: Number(job.id),
      userId: Number(userId),
      answers: structuredAnswers
    };

    setIsSubmitting(true);
    try {
      const response = await applyForJob(payload, token);
      const appliedDate = response?.data?.appliedJob?.created_at || new Date().toISOString();

      if (job?.apply_link) {
        CommonToaster('Marked as applied! Redirecting to employer website... 🚀', 'success');
        if (typeof window !== 'undefined') {
          window.open(job.apply_link, '_blank');
        }
      } else {
        CommonToaster('Application submitted successfully! 🚀', 'success');
      }

      if (onApplySuccess) {
        onApplySuccess(appliedDate);
      }
      onClose();
    } catch (err) {
      console.error('Error applying for job:', err);
      if (job?.apply_link) {
        // Even if status recording had an issue, forward candidate to employer link
        CommonToaster('Redirecting to employer website... 🚀', 'info');
        if (typeof window !== 'undefined') {
          window.open(job.apply_link, '_blank');
        }
        if (onApplySuccess) {
          onApplySuccess(new Date().toISOString());
        }
        onClose();
      } else {
        const msg =
          err?.response?.data?.details ||
          err?.response?.data?.message ||
          'Error while applying. Please try again.';
        CommonToaster(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Is Save button ready?
  // Ready when recruiter questions are finished and resume prompt is shown or completed
  const isReadyToSave =
    currentStep === 'ready' ||
    currentStep === 'resume' ||
    resumeActionTaken ||
    (employerQuestions.length === 0);

  return (
    <div className="cad-drawer-overlay" onClick={onClose}>
      <div className="cad-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header with Close 'X' Button */}
        <div className="cad-header">
          <button
            type="button"
            className="cad-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Hidden File Input for Resume Upload */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />

        {/* Chat Stream Body */}
        <div className="cad-body">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              const isEditingThis = editingQIndex === msg.qIndex;
              const targetQ = msg.isEmployerQAnswer ? employerQuestions[msg.qIndex] : null;

              return (
                <div key={msg.id} className="cad-user-bubble-container">
                  <div
                    className={`cad-user-bubble ${msg.isEmployerQAnswer ? 'editable' : ''}`}
                    onClick={() => {
                      if (msg.isEmployerQAnswer && !isEditingThis) {
                        handleStartEdit(msg.qIndex);
                      }
                    }}
                    title={msg.isEmployerQAnswer ? 'Click to edit answer' : undefined}
                  >
                    {msg.isFile ? (
                      <span className="cad-resume-badge">
                        <FaFilePdf style={{ color: '#ef4444' }} />
                        {msg.text}
                        <FaCheckCircle style={{ color: '#10b981', marginLeft: 4 }} />
                      </span>
                    ) : (
                      <>
                        <span>{msg.text}</span>
                        {msg.isEmployerQAnswer && (
                          <button
                            type="button"
                            className="cad-bubble-edit-btn"
                            title="Edit answer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(msg.qIndex);
                            }}
                          >
                            <MdEdit size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Inline Editor for this previously answered question */}
                  {isEditingThis && targetQ && (
                    <div className="cad-inline-edit-card">
                      <div className="cad-inline-edit-header">
                        <span className="cad-inline-edit-title">
                          Edit: <strong>{targetQ.question}</strong>
                          {targetQ.isrequired && <span className="cad-required-star"> *</span>}
                        </span>
                        <button
                          type="button"
                          className="cad-inline-close-btn"
                          onClick={handleCancelEdit}
                          title="Cancel"
                        >
                          <IoClose size={16} />
                        </button>
                      </div>

                      <div className="cad-inline-edit-body">
                        {targetQ.type === 'Single choice' && targetQ.options && targetQ.options.length > 0 ? (
                          <div className="cad-choice-chips-grid">
                            {targetQ.options.map((opt, oIdx) => {
                              const isSelected = String(opt) === String(editAnswerInput);
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  className={`cad-choice-chip ${isSelected ? 'selected' : ''}`}
                                  style={isSelected ? { borderColor: '#5f2eea', color: '#5f2eea', background: '#f5f0ff', fontWeight: 600 } : {}}
                                  onClick={() => handleSaveEdit(String(opt))}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : targetQ.type === 'Multiple choice' && targetQ.options && targetQ.options.length > 0 ? (
                          <div>
                            <div className="cad-choice-chips-grid">
                              {targetQ.options.map((opt, oIdx) => {
                                const optStr = String(opt);
                                const isSelected = editSelectedMulti.includes(optStr);
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    className={`cad-choice-chip multi ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditSelectedMulti((prev) => prev.filter((o) => o !== optStr));
                                      } else {
                                        setEditSelectedMulti((prev) => [...prev, optStr]);
                                      }
                                    }}
                                  >
                                    <span className="cad-checkbox-indicator">
                                      {isSelected ? '✓' : ''}
                                    </span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="cad-inline-edit-actions">
                              <button
                                type="button"
                                className="cad-send-btn small"
                                disabled={targetQ.isrequired && editSelectedMulti.length === 0}
                                onClick={() => handleSaveEdit(editSelectedMulti.join(', '))}
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                className="cad-chip-btn skip small"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="cad-restart-link-btn"
                                onClick={() => handleRestartFromQuestion(msg.qIndex)}
                                title="Redo from this question onward"
                              >
                                Restart from here
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              rows={2}
                              className="cad-textarea-input"
                              value={editAnswerInput}
                              onChange={(e) => setEditAnswerInput(e.target.value)}
                              placeholder="Update your answer..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && editAnswerInput.trim()) {
                                  e.preventDefault();
                                  handleSaveEdit(editAnswerInput);
                                }
                              }}
                              autoFocus
                            />
                            <div className="cad-inline-edit-actions">
                              <button
                                type="button"
                                className="cad-send-btn small"
                                disabled={targetQ.isrequired && !editAnswerInput.trim()}
                                onClick={() => handleSaveEdit(editAnswerInput)}
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                className="cad-chip-btn skip small"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                              {!targetQ.isrequired && (
                                <button
                                  type="button"
                                  className="cad-chip-btn skip small"
                                  onClick={() => handleSaveEdit('', true)}
                                >
                                  Skip
                                </button>
                              )}
                              <button
                                type="button"
                                className="cad-restart-link-btn"
                                onClick={() => handleRestartFromQuestion(msg.qIndex)}
                                title="Redo from this question onward"
                              >
                                Restart from here
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Bot message
            return (
              <div key={msg.id} className="cad-message-group">
                <div className="cad-bot-bubble">
                  {msg.text}
                  {msg.isrequired && <span className="cad-required-star"> *</span>}
                </div>

                {/* Recruiter's Dynamic Question Input */}
                {msg.isEmployerQ && currentStep === 'questions' && msg.qIndex === currentEmployerQIndex && editingQIndex === null && (() => {
                  const currentQ = employerQuestions[currentEmployerQIndex];
                  if (!currentQ) return null;

                  const isSingleChoice = currentQ.type === 'Single choice' && currentQ.options && currentQ.options.length > 0;
                  const isMultiChoice = currentQ.type === 'Multiple choice' && currentQ.options && currentQ.options.length > 0;

                  if (isSingleChoice) {
                    return (
                      <div className="cad-choice-container">
                        <div className="cad-choice-chips-grid">
                          {currentQ.options.map((option, optIdx) => (
                            <button
                              key={optIdx}
                              type="button"
                              className="cad-choice-chip"
                              onClick={() => handleEmployerAnswer(String(option))}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {!currentQ.isrequired && (
                          <div style={{ marginTop: 8 }}>
                            <button
                              type="button"
                              className="cad-chip-btn skip"
                              onClick={() => handleEmployerAnswer('', true)}
                            >
                              Skip
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isMultiChoice) {
                    return (
                      <div className="cad-choice-container">
                        <div className="cad-choice-chips-grid">
                          {currentQ.options.map((option, optIdx) => {
                            const optStr = String(option);
                            const isSelected = selectedMultiOptions.includes(optStr);
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                className={`cad-choice-chip multi ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedMultiOptions((prev) => prev.filter((o) => o !== optStr));
                                  } else {
                                    setSelectedMultiOptions((prev) => [...prev, optStr]);
                                  }
                                }}
                              >
                                <span className="cad-checkbox-indicator">
                                  {isSelected ? '✓' : ''}
                                </span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, width: '100%' }}>
                          <button
                            type="button"
                            className="cad-send-btn"
                            style={{ flex: 1 }}
                            disabled={currentQ.isrequired && selectedMultiOptions.length === 0}
                            onClick={() => {
                              handleEmployerAnswer(selectedMultiOptions.join(', '));
                              setSelectedMultiOptions([]);
                            }}
                          >
                            Submit Answer
                          </button>
                          {!currentQ.isrequired && (
                            <button
                              type="button"
                              className="cad-chip-btn skip"
                              onClick={() => {
                                handleEmployerAnswer('', true);
                                setSelectedMultiOptions([]);
                              }}
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Short answer (default)
                  return (
                    <div className="cad-options-container" style={{ width: '100%' }}>
                      <textarea
                        rows={3}
                        className="cad-textarea-input"
                        placeholder="Type your answer here..."
                        value={employerAnswerInput}
                        onChange={(e) => setEmployerAnswerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && employerAnswerInput.trim()) {
                            e.preventDefault();
                            handleEmployerAnswer(employerAnswerInput);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, width: '100%' }}>
                        <button
                          type="button"
                          className="cad-send-btn"
                          style={{ flex: 1 }}
                          disabled={!employerAnswerInput.trim()}
                          onClick={() => handleEmployerAnswer(employerAnswerInput)}
                        >
                          Submit Answer
                        </button>
                        {!currentQ.isrequired && (
                          <button
                            type="button"
                            className="cad-chip-btn skip"
                            onClick={() => handleEmployerAnswer('', true)}
                          >
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Resume Prompt Action Buttons */}
                {msg.isResumePrompt && !resumeActionTaken && (
                  <div className="cad-resume-actions">
                    <button
                      type="button"
                      className="cad-upload-resume-btn"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <span className="cad-spinner-blue"></span>
                          Uploading...
                        </>
                      ) : (
                        'Upload Resume'
                      )}
                    </button>
                    <button
                      type="button"
                      className="cad-later-btn"
                      onClick={handleLaterClick}
                      disabled={isUploading}
                    >
                      I'll do it later
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="cad-typing-indicator">
              <span className="cad-typing-dot"></span>
              <span className="cad-typing-dot"></span>
              <span className="cad-typing-dot"></span>
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>

        {/* Sticky Footer with Save Button */}
        <div className="cad-footer">
          <button
            type="button"
            className={`cad-save-btn ${isReadyToSave ? 'active' : 'pending'}`}
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="cad-spinner"></span>
                {job?.apply_link ? 'Redirecting...' : 'Saving...'}
              </>
            ) : job?.apply_link ? (
              'Save & Apply on Employer Site'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
