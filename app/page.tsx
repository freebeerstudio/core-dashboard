'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { BusinessUnit, LLMCosts, SystemEvent, RevenueData } from "@/lib/types"

export default function Dashboard() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [llmCosts, setLlmCosts] = useState<LLMCosts | null>(null)
  const [events, setEvents] = useState<SystemEvent[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, costsRes, eventsRes, revenueRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/llm-costs'),
          fetch('/api/events'),
          fetch('/api/revenue')
        ])

        const healthData = await healthRes.json()
        const costsData = await costsRes.json()
        const eventsData = await eventsRes.json()
        const revenueResData = await revenueRes.json()

        setBusinessUnits(healthData.data || [])
        setLlmCosts(costsData.data)
        setEvents(eventsData.data || [])
        setRevenueData(revenueResData.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const costPercentage = llmCosts ? Math.min((llmCosts.total_cost_30d / 20) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">FreeBeer.Studio Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Real-time monitoring for all business units
          </p>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Column 1-2: Business Units */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Business Units</h2>

              {loading ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-zinc-600">Loading business units...</p>
                  </CardContent>
                </Card>
              ) : businessUnits.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No business units yet</CardTitle>
                    <CardDescription>Add your first BU to start monitoring</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                businessUnits.map((bu) => (
                  <Card key={bu.site_id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {bu.status_badge === 'healthy' ? '🟢' :
                             bu.status_badge === 'degraded' ? '🟡' :
                             bu.status_badge === 'warning' ? '🟠' :
                             bu.status_badge === 'critical' ? '🔴' :
                             '⚪'}
                          </span>
                          <CardTitle>{bu.site_name}</CardTitle>
                        </div>
                        <Badge
                          variant="default"
                          className={
                            bu.status_badge === 'healthy' ? 'bg-green-500 hover:bg-green-600' :
                            bu.status_badge === 'degraded' ? 'bg-yellow-500 hover:bg-yellow-600' :
                            bu.status_badge === 'warning' ? 'bg-orange-500 hover:bg-orange-600' :
                            bu.status_badge === 'critical' ? 'bg-red-500 hover:bg-red-600' :
                            'bg-zinc-500 hover:bg-zinc-600'
                          }
                        >
                          {bu.status_badge === 'healthy' ? 'Healthy' :
                           bu.status_badge === 'degraded' ? 'Degraded' :
                           bu.status_badge === 'warning' ? 'Warning' :
                           bu.status_badge === 'critical' ? 'Critical' :
                           'Unknown'}
                        </Badge>
                      </div>
                      <CardDescription>{bu.bu_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
                          <span className="font-medium">
                            {bu.health_status === 'healthy' ? 'All systems operational' :
                             bu.health_status === 'warning' ? 'Performance degraded' :
                             bu.health_status === 'critical' ? 'Service down' :
                             'Status unknown'}
                          </span>
                        </div>
                        {bu.response_time_ms && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Response Time:</span>
                            <span className="font-medium">{bu.response_time_ms}ms</span>
                          </div>
                        )}
                        {bu.last_check && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Last Check:</span>
                            <span className="font-medium">
                              {new Date(bu.last_check).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        {bu.error_message && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {bu.error_message}
                          </div>
                        )}
                        <div className="mt-4">
                          <a
                            href={`https://vercel.com/freebeerstudio/${bu.domain.replace('.', '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            View in Vercel →
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Revenue, LLM Cost Overview & Events */}
          <div className="space-y-6">
            {/* Revenue Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-2xl font-bold">
                        ${revenueData?.total_revenue_30d.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {revenueData?.total_transactions || 0} transaction{revenueData?.total_transactions !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-zinc-600 dark:text-zinc-400">MRR</div>
                      <div className="text-lg font-semibold">${revenueData?.mrr.toFixed(2) || '0.00'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-600 dark:text-zinc-400">Active Subs</div>
                      <div className="text-lg font-semibold">{revenueData?.active_subscriptions || 0}</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {revenueData && revenueData.total_transactions > 0 ? (
                      <>
                        Avg daily revenue: ${revenueData.avg_daily_revenue.toFixed(2)}
                      </>
                    ) : (
                      'No revenue tracked yet. Revenue tracking begins when first payment is received.'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LLM Cost Panel */}
            <Card>
              <CardHeader>
                <CardTitle>LLM Costs</CardTitle>
                <CardDescription>Rolling 30-day window</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-2xl font-bold">
                        ${llmCosts?.total_cost_30d.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">/ $20.00 target</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 dark:bg-zinc-700">
                      <div
                        className={`h-2 rounded-full ${costPercentage < 75 ? 'bg-green-500' : costPercentage < 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${costPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {llmCosts && llmCosts.total_calls > 0 ? (
                      <>
                        {llmCosts.total_calls} API call{llmCosts.total_calls !== 1 ? 's' : ''} in last 30 days
                        <br />
                        Avg: ${llmCosts.avg_daily_cost.toFixed(2)}/day
                      </>
                    ) : (
                      'No LLM usage tracked yet. Cost tracker will activate when first API call is logged.'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {events.length === 0 ? (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      No recent events. Business operations events will appear here.
                    </div>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="flex gap-3 py-2 border-b last:border-0">
                        <div className="shrink-0">
                          {event.severity === 'critical' ? '🔴' :
                           event.severity === 'warning' ? '🟡' :
                           event.severity === 'info' ? '🔵' :
                           '⚪'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{event.description}</div>
                          <div className="text-xs text-zinc-400 mt-1">{event.time_ago}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
