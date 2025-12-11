import React, { useEffect, useState } from "react";
import { fetchDashboard,  } from "../service/activity.service";
import { SalesDashboardData } from "../dto/dashboard.dto";
import {Lead} from "../dto/lead.dto"
import { Activity } from "../dto/activity.dto"; 
import { Opportunity } from "../dto/opportunity.dto";
import {
  Card,
  CardHeader,
  CardContent
} from "../../../components/ui/Card";
import { Separator } from "../../../components/ui/separator";

import {
  CircleDollarSign,
  Target,
  Clock,
  Users,
  Briefcase
} from "lucide-react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { MetricCard } from "../components/MetricCard";
import { ChartCard } from "../components/ChartCard";
import { RecentList } from "../components/RecentList";
export default function CRMDashboardPage() {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboard()
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;
  }

  const { summary, pipeline, charts, recent } = data;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CRM Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of all your CRM activities, leads & opportunities
          </p>
        </div>

        {/* SUMMARY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <MetricCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            title="Total Leads"
            value={summary.totalLeads}
            color="from-blue-50 to-blue-100"
          />

          <MetricCard
            icon={<Briefcase className="w-6 h-6 text-orange-600" />}
            title="Total Opportunities"
            value={summary.totalOpp}
            color="from-orange-50 to-orange-100"
          />

          <MetricCard
            icon={<Target className="w-6 h-6 text-green-600" />}
            title="Win Rate"
            value={summary.winRate + "%"}
            color="from-green-50 to-green-100"
          />
        </div>

        {/* REVENUE + TODAY ACTIVITY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <MetricCard
            icon={<CircleDollarSign className="w-6 h-6 text-purple-600" />}
            title="Total Revenue Won"
            value={summary.totalRevenue.toLocaleString("vi-VN") + " ₫"}
            color="from-purple-50 to-purple-100"
          />

          <MetricCard
            icon={<Clock className="w-6 h-6 text-indigo-600" />}
            title="Activities Today"
            value={summary.activitiesToday.totalActivitiesToday}
            color="from-indigo-50 to-indigo-100"
          />
        </div>

        {/* PIPELINE FUNNEL */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Pipeline Funnel</h2>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">

            <div className="grid grid-cols-4 gap-4">
              {pipeline.map((p) => (
                <div
                  key={p.stage}
                  className="text-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <p className="uppercase text-xs font-bold text-gray-500">{p.stage}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{p.count}</p>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ACTIVITIES 7D */}
          <ChartCard title="Activities (Last 7 Days)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.activity7d}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* LEADS CREATED */}
          <ChartCard title="Leads Created (Last 7 Days)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={charts.leads7d}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* REVENUE 30 DAYS */}
        <ChartCard title="Revenue (Last 30 Days)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.revenue30d}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#9333ea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* RECENT ITEMS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

          <RecentList<Lead>
            title="Recent Leads"
            items={recent.leads}
            getLabel={(l) => l.name}
            getDate={(l) => l.created_at}
            />

            <RecentList<Opportunity>
            title="Recent Opportunities"
            items={recent.opportunities}
            getLabel={(o) => o.name}
            getDate={(o) => o.created_at}
            />

            <RecentList<Activity>
            title="Recent Activities"
            items={recent.activities}
            getLabel={(a) => a.subject ?? "(No Subject)"}
            getDate={(a) => a.created_at}
            />


        </div>

      </div>
    </div>
  );
}
