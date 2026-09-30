'use client';
import React, { useState } from "react";
import { GoDotFill } from "react-icons/go";
import { message } from "antd";
import {
  emailValidator,
  nameValidator,
  phoneValidation,
} from "../Common/Validation";
import { FiCreditCard, FiClock, FiShield, FiCheck, FiStar } from "react-icons/fi";
import { BsLightningChargeFill } from "react-icons/bs";

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("Plans");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const tabs = [
    { name: "Plans", icon: <FiCreditCard /> },
    { name: "Billing history", icon: <FiClock /> },
    { name: "Blocked Candidates & Org.", icon: <FiShield /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-2 md:p-10 font-sans text-slate-800 bg-slate-50 min-h-screen">
      <div className="mb-3">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 tracking-tight">Account Settings</h2>
        <p className="text-slate-500 text-md mb-0">Manage your billing, plans, and organizational preferences.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <div className="flex gap-8 min-w-max">
          {tabs.map((tab) => (
            <div
              key={tab.name}
              className={`flex items-center gap-2 py-4 text-base cursor-pointer relative transition-colors duration-200 ${activeTab === tab.name
                ? "text-blue-600 font-semibold after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-1 after:bg-blue-600 after:rounded-t-md"
                : "font-medium text-slate-500 hover:text-blue-600"
                }`}
              onClick={() => setActiveTab(tab.name)}
            >
              <span className="text-xl flex">{tab.icon}</span>
              {tab.name}
            </div>
          ))}
        </div>
      </div>

      {activeTab === "Plans" && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <div className="text-center mb-7">
            <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-1">Subscription Plans</h3>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Upgrade your plan to unlock more features and scale your hiring process.</p>
          </div>

          {/* Current Plan Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-6 rounded-2xl bg-gradient-to-br from-white to-slate-100 border border-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] mb-8">
            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-0">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <BsLightningChargeFill className="text-white text-xl md:text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-emerald-500 mb-1">Current Plan</span>
                <h4 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Standard Plan</h4>
                <p className="text-slate-500 text-xs md:text-sm mb-0">The changes will be reflected within 15 minutes if you upgrade.</p>
              </div>
            </div>
            <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                <FiStar className="text-base" />
                <span>Get 3x more visibility</span>
              </div>
              <button className="w-full md:w-auto px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-slate-800 hover:-translate-y-px transition-all">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Toggle Billing Cycle */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex bg-slate-200 p-1.5 rounded-full relative">
              <button
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${billingCycle === "annually" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                onClick={() => setBillingCycle("annually")}
              >
                Annually <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold ml-1">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* Standard Plan */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 flex flex-col relative transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-2">
                <h4 className="text-xl font-semibold mb-2 text-slate-900">Standard</h4>
                <div className="flex items-baseline mb-2 text-3xl font-extrabold text-slate-900">
                  <span className="text-2xl font-semibold mr-1 text-slate-500">₹</span>0<span className="text-base font-medium ml-1 text-slate-500">/mo</span>
                </div>
                <span className="block text-sm text-emerald-500 font-medium mb-3">₹0 Annually</span>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 min-h-[3rem] mb-2">Essential features to start finding the right talent.</p>
              </div>
              <button className="w-full py-3.5 rounded-xl font-semibold text-base transition-all mb-6 flex justify-center items-center gap-2 bg-slate-100 text-slate-500 border border-slate-200 cursor-default" disabled>
                <GoDotFill /> Current Plan
              </button>
              <div className="flex-grow">
                <h6 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Includes:</h6>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Upto 3 public live jobs/internships</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Public Approval within 24 hours</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Upto 14 day registration window</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> 24 hour support via email</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> 50 assessment attempts per listing</li>
                </ul>
              </div>
            </div>

            {/* Hiring Plan (Highlighted) */}
            <div className="bg-white rounded-3xl p-8 lg:p-10 border-2 border-blue-500 flex flex-col relative transition-all duration-300 lg:scale-105 hover:lg:-translate-y-2 lg:hover:scale-105 hover:-translate-y-2 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.2)] hover:shadow-[0_25px_30px_-5px_rgba(59,130,246,0.25)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-md shadow-blue-500/30">Recommended</div>
              <div className="mb-2">
                <h4 className="text-xl font-semibold mb-2 text-slate-900">Hiring Plan</h4>
                <div className="flex items-baseline mb-2 text-3xl font-extrabold text-slate-900">
                  <span className="text-2xl font-semibold mr-1 text-slate-500">₹</span>{billingCycle === "monthly" ? "4,999" : "3,999"}<span className="text-base font-medium ml-1 text-slate-500">/mo</span>
                </div>
                <span className="block text-sm text-emerald-500 font-medium mb-3">Billed ₹59,988 Annually</span>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 min-h-[3rem] mb-2">Increased access to job listings, competitions and more features.</p>
              </div>
              <button className="w-full py-3.5 rounded-xl font-semibold text-base transition-all mb-8 flex justify-center items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/30">Upgrade Now</button>
              <div className="flex-grow">
                <h6 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Everything in Standard, plus:</h6>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Upto 10 public live jobs/internships</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Public approval within an hour</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Upto 60 day registration window</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> Dedicated Relationship Manager</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> 150 assessment attempts per listing</li>
                  <li className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"><FiCheck className="text-blue-500 text-xl shrink-0 -mt-0.5" /> 50 interviews per listing</li>
                </ul>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 lg:p-10 border border-slate-800 flex flex-col relative transition-all duration-300 hover:-translate-y-2 hover:shadow-xl md:col-span-2 lg:col-span-1">
              <div className="mb-2">
                <h4 className="text-xl font-semibold mb-2 text-white">Enterprise</h4>
                <div className="flex items-baseline mb-2 text-4xl font-extrabold text-white">
                  <span className="text-2xl">Custom</span>
                </div>
                <span className="block text-sm text-emerald-500 font-medium mb-3">Tailored Pricing</span>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[3rem] mb-2">Unlimited access, AI-powered tools and custom solutions.</p>
              </div>
              <button className="w-full py-3.5 rounded-xl font-semibold text-base transition-all mb-8 flex justify-center items-center gap-2 bg-white text-slate-900 hover:bg-slate-100">Contact Sales</button>
              <div className="flex-grow">
                <h6 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Everything in Hiring, plus:</h6>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"><FiCheck className="text-blue-400 text-xl shrink-0 -mt-0.5" /> Unlimited public live jobs/internships</li>
                  <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"><FiCheck className="text-blue-400 text-xl shrink-0 -mt-0.5" /> Public Approval within 10 minutes</li>
                  <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"><FiCheck className="text-blue-400 text-xl shrink-0 -mt-0.5" /> Upto 180 day registration window</li>
                  <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"><FiCheck className="text-blue-400 text-xl shrink-0 -mt-0.5" /> Newsletter Inclusion</li>
                  <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"><FiCheck className="text-blue-400 text-xl shrink-0 -mt-0.5" /> State of the art AI interviews</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Billing history" && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <div className="flex flex-col items-center justify-center py-20 px-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <FiClock className="text-4xl text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Billing History</h3>
            <p className="text-slate-500 max-w-md">You haven't made any transactions yet. Your invoices will appear here once you upgrade.</p>
          </div>
        </div>
      )}

      {activeTab === "Blocked Candidates & Org." && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <div className="flex flex-col items-center justify-center py-20 px-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <FiShield className="text-4xl text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Blocked Entities</h3>
            <p className="text-slate-500 max-w-md">You have not blocked any candidates or organizations. Manage your block list here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
