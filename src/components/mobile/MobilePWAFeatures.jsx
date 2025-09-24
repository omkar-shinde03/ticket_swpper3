import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Bell, Smartphone, Wifi, WifiOff, Zap, Shield, Star, Share2, Heart } from 'lucide-react'

export const MobilePWAFeatures = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [batteryLevel, setBatteryLevel] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check battery level if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(battery.level * 100)
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100)
        })
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        console.log('Notification permission granted')
        // Show success feedback
        setShowFeatures(true)
        setTimeout(() => setShowFeatures(false), 3000)
      }
    }
  }

  const addToHomeScreen = () => {
    // Show instructions for manual add to home screen
    const instructions = `
      To add to home screen:
      1. Tap the share button in your browser
      2. Select "Add to Home Screen"
      3. Tap "Add" to confirm
    `
    alert(instructions)
  }

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TicketSwapper - Buy & Sell Bus Tickets',
          text: 'Check out this amazing app for buying and selling bus tickets!',
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback for browsers without native sharing
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="space-y-4">
      {/* Install App Card */}
      {showInstallPrompt && !isInstalled && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Download className="h-5 w-5" />
              Install TicketSwapper
            </CardTitle>
            <CardDescription className="text-blue-700">
              Install our app for quick access, offline features, and better performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleInstallClick} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
            <div className="text-xs text-blue-600 text-center">
              Free • No ads • Offline support
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Installed */}
      {isInstalled && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Star className="h-5 w-5" />
              App Installed!
            </CardTitle>
            <CardDescription className="text-green-700">
              Great! You're using our mobile app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-medium">Mobile App Active</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Bell className="h-5 w-5" />
            Enable Notifications
          </CardTitle>
          <CardDescription className="text-purple-700">
            Get instant updates about new tickets, price changes, and important alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={requestNotificationPermission} 
            variant="outline" 
            className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
          <div className="grid grid-cols-2 gap-2 text-xs text-purple-600">
            <div className="flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Instant alerts
            </div>
            <div className="flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Secure & private
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Features Card */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Smartphone className="h-5 w-5" />
            Mobile-First Features
          </CardTitle>
          <CardDescription className="text-orange-700">
            Optimized for mobile with advanced touch gestures and offline capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 rounded-lg p-3 text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xs">👆</span>
              </div>
              <p className="text-xs font-medium text-orange-800">Touch Optimized</p>
            </div>
            <div className="bg-white/50 rounded-lg p-3 text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-xs">📱</span>
              </div>
              <p className="text-xs font-medium text-orange-800">Offline Ready</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-orange-700">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Swipe gestures for navigation
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Offline ticket viewing
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Quick ticket search
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Touch-optimized interface
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Card */}
      <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Zap className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Online Status */}
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">Connection</span>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            {/* Battery Level */}
            {batteryLevel !== null && (
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Battery</span>
                </div>
                <Badge 
                  variant={batteryLevel > 20 ? "default" : "destructive"} 
                  className="text-xs"
                >
                  {Math.round(batteryLevel)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={addToHomeScreen}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Add to Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={shareApp}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share App
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Feedback */}
      {showFeatures && (
        <div className="fixed bottom-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-fade-in-up z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span className="font-medium">Notifications enabled!</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-600"
              onClick={() => setShowFeatures(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}