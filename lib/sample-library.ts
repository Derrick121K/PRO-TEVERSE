// Sample Library Integration for PRO-TEEVERSE
// Provides access to Freesound.org API and local samples

export interface Sample {
  id: string
  name: string
  description: string
  duration: number // seconds
  sampleRate: number
  channels: number
  type: 'oneshot' | 'loop' | 'wavetable'
  category: string
  tags: string[]
  previewUrl?: string
  sourceUrl?: string
  waveformUrl?: string
  license: string
  username: string
  downloads: number
  rating: number
}

export interface SampleSearchResult {
  samples: Sample[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Freesound API configuration
const FREESOUND_API_KEY = 'demo' // Users can get a free API key from freesound.org
const FREESOUND_API_BASE = 'https://freesound.org/apiv2'

// Local sample library (fallback when no internet)
const localSamples: Sample[] = [
  {
    id: 'kick-core',
    name: 'Core Kick',
    description: 'Pro-Teeverse core kick drum',
    duration: 0.5,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Drums',
    tags: ['kick', '808', 'bass'],
    sourceUrl: '/sounds/kick.wav',
    license: 'CC0',
    username: 'system',
    downloads: 1000,
    rating: 4.5
  },
  {
    id: 'snare-core',
    name: 'Core Snare',
    description: 'Pro-Teeverse core snare drum',
    duration: 0.3,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Drums',
    tags: ['snare', 'drums', 'core'],
    sourceUrl: '/sounds/snare.wav',
    license: 'CC0',
    username: 'system',
    downloads: 800,
    rating: 4.2
  },
  {
    id: 'hihat-core',
    name: 'Core Hi-Hat',
    description: 'Pro-Teeverse core hi-hat',
    duration: 0.4,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Drums',
    tags: ['hihat', 'drums', 'core'],
    sourceUrl: '/sounds/hihat.wav',
    license: 'CC0',
    username: 'system',
    downloads: 750,
    rating: 4.3
  },
  {
    id: 'clap-core',
    name: 'Core Clap',
    description: 'Pro-Teeverse core clap',
    duration: 0.3,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Drums',
    tags: ['clap', 'drums', 'core'],
    sourceUrl: '/sounds/clap.wav',
    license: 'CC0',
    username: 'system',
    downloads: 600,
    rating: 4.0
  },
  {
    id: 'hihat-closed',
    name: 'Hi-Hat Closed',
    description: 'Closed hi-hat',
    duration: 0.1,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Drums',
    tags: ['hihat', 'closed', 'drums'],
    license: 'CC0',
    username: 'system',
    downloads: 900,
    rating: 4.6
  },
  {
    id: 'hihat-open',
    name: 'Hi-Hat Open',
    description: 'Open hi-hat',
    duration: 0.5,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Drums',
    tags: ['hihat', 'open', 'drums'],
    license: 'CC0',
    username: 'system',
    downloads: 850,
    rating: 4.4
  },
  {
    id: 'perc-rim',
    name: 'Rim Shot',
    description: 'Percussive rim shot',
    duration: 0.2,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Percussion',
    tags: ['rim', 'shot', 'percussion'],
    license: 'CC0',
    username: 'system',
    downloads: 500,
    rating: 4.1
  },
  {
    id: 'bass-sub-c',
    name: 'Sub Bass C',
    description: 'Deep sub bass on C',
    duration: 1.0,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Bass',
    tags: ['bass', 'sub', '808'],
    license: 'CC0',
    username: 'system',
    downloads: 700,
    rating: 4.3
  },
  {
    id: 'bass-808-e',
    name: '808 Bass E',
    description: 'Classic 808 bass on E',
    duration: 1.5,
    sampleRate: 44100,
    channels: 2,
    type: 'wavetable',
    category: 'Bass',
    tags: ['bass', '808', 'wobble'],
    license: 'CC0',
    username: 'system',
    downloads: 650,
    rating: 4.2
  },
  {
    id: 'fx-riser',
    name: 'Riser',
    description: 'Ascending riser FX',
    duration: 4.0,
    sampleRate: 44100,
    channels: 2,
    type: 'loop',
    category: 'FX',
    tags: ['riser', 'fx', 'transition'],
    license: 'CC0',
    username: 'system',
    downloads: 400,
    rating: 4.5
  },
  {
    id: 'fx-impact',
    name: 'Impact',
    description: 'Impact sound effect',
    duration: 1.0,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'FX',
    tags: ['impact', 'hit', 'fx'],
    license: 'CC0',
    username: 'system',
    downloads: 350,
    rating: 4.4
  },
  {
    id: 'fx-sweep',
    name: 'Sweep Down',
    description: 'Descending sweep FX',
    duration: 2.0,
    sampleRate: 44100,
    channels: 2,
    type: 'loop',
    category: 'FX',
    tags: ['sweep', 'down', 'fx'],
    license: 'CC0',
    username: 'system',
    downloads: 300,
    rating: 4.1
  },
  {
    id: 'loop-trap-120',
    name: 'Trap Beat 120',
    description: 'Trap drum loop at 120 BPM',
    duration: 2.0,
    sampleRate: 44100,
    channels: 2,
    type: 'loop',
    category: 'Loops',
    tags: ['trap', 'beat', 'drums'],
    license: 'CC0',
    username: 'system',
    downloads: 550,
    rating: 4.4
  },
  {
    id: 'loop-lofi',
    name: 'Lo-Fi Groove',
    description: 'Chill lo-fi drum loop',
    duration: 4.0,
    sampleRate: 44100,
    channels: 2,
    type: 'loop',
    category: 'Loops',
    tags: ['lofi', 'chill', 'drums'],
    license: 'CC0',
    username: 'system',
    downloads: 480,
    rating: 4.6
  },
  {
    id: 'loop-future',
    name: 'Future Bass',
    description: 'Future bass chord loop',
    duration: 4.0,
    sampleRate: 44100,
    channels: 2,
    type: 'loop',
    category: 'Loops',
    tags: ['future', 'bass', 'chords'],
    license: 'CC0',
    username: 'system',
    downloads: 420,
    rating: 4.3
  },
  {
    id: 'vox-hey',
    name: 'Hey Shout',
    description: 'Vocal hey shout',
    duration: 0.5,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Vocals',
    tags: ['vocal', 'hey', 'shout'],
    license: 'CC0',
    username: 'system',
    downloads: 250,
    rating: 4.0
  },
  {
    id: 'vox-yeah',
    name: 'Yeah',
    description: 'Vocal yeah',
    duration: 0.8,
    sampleRate: 44100,
    channels: 2,
    type: 'oneshot',
    category: 'Vocals',
    tags: ['vocal', 'yeah', 'rap'],
    license: 'CC0',
    username: 'system',
    downloads: 200,
    rating: 3.9
  }
]

// Sample library class
class SampleLibrary {
  private useApi: boolean = false
  private apiKey: string = FREESOUND_API_KEY
  private cache: Map<string, Sample> = new Map()

  constructor() {
    // Load API key from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('freesound_api_key')
      if (saved) {
        this.apiKey = saved
        this.useApi = true
      }
    }
  }

  // Configure Freesound API
  setApiKey(key: string) {
    this.apiKey = key
    this.useApi = !!key
    if (typeof window !== 'undefined') {
      localStorage.setItem('freesound_api_key', key)
    }
  }

  // Get API key status
  hasApiKey(): boolean {
    return this.useApi && this.apiKey !== 'demo'
  }

  // Search samples from Freesound API
  async searchFreesound(query: string, options?: {
    page?: number
    pageSize?: number
    category?: string
  }): Promise<SampleSearchResult> {
    if (!this.hasApiKey()) {
      return this.searchLocal(query, options)
    }

    try {
      const params = new URLSearchParams({
        token: this.apiKey,
        query: query,
        page: String(options?.page || 1),
        page_size: String(options?.pageSize || 15),
        fields: 'id,name,description,duration,sample_rate,channels,type,tags,previews,images,license,username,num_downloads,avg_rating'
      })

      const response = await fetch(
        `${FREESOUND_API_BASE}/search/text/?${params}`
      )

      if (!response.ok) {
        throw new Error('Freesound API error')
      }

      const data = await response.json()

      return {
        samples: data.results.map((r: any) => this.mapFreesoundSample(r)),
        total: data.count,
        page: data.page,
        pageSize: data.page_size,
        hasMore: data.page * data.page_size < data.count
      }
    } catch (error) {
      console.error('Freesound search failed:', error)
      return this.searchLocal(query, options)
    }
  }

  // Map Freesound API response to our Sample type
  private mapFreesoundSample(data: any): Sample {
    return {
      id: `fs-${data.id}`,
      name: data.name,
      description: data.description?.substring(0, 200) || '',
      duration: data.duration || 0,
      sampleRate: data.sample_rate || 44100,
      channels: data.channels || 2,
      type: 'oneshot',
      category: this.categorizeFreesoundSample(data.tags || []),
      tags: data.tags || [],
      previewUrl: data.previews?.['preview-hq-mp3'] || data.previews?.['preview-lq-mp3'],
      sourceUrl: data.previews?.['preview-hq-mp3'] || data.previews?.['preview-lq-mp3'],
      waveformUrl: data.images?.waveform_m || data.images?.waveform_l,
      license: data.license,
      username: data.username,
      downloads: data.num_downloads || 0,
      rating: data.avg_rating || 0
    }
  }

  // Categorize sample based on tags
  private categorizeFreesoundSample(tags: string[]): string {
    const tagSet = new Set(tags.map(t => t.toLowerCase()))
    
    if (tagSet.has('kick') || tagSet.has('snare') || tagSet.has('hihat') || tagSet.has('drum')) {
      return 'Drums'
    }
    if (tagSet.has('bass') || tagSet.has('808')) {
      return 'Bass'
    }
    if (tagSet.has('riser') || tagSet.has('impact') || tagSet.has('sweep') || tagSet.has('fx')) {
      return 'FX'
    }
    if (tagSet.has('loop') || tagSet.has('beat')) {
      return 'Loops'
    }
    if (tagSet.has('vocal') || tagSet.has('vox')) {
      return 'Vocals'
    }
    return 'Misc'
  }

  // Search local samples
  searchLocal(query: string, options?: {
    page?: number
    pageSize?: number
    category?: string
  }): SampleSearchResult {
    let results = localSamples

    // Filter by query
    if (query) {
      const q = query.toLowerCase()
      results = results.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    // Filter by category
    if (options?.category && options.category !== 'All') {
      results = results.filter(s => s.category === options.category)
    }

    const page = options?.page || 1
    const pageSize = options?.pageSize || 15
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      samples: results.slice(start, end),
      total: results.length,
      page,
      pageSize,
      hasMore: end < results.length
    }
  }

  // Get sample by ID
  async getSample(id: string): Promise<Sample | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id) || null
    }

    // Check local samples
    const local = localSamples.find(s => s.id === id)
    if (local) {
      this.cache.set(id, local)
      return local
    }

    // Try Freesound if ID starts with fs-
    if (id.startsWith('fs-') && this.hasApiKey()) {
      try {
        const response = await fetch(
          `${FREESOUND_API_BASE}/sounds/${id.slice(3)}/?token=${this.apiKey}&fields=id,name,description,duration,sample_rate,channels,tags,previews,images,license,username,num_downloads,avg_rating`
        )
        if (response.ok) {
          const data = await response.json()
          const sample = this.mapFreesoundSample(data)
          this.cache.set(id, sample)
          return sample
        }
      } catch (error) {
        console.error('Failed to fetch Freesound sample:', error)
      }
    }

    return null
  }

  // Get all categories
  getCategories(): string[] {
    const categories = new Set(localSamples.map(s => s.category))
    return ['All', ...Array.from(categories)]
  }

  // Get samples by category
  getByCategory(category: string): Sample[] {
    if (category === 'All') {
      return localSamples
    }
    return localSamples.filter(s => s.category === category)
  }

  // Get featured/popular samples
  getFeatured(): Sample[] {
    return [...localSamples]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 8)
  }

  // Get recently added
  getRecent(): Sample[] {
    return localSamples.slice(0, 8)
  }
}

// Export singleton instance
export const sampleLibrary = new SampleLibrary()

// Helper: Convert sample to AudioBuffer (for playback)
export async function loadSampleAsAudioBuffer(
  sample: Sample,
  audioContext: AudioContext
): Promise<AudioBuffer | null> {
  try {
    if (sample.previewUrl) {
      const response = await fetch(sample.previewUrl)
      const arrayBuffer = await response.arrayBuffer()
      return await audioContext.decodeAudioData(arrayBuffer)
    }
    
    // Fallback: generate a simple tone based on sample type
    const duration = sample.duration || 1
    const buffer = audioContext.createBuffer(
      sample.channels || 2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    )
    
    // Fill with silence (placeholder - real samples would be loaded)
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        data[i] = 0
      }
    }
    
    return buffer
  } catch (error) {
    console.error('Failed to load sample:', error)
    return null
  }
}
