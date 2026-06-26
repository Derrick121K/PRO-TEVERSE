"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings as SettingsIcon,
  User,
  AudioLines,
  Palette,
  Keyboard,
  Save,
  RotateCcw,
  Volume2,
  Mic,
  Monitor,
  Music,
  Shield,
  Bell,
  Globe
} from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [audioSettings, setAudioSettings] = useState({
    sampleRate: '44100',
    bufferSize: '512',
    inputDevice: 'default',
    outputDevice: 'default',
    masterVolume: 80,
    inputVolume: 70
  })
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    snapToGrid: true,
    gridSize: 0.25,
    autoSave: true,
    autoSaveInterval: 5,
    showTooltips: true,
    keyboardShortcuts: true
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Ã¢â€ Â Back</Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <SettingsIcon className="h-6 w-6 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Settings</h1>
                <p className="text-[10px] text-muted-foreground">Configure your studio</p>
              </div>
            </div>
          </div>
          <Button className="bg-neon-cyan text-background hover:bg-neon-cyan/90">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface-1 border border-border mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="general" className="data-[state=active]:bg-surface-2">
              <SettingsIcon className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-surface-2">
              <AudioLines className="h-4 w-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-surface-2">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="data-[state=active]:bg-surface-2">
              <Keyboard className="h-4 w-4 mr-2" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-surface-2">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold text-white">Offline Mode</h2>
              <p className="mt-2 text-sm text-slate-300">
                PRO-TEVERSE now runs music generation locally. No cloud API is required.
              </p>
            </div>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-neon-cyan" />
                  Editor Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Snap to Grid</Label>
                    <p className="text-xs text-muted-foreground">Automatically snap notes to grid</p>
                  </div>
                  <Switch
                    checked={preferences.snapToGrid}
                    onCheckedChange={(v) => setPreferences({...preferences, snapToGrid: v})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Grid Size</Label>
                  <Select
                    value={String(preferences.gridSize)}
                    onValueChange={(v) => setPreferences({...preferences, gridSize: parseFloat(v)})}
                  >
                    <SelectTrigger className="w-48 bg-surface-2 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.125">1/32 note</SelectItem>
                      <SelectItem value="0.25">1/16 note</SelectItem>
                      <SelectItem value="0.5">1/8 note</SelectItem>
                      <SelectItem value="1">1/4 note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Auto Save</Label>
                    <p className="text-xs text-muted-foreground">Automatically save projects</p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(v) => setPreferences({...preferences, autoSave: v})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-neon-purple" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">GossipAI-PROD suggestions</Label>
                    <p className="text-xs text-muted-foreground">Show GossipAI-PROD-powered suggestions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Export Alerts</Label>
                    <p className="text-xs text-muted-foreground">Notify when export completes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-neon-cyan" />
                Audio Device
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Output Device</Label>
                    <Select
                      value={audioSettings.outputDevice}
                      onValueChange={(v) => setAudioSettings({...audioSettings, outputDevice: v})}
                    >
                      <SelectTrigger className="bg-surface-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">System Default</SelectItem>
                        <SelectItem value="asio">ASIO Driver</SelectItem>
                        <SelectItem value="wdm">WDM Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Sample Rate</Label>
                    <Select
                      value={audioSettings.sampleRate}
                      onValueChange={(v) => setAudioSettings({...audioSettings, sampleRate: v})}
                    >
                      <SelectTrigger className="bg-surface-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="44100">44.1 kHz</SelectItem>
                        <SelectItem value="48000">48 kHz</SelectItem>
                        <SelectItem value="96000">96 kHz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Buffer Size: {audioSettings.bufferSize} samples</Label>
                  <Slider
                    value={[parseInt(audioSettings.bufferSize)]}
                    onValueChange={([v]) => setAudioSettings({...audioSettings, bufferSize: String(v)})}
                    min={128}
                    max={2048}
                    step={128}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-5 w-5 text-neon-pink" />
                  Input Device
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Recording Device</Label>
                  <Select
                    value={audioSettings.inputDevice}
                    onValueChange={(v) => setAudioSettings({...audioSettings, inputDevice: v})}
                  >
                    <SelectTrigger className="bg-surface-2 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">System Default</SelectItem>
                      <SelectItem value="input1">Built-in Microphone</SelectItem>
                      <SelectItem value="input2">Audio Interface</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Input Level: {audioSettings.inputVolume}%</Label>
                  <Slider
                    value={[audioSettings.inputVolume]}
                    onValueChange={([v]) => setAudioSettings({...audioSettings, inputVolume: v})}
                    max={100}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <button
                    className={`p-4 rounded-lg border-2 ${preferences.theme === 'dark' ? 'border-neon-cyan' : 'border-border'}`}
                    onClick={() => setPreferences({...preferences, theme: 'dark'})}
                  >
                    <div className="w-20 h-14 bg-surface-1 rounded flex items-center justify-center">
                      <span className="text-xs text-foreground">Dark</span>
                    </div>
                  </button>
                  <button
                    className={`p-4 rounded-lg border-2 ${preferences.theme === 'light' ? 'border-neon-cyan' : 'border-border'}`}
                    onClick={() => setPreferences({...preferences, theme: 'light'})}
                  >
                    <div className="w-20 h-14 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-900">Light</span>
                    </div>
                  </button>
                  <button
                    className={`p-4 rounded-lg border-2 ${preferences.theme === 'auto' ? 'border-neon-cyan' : 'border-border'}`}
                    onClick={() => setPreferences({...preferences, theme: 'auto'})}
                  >
                    <div className="w-20 h-14 bg-gradient-to-r from-surface-1 to-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-foreground">Auto</span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shortcuts" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Play/Pause', shortcut: 'Space' },
                    { action: 'Stop', shortcut: 'Enter' },
                    { action: 'Record', shortcut: 'R' },
                    { action: 'Save Project', shortcut: 'Ctrl+S' },
                    { action: 'New Track', shortcut: 'Ctrl+T' },
                    { action: 'Delete Selected', shortcut: 'Delete' },
                    { action: 'Undo', shortcut: 'Ctrl+Z' },
                    { action: 'Redo', shortcut: 'Ctrl+Shift+Z' },
                    { action: 'Zoom In', shortcut: 'Ctrl++' },
                    { action: 'Zoom Out', shortcut: 'Ctrl+-' },
                  ].map((item) => (
                    <div key={item.action} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-foreground">{item.action}</span>
                      <kbd className="px-2 py-1 bg-surface-2 rounded text-xs font-mono">{item.shortcut}</kbd>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-neon-cyan" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-2xl font-bold text-background">
                    PT
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Display Name</Label>
                    <Input defaultValue="Producer" className="bg-surface-2 border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Email</Label>
                    <Input defaultValue="producer@email.com" className="bg-surface-2 border-border" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-neon-purple" />
                  Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select defaultValue="en">
                  <SelectTrigger className="w-48 bg-surface-2 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}