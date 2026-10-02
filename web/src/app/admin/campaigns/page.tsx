'use client';

import React from 'react';
import { 
  Search, Bell, Plus, Filter, ChevronDown, Edit2, Trash2, 
  BarChart2, TrendingUp, TrendingDown 
} from 'lucide-react';

export default function AdminCampaigns() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0B192C]">Marketing &gt; Campaigns &amp; Notifications</h1>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search orders, bills, customer IDs..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm w-[320px] focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            />
          </div>
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-gray-50"></span>
          </div>
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-9 h-9 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">System Owner</span>
              <span className="text-sm font-bold text-[#0B192C] leading-none">George Malieakal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title & Add Button */}
      <section className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#0B192C] tracking-tight mb-1">Campaigns &amp; Notifications</h2>
          <p className="text-sm font-medium text-gray-500">Engage Malieakal buyers with targeted monsoonal offers, alerts, and coupons</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm transition-colors">
          <Megaphone size={16} /> CREATE CAMPAIGN
        </button>
      </section>

      {/* Tabs */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm flex items-center overflow-hidden">
        <Tab isActive={true} label="All Campaigns" />
        <Tab isActive={false} label="Flash Sales" />
        <Tab isActive={false} label="Coupons" />
        <Tab isActive={false} label="Notifications" />
        <Tab isActive={false} label="Scheduled" />
        <Tab isActive={false} label="History" />
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <CampaignMetric title="TOTAL SENT" value="45,280" />
        <CampaignMetric title="DELIVERED" value="44,120" badge="97.4%" badgeType="positive" />
        <CampaignMetric title="AVG OPEN RATE" value="62%" badge="+2.4%" badgeType="positive" />
        <CampaignMetric title="AVG CLICK RATE" value="18%" badge="+0.8%" badgeType="positive" />
      </section>

      {/* Data Table */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 overflow-hidden flex flex-col">
        <h3 className="text-lg font-bold text-[#0B192C] mb-6">Active Curation Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                <th className="py-4 pr-3">Campaign Name</th>
                <th className="py-4 px-3">Type</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 px-3">Audience Target</th>
                <th className="py-4 px-3">Start Date</th>
                <th className="py-4 px-3">End Date</th>
                <th className="py-4 px-3 text-right">Delivered</th>
                <th className="py-4 px-3 text-right">Opened</th>
                <th className="py-4 pl-3 text-right">Conversions</th>
              </tr>
            </thead>
            <tbody className="text-[#0B192C] font-semibold divide-y divide-gray-50">
              <CampaignRow 
                name="Monsoon Sale Spl Inverter ACs" type="Flash Sale" status="Active" 
                audience="All Customers (12,450)" start="15 Aug 2026" end="25 Aug 2026"
                delivered="12,210" opened="7,840" conversions="184 Sales" convColor="text-amber-500"
              />
              <CampaignRow 
                name="Independence Day Electronics Promo" type="Coupon" status="Active" 
                audience="Recent Purchasers (2,5..." start="12 Aug 2026" end="20 Aug 2026"
                delivered="2,450" opened="1,980" conversions="92 Claims" convColor="text-amber-500"
              />
              <CampaignRow 
                name="New Samsung S24 Series Alerts" type="Notification" status="Scheduled" 
                audience="Tech Enthusiasts (4,200)" start="20 Aug 2026" end="22 Aug 2026"
                delivered="-" opened="-" conversions="-" convColor="text-gray-400"
              />
              <CampaignRow 
                name="LG Heritage Refrigerator Clearance" type="Flash Sale" status="Draft" 
                audience="Kollam Core Buyers" start="05 Sep 2026" end="15 Sep 2026"
                delivered="-" opened="-" conversions="-" convColor="text-gray-400"
              />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Megaphone({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

function Tab({ isActive, label }: any) {
  return (
    <button className={`px-6 py-4 text-sm font-bold transition-colors ${
      isActive ? 'bg-[#0B192C] text-white' : 'text-gray-500 hover:bg-gray-50'
    }`}>
      {label}
    </button>
  );
}

function CampaignMetric({ title, value, badge, badgeType }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-black text-[#0B192C]">{value}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 ${
            badgeType === 'positive' ? 'bg-[#e8f5ed] text-[#1a8b44]' : 'bg-gray-100 text-gray-600'
          }`}>
            {badgeType === 'positive' && <TrendingUp size={10} />}
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function CampaignRow({ name, type, status, audience, start, end, delivered, opened, conversions, convColor }: any) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-4 pr-3">{name}</td>
      <td className="py-4 px-3 text-gray-500 font-medium">{type}</td>
      <td className="py-4 px-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
          status === 'Active' ? 'bg-[#e8f5ed] text-[#1a8b44]' : 
          status === 'Scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {status}
        </span>
      </td>
      <td className="py-4 px-3 text-gray-500 font-medium text-xs">{audience}</td>
      <td className="py-4 px-3 text-gray-400 font-medium text-xs">{start}</td>
      <td className="py-4 px-3 text-gray-400 font-medium text-xs">{end}</td>
      <td className="py-4 px-3 text-right">{delivered}</td>
      <td className="py-4 px-3 text-right">{opened}</td>
      <td className={`py-4 pl-3 text-right font-bold ${convColor}`}>{conversions}</td>
    </tr>
  );
}
