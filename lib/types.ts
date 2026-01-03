export interface BusinessUnit {
  site_id: string
  site_name: string
  domain: string
  bu_name: string
  site_status: string
  health_status: string | null
  response_time_ms: number | null
  last_check: string | null
  error_message: string | null
  status_badge: 'healthy' | 'warning' | 'critical' | 'unknown'
}

export interface LLMCosts {
  total_cost_30d: number
  avg_daily_cost: number
  total_calls: number
}

export interface SystemEvent {
  id: string
  event_type: string
  description: string
  metadata: any
  created_at: string
  time_ago: string
}
