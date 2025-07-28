'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FinancialMetrics } from '@/services/api'
import {
  AlertTriangle,
  Bell,
  BellOff,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Volume2,
  Zap
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export interface Alert {
  id: string
  name: string
  type: 'performance' | 'volatility' | 'volume' | 'price'
  condition: 'above' | 'below' | 'equals'
  threshold: number
  enabled: boolean
  symbol: string
  timeframe: string
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
}

interface AlertSystemProps {
  symbol: string
  timeframe: string
  currentData: FinancialMetrics[]
  onAlertTrigger?: (alert: Alert, data: FinancialMetrics) => void
}

export function AlertSystem({
  symbol,
  timeframe,
  currentData,
  onAlertTrigger
}: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    name: '',
    type: 'performance',
    condition: 'above',
    threshold: 0,
    enabled: true
  })

  useEffect(() => {
    const savedAlerts = localStorage.getItem(`alerts_${symbol}`)
    if (savedAlerts) {
      try {
        const parsedAlerts = JSON.parse(savedAlerts).map((alert: Alert) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          lastTriggered: alert.lastTriggered
            ? new Date(alert.lastTriggered)
            : undefined
        }))
        setAlerts(parsedAlerts)
      } catch {
        toast.error('Failed to load alerts', {
          description:
            'Your saved alerts could not be loaded. Please check your browser settings.'
        })
      }
    }
  }, [symbol])

  useEffect(() => {
    localStorage.setItem(`alerts_${symbol}`, JSON.stringify(alerts))
  }, [alerts, symbol])

  const triggerAlert = useCallback(
    (alert: Alert, data: FinancialMetrics) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (alert.lastTriggered && alert.lastTriggered > fiveMinutesAgo) {
        return
      }

      const updatedAlert = {
        ...alert,
        lastTriggered: new Date(),
        triggerCount: alert.triggerCount + 1
      }

      setAlerts(prev => prev.map(a => (a.id === alert.id ? updatedAlert : a)))

      const getAlertIcon = () => {
        switch (alert.type) {
          case 'performance':
            return alert.condition === 'above' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )
          case 'volatility':
            return <Zap className="w-4 h-4" />
          case 'volume':
            return <Volume2 className="w-4 h-4" />
          case 'price':
            return <TrendingUp className="w-4 h-4" />
          default:
            return <AlertTriangle className="w-4 h-4" />
        }
      }

      const getAlertMessage = () => {
        const value =
          alert.type === 'performance'
            ? data.performance
            : alert.type === 'volatility'
              ? data.volatility
              : alert.type === 'volume'
                ? data.volume
                : data.close

        const conditionText =
          alert.condition === 'above'
            ? 'above'
            : alert.condition === 'below'
              ? 'below'
              : 'equals'

        return `${alert.name}: ${alert.type} is ${conditionText} ${alert.threshold} (Current: ${value.toFixed(2)})`
      }

      toast(alert.name, {
        description: getAlertMessage(),
        icon: getAlertIcon(),
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            toast.info('Alert details', alert)
          }
        }
      })

      // Call parent callback if provided
      onAlertTrigger?.(updatedAlert, data)
    },
    [onAlertTrigger]
  )

  useEffect(() => {
    if (!alerts.length || !currentData.length) return

    const latestData = currentData[currentData.length - 1]

    alerts.forEach(alert => {
      if (!alert.enabled) return

      let shouldTrigger = false
      const value =
        alert.type === 'performance'
          ? latestData.performance
          : alert.type === 'volatility'
            ? latestData.volatility
            : alert.type === 'volume'
              ? latestData.volume
              : latestData.close

      switch (alert.condition) {
        case 'above':
          shouldTrigger = value > alert.threshold
          break
        case 'below':
          shouldTrigger = value < alert.threshold
          break
        case 'equals':
          shouldTrigger = Math.abs(value - alert.threshold) < 0.01
          break
      }

      if (shouldTrigger) {
        triggerAlert(alert, latestData)
      }
    })
  }, [currentData, alerts, onAlertTrigger, triggerAlert])

  const createAlert = useCallback(() => {
    if (!newAlert.name || newAlert.threshold === undefined) {
      toast.error('Invalid Alert', {
        description: 'Please provide a name and threshold for the alert.'
      })
      return
    }

    const alert: Alert = {
      id: Date.now().toString(),
      name: newAlert.name,
      type: newAlert.type || 'performance',
      condition: newAlert.condition || 'above',
      threshold: newAlert.threshold || 0,
      enabled: newAlert.enabled || true,
      symbol,
      timeframe,
      createdAt: new Date(),
      triggerCount: 0
    }

    setAlerts(prev => [...prev, alert])
    setNewAlert({
      name: '',
      type: 'performance',
      condition: 'above',
      threshold: 0,
      enabled: true
    })
    setIsModalOpen(false)

    toast.success('Alert Created', {
      description: `Alert "${alert.name}" has been created successfully.`
    })
  }, [newAlert, symbol, timeframe])

  const deleteAlert = useCallback(
    (alertId: string) => {
      const alertToDelete = alerts.find(a => a.id === alertId)
      setAlerts(prev => prev.filter(a => a.id !== alertId))

      if (alertToDelete) {
        toast.success('Alert Deleted', {
          description: `Alert "${alertToDelete.name}" has been removed.`
        })
      }
    },
    [alerts]
  )

  const toggleAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => {
        if (alert.id === alertId) {
          const updatedAlert = { ...alert, enabled: !alert.enabled }
          toast.success(
            updatedAlert.enabled ? 'Alert Enabled' : 'Alert Disabled',
            {
              description: `Alert "${alert.name}" has been ${updatedAlert.enabled ? 'enabled' : 'disabled'}.`
            }
          )
          return updatedAlert
        }
        return alert
      })
    )
  }, [])

  const getAlertTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="w-4 h-4" />
      case 'volatility':
        return <Zap className="w-4 h-4" />
      case 'volume':
        return <Volume2 className="w-4 h-4" />
      case 'price':
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const getAlertTypeColor = (type: Alert['type']) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-100 text-blue-800'
      case 'volatility':
        return 'bg-yellow-100 text-yellow-800'
      case 'volume':
        return 'bg-green-100 text-green-800'
      case 'price':
        return 'bg-purple-100 text-purple-800'
    }
  }

  const activeAlerts = useMemo(() => alerts.filter(a => a.enabled), [alerts])

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alert System
              {activeAlerts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeAlerts.length} active
                </Badge>
              )}
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="alert-name" className="text-sm">
                      Alert Name
                    </Label>
                    <Input
                      id="alert-name"
                      value={newAlert.name}
                      onChange={e =>
                        setNewAlert(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., High Volatility Alert"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="alert-type" className="text-sm">
                      Alert Type
                    </Label>
                    <Select
                      value={newAlert.type}
                      onValueChange={(value: Alert['type']) =>
                        setNewAlert(prev => ({ ...prev, type: value }))
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="volatility">Volatility</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="alert-condition" className="text-sm">
                        Condition
                      </Label>
                      <Select
                        value={newAlert.condition}
                        onValueChange={(value: Alert['condition']) =>
                          setNewAlert(prev => ({ ...prev, condition: value }))
                        }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above</SelectItem>
                          <SelectItem value="below">Below</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="alert-threshold" className="text-sm">
                        Threshold
                      </Label>
                      <Input
                        id="alert-threshold"
                        type="number"
                        step="0.01"
                        value={newAlert.threshold}
                        onChange={e =>
                          setNewAlert(prev => ({
                            ...prev,
                            threshold: parseFloat(e.target.value) || 0
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert-enabled"
                      checked={newAlert.enabled}
                      onCheckedChange={checked =>
                        setNewAlert(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                    <Label htmlFor="alert-enabled" className="text-sm">
                      Enable Alert
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createAlert} className="flex-1">
                      Create Alert
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts configured</p>
              <p className="text-xs">
                Create your first alert to get notified about important market
                events
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.enabled ? 'bg-background' : 'bg-muted/50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${getAlertTypeColor(alert.type)}`}>
                      {getAlertTypeIcon(alert.type)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{alert.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {alert.type} {alert.condition} {alert.threshold}
                        {alert.type === 'performance' && '%'}
                        {alert.type === 'volatility' && '%'}
                        {alert.type === 'volume' && ''}
                        {alert.type === 'price' && '$'}
                      </div>
                      {alert.triggerCount > 0 && (
                        <div className="text-xs text-blue-600">
                          Triggered {alert.triggerCount} time
                          {alert.triggerCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAlert(alert.id)}
                      className="h-8 w-8 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
